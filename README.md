# 減築くん

人口減少自治体のインフラ予算シミュレーションゲームです。

年度末レポートを読み、翌年度予算を配分し、橋・道路・防災・減築・住民対応・予備費のバランスを取りながら、10年間町を維持することを目指します。

## 公開URL

Production:
https://genchiku-d9eza5nu4-waltmihanys-projects.vercel.app

GitHub:
https://github.com/waltmihany/genchiku-kun

## 遊び方

1. 年度末レポートで町の状態や地区ごとの不満を確認します。
2. 翌年度の予算配分を決めます。
3. 月次進行でイベントや町の変化を見守ります。
4. 満足度、財政、安全度、支持率、反乱ゲージに注意しながら10年生存を目指します。

## 開発環境

- React
- Vite
- JavaScript

## ローカル起動

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## Vercel

- Project: `genchiku-kun`
- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## 現在の状態

現時点では v4 安定版です。まずブラウザで遊べる公開版を優先しており、ゲーム本体のバランスや進行ロジックは維持しています。

以下はまだ未実装です。

- localStorage セーブ機能
- 放置進行
- 1日1年モード
- PWA化
- PWA通知
- TWAでGoogle Play配信

## 今後の予定

- localStorageセーブ
- 放置進行
- 1日1年モード
- PWA化
- PWA通知
- TWAでGoogle Play配信検討
