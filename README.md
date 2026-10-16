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

此規則只涉及日期判斷、分段費率與互斥折扣，原生 JavaScript 即可處理；Vue 不會讓計價邏輯更準確，因此不增加框架或套件。此處「自動判斷」在瀏覽器執行，網站沒有計價後台，亦不修改 Google 表單。

### 關注點分離

- `components/_rental_calculator.pug`：表單、結果區、欄位標籤與計費說明。
- `styles/rental-calculator.css`：限定於試算區塊的樣式與手機版排版，沿用網站既有 CSS 變數。
- `js/rental-pricing.mjs`：純計價函式 `calculateRentalQuote()`；處理費率、時長與可否試算，回傳狀態及數值，不存取 DOM、不格式化金額。
- `js/rental-calculator.mjs`：讀取表單、呼叫計價函式、格式化金額與更新提示，不自行計算費用。
- `tests/rental-pricing.test.mjs`：平日／週末、18:00 分界、完整時段優惠與 8 小時折抵不疊加的回歸測試。

### 計費範圍

- 輸入借用日期、開始時間、結束時間，不再手選方案或非營利資格。日期以日曆日期判斷星期，不受訪客裝置時區影響。
- 週一至週五 18:00 前每小時 NT$350；18:00 起與週六、週日全天每小時 NT$400。跨 18:00 的區間按各費率實際分鐘分拆。
- 完整涵蓋 09:00–13:00、13:30–17:30、18:00–22:00 任一優惠時段，折 NT$100。
- 同次連續租借滿 8 小時改折 NT$250，不疊加時段優惠；每次租借僅折抵一次，不按每 8 小時重複折抵。
- 範例：週一 12:00–19:00，基本費 `350 × 6 + 400 × 1 = 2500`，完整涵蓋下午時段折 NT$100，總計 NT$2,400。
- 僅試算同一天、結束時間晚於開始時間、時長為整小時的區間。起訖時間可包含分鐘，例如 13:30–17:30；非整小時不自動進位，跨日另洽。分段費用加總後以 `Math.ceil()` 無條件進位至整元，再扣除適用的整元優惠；不逐段進位，也不進位租借時數，畫面金額不顯示小數。
- 未填完、無效或不在試算範圍的區間不顯示金額，避免保留前次報價。此試算不等於場租預約，實際費用以預約確認信為準。

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

## Google 預約表單

- `components/_booking_form.pug`：在費用試算下方、聯絡我們上方內嵌公開 Google 表單，提供另開填答頁的備用連結。
- `styles/booking-form.css`：表單外框及響應式寬高；表單內容由 Google 管理，不以網站 CSS 或 JavaScript 修改。
- 預覽錨點為 `#booking-form`。iframe 使用 `embedded=true` 與延遲載入，保留表單內部捲動；不自動帶入試算資料，也不新增套件。
- 更換表單時，同步修改 iframe 的 `src` 與備用連結的 `href`，再執行 `npm run build`。填答權限、題目、回覆及通知請至 Google 表單管理。
- 預約說明整合為單一段落，連結 `img_202611/小船254透明定價方案.png` 供查閱場地方案，並提供聯絡入口。此附檔及外部 Google 表單由場地方維護；試算器僅套用上述基本費與兩種互斥折扣，不推算附檔中的多次租借優惠或其他合作方案，實際費用以預約確認信為準。
