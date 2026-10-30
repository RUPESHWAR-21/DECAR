@echo off
setlocal

set "ROOT=%~dp0"
set "VENV=%ROOT%.venv"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%VENV%\Scripts\python.exe" (
  echo Python venv not found. Create it with: python -m venv .venv
  exit /b 1
)

if not exist "%BACKEND%\main.py" (
  echo Backend app not found at "%BACKEND%\main.py"
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo Frontend package.json not found at "%FRONTEND%\package.json"
  exit /b 1
)

echo.
echo Starting Backend on port 8000...
start "Backend Server" "%VENV%\Scripts\python.exe" "%BACKEND%\main.py"

echo Starting Frontend on port 5173...
start "Frontend Server" cmd /c "cd /d %FRONTEND% && npm install && npm run dev"

echo.
echo Both servers should open in new windows...

endlocal
