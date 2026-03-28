// TEDAR — Channel ranker LLM prompt
// Builds the prompt that asks the LLM to pick the top 20 most relevant channels.

import { ChannelSearchResult } from '../types';

export function buildChannelRankerPrompt(
  nicheKeyword: string,
  channels: ChannelSearchResult[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are a YouTube niche relevance expert. Your job is to analyse a list of YouTube channels and select the top 20 most relevant ones for a given niche keyword.

CRITICAL RULES:
- Return ONLY a valid JSON array. No explanation, no markdown, no code blocks, no backticks.
- Your entire response must start with [ and end with ]
- Select up to 20 channels maximum
- Exclude channels that are only tangentially related to the niche
- Give each selected channel a relevanceScore from 0 to 100 (100 = perfectly on-topic)
- Give each channel a one-sentence relevanceReason explaining why it is relevant
- Sort results by relevanceScore descending

OUTPUT FORMAT (strictly follow this):
[
  {
    "youtubeChannelId": "UCxxxxxxx",
    "channelName": "Channel Name",
    "relevanceScore": 92,
    "relevanceReason": "One sentence explaining why this channel is relevant to the niche."
  }
]`;

  // Strip descriptions to reduce token count — channel name is sufficient for ranking
  const channelList = channels.map((c) => ({
    youtubeChannelId: c.youtubeChannelId,
    channelName: c.channelName,
  }));

  const userMessage = `Niche keyword: "${nicheKeyword}"

Here are the candidate channels to evaluate:
${JSON.stringify(channelList, null, 2)}

Return the top 20 most relevant channels as a JSON array. Remember: ONLY the JSON array, nothing else.`;

  return { systemPrompt, userMessage };
}
