# セーブ機能 準備メモ（v4 / 実装は次フェーズ）

このドキュメントは、次フェーズで localStorage ベースのセーブ機能を入れる際に
迷わないように、対象 / タイミング / 復元 / 注意点 を 1 ファイルに整理したメモです。
**このフェーズでは実装しません。**

---

## 1. セーブ対象（gameState の保存対象）

`buildInitialState()`（src/legacy/state/gameCoreState.js）が返す初期 state のうち、
**プレイ進行に依存して動くもの全体** が基本的にセーブ対象になります。

### 必須（保存しないと進行が壊れる）
- `screen` / `phase` / `year` / `monthIndex` / `totalYears`
- `annualBudgetBase` / `annualBudget` / `remainingBudget` / `reserveFund` / `emergencyDebt`
- `indicators`（satisfaction / safety / fiscalHealth / futureBurden / support / rebellion）
- `regionalMoods`（central / mountain / river / tourism × satisfaction / rebellion）
- `regionalAlerts`
- `budgetAllocation`（bridge / road / disaster / deconstruction / outreach / reserve）
- `infrastructures`（mapData.infrastructures をベースに condition / burden / status / operationStatus が変動）
- `deconstructionProjects`（status / progress / startedYear / completedYear / cpuReason / lastNote）
- `deconstructionHistory`
- `latestDeconstructionAction` / `latestDeconstructionTargetId`
- `reportEntries` / `selectedReportId`
- `pendingEvent`
- `currentYearEvents` / `currentYearBudgetDecision` / `lastYearCausalSummary`
- `lastChoiceResult`
- `gameOverReason` / `clearMessage`
- `log`

### オンボーディング
- `onboardingActive` / `onboardingSeen`
- これは別キー（例: `genchiku_v4_onboarding_done`）で持っても良い

### セーブ不要（mapData.* のクローン参照だが、書き換えはほぼ infrastructures に集約）
- `areas` / `facilities` / `rivers` / `roads` / `bridges`
- `selectedMapTargetId` だけは UI 状態として保存

### セーブしてはいけないもの
- 関数 / Proxy / DOM 参照
- `currentDramaProfile()` のような **派生計算結果**
  - 復元後に再計算する

---

## 2. セーブすべきタイミング

最小実装では **「画面遷移と進行の切れ目」** だけで十分です。
ここで保存しておけば、ブラウザ閉じ・タブ切替・スマホのバックグラウンド復帰でも復元できます。

### 必ず保存
- 年度末レポートが生成された直後（`finishYear()` の末尾）
- 予算が確定した直後（`applyBudgetPlan()` の末尾）
- イベント選択が確定した直後（`applyEventChoice()` の末尾）
- 月送り完了直後（`finalizeMonth()` の末尾、ただしイベントで止まる時は除く）
- ゲームオーバー / クリア確定時（`setGameOver()` / `clearMessage` 設定後）

### 任意で保存
- ダッシュボードでマップ対象を切り替えた時（軽量、UI 状態のみ）
- オンボーディングのステップ完了時

### 保存しないでよい場面
- 月内処理の途中（`processMonthlyMaintenance()` の中間状態）
- イベント表示中（pendingEvent が確定してない）
- レポート画面でレポート選択中

---

## 3. 復元すべきタイミング

### 起動時
- App マウント直後（`useEffect` で legacy game をマウントする手前）
- localStorage に保存済み state があれば、`buildInitialState()` の結果を**置き換えず**、
  ロードした state を `setState(loaded)` で復元する
- バージョン互換性チェック（後述）に失敗したら、初期 state にフォールバック

### ゲーム継続時
- 復元しない（プレイ中は in-memory state が常に最新）

### リスタート時
- `restartToTitle()` 等で初期 state に戻す時、localStorage の **進行データだけ削除**
  - オンボーディング完了フラグは残す（毎回チュートリアルが出ないように）

---

## 4. localStorage キー設計（提案）

```
genchiku_v4_save        // メインの進行データ（JSON シリアライズ）
genchiku_v4_save_meta   // { version, savedAt, schemaVersion }
genchiku_v4_onboarding  // { completed: true, lastSeen: ISO8601 }
```

- メインデータはトップレベルキー1つに JSON.stringify でまとめて入れる
- meta は別キーにすることで、**スキーマ非互換時に進行だけ捨ててオンボーディングは残せる**
- スキーマバージョンは整数（1, 2, 3, ...）で管理し、不一致なら破棄

---

## 5. 注意点 / 罠ポイント

### A. Proxy 経由のアクセスがある
- `gameCoreProgressApi.js` 等は `new Proxy({}, { get/set })` でアクセスしている
- セーブ時は **必ず `ctx.getState()` の素の object を `JSON.stringify`**
- 復元時は `setState(loaded)` でストアに差し戻す（Proxy は流通させない）

### B. infrastructures は **mapData のクローン**
- `clone(mapData.infrastructures)` をベースにしているが、進行で
  `condition` / `burden` / `status` / `operationStatus` が変動する
- 復元時は **localStorage の値で上書き**、mapData は再クローンしない

### C. reportEntries は state 内に残る
- 年度末ごとに `generateYearEndReport()` で再生成され、配列が肥大化する
- セーブサイズが増えるため、`reportEntries` は **直近 2〜3 年分だけ残す圧縮**を検討
- もしくは年度跨ぎで一度フラッシュする実装もあり

### D. log の肥大化
- `gameState.log.unshift(...)` が方々から呼ばれる
- セーブ前に **直近 50〜80 件で truncate** する処理を入れる

### E. pendingEvent の中身
- イベント表示中にブラウザを閉じられた場合、復元時に同じイベントが再表示される必要あり
- `pendingEvent` も含めてシリアライズすれば対応可

### F. スキーマ変更耐性
- v4.0 → v4.1 等で state の構造が変わると、復元時に古い save が壊れる
- 復元処理に「**未知のキーは無視 / 必須キーが欠けていたら破棄**」のガードを入れる
- 既に `gameCoreStateValidation` 系の verify があるので、それを runtime ガードにも転用できる

### G. iOS Safari のプライベートモード
- localStorage が使えないか、容量が極端に小さい
- try/catch で囲み、失敗時は **メモリ上の state だけで継続**（セーブは無効化）

---

## 6. 実装着手時のおおまかな順序（次フェーズの目安）

1. **保存対象の確定**（このメモを最終仕様化）
2. **シリアライザ / デシリアライザを 1 ファイルで実装**
   - 推奨配置: `src/legacy/state/gameCoreSavePort.js`（契約は追加しない）
3. **保存タイミングの hook 追加**
   - finishYear / applyBudgetPlan / applyEventChoice / finalizeMonth / setGameOver の末尾に
     `saveCurrentState()` を 1 行ずつ追加するだけ
4. **App マウント時の復元処理**
   - `src/App.jsx` の `useEffect` 内、`mountLegacyGame` の前にロード判定
5. **テスト**
   - balance:check には影響しない
   - 通しプレイで「ブラウザ閉じる → 開き直す」で復元できることを目視確認
   - スキーマ非互換のダミーデータを入れて、初期 state にフォールバックすることを確認

---

## 7. 今回（v4 安定化フェーズ）のスタンス

- セーブ機能は**実装しない**
- このメモを次フェーズの起点とする
- 次フェーズで「セーブ実装 → 放置進行 → 1日1年モード → PWA通知」と段階的に進む想定
