# Aura – 氣息冥想 PWA

`Aura` 是一個極簡、療癒的呼吸練習進階網頁應用（PWA），通過自訂呼吸節奏、練習時長與背景音效，幫助使用者快速進入平靜與專注的狀態。整個應用完全前端實現，支援離線安裝及背景運行。

## 功能特色

- **自訂呼吸節奏**：三段式（吸氣→閉氣→呼氣）或四段式（吸氣→閉氣→呼氣→閉氣）循環模式，每個階段可獨立設定 1–30 秒。
- **練習時長**：可選擇 1 分鐘、3 分鐘、5 分鐘或無限模式。
- **視覺引導**：以一個圓形動畫呈現呼吸節奏，吸氣時放大，呼氣時縮小，閉氣時保持大小並帶微弱光暈脈動。
- **音訊提示**：使用 Web Audio API 產生柔和的提示音；支援背景聲景（海浪、森林）並具漸入/漸出效果。
- **離線與背景運行**：透過 Service Worker 快取核心檔案，支援安裝至主畫面並在手機鎖屏或切換應用時繼續播放音訊。

## 安裝與使用

1. 將本專案下載或 `git clone` 至本機。
2. 確保目錄結構如下：

   ```
   aura-breathing-app/
   ├── index.html
   ├── style.css
   ├── app.js
   ├── audio.js
   ├── sw.js
   ├── manifest.json
   ├── assets/
   │   ├── icons/
   │   │   ├── icon-192.png
   │   │   └── icon-512.png
   └── README.md
   ```

3. 使用任何簡易的 HTTP 伺服器於本地端啟動，例如：

   ```bash
   cd aura-breathing-app
   python -m http.server 8080
   ```

4. 在瀏覽器訪問 `http://localhost:8080` 即可體驗。首次點擊畫面時瀏覽器會請求音訊權限。
5. 點擊畫面中央圓圈開始或暫停練習；右下角齒輪圖示可開啟設定。

## 部署到 GitHub Pages

1. 建立一個新的 GitHub Repository（例如 `aura-breathing-app`）。
2. 將專案檔案推送到該 repository 的 `main`（或 `master`）分支。
3. 前往 Repository 的 **Settings → Pages**，將 **Source** 設定為「Deploy from a branch」，選擇 main 分支和根目錄 `/`。
4. 儲存設定後，稍候 GitHub 會提供一個 `https://your-username.github.io/aura-breathing-app/` 的公開網址。

## 技術備註

背景音效使用 Web Audio API 動態產生：

- **Brown noise**（棕色噪音）用於模擬海浪/瀑布聲，透過遞歸累積白噪音降低高頻【596180980067455†L112-L133】。
- **Pink noise**（粉紅噪音）用於森林場景，利用 Paul Kellet 演算法過濾白噪音【596180980067455†L81-L99】並搭配隨機鳥鳴。

這些方法避免了外部音檔的依賴，並能於離線模式下提供柔和、自然的聲景。