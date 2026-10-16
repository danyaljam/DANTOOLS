# DAN Tools One-Command Windows Updater
# Usage: irm https://raw.githubusercontent.com/danyaljam/DANTOOLS/main/scripts/update-windows.ps1 | iex

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "        DAN Tools Windows Updater" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Check if git repo exists in current directory or user home
$currentRepo = (Test-Path "package.json") -and (Test-Path ".git")
$repoDir = $pwd

if (-not $currentRepo) {
    if (Test-Path "$HOME\dtools\package.json") {
        $repoDir = "$HOME\dtools"
        $currentRepo = $true
    } elseif (Test-Path "$HOME\Desktop\Tool\package.json") {
        $repoDir = "$HOME\Desktop\Tool"
        $currentRepo = $true
    }
}

if ($currentRepo) {
    Write-Host "`nUpdating local source repository at $repoDir..." -ForegroundColor Green
    Set-Location $repoDir
    git pull origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: git pull had warnings or conflicts. Running npm install..." -ForegroundColor Yellow
    }
    npm ci
    npm run build
    Write-Host "`nUpdate complete! Starting DAN Tools..." -ForegroundColor Green
    npm run local
    exit 0
}

# 2. Check if installed via WinGet
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetCmd) {
    Write-Host "`nChecking WinGet updates for DanyalJam.DTools..." -ForegroundColor Green
    winget upgrade --id DanyalJam.DTools --exact
    if ($LASTEXITCODE -eq 0) {
        Write-Host "WinGet package upgraded successfully!" -ForegroundColor Green
        exit 0
    }
}

# 3. Fallback: Download latest standalone release EXE
Write-Host "`nDownloading latest standalone release from GitHub..." -ForegroundColor Green
try {
    $releasesUrl = "https://api.github.com/repos/danyaljam/DANTOOLS/releases/latest"
    $release = Invoke-RestMethod -Uri $releasesUrl -Headers @{ "User-Agent" = "dtools-updater" }
    $asset = $release.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1

    if ($asset) {
        $destPath = "$HOME\Downloads\$($asset.name)"
        Write-Host "Downloading $($asset.name) to $destPath..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $destPath
        Write-Host "`nDownload complete! Launching $($asset.name)..." -ForegroundColor Green
        Start-Process $destPath
    } else {
        Write-Host "Please visit https://github.com/danyaljam/DANTOOLS/releases/latest to download the newest version." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not auto-download release. Please visit: https://github.com/danyaljam/DANTOOLS/releases/latest" -ForegroundColor Red
}
