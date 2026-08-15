# Reset MySQL root password for Smart Clinic (requires Administrator)
# Usage (run PowerShell as Administrator):
#   Set-ExecutionPolicy -Scope Process Bypass
#   cd "C:\Users\FUTURE TECH\Smart_Clinic\backend\scripts"
#   .\reset-mysql-password.ps1

param(
    [string]$NewPassword = 'SmartClinic@123'
)

$ErrorActionPreference = 'Stop'

$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 26.7\bin'
$mysqld = Join-Path $mysqlBin 'mysqld.exe'
$mysql = Join-Path $mysqlBin 'mysql.exe'
$ini = 'C:\ProgramData\MySQL\MySQL Server 26.7\my.ini'
$serviceName = 'MySQL267'
$backendRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $backendRoot '.env'
$initFile = Join-Path $env:TEMP 'smart-clinic-mysql-init.sql'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'Re-launching as Administrator...'
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -NewPassword `"$NewPassword`""
    exit 0
}

if (-not (Test-Path $mysqld)) {
    throw "MySQL not found at $mysqld"
}

Write-Host "Stopping $serviceName..."
net stop $serviceName | Out-Null

$escaped = $NewPassword.Replace("'", "''")
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$escaped';
FLUSH PRIVILEGES;
"@ | Set-Content -Path $initFile -Encoding ASCII

Write-Host 'Starting temporary MySQL process to apply new password...'
$mysqldProc = Start-Process -FilePath $mysqld -ArgumentList @(
    "--defaults-file=`"$ini`"",
    "--init-file=`"$initFile`"",
    '--console'
) -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 12

if ($mysqldProc.HasExited) {
    throw 'Temporary mysqld exited early. Check MySQL error logs in ProgramData.'
}

Write-Host 'Stopping temporary MySQL process...'
Stop-Process -Id $mysqldProc.Id -Force
Start-Sleep -Seconds 3

Write-Host "Starting $serviceName..."
net start $serviceName | Out-Null
Start-Sleep -Seconds 4

Write-Host 'Verifying login...'
& $mysql -h 127.0.0.1 -P 3306 -u root "-p$NewPassword" -e "SELECT 'password_ok' AS status;" | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Password reset verification failed.'
}

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backendRoot '.env.example') $envFile
}

$content = Get-Content $envFile
$content = $content | ForEach-Object {
    if ($_ -match '^DB_PASSWORD=') { "DB_PASSWORD=$NewPassword" } else { $_ }
}
Set-Content -Path $envFile -Value $content -Encoding utf8

Write-Host 'Initializing smart_clinic database...'
Set-Location $backendRoot
npm run db:init
if ($LASTEXITCODE -ne 0) {
    throw 'Database initialization failed after password reset.'
}

Remove-Item $initFile -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host 'MySQL setup complete.'
Write-Host "Root password: $NewPassword"
Write-Host 'Database: smart_clinic'
Write-Host 'Start backend: npm run dev'
