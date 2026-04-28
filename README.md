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
