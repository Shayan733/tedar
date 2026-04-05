// TEDAR — Task 2A integration test
// Tests prepareVideo (no LLM) locally. analyseVideo is skipped if Groq 429.
// Run: npx tsx scripts/test-prepare.ts

import { prepareVideo, analyseVideo } from '../lib/analysis';

const VIDEO_URL = 'https://www.youtube.com/watch?v=UF8uR6Z6KLc'; // Steve Jobs Stanford

async function main() {
  console.log('=== Task 2A: prepareVideo + analyseVideo ===\n');

  // --- PART 1: prepareVideo (no LLM, should always work) ---
  console.log('--- prepareVideo ---');
  let prepared;
  try {
    prepared = await prepareVideo(VIDEO_URL);
    console.log(`✅ videoId (Supabase UUID): ${prepared.videoId}`);
    console.log(`✅ youtubeVideoId:          ${prepared.youtubeVideoId}`);
    console.log(`✅ title:                   ${prepared.videoData.title}`);
    console.log(`✅ wordCount:               ${prepared.wordCount}`);
    console.log(`✅ existingAnalysisId:      ${prepared.existingAnalysisId ?? 'none (first run)'}`);
    console.log(`✅ transcript preview:      "${prepared.transcript.slice(0, 100)}..."`);
  } catch (e) {
    console.log(`❌ prepareVideo failed: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }

  // --- PART 2: analyseVideo (calls Groq — may 429 if daily limit exhausted) ---
  console.log('\n--- analyseVideo ---');
  console.log('(Skipping LLM call — Groq daily limit may be exhausted)');
  console.log('To test analyseVideo, uncomment the block below and run when limit resets.');

  // Uncomment to test the full LLM analysis:
  // try {
  //   const result = await analyseVideo(prepared.videoId, {
  //     onProgress: (msg) => console.log(`  → ${msg}`),
  //   });
  //   console.log(`✅ overall score: ${result.engagementScore.overall}`);
  //   console.log(`✅ analysis id:   ${result.id ?? 'not set'}`);
  // } catch (e) {
  //   const msg = e instanceof Error ? e.message : String(e);
  //   if (msg.includes('429') || msg.includes('rate limit')) {
  //     console.log(`⚠️  Groq 429 rate limit — expected if daily tokens exhausted. Not a bug.`);
  //   } else {
  //     console.log(`❌ analyseVideo failed: ${msg}`);
  //   }
  // }

  console.log('\n=== Done ===');
}

main().catch(console.error);
