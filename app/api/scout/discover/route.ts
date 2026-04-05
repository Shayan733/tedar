// TEDAR — Scout Discover endpoint
// Step 1 of progressive niche mode: keyword → LLM-ranked channels
// Returns up to maxChannelsToScan ranked channels. No video scanning.

import { NextRequest, NextResponse } from 'next/server';
import { searchChannels } from '@/lib/youtube/search';
import { buildChannelRankerPrompt } from '@/lib/prompts/channel-ranker';
import { generateLLMResponse, stripJsonFences } from '@/lib/llm/provider';
import { upsertNiche, createPipelineRun, updatePipelineRun } from '@/lib/supabase';
import { DEFAULT_CONFIG } from '@/lib/config';
import { RankedChannel } from '@/lib/types';

export const maxDuration = 30;

interface DiscoverBody {
  keyword: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: DiscoverBody;
  try {
    body = (await req.json()) as DiscoverBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { keyword } = body;
  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
  }

  try {
    const runId = await createPipelineRun('niche', keyword);
    const nicheId = await upsertNiche({ name: keyword, keywords: [keyword], channelCount: 0 });

    const candidates = await searchChannels(keyword);
    const { systemPrompt, userMessage } = buildChannelRankerPrompt(keyword, candidates);
    const llmResponse = await generateLLMResponse(systemPrompt, userMessage);
    const rankedChannels: RankedChannel[] = JSON.parse(stripJsonFences(llmResponse.text));
    const topChannels = rankedChannels.slice(0, DEFAULT_CONFIG.maxChannelsToScan);

    await updatePipelineRun(runId, { channelsFound: topChannels.length });

    return NextResponse.json({ data: { runId, nicheId, channels: topChannels } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Discovery failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
