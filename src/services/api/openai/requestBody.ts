/**
 * Pure utility functions for building OpenAI request bodies and detecting
 * thinking mode. Extracted from index.ts so tests can import them without
 * triggering heavy module side-effects (OpenAI client, stream adapter, etc.).
 */
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions/completions.mjs'
import { getCustomModelConfig, getCustomModelId, isCustomModel } from '../../../utils/model/model.js'
import { isEnvTruthy, isEnvDefinedFalsy } from '../../../utils/envUtils.js'
import { convertEffortValueToLevel, type EffortValue } from '../../../utils/effort.js'

/**
 * Detect whether DeepSeek-style thinking mode should be enabled.
 *
 * Enabled when:
 * 1. OPENAI_ENABLE_THINKING=1 is set (explicit enable), OR
 * 2. Model name contains "deepseek-reasoner" OR "DeepSeek-V3.2" (auto-detect, case-insensitive)
 *
 * Disabled when:
 * - OPENAI_ENABLE_THINKING=0/false/no/off is explicitly set (overrides model detection)
 *
 * @param model - The resolved OpenAI model name
 */
export function isOpenAIThinkingEnabled(model: string): boolean {
  // Explicit disable takes priority (overrides model auto-detect)
  if (isEnvDefinedFalsy(process.env.OPENAI_ENABLE_THINKING)) return false
  // Explicit enable
  if (isEnvTruthy(process.env.OPENAI_ENABLE_THINKING)) return true
  // Auto-detect from model name (deepseek-reasoner and DeepSeek-V3.2 support thinking mode)
  //const modelLower = model.toLowerCase()
  //return modelLower.includes('deepseek-v4')

  //default open
  return true;
}

/**
 * Resolve max output tokens for the OpenAI-compatible path.
 *
 * Override priority:
 * 1. maxOutputTokensOverride (programmatic, from query pipeline)
 * 2. OPENAI_MAX_TOKENS env var (OpenAI-specific, useful for local models
 *    with small context windows, e.g. RTX 3060 12GB running 65536-token models)
 * 3. CLAUDE_CODE_MAX_OUTPUT_TOKENS env var (generic override)
 * 4. upperLimit default (64000)
 */
export function resolveOpenAIMaxTokens(
  upperLimit: number,
  maxOutputTokensOverride?: number,
): number {
  return maxOutputTokensOverride
    ?? (process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS, 10) || undefined : undefined)
    ?? (process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS ? parseInt(process.env.CLAUDE_CODE_MAX_OUTPUT_TOKENS, 10) || undefined : undefined)
    ?? upperLimit
}

/**
 * Build the request body for OpenAI chat.completions.create().
 * Extracted for testability — the thinking mode params are injected here.
 *
 * DeepSeek thinking mode: inject thinking params via request body.
 * Two formats are added simultaneously to support different deployments:
 * - Official DeepSeek API: `thinking: { type: 'enabled' }`
 * - Self-hosted DeepSeek-V3.2: `enable_thinking: true` + `chat_template_kwargs: { thinking: true }`
 * OpenAI SDK passes unknown keys through to the HTTP body.
 * Each endpoint will use the format it recognizes and ignore the others.
 */
export function buildOpenAIRequestBody(params: {
  model: string
  originalModel?: string
  messages: any[]
  tools: any[]
  toolChoice: any
  enableThinking: boolean
  maxTokens: number
  temperatureOverride?: number
  effortValue?: EffortValue
}): ChatCompletionCreateParamsStreaming & {
  thinking?: { type: string }
  enable_thinking?: boolean
  chat_template_kwargs?: { thinking: boolean }
  reasoning_effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
} {
  const { model, originalModel, messages, tools, toolChoice, enableThinking, maxTokens, temperatureOverride, effortValue } = params

  const modelForConfig = originalModel ?? model
  const customConfig = isCustomModel(modelForConfig) ? getCustomModelConfig(modelForConfig) : undefined
  const samplingParams = customConfig?.generationConfig?.samplingParams

  const temperature = temperatureOverride ?? samplingParams?.temperature
  const topP = samplingParams?.top_p
  const presencePenalty = samplingParams?.presence_penalty
  const frequencyPenalty = samplingParams?.frequency_penalty

  // Map langcli effort levels to the OpenAI-compatible reasoning_effort parameter.
  // Numeric effort values are ant-only; coerce them to a string level first.
  const reasoningEffort = effortValue !== undefined
    ? convertEffortValueToLevel(effortValue)
    : undefined

  // Defensive: strip custom: prefix if present (resolveOpenAIModel should have
  // already done this, but the compiled build sometimes fails to do so)
  const apiModel = model.startsWith('custom:') ? model.slice(7) : model

  return {
    model: apiModel,
    messages,
    max_tokens: maxTokens,
    ...(tools.length > 0 && {
      tools,
      ...(toolChoice && { tool_choice: toolChoice }),
    }),
    stream: true,
    stream_options: { include_usage: true },
    // DeepSeek thinking mode: enable chain-of-thought output.
    // When active, temperature/top_p/presence_penalty/frequency_penalty are ignored by DeepSeek.
    ...(enableThinking && {
      // Official DeepSeek API format
      thinking: { type: 'enabled' },
      // Self-hosted DeepSeek-V3.2 format
      enable_thinking: true,
      chat_template_kwargs: { thinking: true },
    }),
    ...((enableThinking === false) && {
      // Official DeepSeek API format
      thinking: { type: 'disabled' },
      // Self-hosted DeepSeek-V3.2 format
      enable_thinking: false,
      chat_template_kwargs: { thinking: false },
    }),
    // Only send temperature when thinking mode is off (DeepSeek ignores it anyway,
    // but other providers may respect it)
    ...(!enableThinking && temperature !== undefined && {
      temperature,
    }),
    ...(topP !== undefined && { top_p: topP }),
    ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
    ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
    ...(reasoningEffort !== undefined && { reasoning_effort: reasoningEffort }),
    ...(customConfig?.generationConfig?.extra_body && customConfig.generationConfig.extra_body),
  }
}
