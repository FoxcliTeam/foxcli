import type { ModelName } from './model.js'

export type ModelConfig = string

export const LANGROUTER_AUTO_CONFIG = 'langrouter/auto' as const satisfies ModelConfig
export const LANGROUTER_AUTO_FREE_CONFIG = 'langrouter/auto-free' as const satisfies ModelConfig

export const DEEPSEEK_V4_FLASH_CONFIG = 'deepseek-v4-flash' as const satisfies ModelConfig

export const DEEPSEEK_V4_PRO_CONFIG = 'deepseek-v4-pro' as const satisfies ModelConfig

export const MOONSHOT_KIMI_K2_5_CONFIG = 'kimi-k2.5' as const satisfies ModelConfig

export const MINIMAX_M3_CONFIG = 'minimax-m3' as const satisfies ModelConfig

export const CLAUDE_OPUS_CONFIG = 'claude-opus-4-8' as const satisfies ModelConfig

export const GLM_5_2_CONFIG = 'glm-5.2' as const satisfies ModelConfig
export const GLM_5_3_FLASH_CONFIG = 'glm-5.3-flash' as const satisfies ModelConfig

export const GPT_5_4_CONFIG = 'gpt-5.4' as const satisfies ModelConfig
export const GPT_5_6_CONFIG = 'gpt-5.6-sol' as const satisfies ModelConfig

export const MOONSHOT_KIMI_K2_7_CONFIG = 'kimi-k2.7-code' as const satisfies ModelConfig

export const RING_2_6_1T_CONFIG = 'ring-2.6-1t' as const satisfies ModelConfig

export const MIMO_2_5_PRO_CONFIG = 'mimo-v2.5-pro' as const satisfies ModelConfig

export const MIMO_2_5_CONFIG = 'mimo-v2.5' as const satisfies ModelConfig

export const ALL_MODEL_CONFIGS = {
  langrouterAuto: LANGROUTER_AUTO_CONFIG,
  langrouterAutoFree: LANGROUTER_AUTO_FREE_CONFIG,
  deepseekFlash: DEEPSEEK_V4_FLASH_CONFIG,
  deepseekThink: DEEPSEEK_V4_PRO_CONFIG,
  moonshot: MOONSHOT_KIMI_K2_5_CONFIG,
  minimax: MINIMAX_M3_CONFIG,
  claudeOpus: CLAUDE_OPUS_CONFIG,
  glm52: GLM_5_2_CONFIG,
  glm53Flash: GLM_5_3_FLASH_CONFIG,
  gpt54: GPT_5_4_CONFIG,
  gpt56: GPT_5_6_CONFIG,
  moonshot26: MOONSHOT_KIMI_K2_7_CONFIG,
  ring261T: RING_2_6_1T_CONFIG,
  mimo25Pro: MIMO_2_5_PRO_CONFIG,
  mimo25: MIMO_2_5_CONFIG,
} as const satisfies Record<string, ModelConfig>

export type ModelKey = keyof typeof ALL_MODEL_CONFIGS

export type CanonicalModelId = (typeof ALL_MODEL_CONFIGS)[ModelKey]

export const CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS) as [
  CanonicalModelId,
  ...CanonicalModelId[],
]

export const CANONICAL_ID_TO_KEY: Record<CanonicalModelId, ModelKey> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      ([key, cfg]) => [cfg, key],
    ),
  ) as Record<CanonicalModelId, ModelKey>

export const CANONICAL_ID_TO_PROTOCOL: Record<CanonicalModelId, string> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      ([key, cfg]) => {
        const protocol = cfg.includes("claude") ? "anthropic" : "openai"
        return [cfg, protocol]
      },
    ),
  ) as Record<CanonicalModelId, string>

/**
 * Check if a model is a built-in model that uses the OpenAI-compatible protocol.
 */
export function isBuiltInOpenAIModel(model: string): boolean {
  return model in CANONICAL_ID_TO_PROTOCOL &&
    CANONICAL_ID_TO_PROTOCOL[model as keyof typeof CANONICAL_ID_TO_PROTOCOL] === 'openai'
}
