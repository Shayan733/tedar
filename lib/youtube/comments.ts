// TEDAR — Fetch top comments for a YouTube video
// Merged from DP-YT-PIPELINE's comment scraper, rebuilt on direct fetch to the
// official YouTube Data API v3 (edge-compatible — no googleapis dependency).
// Comments are fetched live per analysis run, ordered by relevance, then
// re-ranked by like count so the LLM sees what the audience actually upvoted.

import { CommentData } from '../types';

export const MAX_COMMENTS_TO_ANALYSE = 50;

interface YTCommentSnippet {
  textDisplay?: string;
  textOriginal?: string;
  likeCount?: number;
  authorDisplayName?: string;
  publishedAt?: string;
}

interface YTCommentThread {
  snippet?: {
    totalReplyCount?: number;
    topLevelComment?: { snippet?: YTCommentSnippet };
  };
}

export class CommentsDisabledError extends Error {
  constructor() {
    super('COMMENTS_DISABLED');
    this.name = 'CommentsDisabledError';
  }
}

export async function getTopComments(
  youtubeVideoId: string,
  maxComments: number = MAX_COMMENTS_TO_ANALYSE
): Promise<CommentData[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not set');

  const params = new URLSearchParams({
    videoId: youtubeVideoId,
    part: 'snippet',
    order: 'relevance',          // YouTube's own ranking surfaces the richest threads
    maxResults: '100',
    textFormat: 'plainText',
    key: apiKey,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`);
  if (res.status === 403) throw new CommentsDisabledError();
  if (!res.ok) throw new Error(`YouTube comments API error: ${res.status}`);

  const data = await res.json() as { items?: YTCommentThread[] };
  const comments: CommentData[] = (data.items ?? [])
    .map((thread) => thread.snippet?.topLevelComment?.snippet)
    .filter((s): s is YTCommentSnippet => Boolean(s?.textOriginal || s?.textDisplay))
    .map((s) => ({
      text: (s.textOriginal ?? s.textDisplay ?? '').slice(0, 500),
      likeCount: s.likeCount ?? 0,
      authorName: s.authorDisplayName,
      publishedAt: s.publishedAt,
    }));

  // Most-liked first — like count is the audience's own signal of resonance
  comments.sort((a, b) => b.likeCount - a.likeCount);
  return comments.slice(0, maxComments);
}
