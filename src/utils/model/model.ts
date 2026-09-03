import { getMainLoopModelOverride } from '../../bootstrap/state.js'
import type { ModelProviders } from '../settings/types.js'
import { getSettings_DEPRECATED } from '../settings/settings.js'
import { isModelAllowed } from './modelAllowlist.js'
import { capitalize } from '../stringUtils.js'
import {
  LANGROUTER_AUTO_CONFIG,
  DEEPSEEK_V4_FLASH_CONFIG,
  DEEPSEEK_V4_PRO_CONFIG,
  MOONSHOT_KIMI_K2_5_CONFIG,
  MINIMAX_M3_CONFIG,
  CLAUDE_OPUS_CONFIG,
  CLAUDE_OPUS_4_CONFIG,
  GLM_5_2_CONFIG,
  GLM_5_3_FLASH_CONFIG,
  GPT_5_4_CONFIG,
  GPT_5_6_CONFIG,
  MOONSHOT_KIMI_K2_7_CONFIG,
  RING_2_6_1T_CONFIG,
  MIMO_2_5_PRO_CONFIG,
  MIMO_2_5_CONFIG,
} from './configs.js'
import {
  has1mContext,
} from '../context.js'
export type ModelShortName = string
export type ModelName = string
export type ModelSetting = ModelName | ModelAlias | null
export type ModelAlias = string
export type PermissionMode = string

export function getRuntimeMainLoopModel(params: {
  permissionMode: PermissionMode
  mainLoopModel: string
  exceeds200kTokens?: boolean
}): ModelName {
  return params.mainLoopModel
}

export function getSmallFastModel(): ModelName {
  return process.env.ANTHROPIC_SMALL_FAST_MODEL || getDefaultHaikuModel()
}

export function isNonCustomOpusModel(model: ModelName): boolean {
  return model.includes('minimax')
}

export function getUserSpecifiedModelSetting(): ModelSetting | undefined {
  let specifiedModel: ModelSetting | undefined

  const modelOverride = getMainLoopModelOverride()
  if (modelOverride !== undefined) {
    specifiedModel = modelOverride
  } else {
    const settings = getSettings_DEPRECATED() || {}
    specifiedModel = process.env.ANTHROPIC_MODEL || settings.model || undefined
  }

  if (specifiedModel && !isModelAllowed(specifiedModel)) {
    return undefined
  }

  return specifiedModel
}

export function getMainLoopModel(): ModelName {
  const model = getUserSpecifiedModelSetting()
  if (model !== undefined && model !== null) {
    return parseUserSpecifiedModel(model)
  }
  return getDefaultMainLoopModel()
}

export function getBestModel(): ModelName {
  return CLAUDE_OPUS_CONFIG
}

export function getDefaultOpusModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  }
  const model = getUserSpecifiedModelSetting()
  if (model && model.startsWith('custom:')) {
    return model
  }
  return CLAUDE_OPUS_CONFIG
}

export function getDefaultSonnetModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_SONNET_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  }
  const model = getUserSpecifiedModelSetting()
  if (model && model.startsWith('custom:')) {
    return model
  }
  return DEEPSEEK_V4_PRO_CONFIG
}

export function getDefaultHaikuModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  }
  const model = getUserSpecifiedModelSetting()
  if (model && model.startsWith('custom:')) {
    return model
  }
  return DEEPSEEK_V4_FLASH_CONFIG
}

export function getDefaultFreeModel(): ModelName {
  const model = getUserSpecifiedModelSetting()
  if (model && model.startsWith('custom:')) {
    return model
  }
  return LANGROUTER_AUTO_CONFIG
}

export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  return getDefaultFreeModel()
}

export function getDefaultMainLoopModel(): ModelName {
  return parseUserSpecifiedModel(getDefaultMainLoopModelSetting())
}

