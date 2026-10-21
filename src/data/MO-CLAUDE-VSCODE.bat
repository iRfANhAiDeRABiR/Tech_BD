@echo off
chcp 65001 >nul

:: UTF-8 cho terminal (fix loi tieng Viet bi "rÃ¡Â»i" tren Windows)
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
set "LANG=en_US.UTF-8"
set "LC_ALL=en_US.UTF-8"
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; [Console]::InputEncoding=[System.Text.Encoding]::UTF8; $OutputEncoding=[System.Text.Encoding]::UTF8" >nul 2>&1

:: Tu xin quyen admin (UAC) neu chua co - mot so may can quyen admin moi chay duoc
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Dang xin quyen admin...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
    exit /b
)

title Claude Code (VS Code) - Nghimmo
color 0B

cls
echo.
echo ============================================================
echo       CLAUDE CODE TREN VS CODE - POWERED BY NGHIMMO
echo ============================================================
echo.
echo  Server : https://api.nghimmo.com
echo  Check  : https://api.nghimmo.com/check
echo.
echo ============================================================
echo.

:: Nhap API key cua khach
set "APIKEY="
set /p "APIKEY=Nhap API Key cua ban (sk-...): "

if "%APIKEY%"=="" (
    echo.
    echo [LOI] Ban chua nhap API Key. Dong cua so va mo lai.
    echo.
    pause
    exit /b
)

:: ============================================================
:: GHI CAU HINH CUNG vao %USERPROFILE%\.claude\settings.json
:: Chua co file -> tao moi. Da co file -> ghi de url/token/model.
:: Nho vay du may khach da co settings.json van bi ghi de key moi.
:: ============================================================
set "BASE_URL=https://api.nghimmo.com"
set "MODEL_MAIN=nghi/claude-sonnet-4.6"
set "MODEL_SMALL=nghi/claude-haiku-4.5"
set "SETTINGS_DIR=%USERPROFILE%\.claude"
set "SETTINGS_FILE=%SETTINGS_DIR%\settings.json"

if not exist "%SETTINGS_DIR%" mkdir "%SETTINGS_DIR%" >nul 2>&1

echo.
echo [*] Dang ghi cau hinh cung vao settings.json...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='SilentlyContinue'; $sf=$env:SETTINGS_FILE; $data=$null; if(Test-Path $sf){try{$data=Get-Content $sf -Raw | ConvertFrom-Json}catch{$data=$null}}; if($null -eq $data){$data=[PSCustomObject]@{}}; if(-not($data.PSObject.Properties.Name -contains 'env')){$data | Add-Member -NotePropertyName 'env' -NotePropertyValue ([PSCustomObject]@{}) -Force}; $e=$data.env; if($null -eq $e){$e=[PSCustomObject]@{}; $data.env=$e}; $e | Add-Member -Force -NotePropertyName 'ANTHROPIC_BASE_URL' -NotePropertyValue $env:BASE_URL; $e | Add-Member -Force -NotePropertyName 'ANTHROPIC_AUTH_TOKEN' -NotePropertyValue $env:APIKEY; $e | Add-Member -Force -NotePropertyName 'ANTHROPIC_MODEL' -NotePropertyValue $env:MODEL_MAIN; $e | Add-Member -Force -NotePropertyName 'ANTHROPIC_SMALL_FAST_MODEL' -NotePropertyValue $env:MODEL_SMALL; if($e.PSObject.Properties.Name -contains 'ANTHROPIC_API_KEY'){$e.PSObject.Properties.Remove('ANTHROPIC_API_KEY')}; $enc=New-Object System.Text.UTF8Encoding($false); [System.IO.File]::WriteAllText($sf,($data | ConvertTo-Json -Depth 20),$enc); $cj=Join-Path $env:USERPROFILE '.claude.json'; if(Test-Path $cj){try{$d=Get-Content $cj -Raw | ConvertFrom-Json; foreach($k in @('primaryApiKey','customApiKeyResponses')){if($d.PSObject.Properties.Name -contains $k){$d.PSObject.Properties.Remove($k)}}; [System.IO.File]::WriteAllText($cj,($d | ConvertTo-Json -Depth 20),$enc)}catch{}}"

:: Set them cho phien hien tai (VS Code ke thua khi mo bang 'code')
set "ANTHROPIC_BASE_URL=%BASE_URL%"
set "ANTHROPIC_AUTH_TOKEN=%APIKEY%"
set "ANTHROPIC_MODEL=%MODEL_MAIN%"
set "ANTHROPIC_SMALL_FAST_MODEL=%MODEL_SMALL%"

echo.
echo [OK] Da ghi cung key vao: %SETTINGS_FILE%
echo      (Lan sau mo van dung key nay, khong can nhap lai)
echo.
echo Dang mo VS Code...
echo.

:: Tim VS Code that su (tranh bi Cursor chiem lenh 'code')
set "VSCODE="
if exist "%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd" set "VSCODE=%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd"
if not defined VSCODE if exist "%ProgramFiles%\Microsoft VS Code\bin\code.cmd" set "VSCODE=%ProgramFiles%\Microsoft VS Code\bin\code.cmd"
if not defined VSCODE if exist "%ProgramFiles(x86)%\Microsoft VS Code\bin\code.cmd" set "VSCODE=%ProgramFiles(x86)%\Microsoft VS Code\bin\code.cmd"

if defined VSCODE (
    call "%VSCODE%"
) else (
    echo  [CHU Y] Khong tim thay VS Code that su tren may.
    echo          Co the ban chua cai VS Code, hoac dang dung Cursor.
    echo          Neu ban dung Cursor, hay xem tab "Cursor" trong huong dan.
    echo          Dang thu mo bang lenh 'code' mac dinh...
    code
)

echo.
echo ============================================================
echo  VS Code da duoc khoi dong. Cua so nay co the dong.
echo ============================================================
pause >nul
