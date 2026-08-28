import OpenAI from 'openai'
import { getUserAgent } from 'src/utils/http.js'
import { getCustomModelConfig, isCustomModel, getCustomModelId } from 'src/utils/model/model.js'
import { getInitialSettings } from 'src/utils/settings/settings.js'
import type { ModelProviders } from 'src/utils/settings/types.js'
import { getProxyFetchOptions } from 'src/utils/proxy.js'
import { isEnvTruthy } from 'src/utils/envUtils.js'
import { isBuiltInOpenAIModel } from 'src/utils/model/configs.js'

/**
 * Environment variables:
 *
 * OPENAI_API_KEY: Required. API key for the OpenAI-compatible endpoint.
 * OPENAI_BASE_URL: Recommended. Base URL for the endpoint (e.g. http://localhost:11434/v1).
 * OPENAI_ORG_ID: Optional. Organization ID.
 * OPENAI_PROJECT_ID: Optional. Project ID.
 *
 * For built-in OpenAI-protocol models (defined in configs.ts), if OPENAI_BASE_URL
 * is not set, we fall back to ANTHROPIC_BASE_URL so the request goes to the same
 * host but uses the OpenAI-compatible /v1/chat/completions endpoint.
 */

let cachedClient: OpenAI | null = null

function getCustomProviderConfig(model?: string): {
  apiKey?: string
  baseURL?: string
  timeout?: number
  maxRetries?: number
  customHeaders?: Record<string, string>
} | null {
  if (!model || !isCustomModel(model)) return null
  const config = getCustomModelConfig(model)
  if (!config) return null
  return {
    apiKey: config.envKey ? process.env[config.envKey] : undefined,
    baseURL: config.baseUrl,
    timeout: config.generationConfig?.timeout,
    maxRetries: config.generationConfig?.maxRetries,
    customHeaders: config.generationConfig?.customHeaders,
  }
}

/**
 * Resolve the base URL for OpenAI-compatible requests.
 *
 * Priority:
 * 1. Custom model config baseUrl (from settings.json modelProviders)
 * 2. OPENAI_BASE_URL environment variable
 * 3. For built-in OpenAI-protocol models: ANTHROPIC_BASE_URL with /v1 suffix
 */
function resolveOpenAIBaseURL(model?: string): string | undefined {
  const customConfig = model ? getCustomProviderConfig(model) : null
  if (customConfig?.baseURL) {
    return customConfig.baseURL
  }

  // Built-in OpenAI-protocol models fall back to ANTHROPIC_BASE_URL
  if (model && isBuiltInOpenAIModel(model) && process.env.ANTHROPIC_BASE_URL) {
    let url = process.env.ANTHROPIC_BASE_URL
    // Anthropic SDK expects baseURL without /v1 (it adds /v1/messages internally),
    // but OpenAI SDK expects baseURL *with* /v1 (it adds /chat/completions).
    // Ensure the URL ends with /v1 so the final endpoint becomes
    // ${ANTHROPIC_BASE_URL}/v1/chat/completions.
    if (!url.endsWith('/v1')) {
      url = url.replace(/\/$/, '') + '/v1'
    }
    return url
  }
  if (process.env.OPENAI_BASE_URL) {
    return process.env.OPENAI_BASE_URL
  }
  
  return undefined
}

/**
 * Resolve the API key for OpenAI-compatible requests.
 *
 * Priority:
 * 1. Custom model config envKey (from settings.json modelProviders)
 * 2. OPENAI_API_KEY environment variable
 * 3. For built-in OpenAI-protocol models: ANTHROPIC_AUTH_TOKEN
 */
function resolveOpenAIApiKey(model?: string): string {
  const customConfig = model ? getCustomProviderConfig(model) : null
  if (customConfig?.apiKey) {
    return customConfig.apiKey
  }

  // Built-in OpenAI-protocol models fall back to ANTHROPIC_AUTH_TOKEN
  if (model && isBuiltInOpenAIModel(model) && process.env.ANTHROPIC_AUTH_TOKEN) {
    return process.env.ANTHROPIC_AUTH_TOKEN
  }

  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY
  }

  return ''
}

export function getOpenAIClient(options?: {
  maxRetries?: number
  fetchOverride?: typeof fetch
  source?: string
  model?: string
}): OpenAI {
  const customConfig = options?.model ? getCustomProviderConfig(options.model) : null

  const apiKey = resolveOpenAIApiKey(options?.model)
  const baseURL = resolveOpenAIBaseURL(options?.model)

  const client = new OpenAI({
    apiKey,
    ...(baseURL && { baseURL }),
    maxRetries: customConfig?.maxRetries ?? options?.maxRetries ?? 0,
    timeout: customConfig?.timeout ?? parseInt(process.env.API_TIMEOUT_MS || String(600 * 1000), 10),
    dangerouslyAllowBrowser: true,
    ...(process.env.OPENAI_ORG_ID && { organization: process.env.OPENAI_ORG_ID }),
    ...(process.env.OPENAI_PROJECT_ID && { project: process.env.OPENAI_PROJECT_ID }),
    defaultHeaders: {
      'User-Agent': getUserAgent(),
      ...(customConfig?.customHeaders ?? {}),
    },
    fetchOptions: getProxyFetchOptions({ forAnthropicAPI: false }),
    ...(options?.fetchOverride && { fetch: options.fetchOverride }),
  })

  if (!options?.fetchOverride && !customConfig) {
    cachedClient = client
  }

  return client
}

/** Clear the cached client (useful when env vars change). */
export function clearOpenAIClientCache(): void {
  cachedClient = null
}
