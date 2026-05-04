export const REPORT_BIAS_PROFILES = {
  bridge: {
    label: "不安先行",
    readingTip: "橋梁担当は小さな異変を危険側に倒して読みます。数字の大小と、実際に止めるべき橋かは切り分けて見る必要があります。",
  },
  road: {
    label: "現場実務寄り",
    readingTip: "道路担当は日常運行への支障を軸に話します。見栄えより生活影響を優先するので、他分野の事情と合わせて読むのが無難です。",
  },
  disaster: {
    label: "最悪ケース想定",
    readingTip: "防災担当は最悪ケース基準で話します。強い言い回しでも、そのまま配分の答えとは限りません。",
  },
  deconstruction: {
    label: "将来負担執着",
    readingTip: "減築担当は将来負担の軽減を強く評価します。短期の反発や記憶のコストを割り引きがちなので、地域感情は別で確認したいところです。",
  },
  outreach: {
    label: "空気敏感",
    readingTip: "住民対応担当は怒号・不安・噂の気配を大きめに受け取ります。火種の察知には向きますが、全部を同じ重さで扱うと配分がぶれます。",
  },
  finance: {
    label: "冷徹会計",
    readingTip: "財政担当は感情より残高と持続性を優先します。数字は正確でも、住民がそれで納得するかは別問題です。",
  },
};

export function buildOpeningReportEntry({ areaName, volatileRegion }) {
  return {
    id: "openingNote",
    staffKey: "finance",
    category: "引き継ぎ",
    title: "新任担当への引き継ぎメモ",
    importance: 88,
    urgency: 70,
    impactArea: "全域",
    factHeadline: "この町は全方位維持ができない",
    facts: [
      "人口減少とインフラ老朽化が同時進行しています。",
      "すべてを守る方針では10年持ちません。重点配分と減築判断が必要です。",
      `初期時点で最も不穏なのは ${areaName(volatileRegion.areaId)}（満足度 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}）。`,
    ],
    biasLabel: REPORT_BIAS_PROFILES.finance.label,
    biasSummary: "引き継ぎ文面は財政担当の視点なので、かなり冷たく見えます。ですが、最初に見るべき制約条件を端的に示しています。",
    biasBullets: [
      "感情への配慮は薄いが、戦えない前提を早く共有するには有効です。",
      "まず制約を理解し、その後に住民対応や演出で温度を足す読み方が合っています。",
    ],
    readingTip: REPORT_BIAS_PROFILES.finance.readingTip,
    summary: "人口は減る、施設は老いる、住民は見ています。つまり、全部いっぺんに来ます。ようこそ。",
    recommendation: "何を守り、何を後回しにするかは自分で決めること。資料はそのための材料です。",
  };
}
