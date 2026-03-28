// Test: Full Scout integration — keyword → LLM ranking → videos → outliers → Supabase
// Run with: npx ts-node scripts/test-scout-full.ts

import { searchChannels } from '../lib/youtube/search';
import { buildChannelRankerPrompt } from '../lib/prompts/channel-ranker';
import { generateLLMResponse, stripJsonFences } from '../lib/llm/provider';
import { getChannelVideos } from '../lib/youtube/channel';
import { detectOutliers } from '../lib/youtube/outlier';
import { upsertNiche, upsertChannel, upsertVideo, createPipelineRun, updatePipelineRun } from '../lib/supabase';
import { DEFAULT_CONFIG } from '../lib/config';
import { RankedChannel, OutlierResult } from '../lib/types';

async function main() {
  const keyword = 'personal finance';
  console.log(`\n🔍 Starting Scout for: "${keyword}"\n`);

  // Step 1: Create pipeline run
  const runId = await createPipelineRun('niche', keyword);
  console.log('✅ Pipeline run created:', runId);

  // Step 2: Create niche record
  const nicheId = await upsertNiche({ name: keyword, keywords: [keyword], channelCount: 0 });
  console.log('✅ Niche saved to DB:', nicheId);

  // Step 3: Search YouTube for channels
  const candidates = await searchChannels(keyword);
  console.log(`✅ Found ${candidates.length} candidate channels on YouTube`);

  // Step 4: LLM ranks channels by niche relevance
  const { systemPrompt, userMessage } = buildChannelRankerPrompt(keyword, candidates);
  const llmResponse = await generateLLMResponse(systemPrompt, userMessage);

  let rankedChannels: RankedChannel[] = [];
  try {
    rankedChannels = JSON.parse(stripJsonFences(llmResponse.text)) as RankedChannel[];
    console.log(`✅ LLM ranked ${rankedChannels.length} channels`);
    console.log('Top 3:');
    rankedChannels.slice(0, 3).forEach((c) =>
      console.log(`  - ${c.channelName} (score: ${c.relevanceScore}) — ${c.relevanceReason}`)
    );
  } catch {
    console.log('❌ Failed to parse LLM response:', llmResponse.text.slice(0, 200));
    await updatePipelineRun(runId, { status: 'failed', errorMessage: 'LLM parse error', completedAt: new Date().toISOString() });
    return;
  }

  await updatePipelineRun(runId, { channelsFound: rankedChannels.length });

  // Step 5: Scan top 3 channels (limited for test — full pipeline uses maxChannelsToScan)
  const topChannels = rankedChannels.slice(0, 3);
  let totalVideos = 0;
  let allOutliers: OutlierResult[] = [];

  for (const channel of topChannels) {
    const channelDbId = await upsertChannel({
      youtubeChannelId: channel.youtubeChannelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      nicheId,
      relevanceScore: channel.relevanceScore,
    });

    const videos = await getChannelVideos(channel.youtubeChannelId, DEFAULT_CONFIG.maxVideosPerChannel);
    totalVideos += videos.length;

    const outliers = detectOutliers(videos, channel.channelName, DEFAULT_CONFIG);
    allOutliers = [...allOutliers, ...outliers];

    // Save all videos to DB with outlier scores where applicable
    for (const video of videos) {
      const outlier = outliers.find((o) => o.video.youtubeVideoId === video.youtubeVideoId);
      await upsertVideo({
        ...video,
        channelId: channelDbId,
        outlierScore: outlier?.outlierScore,
        outlierCategory: outlier?.outlierCategory,
      });
    }

    console.log(`✅ ${channel.channelName}: ${videos.length} videos, ${outliers.length} outliers`);
  }

  await updatePipelineRun(runId, {
    videosScanned: totalVideos,
    outliersFound: allOutliers.length,
    status: 'completed',
    completedAt: new Date().toISOString(),
  });

  console.log(`\n🎯 Scout complete!`);
  console.log(`   Channels scanned: ${topChannels.length}`);
  console.log(`   Videos found: ${totalVideos}`);
  console.log(`   Outliers detected: ${allOutliers.length}`);
  console.log(`\nTop 5 outliers across all channels:`);
  allOutliers
    .sort((a, b) => b.outlierScore - a.outlierScore)
    .slice(0, 5)
    .forEach((o, i) => {
      console.log(`${i + 1}. [${o.outlierCategory.toUpperCase()}] ${o.video.title}`);
      console.log(`   ${o.channelName} | ${o.outlierScore.toFixed(1)}x | ${o.video.viewCount.toLocaleString()} views`);
    });

  console.log('\n✅ Check your Supabase dashboard — data should be in channels, videos, and pipeline_runs tables');
}

main().catch(console.error);
