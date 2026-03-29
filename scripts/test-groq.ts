import { generateLLMResponse } from '../lib/llm/provider';

async function main() {
  console.log('Testing Groq LLM...');
  const response = await generateLLMResponse(
    'You are a test assistant. Respond with exactly one word.',
    'Say the word OK and nothing else.'
  );
  console.log('✅ Groq response:', response.text);
  console.log('✅ Tokens used:', response.tokensUsed);
}
main().catch(console.error);
