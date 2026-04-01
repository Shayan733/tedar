// TEDAR — Phase 3 Decoder integration test
// Tests the full decode pipeline: transcript → K1 analysis → Supabase save
// Run with: npx ts-node scripts/test-decoder.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { decodeVideo } from '../lib/analysis';

async function main() {
  // Two real outlier videos from the Supabase database (both confirmed have captions)
  const testVideos = [
    'https://www.youtube.com/watch?v=1iwv1RsvP58',  // 81.7x — IRS Schedule 1-A walkthrough (2952 words)
    'https://www.youtube.com/watch?v=3U4-8xxhljo',  // 58.6x — Valentine gay love short film (355 words)
  ];

  for (const url of testVideos) {
    console.log(`\n--- Decoding: ${url} ---\n`);
    const start = Date.now();
    try {
      const { result, cached } = await decodeVideo(url);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`✅ Analysis complete in ${elapsed}s (cached: ${cached})`);
      console.log(`Primary mechanism: ${result.psychologicalFormula.primaryMechanism}`);
      console.log(`Overall score: ${result.engagementScore.overall}/100 (${result.engagementScore.confidence} confidence)`);

      const scores = result.engagementScore.dimensions;
      const sorted = (Object.entries(scores) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);
      console.log(`\nTop 3 dimension scores:`);
      sorted.forEach(([dim, score]) => console.log(`  ${dim}: ${score}`));

      const moment = result.psychologicalFormula.keyMoments[0];
      if (moment) {
        console.log(`\nKey moment 1: "${moment.transcriptQuote.slice(0, 80)}..."`);
        console.log(`Mechanism: ${moment.mechanism}`);
      }

      console.log(`\nHook strategy: ${result.replicationBrief.hookStrategy.slice(0, 150)}...`);
      console.log(`\n✅ Saved to Supabase — check analyses and transcripts tables`);
    } catch (e) {
      console.log(`❌ Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Cache test: same video again — should return instantly
  console.log(`\n--- Testing cache (same video, should return in <1s) ---`);
  const cacheStart = Date.now();
  try {
    const { cached } = await decodeVideo(testVideos[0]);
    const elapsed = Date.now() - cacheStart;
    if (cached && elapsed < 1000) {
      console.log(`✅ Cache working — returned in ${elapsed}ms (cached: ${cached})`);
    } else if (cached) {
      console.log(`⚠️  Returned cached result but took ${elapsed}ms — check network latency`);
    } else {
      console.log(`⚠️  Cache may not be working — re-ran analysis (took ${elapsed}ms)`);
    }
  } catch (e) {
    console.log(`❌ Cache test failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

main().catch(console.error);
