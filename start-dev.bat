@echo off
setlocal EnableExtensions

rem Start the Vite dev server and open Chrome incognito.
rem Double-click this file, or run from any folder: path\to\start-dev.bat
rem Re-launch in a child cmd so the double-click window closes when startup finishes.

if /i not "%~1"=="__run__" (
  start "" cmd /c ""%~f0" __run__"
  exit /b 0
)

cd /d "%~dp0"

set "PORT=5173"
set "URL=http://localhost:%PORT%/"
set "TITLE=Splice Detail Canvas Dev"
set "PID_FILE=%~dp0.dev-server.pid"

set "NODE_DIR=%ProgramFiles%\nodejs"
if exist "%NODE_DIR%\node.exe" set "PATH=%NODE_DIR%;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was not found on PATH.
  echo Install Node 20 LTS from https://nodejs.org/ then run this script again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing npm dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

rem Stop only the dev server PID recorded by the last run of this script.
if exist "%PID_FILE%" (
  for /f "usebackq delims=" %%I in ("%PID_FILE%") do (
    echo Stopping prior dev server ^(PID %%I^)...
    taskkill /PID %%I /T /F >nul 2>&1
  )
  del /f /q "%PID_FILE%" >nul 2>&1
  ping 127.0.0.1 -n 3 >nul
)

echo Starting dev server at %URL%
start "%TITLE%" /MIN cmd /c "npm run dev -- --port %PORT% --strictPort --host 127.0.0.1"

call :wait_for_port %PORT%
if errorlevel 1 (
  echo Timed out waiting for dev server. Open %URL% manually when ready.
  pause
  exit /b 1
)

call :save_listening_pid %PORT%
call :open_chrome_incognito "%URL%"
exit 0

:wait_for_port
set "CHECK_PORT=%~1"
for /L %%N in (1,1,30) do (
  netstat -ano | findstr /R /C:":%CHECK_PORT% .*LISTENING" >nul 2>&1
  if not errorlevel 1 exit /b 0
  ping 127.0.0.1 -n 2 >nul
)
exit /b 1

:save_listening_pid
set "SAVE_PORT=%~1"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%SAVE_PORT% .*LISTENING"') do (
  echo %%P> "%PID_FILE%"
  exit /b 0
)
exit /b 0

:open_chrome_incognito
set "OPEN_URL=%~1"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Google Chrome was not found. Open %OPEN_URL% manually in an incognito window.
  exit /b 1
)
echo Opening Chrome incognito: %OPEN_URL%
start "" "%CHROME%" --incognito "%OPEN_URL%"
exit /b 0
