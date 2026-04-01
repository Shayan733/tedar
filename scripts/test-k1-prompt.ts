import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getVideoData } from '../lib/youtube/metadata';
import { getTranscript } from '../lib/youtube/transcript';
import { buildDecoderPrompt } from '../lib/prompts/k1-decoder';
import { generateLLMResponse } from '../lib/llm/provider';

async function main() {
  const videoUrl = 'https://www.youtube.com/watch?v=1iwv1RsvP58';
  console.log('Step 1: Fetching video metadata...');
  const videoData = await getVideoData(videoUrl);
  console.log('✅ Got metadata:', videoData.title);

  console.log('Step 2: Fetching transcript...');
  const transcript = await getTranscript(videoData.youtubeVideoId);
  console.log('✅ Got transcript:', transcript.split(' ').length, 'words');

  console.log('Step 3: Building K1 prompt...');
  const { systemPrompt, userMessage } = buildDecoderPrompt(videoData, transcript);
  console.log('✅ Prompt built. System prompt length:', systemPrompt.length, 'chars');

  console.log('Step 4: Calling LLM (Groq)...');
  const start = Date.now();
  const response = await generateLLMResponse(systemPrompt, userMessage, {
    temperature: 0.3,
    maxTokens: 4096,
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log('✅ LLM responded in', elapsed + 's');

  console.log('\n--- RAW RESPONSE (first 3000 chars) ---\n');
  console.log(response.text.slice(0, 3000));
  console.log('\n--- END ---');
}

main().catch(e => console.error('❌ Failed:', e.message));
