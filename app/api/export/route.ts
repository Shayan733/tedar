// TEDAR — Export API route
// Downloads the latest decode analysis per video as CSV or JSON.
// Merged from DP-YT-PIPELINE's /export endpoints.

import { NextRequest, NextResponse } from 'next/server';
import { getExportRows, toCsv } from '@/lib/export';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse | Response> {
  const format = request.nextUrl.searchParams.get('format') ?? 'json';
  if (format !== 'json' && format !== 'csv') {
    return NextResponse.json(
      { error: 'format must be "csv" or "json"', code: 'INVALID_FORMAT' },
      { status: 400 }
    );
  }

  try {
    const rows = await getExportRows();
    const stamp = new Date().toISOString().slice(0, 10);

    if (format === 'csv') {
      return new Response(toCsv(rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tedar-analyses-${stamp}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tedar-analyses-${stamp}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
