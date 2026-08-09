$ErrorActionPreference = "Stop"

$repo =
  Split-Path -Parent (
    Split-Path -Parent $MyInvocation.MyCommand.Path
  )

Set-Location $repo

$version =
  "26.1"

$url =
  "https://ucdp.uu.se/downloads/ged/ged261-csv.zip"

$dataRoot =
  Join-Path $repo ".data\ucdp-ged"

$outputDir =
  Join-Path $dataRoot $version

$tempDir =
  Join-Path $dataRoot "_download"

$zipPath =
  Join-Path $tempDir "ged261-csv.zip"

$extractDir =
  Join-Path $tempDir "extracted"

New-Item `
  -ItemType Directory `
  -Force `
  -Path $tempDir |
  Out-Null

Remove-Item `
  -Recurse `
  -Force `
  -ErrorAction SilentlyContinue `
  $extractDir

Write-Host ""
Write-Host "Downloading UCDP GED 26.1..." -ForegroundColor Cyan

Invoke-WebRequest `
  -Uri $url `
  -OutFile $zipPath `
  -UseBasicParsing

Write-Host "Extracting..." -ForegroundColor Cyan

Expand-Archive `
  -Path $zipPath `
  -DestinationPath $extractDir `
  -Force

$csv =
  Get-ChildItem `
    -Path $extractDir `
    -Recurse `
    -File `
    -Filter *.csv |
  Select-Object -First 1

if (-not $csv) {
  throw "UCDP GED CSV file was not found after extraction."
}

Write-Host "Building local yearly index..." -ForegroundColor Cyan

node .\scripts\build-ucdp-ged-index.mjs `
  --csv $csv.FullName `
  --out $outputDir

if ($LASTEXITCODE -ne 0) {
  throw "UCDP GED index build failed."
}

Remove-Item `
  -Recurse `
  -Force `
  -ErrorAction SilentlyContinue `
  $tempDir

$manifest =
  Get-Content `
    (Join-Path $outputDir "manifest.json") `
    -Raw |
  ConvertFrom-Json

Write-Host ""
Write-Host "UCDP GED LOCAL PROVISION SUCCESSFUL" -ForegroundColor Green
Write-Host "Version: $($manifest.version)"
Write-Host "Records: $($manifest.recordCount)"
Write-Host "Coverage: $($manifest.coverageStart) -> $($manifest.coverageEnd)"
Write-Host "Path: $outputDir"