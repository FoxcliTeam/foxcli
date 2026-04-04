/**
 * Window-level screenshot capture using Win32 PrintWindow API.
 * Captures windows even when occluded or minimized.
 */

interface CaptureResult {
  base64: string
  width: number
  height: number
}

const CAPTURE_BY_TITLE_PS = `
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @'
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;
public class WinCap {
    [DllImport("user32.dll", CharSet=CharSet.Unicode)]
    public static extern IntPtr FindWindow(string c, string t);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int L, T, R, B; }

    public static string Capture(string title) {
        IntPtr hwnd = FindWindow(null, title);
        if (hwnd == IntPtr.Zero) return "NOT_FOUND";
        RECT r; GetWindowRect(hwnd, out r);
        int w = r.R - r.L; int h = r.B - r.T;
        if (w <= 0 || h <= 0) return "INVALID_SIZE";
        Bitmap bmp = new Bitmap(w, h);
        Graphics g = Graphics.FromImage(bmp);
        IntPtr hdc = g.GetHdc();
        PrintWindow(hwnd, hdc, 2);
        g.ReleaseHdc(hdc); g.Dispose();
        var ms = new System.IO.MemoryStream();
        bmp.Save(ms, ImageFormat.Png);
        bmp.Dispose();
        return w + "," + h + "," + Convert.ToBase64String(ms.ToArray());
    }
}
'@
`

const CAPTURE_BY_HWND_PS = `
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing @'
using System;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;
public class WinCapH {
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
    [DllImport("user32.dll")]
    public static extern bool IsWindow(IntPtr hWnd);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int L, T, R, B; }

    public static string Capture(IntPtr hwnd) {
        if (!IsWindow(hwnd)) return "NOT_FOUND";
        RECT r; GetWindowRect(hwnd, out r);
        int w = r.R - r.L; int h = r.B - r.T;
        if (w <= 0 || h <= 0) return "INVALID_SIZE";
        Bitmap bmp = new Bitmap(w, h);
        Graphics g = Graphics.FromImage(bmp);
        IntPtr hdc = g.GetHdc();
        PrintWindow(hwnd, hdc, 2);
        g.ReleaseHdc(hdc); g.Dispose();
        var ms = new System.IO.MemoryStream();
        bmp.Save(ms, ImageFormat.Png);
        bmp.Dispose();
        return w + "," + h + "," + Convert.ToBase64String(ms.ToArray());
    }
}
'@
`

function parseCaptureOutput(raw: string): CaptureResult | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'NOT_FOUND' || trimmed === 'INVALID_SIZE') {
    return null
  }
  const firstComma = trimmed.indexOf(',')
  const secondComma = trimmed.indexOf(',', firstComma + 1)
  if (firstComma === -1 || secondComma === -1) return null

  const width = Number(trimmed.slice(0, firstComma))
  const height = Number(trimmed.slice(firstComma + 1, secondComma))
  const base64 = trimmed.slice(secondComma + 1)

  if (!width || !height || !base64) return null
  return { base64, width, height }
}

function runPs(script: string): string {
  const result = Bun.spawnSync({
    cmd: ['powershell', '-NoProfile', '-NonInteractive', '-Command', script],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return new TextDecoder().decode(result.stdout).trim()
}

/**
 * Capture a window screenshot by its exact title.
 * Uses PrintWindow which works even for occluded/background windows.
 */
export function captureWindow(title: string): CaptureResult | null {
  const escaped = title.replace(/'/g, "''")
  const script = `${CAPTURE_BY_TITLE_PS}\n[WinCap]::Capture('${escaped}')`
  const raw = runPs(script)
  return parseCaptureOutput(raw)
}

/**
 * Capture a window screenshot by its HWND handle.
 */
export function captureWindowByHwnd(hwnd: number): CaptureResult | null {
  const script = `${CAPTURE_BY_HWND_PS}\n[WinCapH]::Capture([IntPtr]::new(${hwnd}))`
  const raw = runPs(script)
  return parseCaptureOutput(raw)
}
