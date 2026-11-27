@echo off
chcp 65001 >nul
cd /d "%~dp0"
set G=git -c safe.directory=*
where git >nul 2>nul || (
  echo [錯誤] 找不到 Git，請先安裝：winget install Git.Git
  echo 安裝完重新雙擊 publish.bat
  pause
  exit /b 1
)
%G% remote get-url origin >nul 2>nul || %G% remote add origin https://github.com/cory9265-code/Gesture-Games.git
echo 正在上傳到 https://github.com/cory9265-code/Gesture-Games ...
echo （第一次會跳出 GitHub 登入視窗，請登入並按授權）
%G% push -u origin main
if errorlevel 1 (
  echo.
  echo 遠端已經有檔案，先合併再上傳一次...
  %G% pull origin main --allow-unrelated-histories --no-edit -X ours
  %G% push -u origin main
)
echo.
echo 完成後到 GitHub 的 Settings - Pages，Branch 選 main、資料夾選 / (root)，按 Save。
echo 約 1 分鐘後網址是 https://cory9265-code.github.io/Gesture-Games/
pause
