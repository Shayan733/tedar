// TEDAR — Builder orchestrator
// Single entry point for the full build pipeline.
// Takes a decode analysis ID + creator context → returns a production brief.

import { buildBuilderPrompt, BUILDER_PROMPT_VERSION } from './prompts/k1-builder';
import { generateLLMResponse, stripJsonFences } from './llm/provider';
import { getBriefByAnalysisId, upsertBrief } from './supabase-builder';
import { supabaseAdmin } from './supabase';
import { BuilderResult, CreatorContext, DecoderResult } from './types';
import { LLM_TEMPERATURE } from './config';

const BUILDER_MAX_TOKENS = 8192;

function validateBuilderResult(parsed: unknown): parsed is BuilderResult {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const r = parsed as Record<string, unknown>;
  return (
    typeof r.creatorContext === 'object' &&
    typeof r.productionBrief === 'object' &&
    typeof r.scriptOutline === 'object'
  );
}

// Normalise domain values — Gemini sometimes returns "Cognitive Psychology" instead of "cognitive_psychology"
function normaliseDomain(domain: string): string {
  return domain.toLowerCase().replace(/\s+/g, '_');
}

function normaliseInstruction(
  instr: Record<string, unknown>
): Record<string, unknown> {
  if (typeof instr.domain === 'string') {
    instr.domain = normaliseDomain(instr.domain);
  }
  return instr;
}

function normaliseResult(result: BuilderResult): BuilderResult {
  const brief = result.productionBrief;
  normaliseInstruction(brief.hookStrategy as unknown as Record<string, unknown>);
  normaliseInstruction(brief.contentStructure as unknown as Record<string, unknown>);
  brief.priorityTriggers.forEach((t) =>
    normaliseInstruction(t as unknown as Record<string, unknown>)
  );
  const script = result.scriptOutline;
  normaliseInstruction(script.hookBeat as unknown as Record<string, unknown>);
  script.evidenceBeats.forEach((b) =>
    normaliseInstruction(b as unknown as Record<string, unknown>)
  );
  normaliseInstruction(script.payoffBeat as unknown as Record<string, unknown>);
  normaliseInstruction(script.closeBeat as unknown as Record<string, unknown>);
  return result;
}

export interface BuildOutcome {
  result: BuilderResult;
  cached: boolean;
  processingTimeMs: number;
}

export async function buildBrief(
  analysisId: string,
  creatorContext: CreatorContext,
  options?: {
    visualDirection?: string;
    audioDirection?: string;
    forceRefresh?: boolean;
  }
): Promise<BuildOutcome> {
  // Step 1: cache check
  if (!options?.forceRefresh) {
    const cached = await getBriefByAnalysisId(analysisId);
    if (cached) {
      return { result: cached.result, cached: true, processingTimeMs: 0 };
    }
  }

  // Step 2: load the decode analysis
  const { data: analysis, error } = await supabaseAdmin
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('analysis_type', 'decode')
    .single();

  if (error || !analysis) {
    throw new Error('Decode analysis not found. Run the Decoder first.');
  }

  const decoderResult = analysis.result as unknown as DecoderResult;

  // Step 3: build the prompt
  const { systemPrompt, userMessage } = buildBuilderPrompt(
    decoderResult,
    creatorContext,
    options
  );

  // Step 4: call Gemini (swap provider temporarily)
  const startTime = Date.now();
  const originalProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = process.env.BUILDER_LLM_PROVIDER ?? 'gemini';

  let builderResult: BuilderResult;
  try {
    const response = await generateLLMResponse(systemPrompt, userMessage, {
      temperature: LLM_TEMPERATURE,
      maxTokens: BUILDER_MAX_TOKENS,
    });
    const processingTimeMs = Date.now() - startTime;

    // Step 5: parse and validate — retry once on failure
    try {
      const cleaned = stripJsonFences(response.text);
      const parsed: unknown = JSON.parse(cleaned);
      if (!validateBuilderResult(parsed)) throw new Error('Invalid shape');
      builderResult = normaliseResult(parsed);
    } catch {
      // Retry once
      const retryResponse = await generateLLMResponse(
        systemPrompt,
        userMessage +
          '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no backticks, no text outside the JSON object.',
        { temperature: LLM_TEMPERATURE, maxTokens: BUILDER_MAX_TOKENS }
      );
      try {
        const cleaned = stripJsonFences(retryResponse.text);
        const parsed: unknown = JSON.parse(cleaned);
        if (!validateBuilderResult(parsed))
          throw new Error('Invalid shape on retry');
        builderResult = normaliseResult(parsed);
      } catch {
        throw new Error(
          'Brief could not be generated. Please try again.'
        );
      }
    }

    // Step 6: attach metadata
    builderResult.sourceAnalysisId = analysisId;
    builderResult.promptVersion = BUILDER_PROMPT_VERSION;

    // Step 7: save to database
    await upsertBrief({
      videoId: analysis.video_id as string,
      analysisType: 'build',
      llmProvider: process.env.BUILDER_LLM_PROVIDER ?? 'gemini',
      llmModel: 'gemini-2.5-flash',
      promptVersion: BUILDER_PROMPT_VERSION,
      result: builderResult,
      processingTimeMs,
    });

    return { result: builderResult, cached: false, processingTimeMs };
  } finally {
    // Always restore the original provider
    process.env.LLM_PROVIDER = originalProvider;
  }
}
