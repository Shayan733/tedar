// TEDAR — Scout Run API Route (streaming)
// Streams progress events via SSE so the browser sees live updates.

import { NextRequest, NextResponse } from 'next/server';
import { runNichePipeline } from '@/lib/pipeline/niche-pipeline';
import { runChannelPipeline } from '@/lib/pipeline/channel-pipeline';
import { runVideoPipeline } from '@/lib/pipeline/video-pipeline';
import { createStreamResponse } from '@/lib/streaming';
import {
  NichePipelineResult,
  ChannelPipelineResult,
  VideoPipelineResult,
} from '@/lib/types';

type PipelineResult = NichePipelineResult | ChannelPipelineResult | VideoPipelineResult;

interface RunBody {
  inputType: 'niche' | 'channel' | 'video';
  inputValue: string;
}

function buildNarratorMessage(results: PipelineResult): string {
  if (results.inputType === 'video') {
    const v = (results as VideoPipelineResult).video;
    return `Video: "${v.title}" | Views: ${v.viewCount.toLocaleString()}`;
  }
  const r = results as NichePipelineResult | ChannelPipelineResult;
  const top3 = r.outliers
    .slice(0, 3)
    .map((o) => `"${o.video.title}" (${o.outlierScore.toFixed(1)}x)`)
    .join(', ');
  return `Scanned ${r.videosScanned} videos. Found ${r.outliersFound} outliers. Top results: ${top3}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { inputType, inputValue } = body;

  if (!inputType || !inputValue) {
    return NextResponse.json(
      { error: 'inputType and inputValue are required' },
      { status: 400 }
    );
  }

  return createStreamResponse(async (send) => {
    send({ type: 'progress', message: `Running Scout on "${inputValue}"...` });

    let results: PipelineResult;

    if (inputType === 'niche') {
      results = await runNichePipeline(inputValue);
      const n = results as NichePipelineResult;
      send({
        type: 'progress',
        message: `Found ${n.channelsScanned} channels. Scanning videos...`,
      });
      send({
        type: 'progress',
        message: `Found ${n.videosScanned} videos. Detecting outliers...`,
      });
      send({
        type: 'progress',
        message: `Found ${n.outliersFound} outliers. Generating summary...`,
      });
    } else if (inputType === 'channel') {
      results = await runChannelPipeline(inputValue);
      const c = results as ChannelPipelineResult;
      send({
        type: 'progress',
        message: `Found ${c.videosScanned} videos. Detecting outliers...`,
      });
      send({
        type: 'progress',
        message: `Found ${c.outliersFound} outliers. Generating summary...`,
      });
    } else if (inputType === 'video') {
      results = await runVideoPipeline(inputValue);
      send({ type: 'progress', message: 'Video found. Generating summary...' });
    } else {
      throw new Error(`Unknown inputType: ${inputType}`);
    }

    send({
      type: 'result',
      data: {
        runId: results.runId,
        inputType: results.inputType,
        results,
        narratorMessage: buildNarratorMessage(results),
      },
    });
  });
}
