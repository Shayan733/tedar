// TEDAR — Scout Run API Route
// Runs the full Scout pipeline synchronously and returns results + narrator summary.
// Runs locally only in Phase 2 — no Vercel timeout concern until Phase 5.

import { NextRequest, NextResponse } from 'next/server';
import { runNichePipeline } from '@/lib/pipeline/niche-pipeline';
import { runChannelPipeline } from '@/lib/pipeline/channel-pipeline';
import { runVideoPipeline } from '@/lib/pipeline/video-pipeline';
import { generateLLMResponse } from '@/lib/llm/provider';
import { NichePipelineResult, ChannelPipelineResult, VideoPipelineResult } from '@/lib/types';

type PipelineResult = NichePipelineResult | ChannelPipelineResult | VideoPipelineResult;

interface RunBody {
  inputType: 'niche' | 'channel' | 'video';
  inputValue: string;
}

const NARRATOR_SYSTEM_PROMPT =
  'You are TEDAR, a content intelligence system. You have just completed a Scout analysis. ' +
  'Summarise the results in 2–3 sentences in a direct, intelligent voice. ' +
  'Name the top outlier video and its score. Note one pattern across the results if visible. ' +
  'Do not use bullet points. Do not use the word "fascinating". Be specific, not generic.';

function buildNarratorMessage(results: PipelineResult): string {
  if (results.inputType === 'video') {
    const v = (results as VideoPipelineResult).video;
    return `Video: "${v.title}" | Views: ${v.viewCount.toLocaleString()}`;
  }
  const r = results as NichePipelineResult | ChannelPipelineResult;
  const top3 = r.outliers.slice(0, 3)
    .map(o => `"${o.video.title}" (${o.outlierScore.toFixed(1)}x)`)
    .join(', ');
  return `Scanned ${r.videosScanned} videos. Found ${r.outliersFound} outliers. Top results: ${top3}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RunBody;
  try {
    body = await req.json() as RunBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { inputType, inputValue } = body;

  if (!inputType || !inputValue) {
    return NextResponse.json({ error: 'inputType and inputValue are required' }, { status: 400 });
  }

  try {
    let results: PipelineResult;

    if (inputType === 'niche') {
      results = await runNichePipeline(inputValue);
    } else if (inputType === 'channel') {
      results = await runChannelPipeline(inputValue);
    } else if (inputType === 'video') {
      results = await runVideoPipeline(inputValue);
    } else {
      return NextResponse.json({ error: `Unknown inputType: ${inputType}` }, { status: 400 });
    }

    const narratorUserMessage = buildNarratorMessage(results);
    const narratorResponse = await generateLLMResponse(NARRATOR_SYSTEM_PROMPT, narratorUserMessage);

    return NextResponse.json({
      runId: results.runId,
      inputType: results.inputType,
      results,
      narratorMessage: narratorResponse.text,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scout pipeline failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
