/**
 * Window enumeration using Win32 EnumWindows API.
 * Returns visible windows with their HWND, PID, and title.
 */

export interface WindowInfo {
  hwnd: number
  pid: number
  title: string
}

const ENUM_WINDOWS_PS = `
Add-Type @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WinEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    public static List<string> results = new List<string>();

    public static void Run() {
        results.Clear();
        EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
            if (!IsWindowVisible(hWnd)) return true;
            int len = GetWindowTextLength(hWnd);
            if (len == 0) return true;
            StringBuilder sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            string title = sb.ToString();
            if (string.IsNullOrWhiteSpace(title)) return true;
            uint pid = 0;
            GetWindowThreadProcessId(hWnd, out pid);
            results.Add(hWnd.ToInt64() + "|" + pid + "|" + title);
            return true;
        }, IntPtr.Zero);
    }
}
'@
[WinEnum]::Run()
[WinEnum]::results | ForEach-Object { $_ }
`

/**
 * List all visible windows with non-empty titles.
 * Returns HWND, PID, and window title for each.
 */
export function listWindows(): WindowInfo[] {
  const result = Bun.spawnSync({
    cmd: ['powershell', '-NoProfile', '-NonInteractive', '-Command', ENUM_WINDOWS_PS],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const raw = new TextDecoder().decode(result.stdout).trim()
  if (!raw) return []

  return raw
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const trimmed = line.trim()
      const firstPipe = trimmed.indexOf('|')
      const secondPipe = trimmed.indexOf('|', firstPipe + 1)
      if (firstPipe === -1 || secondPipe === -1) return null

      const hwnd = Number(trimmed.slice(0, firstPipe))
      const pid = Number(trimmed.slice(firstPipe + 1, secondPipe))
      const title = trimmed.slice(secondPipe + 1)

      if (isNaN(hwnd) || isNaN(pid) || !title) return null
      return { hwnd, pid, title }
    })
    .filter((item): item is WindowInfo => item !== null)
}