export function getCanonicalName(fullModelName: ModelName): ModelShortName {
  const name = fullModelName.toLowerCase()
  if (name.includes('deepseek-v4-pro')) {
    return 'deepseek-v4-pro'
  }
  if (name.includes('deepseek-v4-flash')) {
    return 'deepseek-v4-flash'
  }
  if (name.includes('kimi-k2.7-code')) {
    return 'kimi-k2.7-code'
  }
  if (name.includes('kimi-k2.5')) {
    return 'kimi-k2.5'
  }
  if (name.includes('kimi-k2')) {
    return 'kimi-k2'
  }
  if (name.includes('moonshot') || name.includes('kimi')) {
    return 'kimi-k2'
  }
  if (name.includes('minimax')) {
    return 'minimax-m3'
  }
  if (name.includes('glm-5.2')) {
    return 'glm-5.2'
  }
  if (name.includes('glm-5.3-flash')) {
    return 'glm-5.3-flash'
  }
  if (name.includes('ring-2.6-1t')) {
    return 'ring-2.6-1t'
  }
  if (name.includes('mimo-v2.5-pro')) {
    return 'mimo-v2.5-pro'
  }
  if (name.includes('mimo-v2.5')) {
    return 'mimo-v2.5'
  }

  return fullModelName
}

export function firstPartyNameToCanonical(name: ModelName): ModelShortName {
  return getCanonicalName(name)
}

export function getClaudeAiUserDefaultModelDescription(
  _fastMode = false,
): string {
  return 'DeepSeek V4 flash · Best for everyday tasks'
}

export function renderDefaultModelSetting(
  setting: ModelName | ModelAlias,
): string {
  return renderModelName(parseUserSpecifiedModel(setting))
}

export function isOpus1mMergeEnabled(): boolean {
  return false
}

export function renderModelSetting(setting: ModelName | ModelAlias): string {
  if (isModelAlias(setting)) {
    return capitalize(setting)
  }
  return renderModelName(setting)
}

export function getPublicModelDisplayName(model: ModelName): string | null {
  if (model === 'langrouter/auto') {
    return 'LangRouter Auto'
  }

  if (model === 'deepseek-v4-flash') {
    return 'DeepSeek V4 flash'
  }
  if (model === 'deepseek-v4-pro') {
    return 'DeepSeek V4 pro'
  }
  if (model === 'kimi-k2.5') {
    return 'Kimi K2.5'
  }
  if (model === 'minimax-m3') {
    return 'MiniMax M3'
  }
  if (model === 'claude-opus-5') {
    return 'Claude Opus 5'
  }
  if (model === 'claude-opus-4-8') {
    return 'Claude Opus 4.8'
  }
  if (model === 'glm-5.2') {
    return 'GLM 5.2'
  }
  if (model === 'glm-5.3-flash') {
    return 'GLM 5.3 flash'
  }
  if (model === 'gpt-5.4') {
    return 'GPT 5.4'
  }
  if (model === 'gpt-5.6-sol') {
    return 'GPT 5.6 Sol'
  }
  if (model === 'kimi-k2.7-code') {
    return 'Kimi K2.7 code'
  }
  if (model === 'ring-2.6-1t') {
    return 'Ring 2.6 1T'
  }
  if (model === 'mimo-v2.5-pro') {
    return 'Mimo 2.5 pro'
  }
  if (model === 'mimo-v2.5') {
    return 'Mimo 2.5'
  }

  return null
}

export function renderModelName(model: ModelName): string {
  const publicName = getPublicModelDisplayName(model)
  if (publicName) {
    return publicName
  }
  return model
}

export function getPublicModelName(model: ModelName): string {
  const publicName = getPublicModelDisplayName(model)
  if (publicName) {
    return publicName
  }
  return model
}

