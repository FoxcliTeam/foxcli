import {
  LANGROUTER_AUTO_CONFIG,
  DEEPSEEK_V4_FLASH_CONFIG,
  DEEPSEEK_V4_PRO_CONFIG,
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
import { getSettings_DEPRECATED } from '../settings/settings.js'
import { getGlobalConfig } from '../config.js'
import { isModelAllowed } from './modelAllowlist.js'
import type { ModelProviders } from '../settings/types.js'
import {
  has1mContext,
} from '../context.js'

export type ModelOption = {
  value: string
  label: string
  description: string
  descriptionForModel?: string
}

export function getDefaultOptionForUser(): ModelOption {
  return {
    value: LANGROUTER_AUTO_CONFIG,
    label: 'Auto (free)',
    description: `Use the auto-free model (${LANGROUTER_AUTO_CONFIG})`,
  }
}

function getDeepSeekOption(): ModelOption {
  return {
    value: DEEPSEEK_V4_FLASH_CONFIG,
    label: 'DeepSeek V4 flash',
    description: 'DeepSeek V4 flash · Best for everyday tasks',
    descriptionForModel: 'DeepSeek V4 flash - best for everyday tasks',
  }
}

function getDeepSeekThinkOption(): ModelOption {
  return {
    value: DEEPSEEK_V4_PRO_CONFIG,
    label: 'DeepSeek V4 pro',
    description: 'DeepSeek V4 pro · Enhanced reasoning',
    descriptionForModel: 'DeepSeek V4 pro - enhanced reasoning',
  }
}

function getMoonshotK27Option(): ModelOption {
  return {
    value: MOONSHOT_KIMI_K2_7_CONFIG,
    label: 'Kimi K2.7 code',
    description: 'Kimi K2.7 code · Flagship coding model',
    descriptionForModel: 'Kimi K2.7 code - Flagship coding model',
  }
}

function getMiniMaxOption(): ModelOption {
  return {
    value: MINIMAX_M3_CONFIG,
    label: 'MiniMax M3',
    description: 'MiniMax M3 · MiniMax flagship model',
    descriptionForModel: 'MiniMax M3 - MiniMax flagship model',
  }
}

function getClaudeOpusOption(): ModelOption {
  return {
    value: CLAUDE_OPUS_CONFIG,
    label: 'Claude Opus 5',
    description: 'Claude Opus 5 · Anthropic flagship model',
    descriptionForModel: 'Claude Opus 5 - Anthropic flagship model',
  }
}

function getClaudeOpus4Option(): ModelOption {
  return {
    value: CLAUDE_OPUS_4_CONFIG,
    label: 'Claude Opus 4.8',
    description: 'Claude Opus 4.8 · Anthropic model',
    descriptionForModel: 'Claude Opus 4.8 - Anthropic model',
  }
}

function getGlm52Option(): ModelOption {
  return {
    value: GLM_5_2_CONFIG,
    label: 'GLM 5.2',
    description: 'GLM 5.2 · Z.ai flagship model',
    descriptionForModel: 'GLM 5.2 - Z.ai flagship model',
  }
}

function getGlm53FlashOption(): ModelOption {
  return {
    value: GLM_5_3_FLASH_CONFIG,
    label: 'GLM 5.3 flash',
    description: 'GLM 5.3 flash · Z.ai turbo model',
    descriptionForModel: 'GLM 5.3 flash - Z.ai turbo model',
  }
}

function getGpt54Option(): ModelOption {
  return {
    value: GPT_5_4_CONFIG,
    label: 'GPT 5.4',
    description: 'GPT 5.4 · Openai model',
    descriptionForModel: 'GPT 5.4 · Openai model',
  }
}

function getGpt56Option(): ModelOption {
  return {
    value: GPT_5_6_CONFIG,
    label: 'GPT 5.6 Sol',
    description: 'GPT 5.6 Sol · Openai flagship model',
    descriptionForModel: 'GPT 5.6 Sol · Openai flagship model',
  }
}

function getRing261TOption(): ModelOption {
  return {
    value: RING_2_6_1T_CONFIG,
    label: 'Ring 2.6 1T',
    description: 'Ring 2.6 1T · inclusionAI flagship model',
    descriptionForModel: 'Ring 2.6 1T · inclusionAI flagship model',
  }
}

function getMimo25ProOption(): ModelOption {
  return {
    value: MIMO_2_5_PRO_CONFIG,
    label: 'Mimo 2.5 pro',
    description: 'Mimo 2.5 pro · Xiaomi Mimo flagship model',
    descriptionForModel: 'Mimo 2.5 pro · Xiaomi Mimo flagship model',
  }
}

function getMimo25Option(): ModelOption {
  return {
    value: MIMO_2_5_CONFIG,
    label: 'Mimo 2.5',
    description: 'Mimo 2.5 · Xiaomi Mimo model',
    descriptionForModel: 'Mimo 2.5 · Xiaomi Mimo model',
  }
}

function getModelOptionsBase(): ModelOption[] {
  return [
    getDefaultOptionForUser(),
    getDeepSeekOption(),
    getDeepSeekThinkOption(),
    getGlm52Option(),
    getGlm53FlashOption(),
    getClaudeOpusOption(),
    getClaudeOpus4Option(),
    getMoonshotK27Option(),
    getGpt56Option(),
    getGpt54Option(),
    getMiniMaxOption(),
    getMimo25ProOption(),
    getMimo25Option(),
  ]
}

function getCustomSonnetOption(): ModelOption | undefined {
  const customSonnetModel = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  if (customSonnetModel) {
    const is1m = has1mContext(customSonnetModel)
    return {
      value: 'sonnet',
      label:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME ?? customSonnetModel,
      description:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ??
        `Custom Sonnet model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ?? `Custom Sonnet model${is1m ? ' with 1M context' : ''}`} (${customSonnetModel})`,
    }
  }
}

function getCustomOpusOption(): ModelOption | undefined {
  const customOpusModel = process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  if (customOpusModel) {
    const is1m = has1mContext(customOpusModel)
    return {
      value: 'opus',
      label: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME ?? customOpusModel,
      description:
        process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ??
        `Custom Opus model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ?? `Custom Opus model${is1m ? ' with 1M context' : ''}`} (${customOpusModel})`,
    }
  }
}

function getCustomHaikuOption(): ModelOption | undefined {
  const customHaikuModel = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  if (customHaikuModel) {
    return {
      value: 'haiku',
      label: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME ?? customHaikuModel,
      description:
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ??
        'Custom Haiku model',
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ?? 'Custom Haiku model'} (${customHaikuModel})`,
    }
  }
}

function getCustomModelProvidersOptions(): ModelOption[] {
  const settings = getSettings_DEPRECATED() || {}
  const modelProviders = settings.modelProviders as ModelProviders | undefined
  if (!modelProviders) return []

  const options: ModelOption[] = []
  for (const [_provider, models] of Object.entries(modelProviders)) {
    for (const model of models) {
      if (
        !options.some(existing => existing.value === `custom:${model.id}`)
      ) {
        options.push({
          value: `custom:${model.id}`,
          label: model.name || model.id,
          description: `Custom model (${model.id})`,
        })
      }
    }
  }
  return options
}

export function getModelOptions(_fastMode = false): ModelOption[] {
  const options = getModelOptionsBase()

  const customModelEnv = process.env.ANTHROPIC_CUSTOM_MODEL_OPTION
  if (
    customModelEnv &&
    !options.some(existing => existing.value === customModelEnv)
  ) {
    options.push({
      value: customModelEnv,
      label: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME ?? customModelEnv,
      description:
        process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION ??
        `Custom model (${customModelEnv})`,
    })
  }

  for (const opt of getGlobalConfig().additionalModelOptionsCache ?? []) {
    if (!options.some(existing => existing.value === opt.value)) {
      options.push(opt)
    }
  }

  const customProviderOptions = getCustomModelProvidersOptions()
  for (const opt of customProviderOptions) {
    if (!options.some(existing => existing.value === opt.value)) {
      options.push(opt)
    }
  }

  const customSonnet = getCustomSonnetOption()
  if (customSonnet !== undefined) {
    options.push(customSonnet)
  }
  const customOpus = getCustomOpusOption()
  if (customOpus !== undefined) {
    options.push(customOpus)
  }
  const customHaiku = getCustomHaikuOption()
  if (customHaiku !== undefined) {
    options.push(customHaiku)
  }

  return filterModelOptionsByAllowlist(options)
}

function filterModelOptionsByAllowlist(options: ModelOption[]): ModelOption[] {
  const settings = getSettings_DEPRECATED() || {}
  if (!settings.availableModels) {
    return options
  }
  return options.filter(
    opt =>
      opt.value === 'default' ||
      (opt.value !== null && isModelAllowed(opt.value)),
  )
}
