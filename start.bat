@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8930
set PY=
where py >nul 2>nul && set PY=py -3
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (
  echo.
  echo [ERROR] Python not found. Install it first:
  echo   winget install Python.Python.3.13
  echo Then double-click start.bat again.
  pause
  exit /b 1
)
echo Gesture Show is running at http://127.0.0.1:%PORT%/
echo Keep this window open. Close it to stop.
start "" http://127.0.0.1:%PORT%/
%PY% -m http.server %PORT% --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo [ERROR] Port %PORT% is in use. Close the other black window and try again.
  pause
)
