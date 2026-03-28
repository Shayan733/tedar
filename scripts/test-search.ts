// Test: YouTube channel search
// Run with: npx ts-node scripts/test-search.ts

import { searchChannels } from '../lib/youtube/search';

async function main() {
  console.log('Testing YouTube channel search...');
  const results = await searchChannels('fitness motivation');
  console.log(`✅ Found ${results.length} channels`);
  console.log('First 3 results:');
  results.slice(0, 3).forEach((c) => {
    console.log(`  - ${c.channelName} (${c.youtubeChannelId})`);
  });
}

main().catch(console.error);