export function parseUserSpecifiedModel(
  modelInput: ModelName | ModelAlias,
): ModelName {
  const modelInputTrimmed = modelInput.trim()

  if (modelInputTrimmed === 'langrouter/auto') {
    return LANGROUTER_AUTO_CONFIG
  }
  if (modelInputTrimmed === 'deepseek-v4-flash') {
    return DEEPSEEK_V4_FLASH_CONFIG
  }
  if (modelInputTrimmed === 'deepseek-v4-pro') {
    return DEEPSEEK_V4_PRO_CONFIG
  }
  if (modelInputTrimmed === 'kimi-k2.5') {
    return MOONSHOT_KIMI_K2_5_CONFIG
  }
  if (modelInputTrimmed === 'minimax-m3') {
    return MINIMAX_M3_CONFIG
  }
  if (modelInputTrimmed === 'claude-opus-5') {
    return CLAUDE_OPUS_CONFIG
  }
  if (modelInputTrimmed === 'claude-opus-4-8') {
    return CLAUDE_OPUS_4_CONFIG
  }
  if (modelInputTrimmed === 'glm-5.2') {
    return GLM_5_2_CONFIG
  }
  if (modelInputTrimmed === 'glm-5.3-flash') {
    return GLM_5_3_FLASH_CONFIG
  }
  if (modelInputTrimmed === 'gpt-5.4') {
    return GPT_5_4_CONFIG
  }
  if (modelInputTrimmed === 'gpt-5.6-sol') {
    return GPT_5_6_CONFIG
  }
  if (modelInputTrimmed === 'kimi-k2.7-code') {
    return MOONSHOT_KIMI_K2_7_CONFIG
  }
  if (modelInputTrimmed === 'ring-2.6-1t') {
    return RING_2_6_1T_CONFIG
  }
  if (modelInputTrimmed === 'mimo-v2.5-pro') {
    return MIMO_2_5_PRO_CONFIG
  }
  if (modelInputTrimmed === 'mimo-v2.5') {
    return MIMO_2_5_CONFIG
  }

  const normalizedModel = modelInputTrimmed.toLowerCase()

  const has1mTag = has1mContext(normalizedModel)
  const modelString = has1mTag
    ? normalizedModel.replace(/\[1m]$/i, '').trim()
    : normalizedModel

  if (isModelAlias(modelString)) {
    switch (modelString) {
      case 'opusplan':
        return getDefaultSonnetModel() + (has1mTag ? '[1m]' : '') // Sonnet is default, Opus in plan mode
      case 'sonnet':
        return getDefaultSonnetModel() + (has1mTag ? '[1m]' : '')
      case 'haiku':
        return getDefaultHaikuModel() + (has1mTag ? '[1m]' : '')
      case 'opus':
        return getDefaultOpusModel() + (has1mTag ? '[1m]' : '')
      case 'best':
        return getBestModel()
      default:
    }
  }

  if (has1mTag) {
    return modelInputTrimmed.replace(/\[1m\]$/i, '').trim() + '[1m]'
  }
  return modelInputTrimmed
}

export function modelDisplayString(model: ModelSetting): string {
  if (model === null) {
    return `Default (${getDefaultMainLoopModel()})`
  }
  const resolvedModel = parseUserSpecifiedModel(model)
  return model === resolvedModel ? resolvedModel : `${model} (${resolvedModel})`
}

export function getMarketingNameForModel(modelId: string): string | undefined {
  const publicName = getPublicModelDisplayName(modelId)
  return publicName ?? undefined
}

export function normalizeModelStringForAPI(model: string): string {
  // Strip custom: prefix (user-defined models from settings.json modelProviders)
  const withoutPrefix = model.startsWith('custom:') ? model.slice(7) : model
  return withoutPrefix.replace(/\[(1|2)m\]/gi, '')
}

export function resolveSkillModelOverride(
  skillModel: string,
  currentModel: string,
): string {
  return skillModel
}

export function isLegacyModelRemapEnabled(): boolean {
  return false
}

function isModelAlias(model: string): boolean {
  return ['sonnet',
  'opus',
  'haiku',
  'best',
  'sonnet[1m]',
  'opus[1m]',
  'opusplan', 'deepseek', 'moonshot', 'minimax'].includes(model.toLowerCase())
}

export type CustomModelConfig = {
  id: string
  name: string
  envKey: string
  baseUrl: string
  generationConfig?: {
    timeout?: number
    maxRetries?: number
    enableCacheControl?: boolean
    contextWindowSize?: number
    modalities?: { image?: boolean; text?: boolean }
    customHeaders?: Record<string, string>
    extra_body?: Record<string, unknown>
    samplingParams?: {
      temperature?: number
      top_p?: number
      top_k?: number
      max_tokens?: number
      presence_penalty?: number
      frequency_penalty?: number
    }
  }
}

export function getCustomModelConfig(
  modelId: string,
): CustomModelConfig | undefined {
  if (!isCustomModel(modelId)) {
    return;
  }

  const settings = getSettings_DEPRECATED() || {}
  const modelProviders = settings.modelProviders as ModelProviders | undefined
  if (!modelProviders) return undefined

  const actualModelId = getCustomModelId(modelId)
  if (!actualModelId) return undefined

  for (const [_provider, models] of Object.entries(modelProviders)) {
    const found = models.find(m => m.id === actualModelId)
    if (found) {
      return found
    }
  }
  return undefined
}

export function isCustomModel(model: string): boolean {
  return model.startsWith('custom:')
}

export function getCustomModelId(model: ModelName): string | undefined {
  if (!isCustomModel(model)) return undefined
  return model.slice(7)
}
