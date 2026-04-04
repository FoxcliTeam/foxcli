/**
 * Windows UI Automation module
 *
 * Provides UI element tree inspection, element lookup, programmatic click,
 * value setting, and hit-testing via PowerShell + System.Windows.Automation.
 */

export interface UIElement {
  name: string
  controlType: string // Button, Edit, Text, List, Window, etc.
  automationId: string
  boundingRect: { x: number; y: number; w: number; h: number }
  isEnabled: boolean
  value?: string
  children?: UIElement[]
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const UIA_ASSEMBLIES = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName WindowsBase
`

function ps(script: string): string {
  const result = Bun.spawnSync({
    cmd: ['powershell', '-NoProfile', '-NonInteractive', '-Command', script],
    stdout: 'pipe',
    stderr: 'pipe',
  })
  return new TextDecoder().decode(result.stdout).trim()
}

function parseJsonSafe<T>(raw: string, fallback: T): T {
  try {
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// PowerShell snippet that finds a window by exact or partial title match.
// Assumes $title is already set in the calling script.
const PS_FIND_WINDOW = `
$root = [System.Windows.Automation.AutomationElement]::RootElement
$window = $root.FindFirst(
  [System.Windows.Automation.TreeScope]::Children,
  [System.Windows.Automation.PropertyCondition]::new(
    [System.Windows.Automation.AutomationElement]::NameProperty, $title))
if ($window -eq $null) {
  $all = $root.FindAll(
    [System.Windows.Automation.TreeScope]::Children,
    [System.Windows.Automation.Condition]::TrueCondition)
  foreach ($el in $all) {
    if ($el.Current.Name -and $el.Current.Name.Contains($title)) {
      $window = $el
      break
    }
  }
}
`

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the UI element tree of a window, up to `depth` levels deep (default 3).
 */
export function getUITree(windowTitle: string, depth: number = 3): UIElement[] {
  const escapedTitle = windowTitle.replace(/'/g, "''")
  const script = `
${UIA_ASSEMBLIES}
$title = '${escapedTitle}'
${PS_FIND_WINDOW}
if ($window -eq $null) {
  Write-Output '[]'
  exit
}

function Get-UIChildren($parent, $currentDepth, $maxDepth) {
  if ($currentDepth -ge $maxDepth) { return @() }
  $children = $parent.FindAll(
    [System.Windows.Automation.TreeScope]::Children,
    [System.Windows.Automation.Condition]::TrueCondition)
  $result = @()
  foreach ($el in $children) {
    $rect = $el.Current.BoundingRectangle
    $obj = @{
      name = [string]$el.Current.Name
      controlType = $el.Current.ControlType.ProgrammaticName -replace 'ControlType\\.', ''
      automationId = [string]$el.Current.AutomationId
      boundingRect = @{
        x = [int]$rect.X
        y = [int]$rect.Y
        w = [int]$rect.Width
        h = [int]$rect.Height
      }
      isEnabled = $el.Current.IsEnabled
    }
    try {
      $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
      if ($vp -ne $null) { $obj['value'] = $vp.Current.Value }
    } catch {}
    $sub = Get-UIChildren $el ($currentDepth + 1) $maxDepth
    if ($sub.Count -gt 0) { $obj['children'] = $sub }
    $result += $obj
  }
  return $result
}

$tree = Get-UIChildren $window 0 ${depth}
if ($tree -eq $null -or $tree.Count -eq 0) {
  Write-Output '[]'
} else {
  $tree | ConvertTo-Json -Depth 20 -Compress
}
`
  const raw = ps(script)
  const parsed = parseJsonSafe<UIElement | UIElement[]>(raw, [])
  return Array.isArray(parsed) ? parsed : [parsed]
}

/**
 * Find a single element inside a window matching the given query fields.
 */
export function findElement(
  windowTitle: string,
  query: { name?: string; controlType?: string; automationId?: string },
): UIElement | null {
  const escapedTitle = windowTitle.replace(/'/g, "''")

  // Build conditions array
  const conditions: string[] = []
  if (query.name) {
    const v = query.name.replace(/'/g, "''")
    conditions.push(
      `[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty, '${v}')`,
    )
  }
  if (query.controlType) {
    const v = query.controlType.replace(/'/g, "''")
    conditions.push(
      `[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::${v})`,
    )
  }
  if (query.automationId) {
    const v = query.automationId.replace(/'/g, "''")
    conditions.push(
      `[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::AutomationIdProperty, '${v}')`,
    )
  }

  if (conditions.length === 0) return null

  let conditionExpr: string
  if (conditions.length === 1) {
    conditionExpr = conditions[0]
  } else {
    conditionExpr = `[System.Windows.Automation.AndCondition]::new(@(${conditions.join(', ')}))`
  }

  const script = `
${UIA_ASSEMBLIES}
$title = '${escapedTitle}'
${PS_FIND_WINDOW}
if ($window -eq $null) {
  Write-Output 'null'
  exit
}
$cond = ${conditionExpr}
$el = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
if ($el -eq $null) {
  Write-Output 'null'
  exit
}
$rect = $el.Current.BoundingRectangle
$obj = @{
  name = [string]$el.Current.Name
  controlType = $el.Current.ControlType.ProgrammaticName -replace 'ControlType\\.', ''
  automationId = [string]$el.Current.AutomationId
  boundingRect = @{
    x = [int]$rect.X
    y = [int]$rect.Y
    w = [int]$rect.Width
    h = [int]$rect.Height
  }
  isEnabled = $el.Current.IsEnabled
}
try {
  $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  if ($vp -ne $null) { $obj['value'] = $vp.Current.Value }
} catch {}
$obj | ConvertTo-Json -Compress
`
  const raw = ps(script)
  return parseJsonSafe<UIElement | null>(raw, null)
}

/**
 * Click an element by its automationId using InvokePattern.
 */
export function clickElement(windowTitle: string, automationId: string): boolean {
  const escapedTitle = windowTitle.replace(/'/g, "''")
  const escapedId = automationId.replace(/'/g, "''")

  const script = `
${UIA_ASSEMBLIES}
$title = '${escapedTitle}'
${PS_FIND_WINDOW}
if ($window -eq $null) {
  Write-Output 'false'
  exit
}
$cond = [System.Windows.Automation.PropertyCondition]::new(
  [System.Windows.Automation.AutomationElement]::AutomationIdProperty, '${escapedId}')
$el = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
if ($el -eq $null) {
  Write-Output 'false'
  exit
}
try {
  $ip = $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
  $ip.Invoke()
  Write-Output 'true'
} catch {
  Write-Output 'false'
}
`
  return ps(script) === 'true'
}

/**
 * Set the value of an element by its automationId using ValuePattern.
 */
export function setValue(windowTitle: string, automationId: string, value: string): boolean {
  const escapedTitle = windowTitle.replace(/'/g, "''")
  const escapedId = automationId.replace(/'/g, "''")
  const escapedValue = value.replace(/'/g, "''")

  const script = `
${UIA_ASSEMBLIES}
$title = '${escapedTitle}'
${PS_FIND_WINDOW}
if ($window -eq $null) {
  Write-Output 'false'
  exit
}
$cond = [System.Windows.Automation.PropertyCondition]::new(
  [System.Windows.Automation.AutomationElement]::AutomationIdProperty, '${escapedId}')
$el = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $cond)
if ($el -eq $null) {
  Write-Output 'false'
  exit
}
try {
  $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
  $vp.SetValue('${escapedValue}')
  Write-Output 'true'
} catch {
  Write-Output 'false'
}
`
  return ps(script) === 'true'
}

/**
 * Get the UI element at a specific screen coordinate.
 */
export function elementAtPoint(x: number, y: number): UIElement | null {
  const script = `
${UIA_ASSEMBLIES}
try {
  $point = [System.Windows.Point]::new(${x}, ${y})
  $el = [System.Windows.Automation.AutomationElement]::FromPoint($point)
  if ($el -eq $null) {
    Write-Output 'null'
    exit
  }
  $rect = $el.Current.BoundingRectangle
  $obj = @{
    name = [string]$el.Current.Name
    controlType = $el.Current.ControlType.ProgrammaticName -replace 'ControlType\\.', ''
    automationId = [string]$el.Current.AutomationId
    boundingRect = @{
      x = [int]$rect.X
      y = [int]$rect.Y
      w = [int]$rect.Width
      h = [int]$rect.Height
    }
    isEnabled = $el.Current.IsEnabled
  }
  try {
    $vp = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    if ($vp -ne $null) { $obj['value'] = $vp.Current.Value }
  } catch {}
  $obj | ConvertTo-Json -Compress
} catch {
  Write-Output 'null'
}
`
  const raw = ps(script)
  return parseJsonSafe<UIElement | null>(raw, null)
}
