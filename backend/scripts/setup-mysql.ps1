# Smart Clinic - MySQL setup helper
# Run from an elevated PowerShell if MySQL service is stopped:
#   net start MySQL267

param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$ErrorActionPreference = 'Stop'
$backendRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $backendRoot '.env'

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendRoot '.env.example') $envFile
}

$content = Get-Content $envFile
$content = $content | ForEach-Object {
    if ($_ -match '^DB_PASSWORD=') { "DB_PASSWORD=$Password" } else { $_ }
}
Set-Content -Path $envFile -Value $content -Encoding utf8

Write-Host "Updated backend/.env with DB_PASSWORD"
Write-Host "Initializing database..."
Set-Location $backendRoot
npm run db:init
if ($LASTEXITCODE -eq 0) {
    Write-Host "MySQL setup complete: database 'smart_clinic' is ready."
} else {
    Write-Host "Database init failed. Check root password and that MySQL267 is running."
    exit 1
}
