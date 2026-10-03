# 換一個產品或市場：Lead Discovery 換情境指南 v0.1

> 內部草稿，同時是商業 USB 教材的底稿。所有紀錄都是合成的，層級是閱讀順序，不是成交機率。
> 日期：2026-10-03｜狀態：已用一組合成情境（另一個產品、兩個合成市場）實測過一次；尚未有非工程師自己跑過（UNKNOWN）。

## 1. 一句話

換產品或換目的市場，應該是**換資料檔**，不是改判斷程式。方法（怎麼分層）、市場事實、產品用語，各放各的檔案。

## 2. 哪些檔案是什麼

| 檔案 | 角色 | 換情境時 |
|---|---|---|
| `qualification.js` | **方法**：最差的層級勝出、沒有分數、沒有權重；四層 ENGAGE_FIRST／VERIFY_FIRST／HOLD／EXCLUDE | **不動**（有守門測試，見第 4 節） |
| `cdd-intake-proposal.js` | 契約：輸出給 CDD 的提案（schemaVersion 1） | **不動** |
| `markets.js` | **市場事實**：每個市場「出貨前通常要查什麼」、付款慣例、貿易救濟查證。標示為 DOMAIN_LEARNING，不是已驗證事實 | 換成你的市場表，或用 `marketFor(record, keys, 你的表)` 傳入 |
| `category-map.js` | **產品用語**：品類鍵，以及自由文字品類到品類鍵的關鍵字對照 | 換成你的產品 |
| `records.js` | **情境資料**：12 筆合成紀錄 | 換成你的合成紀錄 |

## 3. 方法讀什麼欄位

`buyerFit`、`categoryFit`、`importOpenness`、`originSourcing`（買方是否向賣方的**產地區域**採購）、`entryBarrier`、`complianceGate`、`sources[].tier`。

- 空白或看不到的欄位是 UNKNOWN，會落在「先查證」，**永遠不會**直接進「優先接觸」（測試：一筆什麼都不知道的紀錄只會是 VERIFY_FIRST）。
- 進入門檻只決定同一層裡的先後，不是閘門。
- 區域統計由呼叫端提供：`summarize(records, regionOf)`；沒有提供就全部算「unknown」，不會替你猜。

## 4. 守門：方法檔不准長出情境用語

`neutral.test.mjs` 讀 `qualification.js` 的程式碼（不含註解），要求：
1. 沒有任何 `import`，因此碰不到市場資料或產品用語；
2. 沒有區域、產品或市場資料的字眼（例如地區名、品類名、`markets.js`）。

已做破壞測試：故意放回一個 `"Asia"` 字串、或放回 `import { MARKETS }`，測試兩種情況都會失敗。

## 5. 實測：換一次情境

`neutral.test.mjs` 用「合成產品 A」、兩個合成市場（各自的區域、幣別、檢查清單）、自己的品類對照，跑過一遍（16 項通過）：
- 五筆合成紀錄得到預期的層級（優先接觸、先查證、暫緩、排除）與順序；
- 區域統計來自傳入的查詢函式；沒傳就不編造；
- 市場檢查來自傳入的市場表與品類對照；市場表裡沒有的市場回傳空值，不給預設；
- 輸出是確定的（同樣輸入，同樣輸出）。

## 6. 前一步的保證

方法與資料拆開時，用「改前輸出」做了黃金檔（`golden/`）：12 筆紀錄的層級、原因、市場檢查、CDD 提案，改後必須完全相同；唯一的差別是兩個原因代碼改名（`NO_ASIA_SOURCING`→`NO_ORIGIN_SOURCING`、`ASIA_UNKNOWN`→`ORIGIN_UNKNOWN`）。上線的頁面文字整頁雜湊比對也一致。

**CDD 契約沒動：** 匯出提案裡的 `excludedFromCdd` 保留舊標籤 `asiaSourcing`，因為它是 schemaVersion 1 輸出的一部分，並被凍結的測試檔檢查。來源紀錄內部的欄位名才是 `originSourcing`。

## 7. 還沒拆乾淨的（如實記錄）

| # | 位置 | 問題 |
|---|---|---|
| 1 | `index.html`、`own-brief-copy.js`、`own-list.js` | 介面文案仍寫「亞洲採購」、「Asia sourcing」，`own-list.js` 的表單欄位叫 `asia`。這是目前情境（賣方在亞洲）的呈現用語，換成別的產地要改文案 |
| 2 | `records.js` 的 `category` 自由文字 | 要靠 `category-map.js` 的關鍵字才能對到品類鍵；新產品要補關鍵字 |
| 3 | `markets.js` | 市場事實的結構已經像一個 Market Pack，但規格（Core v0.1）還沒有這個概念；草案見 `CORE_SPEC_AMENDMENT_A1_MARKET_PACK_V0_1_DRAFT.md`（尚未生效） |

## 8. 不證明什麼

- 不證明層級對任何真實買家正確。
- 不證明跨產業有效（Core 規格明寫 NOT VERIFIED）。
- 不證明非工程師能自己完成這個換法。
