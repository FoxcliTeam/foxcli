/**
 * OCR module using Windows.Media.Ocr.OcrEngine via PowerShell.
 * Captures a screen region or window, then runs WinRT OCR to extract text.
 */

export interface OcrLine {
  text: string
  bounds: { x: number; y: number; w: number; h: number }
}

export interface OcrResult {
  text: string
  lines: OcrLine[]
  language: string
}

function emptyResult(language: string): OcrResult {
  return { text: '', lines: [], language }
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
 * PowerShell script that:
 * 1. Screenshots a screen region using CopyFromScreen
 * 2. Saves to temp PNG
 * 3. Loads via WinRT BitmapDecoder -> SoftwareBitmap
 * 4. Runs OcrEngine.RecognizeAsync
 * 5. Outputs JSON with text, lines, and bounding rects
 */
function buildOcrRegionScript(
  x: number,
  y: number,
  w: number,
  h: number,
  lang: string,
): string {
  return `
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Runtime.WindowsRuntime

# Load WinRT types
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.RandomAccessStream, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]

# Await helper for WinRT async operations
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1'
})[0]
Function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

try {
    # Step 1: Screenshot region
    $bmp = New-Object System.Drawing.Bitmap(${w}, ${h})
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen(${x}, ${y}, 0, 0, (New-Object System.Drawing.Size(${w}, ${h})))
    $g.Dispose()

    # Step 2: Save to temp file
    $tmpFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "ocrtemp_$([guid]::NewGuid().ToString('N')).png")
    $bmp.Save($tmpFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # Step 3: Open as StorageFile -> BitmapDecoder -> SoftwareBitmap
    $storageFile = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tmpFile)) ([Windows.Storage.StorageFile])
    $stream = Await ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $softwareBmp = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    # Step 4: Create OCR engine
    $ocrLang = New-Object Windows.Globalization.Language('${lang}')
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($ocrLang)
    if ($engine -eq $null) {
        # Fallback to en-US
        $ocrLang = New-Object Windows.Globalization.Language('en-US')
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($ocrLang)
    }
    if ($engine -eq $null) {
        Write-Output '{"text":"","lines":[],"language":"${lang}"}'
        return
    }

    # Step 5: Run OCR
    $ocrResult = Await ($engine.RecognizeAsync($softwareBmp)) ([Windows.Media.Ocr.OcrResult])

    # Step 6: Extract lines with bounding rects
    $lines = @()
    foreach ($line in $ocrResult.Lines) {
        $minX = [double]::MaxValue; $minY = [double]::MaxValue
        $maxX = 0.0; $maxY = 0.0
        foreach ($word in $line.Words) {
            $r = $word.BoundingRect
            if ($r.X -lt $minX) { $minX = $r.X }
            if ($r.Y -lt $minY) { $minY = $r.Y }
            if (($r.X + $r.Width) -gt $maxX) { $maxX = $r.X + $r.Width }
            if (($r.Y + $r.Height) -gt $maxY) { $maxY = $r.Y + $r.Height }
        }
        $lines += @{
            text = $line.Text
            bounds = @{
                x = [int]$minX
                y = [int]$minY
                w = [int]($maxX - $minX)
                h = [int]($maxY - $minY)
            }
        }
    }

    $output = @{
        text = $ocrResult.Text
        lines = $lines
        language = $ocrLang.LanguageTag
    }
    Write-Output (ConvertTo-Json $output -Depth 4 -Compress)

    # Cleanup
    $stream.Dispose()
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
} catch {
    Write-Output '{"text":"","lines":[],"language":"${lang}"}'
}
`
}

/**
 * PowerShell script to get a window's bounding rect by title.
 */
function buildGetWindowRectScript(windowTitle: string): string {
  const escaped = windowTitle.replace(/'/g, "''")
  return `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class WinRect {
    [DllImport("user32.dll", CharSet=CharSet.Unicode)]
    public static extern IntPtr FindWindow(string c, string t);
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr h, out RECT r);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int L, T, R, B; }
    public static string Get(string title) {
        IntPtr hwnd = FindWindow(null, title);
        if (hwnd == IntPtr.Zero) return "NOT_FOUND";
        RECT r; GetWindowRect(hwnd, out r);
        int w = r.R - r.L; int h = r.B - r.T;
        if (w <= 0 || h <= 0) return "INVALID_SIZE";
        return r.L + "," + r.T + "," + w + "," + h;
    }
}
'@
[WinRect]::Get('${escaped}')
`
}

function parseOcrOutput(raw: string, lang: string): OcrResult {
  if (!raw) return emptyResult(lang)
  try {
    const parsed = JSON.parse(raw)
    return {
      text: parsed.text ?? '',
      lines: Array.isArray(parsed.lines)
        ? parsed.lines.map((l: any) => ({
            text: l.text ?? '',
            bounds: {
              x: l.bounds?.x ?? 0,
              y: l.bounds?.y ?? 0,
              w: l.bounds?.w ?? 0,
              h: l.bounds?.h ?? 0,
            },
          }))
        : [],
      language: parsed.language ?? lang,
    }
  } catch {
    return emptyResult(lang)
  }
}

/**
 * Perform OCR on a screen region.
 * Screenshots the specified rectangle, then runs WinRT OcrEngine.
 *
 * @param x - Left coordinate
 * @param y - Top coordinate
 * @param w - Width in pixels
 * @param h - Height in pixels
 * @param lang - BCP-47 language tag (default 'en-US'). Confirmed: 'en-US', 'zh-Hans-CN'
 */
export async function ocrRegion(
  x: number,
  y: number,
  w: number,
  h: number,
  lang?: string,
): Promise<OcrResult> {
  const language = lang ?? 'en-US'
  if (w <= 0 || h <= 0) return emptyResult(language)

  try {
    const script = buildOcrRegionScript(x, y, w, h, language)
    const raw = runPs(script)
    return parseOcrOutput(raw, language)
  } catch {
    return emptyResult(language)
  }
}

/**
 * Perform OCR on a specific window by its title.
 * Gets the window rect, then delegates to ocrRegion.
 *
 * @param windowTitle - Exact window title to find via FindWindow
 * @param lang - BCP-47 language tag (default 'en-US')
 */
export async function ocrWindow(
  windowTitle: string,
  lang?: string,
): Promise<OcrResult> {
  const language = lang ?? 'en-US'

  try {
    const rectScript = buildGetWindowRectScript(windowTitle)
    const raw = runPs(rectScript)
    const trimmed = raw.trim()

    if (!trimmed || trimmed === 'NOT_FOUND' || trimmed === 'INVALID_SIZE') {
      return emptyResult(language)
    }

    const parts = trimmed.split(',')
    if (parts.length !== 4) return emptyResult(language)

    const [x, y, w, h] = parts.map(Number)
    if (!w || !h) return emptyResult(language)

    return ocrRegion(x, y, w, h, lang)
  } catch {
    return emptyResult(language)
  }
}
