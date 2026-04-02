/**
 * Sentinel apps — 需要特殊权限警告的应用列表
 *
 * 包含终端、文件管理器、系统设置等敏感应用。
 * Computer Use 操作这些应用时会显示额外警告。
 */

type SentinelCategory = 'shell' | 'filesystem' | 'system_settings'

const SENTINEL_MAP: Record<string, SentinelCategory> = {
  // Shell / Terminal
  'com.apple.Terminal': 'shell',
  'com.googlecode.iterm2': 'shell',
  'dev.warp.Warp-Stable': 'shell',
  'io.alacritty': 'shell',
  'com.github.wez.wezterm': 'shell',
  'net.kovidgoyal.kitty': 'shell',
  'co.zeit.hyper': 'shell',

  // Filesystem
  'com.apple.finder': 'filesystem',

  // System Settings
  'com.apple.systempreferences': 'system_settings',
  'com.apple.SystemPreferences': 'system_settings',
}

export const sentinelApps: string[] = Object.keys(SENTINEL_MAP)

export function getSentinelCategory(bundleId: string): SentinelCategory | null {
  return SENTINEL_MAP[bundleId] ?? null
}
