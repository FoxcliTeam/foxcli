/**
 * @ant/computer-use-mcp — Stub 实现
 *
 * 提供类型安全的 stub，所有函数返回合理的默认值。
 * 在 feature('CHICAGO_MCP') = false 时不会被实际调用，
 * 但确保 import 不报错且类型正确。
 */

import type {
  ComputerUseHostAdapter,
  CoordinateMode,
  GrantFlags,
  Logger,
} from './types'

// Re-export types from types.ts
export type { CoordinateMode, Logger } from './types'
export type {
  ComputerUseConfig,
  ComputerUseHostAdapter,
  CuPermissionRequest,
  CuPermissionResponse,
  CuSubGates,
} from './types'
export { DEFAULT_GRANT_FLAGS } from './types'

// ---------------------------------------------------------------------------
// Types (defined here for callers that import from the main entry)
// ---------------------------------------------------------------------------

export interface DisplayGeometry {
  width: number
  height: number
  displayId?: number
  originX?: number
  originY?: number
}

export interface FrontmostApp {
  bundleId: string
  displayName: string
}

export interface InstalledApp {
  bundleId: string
  displayName: string
  path: string
}

export interface RunningApp {
  bundleId: string
  displayName: string
}

export interface ScreenshotResult {
  base64: string
  width: number
  height: number
}

export type ResolvePrepareCaptureResult = ScreenshotResult

export interface ScreenshotDims {
  width: number
  height: number
  displayWidth: number
  displayHeight: number
  displayId: number
  originX: number
  originY: number
}

export interface CuCallToolResultContent {
  type: 'image' | 'text'
  data?: string
  mimeType?: string
  text?: string
}

export interface CuCallToolResult {
  content: CuCallToolResultContent[]
  telemetry: {
    error_kind?: string
    [key: string]: unknown
  }
}

export type ComputerUseSessionContext = Record<string, unknown>

// ---------------------------------------------------------------------------
// API_RESIZE_PARAMS — 默认的截图缩放参数
// ---------------------------------------------------------------------------

export const API_RESIZE_PARAMS = {
  maxWidth: 1280,
  maxHeight: 800,
  maxPixels: 1280 * 800,
}

// ---------------------------------------------------------------------------
// ComputerExecutor — stub class
// ---------------------------------------------------------------------------

export class ComputerExecutor {
  capabilities: Record<string, boolean> = {}
}

// ---------------------------------------------------------------------------
// Functions — 返回合理默认值的 stub
// ---------------------------------------------------------------------------

/**
 * 计算目标截图尺寸。
 * 在物理宽高和 API 限制之间取最优尺寸。
 */
export function targetImageSize(
  physW: number,
  physH: number,
  _params?: typeof API_RESIZE_PARAMS,
): [number, number] {
  const maxW = _params?.maxWidth ?? 1280
  const maxH = _params?.maxHeight ?? 800
  const scale = Math.min(1, maxW / physW, maxH / physH)
  return [Math.round(physW * scale), Math.round(physH * scale)]
}

/**
 * 绑定会话上下文，返回工具调度函数。
 * Stub 返回一个始终返回空结果的调度器。
 */
export function bindSessionContext(
  _adapter: ComputerUseHostAdapter,
  _coordinateMode: CoordinateMode,
  _ctx: ComputerUseSessionContext,
): (name: string, args: unknown) => Promise<CuCallToolResult> {
  return async (_name: string, _args: unknown) => ({
    content: [],
    telemetry: {},
  })
}

/**
 * 构建 Computer Use 工具定义列表。
 * Stub 返回空数组（无工具）。
 */
export function buildComputerUseTools(
  _capabilities?: Record<string, boolean>,
  _coordinateMode?: CoordinateMode,
  _installedAppNames?: string[],
): Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> {
  return []
}

/**
 * 创建 Computer Use MCP server。
 * Stub 返回 null（服务未启用）。
 */
export function createComputerUseMcpServer(
  _adapter?: ComputerUseHostAdapter,
  _coordinateMode?: CoordinateMode,
): null {
  return null
}
