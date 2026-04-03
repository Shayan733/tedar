// Quick test: verify the Builder prompt builds correctly with real data
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';
import { buildBuilderPrompt } from '../lib/prompts/k1-builder';
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

  console.log('Found decode analysis:', data.id);

  const context = { channelName: 'TestChannel', niche: 'personal finance' };
  const { systemPrompt, userMessage } = buildBuilderPrompt(
    data.result as unknown as DecoderResult,
    context
  );

  console.log('System prompt length:', systemPrompt.length, 'chars');
  console.log('User message length:', userMessage.length, 'chars');
  console.log('\n--- SYSTEM PROMPT (first 500 chars) ---');
  console.log(systemPrompt.slice(0, 500));
  console.log('\n--- USER MESSAGE (first 500 chars) ---');
  console.log(userMessage.slice(0, 500));
  console.log('\n--- Prompt built successfully ---');
}

main().catch(console.error);
