// TEDAR — Input Interpreter API Route
// Rule-based classifier — no LLM call. Pattern matching only.
// Video and channel URLs are regex-detected; everything else is treated as a niche keyword.

import { NextRequest, NextResponse } from 'next/server';

// All URL patterns in one place — video checked before channel
const VIDEO_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^#\s]*&)?v=([\w-]{11})/,
  /(?:https?:\/\/)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
];

const CHANNEL_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([\w.-]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([\w-]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([\w.-]+)/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([\w.-]+)/,
];

interface ClassifyResult {
  isReady: true;
  inputType: 'video' | 'channel' | 'niche';
  inputValue: string;
  confirmationMessage: string;
}

function classify(raw: string): ClassifyResult {
  const input = raw.trim();

  // Normalise bare URLs (missing scheme) so regex anchors work uniformly
  const normalised = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  for (const pattern of VIDEO_PATTERNS) {
    const match = normalised.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        isReady: true,
        inputType: 'video',
        inputValue: `https://www.youtube.com/watch?v=${videoId}`,
        confirmationMessage: `Found a video — ready to fetch data and decode.`,
      };
    }
  }

  for (const pattern of CHANNEL_PATTERNS) {
    const match = normalised.match(pattern);
    if (match) {
      return {
        isReady: true,
        inputType: 'channel',
        inputValue: normalised,
        confirmationMessage: `Found a YouTube channel — ready to scan for outliers.`,
      };
    }
  }

  // Anything else is a niche keyword
  return {
    isReady: true,
    inputType: 'niche',
    inputValue: input.toLowerCase(),
    confirmationMessage: `Searching for outliers in the "${input}" niche.`,
  };
}

interface InterpretBody {
  userInput: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: InterpretBody;
  try {
    body = (await req.json()) as InterpretBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { userInput } = body;

  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
  }

  return NextResponse.json(classify(userInput));
}
