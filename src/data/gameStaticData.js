export const MONTHS = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

export const budgetCategories = [
  { key: "bridge", label: "橋梁維持", description: "橋の補修・点検・補強" },
  { key: "road", label: "道路維持", description: "主要道路・生活道路の舗装対応" },
  { key: "disaster", label: "防災", description: "豪雨・台風・避難路対策" },
  { key: "deconstruction", label: "減築・撤去", description: "古い施設や不要路線の整理" },
  { key: "outreach", label: "住民対応", description: "説明会・合意形成・広報" },
  { key: "reserve", label: "予備費", description: "突発事故や入札不調への備え" },
];

export const BUDGET_PRESETS = [
  {
    key: "safetyFirst",
    label: "安全優先",
    summary: "橋・道路・防災を厚くして事故を避ける",
    allocation: { bridge: 23, road: 21, disaster: 22, deconstruction: 12, outreach: 10, reserve: 12 },
  },
  {
    key: "fiscalRecovery",
    label: "財政再建",
    summary: "予備費と減築を厚くして将来負担を削る",
    allocation: { bridge: 14, road: 14, disaster: 14, deconstruction: 24, outreach: 10, reserve: 24 },
  },
  {
    key: "residentFocus",
    label: "住民重視",
    summary: "住民対応と生活路線を厚くして反発を抑える",
    allocation: { bridge: 17, road: 20, disaster: 14, deconstruction: 12, outreach: 22, reserve: 15 },
  },
  {
    key: "reductionPush",
    label: "減築推進",
    summary: "減築を最優先し、後年の負担軽減を狙う",
    allocation: { bridge: 14, road: 12, disaster: 13, deconstruction: 31, outreach: 14, reserve: 16 },
  },
  {
    key: "balanced",
    label: "バランス型",
    summary: "極端に寄せず、全分野を均等寄りに配分",
    allocation: { bridge: 16, road: 17, disaster: 15, deconstruction: 19, outreach: 17, reserve: 16 },
  },
];

export const AREA_ORDER = ["central", "mountain", "river", "tourism"];

export const REGION_TRAITS = {
  central: { short: "中央", worry: "幹線道路と公共施設の使い勝手に敏感です", tone: "利便性優先" },
  mountain: { short: "山間", worry: "置き去り感と減築への不信に敏感です", tone: "生活路線死守" },
  river: { short: "川沿い", worry: "橋と風水害リスクへの反応が鋭いです", tone: "安全第一" },
  tourism: { short: "観光", worry: "景観・アクセス・評判の悪化に敏感です", tone: "評判重視" },
};
