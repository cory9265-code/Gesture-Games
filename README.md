# 手勢音樂粒子秀（起始包）

這個資料夾已經準備好三樣東西，畫面還沒做：

| 位置 | 用途 |
|---|---|
| `vendor/` | 手部辨識模型與程式，離線可用，不可修改 |
| `驗收/` | 19 項驗收測試，不可修改 |
| `start.bat`、`start.sh` | 啟動本機網頁 http://127.0.0.1:8930/ |
| `js/config.js` | 設定檔，講義打包時會換成您自己的 |

接下來：回講義第三篇，把規格寫完、打包成「第三篇指令包」，交給您的 AI。

授權：Google MediaPipe Tasks Vision 0.10.14 與 hand_landmarker 模型為 Apache-2.0；驗收樣本的手勢照片為 AI 生成，不是真實人物。

## 發佈到網路（GitHub Pages）
1. 雙擊 `publish.bat`，登入 GitHub，檔案就會上傳到 https://github.com/cory9265-code/Gesture-Games
2. 到 repo 的 Settings → Pages：Branch 選 `main`、資料夾選 `/ (root)`，按 Save。
3. 約 1 分鐘後打開 https://cory9265-code.github.io/Gesture-Games/ ，按「📱 分享 QR 碼」，別人用手機一掃就能玩（https，手機鏡頭也能用）。
