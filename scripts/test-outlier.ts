// Test: Full outlier detection on a real channel
// Run with: npx ts-node scripts/test-outlier.ts

import { resolveChannelId, getChannelVideos } from '../lib/youtube/channel';
import { detectOutliers } from '../lib/youtube/outlier';
import { DEFAULT_CONFIG } from '../lib/config';

async function main() {
  const channelId = await resolveChannelId('https://www.youtube.com/@mkbhd');
  const videos = await getChannelVideos(channelId, 50);
  console.log(`✅ Got ${videos.length} videos`);

  const outliers = detectOutliers(videos, 'MKBHD', DEFAULT_CONFIG);
  console.log(`✅ Found ${outliers.length} outliers`);

  outliers.slice(0, 5).forEach((o, i) => {
    console.log(`${i + 1}. [${o.outlierCategory.toUpperCase()}] ${o.video.title}`);
    console.log(`   Score: ${o.outlierScore.toFixed(1)}x | Views: ${o.video.viewCount.toLocaleString()}`);
  });
}

main().catch(console.error);
