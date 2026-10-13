# Dependency installation is explicitly confined to disposable GitHub runners.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'This installer is for GitHub Actions only; use existing local dependencies.' }
$edition = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$sources = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'runtime-sources.json') -Raw | ConvertFrom-Json
$runtimeDirectory = Join-Path $env:RUNNER_TEMP 'cpp-handbook-runtime'
$licenseDirectory = Join-Path $runtimeDirectory 'font-licenses'
New-Item -ItemType Directory -Force -Path $licenseDirectory | Out-Null
function Get-VerifiedFile($source, $destination) {
    Invoke-WebRequest -Uri $source.url -OutFile $destination
    $actual = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $source.sha256) { throw "Download checksum mismatch: $destination" }
}
$archive = Join-Path $runtimeDirectory 'poppler.zip'
Get-VerifiedFile $sources.poppler $archive
Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $runtimeDirectory 'poppler')
$pdftoppm = @(Get-ChildItem -LiteralPath (Join-Path $runtimeDirectory 'poppler') -Filter pdftoppm.exe -Recurse)
if ($pdftoppm.Count -ne 1) { throw 'Expected one pinned Poppler executable' }
$pdftoppm[0].DirectoryName | Out-File -LiteralPath $env:GITHUB_PATH -Encoding utf8 -Append
"HANDBOOK_PDFTOPPM=$($pdftoppm[0].FullName)" | Out-File -LiteralPath $env:GITHUB_ENV -Encoding utf8 -Append
"HANDBOOK_FONT_LICENSES=$licenseDirectory" | Out-File -LiteralPath $env:GITHUB_ENV -Encoding utf8 -Append

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class HandbookFonts {
    [DllImport("gdi32.dll", CharSet=CharSet.Unicode)]
    public static extern int AddFontResourceEx(string filename, uint flags, IntPtr reserved);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)]
    public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, IntPtr w, IntPtr l, uint f, uint t, out IntPtr r);
}
'@
$fontDirectory = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
New-Item -ItemType Directory -Force -Path $fontDirectory | Out-Null
$fontRegistry = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item -Path $fontRegistry -Force | Out-Null
foreach ($font in $sources.fonts) {
    if ($font.license) {
        Get-VerifiedFile $font (Join-Path $licenseDirectory $font.name)
    } else {
        $destination = Join-Path $fontDirectory $font.name
        Get-VerifiedFile $font $destination
        New-ItemProperty -Path $fontRegistry -Name $font.name -Value $destination -PropertyType String -Force | Out-Null
        if ([HandbookFonts]::AddFontResourceEx($destination, 0, [IntPtr]::Zero) -eq 0) { throw "Font registration failed: $($font.name)" }
    }
}
$fontResult = [IntPtr]::Zero
[HandbookFonts]::SendMessageTimeout([IntPtr]0xffff, 0x1d, [IntPtr]::Zero, [IntPtr]::Zero, 2, 5000, [ref]$fontResult) | Out-Null
Add-Type -AssemblyName System.Drawing
$installed = [System.Drawing.Text.InstalledFontCollection]::new()
$fontNames = @($installed.Families.Name)
foreach ($family in @('Noto Sans CJK SC', 'Noto Serif CJK SC', 'Consolas', 'Segoe UI', 'Arial')) {
    if ($family -notin $fontNames) { throw "Required font is unavailable: $family" }
}

Push-Location $PSScriptRoot
try {
    $browser = node -p "require('playwright').chromium.executablePath()"
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $browser)) { throw 'Pinned Chromium is missing' }
    "HANDBOOK_BROWSER=$browser" | Out-File -LiteralPath $env:GITHUB_ENV -Encoding utf8 -Append
    $packages = node -p "JSON.stringify({marked:require('./node_modules/marked/package.json').version,playwright:require('./node_modules/playwright/package.json').version,chromium:require('./node_modules/playwright-core/browsers.json').browsers.find(b=>b.name==='chromium').browserVersion})" | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw 'Cannot read Node dependency versions' }
    $qa = Join-Path $edition 'qa/learning-revision'
    New-Item -ItemType Directory -Force -Path $qa | Out-Null
    @{
        node = (node --version)
        packages = $packages
        poppler = $sources.poppler
        font_sources = $sources.fonts
        available_fonts = @($fontNames | Where-Object { $_ -match 'Noto|SimSun|Microsoft YaHei|Consolas|Segoe UI|^Arial$' } | Sort-Object)
        runner_os = $env:RUNNER_OS
        runner_image = $env:ImageVersion
    } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $qa 'runtime.json') -Encoding utf8
} finally { Pop-Location }
