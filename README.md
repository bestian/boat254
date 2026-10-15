# boat254

靜態網站專案：以 [Pug](https://pugjs.org/) 撰寫模板，`scripts/build-html.js` 將入口模板編譯成根目錄的 `index.html`。

## 如何 build HTML

1. **安裝依賴**（需已安裝 Node.js）

   ```bash
   npm install
   ```

2. **執行編譯**

   ```bash
   npm run build
   ```

   等同於：

   ```bash
   node scripts/build-html.js
   ```

## `build-html.js` 在做什麼

腳本流程很單純：

1. 使用 `pug.renderFile()` 讀取專案根目錄的 **`index.pug`**。
2. 選項 **`pretty: true`**：輸出的 HTML 會換行縮排，較易閱讀。
3. 將結果寫入 **`index.html`**（與 `index.pug` 同層，專案根目錄）。

`index.pug` 透過 `include components/_*.pug` 組裝各區塊（導覽、Hero、關於、相簿等），編譯時會一併展開成單一 HTML 檔。

## 開發時注意

- 修改 **`components/`** 或 **`index.pug`** 後，若要更新部署用的靜態檔，請再執行一次 **`npm run build`**，確認根目錄 **`index.html`** 已同步。
- 若僅在本機用 Live Server 等方式開 `index.html`，請在每次模板變更後重新 build，否則看到的仍是舊版 HTML。

## 租借費用試算

試算區塊位於已預約檔期日曆下方，使用原生 JavaScript，不依賴前端框架，也不會送出預約或讀取 Google 日曆空檔。

### 關注點分離

- `components/_rental_calculator.pug`：表單、結果區、欄位標籤與計費說明。
- `styles/rental-calculator.css`：限定於試算區塊的樣式與手機版排版，沿用網站既有 CSS 變數。
- `js/rental-pricing.mjs`：純計價函式 `calculateRentalQuote()`；處理費率、時長與可否試算，回傳狀態及數值，不存取 DOM、不格式化金額。
- `js/rental-calculator.mjs`：讀取表單、呼叫計價函式、格式化金額與更新提示，不自行計算費用。
- `tests/rental-pricing.test.mjs`：優惠適用範圍、包段限制與時間邊界的回歸測試。

### 計費範圍

- 平日每小時 NT$350；假日每小時 NT$400，非營利每小時 NT$300。
- 假日連續 4 小時方案 NT$1,600，非營利 NT$1,200；此方案必須恰好 4 小時，不推算超時或多包段費用。
- 平日非營利暫依公開原價試算，並提示合作優惠另洽，不自行套用折扣。
- 僅試算同一天、結束時間晚於開始時間、時長為整小時的區間。起訖時間可包含分鐘，例如 10:30–11:30；非整小時不自動進位。
- 未填完、無效或不在試算範圍的區間不顯示金額，避免保留前次報價。優惠資格與最終費用仍須洽詢確認。

調整費率時，請修改計價模組，並同步更新 `components/_pricing.pug`、試算區塊內的公開費率說明與對應測試。

### 本機預覽與測試

瀏覽器模組需透過 HTTP 載入，請使用 Live Server，或在專案根目錄執行：

```bash
npm run build
python3 -m http.server 5173
```

開啟 `http://localhost:5173/#rental-calculator`。不支援直接以 `file://` 開啟試算；瀏覽器停用 JavaScript 時，表單停用並顯示替代說明。

計價回歸測試使用 Node.js 內建測試工具，不需額外套件：

```bash
npm test
```
