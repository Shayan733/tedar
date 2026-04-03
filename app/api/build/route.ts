// TEDAR — Build API route (streaming)
// Streams progress events via SSE. Checks cache first — only calls Gemini if needed.

import { NextRequest, NextResponse } from 'next/server';
import { buildBrief } from '@/lib/builder';
import { getBriefByAnalysisId } from '@/lib/supabase-builder';
import { CreatorContext } from '@/lib/types';
import { createStreamResponse } from '@/lib/streaming';

export async function POST(request: NextRequest): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const analysisId = body.analysisId;
  const channelName = body.channelName;
  const niche = body.niche;

  if (
    !analysisId ||
    typeof analysisId !== 'string' ||
    !channelName ||
    typeof channelName !== 'string' ||
    !niche ||
    typeof niche !== 'string'
  ) {
    return NextResponse.json(
      { error: 'analysisId, channelName, and niche are required', code: 'MISSING_FIELDS' },
      { status: 400 }
    );
  }

  const creatorContext: CreatorContext = {
    channelName,
    niche,
    typicalContentStyle:
      typeof body.typicalContentStyle === 'string' ? body.typicalContentStyle : undefined,
    targetAudience:
      typeof body.targetAudience === 'string' ? body.targetAudience : undefined,
  };

  const forceRefresh = body.forceRefresh === true;

  return createStreamResponse(async (send) => {
    send({ type: 'progress', message: 'Checking for existing brief...' });

    // Early cache check so we can return immediately without calling buildBrief
    if (!forceRefresh) {
      const existing = await getBriefByAnalysisId(analysisId);
      if (existing) {
        send({
          type: 'result',
          data: { data: existing.result, meta: { cached: true, processingTimeMs: 0 } },
        });
        return;
      }
    }

    send({ type: 'progress', message: 'Loading psychological analysis...' });
    send({ type: 'progress', message: 'Translating to production decisions...' });
    send({ type: 'progress', message: 'Building hook strategy...' });
    send({ type: 'progress', message: 'Building script outline...' });

    const outcome = await buildBrief(analysisId, creatorContext, { forceRefresh });

    send({ type: 'progress', message: 'Saving brief to database...' });

    send({
      type: 'result',
      data: {
        data: outcome.result,
        meta: { processingTimeMs: outcome.processingTimeMs, cached: outcome.cached },
      },
    });
  });
}
