// TEDAR — Build API route
// Receives an analysis ID and creator context, runs the Builder pipeline, returns the brief.
// Checks cache first — only calls Gemini if no brief exists for this analysis.

import { NextRequest, NextResponse } from 'next/server';
import { buildBrief } from '@/lib/builder';
import { CreatorContext } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
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
        typeof body.typicalContentStyle === 'string'
          ? body.typicalContentStyle
          : undefined,
      targetAudience:
        typeof body.targetAudience === 'string'
          ? body.targetAudience
          : undefined,
    };

    const forceRefresh = body.forceRefresh === true;

    const outcome = await buildBrief(analysisId, creatorContext, {
      forceRefresh,
    });

    return NextResponse.json({
      data: outcome.result,
      meta: {
        processingTimeMs: outcome.processingTimeMs,
        cached: outcome.cached,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message, code: 'ANALYSIS_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: message, code: 'BUILD_FAILED' },
      { status: 500 }
    );
  }
}
