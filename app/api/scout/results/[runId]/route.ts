// TEDAR — Results Retrieval API Route
// GET endpoint to fetch saved results for any past pipeline run by ID.
// Allows revisiting previous analyses without re-running the pipeline.

import { NextRequest, NextResponse } from 'next/server';
import { getPipelineRun, getOutliersForRun } from '@/lib/supabase-queries';

interface RouteParams {
  params: Promise<{ runId: string }>;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { runId } = await params;

  if (!runId) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  const run = await getPipelineRun(runId);

  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  const outliers = await getOutliersForRun(runId);

  return NextResponse.json({ run, outliers });
}
