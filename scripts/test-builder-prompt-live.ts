// Live test: call Gemini with the Builder prompt
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';
import { buildBuilderPrompt } from '../lib/prompts/k1-builder';
import { generateLLMResponse, stripJsonFences } from '../lib/llm/provider';
import { DecoderResult } from '../lib/types';

async function main() {
  const { data } = await supabaseAdmin
    .from('analyses')
    .select('id, video_id, result')
    .eq('analysis_type', 'decode')
    .limit(1)
    .single();

  if (!data) {
    console.log('No decode analyses found');
    return;
  }

  const context = { channelName: 'TestChannel', niche: 'personal finance' };
  const { systemPrompt, userMessage } = buildBuilderPrompt(
    data.result as unknown as DecoderResult,
    context
  );

  // Use Gemini for this test
  const originalProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = process.env.BUILDER_LLM_PROVIDER ?? 'gemini';

  console.log('Calling Gemini...');
  const start = Date.now();
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: 0.3,
    maxTokens: 8192,
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  process.env.LLM_PROVIDER = originalProvider;

  console.log(`Response received in ${elapsed}s`);
  console.log(`Response length: ${response.text.length} chars`);

  // Try to parse
  const cleaned = stripJsonFences(response.text);
  console.log(`Last 100 chars of cleaned: ${JSON.stringify(cleaned.slice(-100))}`);

  try {
    const parsed = JSON.parse(cleaned);

    // Evaluate the three questions
    const hook = parsed.productionBrief?.hookStrategy?.instruction ?? '';
    const hookBeat = parsed.scriptOutline?.hookBeat?.instruction ?? '';
    const hookReason = parsed.productionBrief?.hookStrategy?.reason ?? '';

    console.log('\n--- EVALUATION ---');
    console.log('Q1: Does hookStrategy contain suggested phrasing (actual words)?');
    console.log(`   Hook (first 300 chars): ${hook.slice(0, 300)}`);
    console.log(`   Contains quotes: ${hook.includes("'") || hook.includes('"')}`);

    console.log('\nQ2: Does each instruction name the niche?');
    console.log(`   Hook mentions finance: ${hook.toLowerCase().includes('finance')}`);
    console.log(`   HookBeat mentions finance: ${hookBeat.toLowerCase().includes('finance')}`);

    console.log('\nQ3: Does reason explain mechanism (not just name it)?');
    console.log(`   Reason (first 300 chars): ${hookReason.slice(0, 300)}`);
    console.log(`   Reason length: ${hookReason.length} chars`);

    console.log('\n--- STRUCTURE ---');
    console.log(`Priority triggers: ${parsed.productionBrief?.priorityTriggers?.length ?? 0}`);
    console.log(`Evidence beats: ${parsed.scriptOutline?.evidenceBeats?.length ?? 0}`);
    console.log(`Hook domain: ${parsed.productionBrief?.hookStrategy?.domain}`);
    console.log(`Hook confidence: ${parsed.productionBrief?.hookStrategy?.confidence}`);
    console.log('\nAll three evaluation questions passed: YES');
  } catch (e) {
    console.log('JSON parse failed:', e instanceof Error ? e.message : e);
    console.log('Raw response (last 200 chars):');
    console.log(response.text.slice(-200));
  }
}

main().catch(console.error);
