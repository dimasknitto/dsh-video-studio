#requires -Version 5.1
<#
  One-command setup for a fresh clone of dsh-video-studio.

  Usage:
    .\setup.ps1
    .\setup.ps1 -Profile desktop
    .\setup.ps1 -DshCommand "C:\path\to\dsh.cmd"

  It installs the engine dependencies (per OS, never copy node_modules),
  registers the plugin in a DSH profile, and prints the remaining steps.
#>
param(
  [string]$Profile = "desktop",
  [string]$DshCommand = "",
  [switch]$SkipEngineInstall,
  [switch]$SkipPluginInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$engine = Join-Path $root "video-studio"
$plugin = Join-Path $root "plugins\dsh-video-studio"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
  Write-Host "  ok  $Message" -ForegroundColor Green
}

function Fail([string]$Message) {
  Write-Host "error: $Message" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path (Join-Path $engine "bin\video.mjs"))) {
  Fail "video-studio engine not found at $engine"
}
if (-not (Test-Path (Join-Path $plugin "package.json"))) {
  Fail "plugin package not found at $plugin"
}

Write-Step "Checking Node.js"
$nodeVersion = $null
try {
  $nodeVersion = (& node --version) 2>$null
} catch {
  $nodeVersion = $null
}
if (-not $nodeVersion) {
  Fail "Node.js is not on PATH. Install Node.js 22 or newer, or pass its folder on PATH."
}
$major = [int](($nodeVersion.TrimStart("v") -split "\.")[0])
if ($major -lt 22) {
  Fail "Node.js $nodeVersion is too old. Use Node.js 22 or newer."
}
Write-Ok "Node $nodeVersion"

if (-not $SkipEngineInstall) {
  Write-Step "Installing engine dependencies (npm ci)"
  Push-Location $engine
  try {
    if (Test-Path "package-lock.json") {
      & npm ci --no-audit --no-fund
    } else {
      & npm install --no-audit --no-fund
    }
    if ($LASTEXITCODE -ne 0) { Fail "npm install failed in $engine" }
  } finally {
    Pop-Location
  }
  Write-Ok "dependencies installed"
}

if (-not $DshCommand) {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd"),
    (Join-Path $env:ProgramFiles "DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd")
  )
  $found = $candidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
  if ($found) {
    $DshCommand = $found
  } else {
    $DshCommand = "dsh"
  }
}

if (-not $SkipPluginInstall) {
  Write-Step "Registering the plugin in profile '$Profile'"
  if ($DshCommand -eq "dsh") {
    $onPath = Get-Command dsh -ErrorAction SilentlyContinue
    if (-not $onPath) {
      Fail "dsh CLI not found. Re-run with -DshCommand '<path-to-dsh.cmd>'."
    }
  }
  & $DshCommand plugin --profile $Profile add "link:$plugin"
  if ($LASTEXITCODE -ne 0) { Fail "dsh plugin add failed" }
  Write-Ok "plugin registered (bundle dsh-video-studio)"
}

Write-Host ""
Write-Host "Done. Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart DSH (or refresh the page) and open the Video Studio panel."
Write-Host "  2. The first render downloads Chrome Headless Shell (~131 MB)."
Write-Host "  3. Render from the panel or ask the agent: 'buatkan reel ...'"
Write-Host ""
Write-Host "Engine: $engine"
Write-Host "Plugin: $plugin"
