// Test: YouTube channel video fetching
// Run with: npx ts-node scripts/test-channel.ts

import { resolveChannelId, getChannelVideos } from '../lib/youtube/channel';

async function main() {
  const channelId = await resolveChannelId('https://www.youtube.com/@mkbhd');
  console.log('✅ Resolved channel ID:', channelId);

  const videos = await getChannelVideos(channelId, 10);
  console.log(`✅ Got ${videos.length} videos`);
  console.log('Most recent:', videos[0].title, '| Views:', videos[0].viewCount);
}

main().catch(console.error);
