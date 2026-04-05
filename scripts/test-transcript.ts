// TEDAR — Test script: verify transcript fetching works
// Run: npx tsx scripts/test-transcript.ts

import { getTranscript } from '../lib/youtube/transcript';

const tests = [
  { id: 'UF8uR6Z6KLc', label: 'Steve Jobs Stanford speech (confirmed working)' },
  { id: 'iG9CE55wbtY', label: 'Dan Pink TED Talk — The puzzle of motivation' },
  { id: 'H0Qb4mDsFmI', label: 'Popular tech video — public, should have captions' },
  { id: 'ZbZSe6N_BXs', label: 'Happiness talk — popular, high view count' },
];

async function main() {
  for (const test of tests) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing: ${test.label}`);
    console.log(`ID: ${test.id}`);
    try {
      const transcript = await getTranscript(test.id);
      const wordCount = transcript.split(/\s+/).length;
      console.log(`✅ SUCCESS — ${wordCount} words`);
      console.log(`Preview: "${transcript.slice(0, 150)}..."`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Distinguish expected failures from unexpected ones
      const isExpected =
        msg.includes('region') ||
        msg.includes('captions available') ||
        msg.includes('private') ||
        msg.includes('deleted');
      console.log(`${isExpected ? '⚠️  EXPECTED FAILURE' : '❌ UNEXPECTED FAILURE'}: ${msg}`);
    }
  }
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Done.');
}

main().catch(console.error);
