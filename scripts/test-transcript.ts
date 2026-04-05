// TEDAR — Test script: verify transcript fetching works
// Run: npx tsx scripts/test-transcript.ts
// Note: ewkQ1FLbYSg from the CLAUDE.md spec appears to be unavailable — using Steve Jobs speech instead

import { getTranscript } from '../lib/youtube/transcript';

async function main() {
  const tests = [
    { id: 'UF8uR6Z6KLc', label: "Steve Jobs Stanford speech (confirmed captions)" },
    { id: 'iG9CE55wbtY', label: "Dan Pink TED Talk (confirmed captions)" },
  ];

  for (const test of tests) {
    console.log(`\nTesting: ${test.label} (${test.id})`);
    try {
      const transcript = await getTranscript(test.id);
      const wordCount = transcript.split(/\s+/).length;
      console.log(`✅ Success — ${wordCount} words`);
      console.log(`First 200 chars: "${transcript.slice(0, 200)}"`);
    } catch (e) {
      console.log(`❌ Failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}

main().catch(console.error);
