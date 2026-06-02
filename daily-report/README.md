# 📰 每日晨間報告(Gmail + Google Calendar)

每天早上 **08:00(台北時間)**,自動檢查你的 Gmail 重要信件與當日 Google Calendar 行程,
產出一份**輕鬆好讀的中文報告**,你在 Claude App(手機/網頁)收到通知就能看。

---

## 🧩 運作方式

```
每天 08:00  →  Claude Code 排程觸發器(Scheduled trigger)
            →  開啟新 session,執行 daily-report/PROMPT.md
            →  讀取 Gmail(過去 24h)+ Google Calendar(今天)
            →  智慧篩選 + 排版,輸出報告到對話
            →  你在 Claude App 收到通知,點開就讀
```

- **報告內容與排版規則**:全部寫在 [`PROMPT.md`](./PROMPT.md),要調整風格直接改那個檔。
- **信件篩選**:智慧分級 🔴 建議處理 / 🟡 順便看 / ⚪ 純促銷(略過)。
- **隱私**:Gmail / Calendar 透過你已授權的連線讀取,只摘要、不外傳、不寄出。

---

## ⚙️ 如何設定「每天 08:00 自動執行」

報告本身已經做好了,最後一步是建立「排程觸發器」讓它每天自動跑。
這一步要在 **Claude Code 網頁版** 的設定介面操作(無法用程式碼建立):

1. 打開 **[claude.com/code](https://claude.com/code)**,進入這個專案(`zhanzhi-site`)。
2. 找到 **Schedules / Triggers(排程 / 觸發器)** 設定。
3. 新增一個排程:
   - **時間**:每天 `08:00`
   - **時區**:`Asia/Taipei`(台北)
   - **分支**:`claude/daily-gmail-calendar-report-Apgag`(或合併後的 `main`)
   - **提示詞 / Prompt**,填入:
     > 請閱讀並嚴格執行 `daily-report/PROMPT.md` 的指令,產出今天的每日報告。
4. 儲存。之後每天 08:00 就會自動產生報告,你在 Claude App 會收到通知。

> 📖 排程觸發器詳細說明:<https://code.claude.com/docs/en/claude-code-on-the-web>

---

## 🔧 想自訂?

| 想改的東西 | 改哪裡 |
|-----------|--------|
| 報告語氣、排版、emoji | `PROMPT.md` 的「輸出格式」段落 |
| 哪些信算「重要」 | `PROMPT.md` 的「信件分級原則」 |
| 看幾小時內的信 | `PROMPT.md` 第 2 步的 `newer_than:1d` |
| 執行時間 | 在網頁版 Triggers 設定改時間 |

---

## 📌 備註

- **送達方式**:目前設定為「在 Claude App 看」。若之後想改成「自動寄 Email 到信箱」,
  需要額外用 Google Apps Script 設定(因為目前 Gmail 工具只能建立草稿、不能自動寄出)。
- 容器是臨時的:這些設定檔已存進 Git repo,所以每次排程開新 session 都讀得到。
