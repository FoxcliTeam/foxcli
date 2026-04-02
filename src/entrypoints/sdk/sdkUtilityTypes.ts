/**
 * Stub: SDK Utility Types.
 */
export type NonNullableUsage = {
  inputTokens?: number
  outputTokens?: number
  cacheReadInputTokens?: number
  cacheCreationInputTokens?: number
  input_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  output_tokens: number
  server_tool_use: { web_search_requests: number; web_fetch_requests: number }
  service_tier: string
  cache_creation: {
    ephemeral_1h_input_tokens: number
    ephemeral_5m_input_tokens: number
  }
  inference_geo: string
  iterations: unknown[]
  speed: string
  cache_deleted_input_tokens?: number
  [key: string]: unknown
}
