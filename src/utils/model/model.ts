import { getMainLoopModelOverride } from '../../bootstrap/state.js'
import { getSettings_DEPRECATED } from '../settings/settings.js'
import { isModelAllowed } from './modelAllowlist.js'
import { capitalize } from '../stringUtils.js'
import {
  DEEPSEEK_V3_2_CONFIG,
  DEEPSEEK_V3_2_THINK_CONFIG,
  MOONSHOT_KIMI_K2_5_CONFIG,
  MOONSHOT_KIMI_K2_CONFIG,
  MINIMAX_M2_5_CONFIG,
  CLAUDE_OPUS_4_6_CONFIG,
} from './configs.js'

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
  return MINIMAX_M2_5_CONFIG
}

export function getDefaultOpusModel(): ModelName {
  return MINIMAX_M2_5_CONFIG
}

export function getDefaultSonnetModel(): ModelName {
  return DEEPSEEK_V3_2_CONFIG
}

export function getDefaultHaikuModel(): ModelName {
  return MOONSHOT_KIMI_K2_5_CONFIG
}

export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  return getDefaultSonnetModel()
}

export function getDefaultMainLoopModel(): ModelName {
  return parseUserSpecifiedModel(getDefaultMainLoopModelSetting())
}

export function getCanonicalName(fullModelName: ModelName): ModelShortName {
  const name = fullModelName.toLowerCase()
  if (name.includes('deepseek')) {
    return 'deepseek-v3-2'
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
    return 'minimax-m2.5'
  }
  return fullModelName
}

export function firstPartyNameToCanonical(name: ModelName): ModelShortName {
  return getCanonicalName(name)
}

export function getClaudeAiUserDefaultModelDescription(
  _fastMode = false,
): string {
  return 'DeepSeek V3.2 · Best for everyday tasks'
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
  if (model === 'deepseek-v3.2') {
    return 'DeepSeek V3.2'
  }
  if (model === 'deepseek-v3.2-think') {
    return 'DeepSeek V3.2 Think'
  }
  if (model === 'kimi-k2.5') {
    return 'Kimi K2.5'
  }
  if (model === 'kimi-k2') {
    return 'Kimi K2'
  }
  if (model === 'minimax-m2.5') {
    return 'MiniMax M2.5'
  }
  if (model === 'claude-opus-4-6') {
    return 'Claude Opus 4.6'
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

  if (modelInputTrimmed === 'deepseek-v3.2') {
    return DEEPSEEK_V3_2_CONFIG
  }
  if (modelInputTrimmed === 'deepseek-v3.2-think') {
    return DEEPSEEK_V3_2_THINK_CONFIG
  }
  if (modelInputTrimmed === 'kimi-k2.5') {
    return MOONSHOT_KIMI_K2_5_CONFIG
  }
  if (modelInputTrimmed === 'kimi-k2' || modelInputTrimmed === 'moonshot-k2') {
    return MOONSHOT_KIMI_K2_CONFIG
  }
  if (modelInputTrimmed === 'minimax-m2.5') {
    return MINIMAX_M2_5_CONFIG
  }
  if (modelInputTrimmed === 'claude-opus-4-6') {
    return CLAUDE_OPUS_4_6_CONFIG
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
  return model.replace(/\[(1|2)m\]/gi, '')
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
  return ['deepseek', 'moonshot', 'minimax'].includes(model.toLowerCase())
}
