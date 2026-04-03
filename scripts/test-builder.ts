// TEDAR — Phase 4 Builder integration test
// Tests the full build pipeline: decode analysis → Builder prompt → Gemini → Supabase save
// Run with: npx ts-node scripts/test-builder.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { buildBrief } from '../lib/builder';
import { supabaseAdmin } from '../lib/supabase';

async function main() {
  // Get real decode analyses from the database
  const { data: analyses } = await supabaseAdmin
    .from('analyses')
    .select('id, video_id, result')
    .eq('analysis_type', 'decode')
    .limit(2);

  if (!analyses || analyses.length === 0) {
    console.log('No decode analyses in database. Run the decoder first.');
    return;
  }

  // Test with two different creator contexts to verify adaptation
  const contexts = [
    { channelName: 'FinanceWithShayan', niche: 'personal finance' },
    { channelName: 'TechReviewsUK', niche: 'tech reviews' },
  ];

  for (let i = 0; i < Math.min(analyses.length, 2); i++) {
    const analysis = analyses[i];
    const context = contexts[i];

    console.log(`\n--- Building brief ${i + 1} for: ${context.channelName} ---`);
    const start = Date.now();

    try {
      const outcome = await buildBrief(analysis.id, context);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`Brief built in ${elapsed}s (cached: ${outcome.cached})`);
      console.log(`Hook strategy (first 150 chars): ${outcome.result.productionBrief.hookStrategy.instruction.slice(0, 150)}...`);
      console.log(`Hook domain: ${outcome.result.productionBrief.hookStrategy.domain}`);
      console.log(`Hook confidence: ${outcome.result.productionBrief.hookStrategy.confidence}`);
      console.log(`Priority triggers: ${outcome.result.productionBrief.priorityTriggers.length}`);
      console.log(`Evidence beats: ${outcome.result.scriptOutline.evidenceBeats.length}`);
      console.log(`Script hook (first 100 chars): ${outcome.result.scriptOutline.hookBeat.instruction.slice(0, 100)}...`);
    } catch (e) {
      console.log(`Failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Test cache: run the same analysis again — should return instantly
  console.log(`\n--- Testing cache (same analysis, should be instant) ---`);
  const start = Date.now();
  const cachedOutcome = await buildBrief(analyses[0].id, contexts[0]);
  const elapsed = Date.now() - start;
  console.log(elapsed < 1000
    ? `Cache working — returned in ${elapsed}ms (cached: ${cachedOutcome.cached})`
    : `Cache may not be working — took ${elapsed}ms (cached: ${cachedOutcome.cached})`
  );

  // Verify briefs appear in Supabase
  const { data: briefs } = await supabaseAdmin
    .from('analyses')
    .select('id, analysis_type, llm_model')
    .eq('analysis_type', 'build');

  console.log(`\nBriefs in Supabase: ${briefs?.length ?? 0}`);
  console.log('Check Supabase analyses table — should see rows with analysis_type = build');
}

main().catch(console.error);
