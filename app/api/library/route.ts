// TEDAR — Library API route
// Returns every video in the database with transcript status and the latest
// analysis per type (decode / audience / brief), newest first.

import { NextResponse } from 'next/server';
import { getLibrary } from '@/lib/supabase-library';

export const dynamic = 'force-dynamic'; // always reflect the live database

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await getLibrary();
    return NextResponse.json({ data: { entries, total: entries.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
