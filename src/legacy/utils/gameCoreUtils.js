import { AREA_ORDER } from "../../data/gameStaticData.js";

export function averageRegionalValue(regionalMoods, key) {
  const list = AREA_ORDER.map((areaId) => regionalMoods[areaId][key]);
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function formatMoney(manYen) {
  const abs = Math.abs(manYen);
  const prefix = manYen < 0 ? "-" : "";
  if (abs >= 10000) {
    return `${prefix}${(abs / 10000).toFixed(abs % 10000 === 0 ? 0 : 1)}億円`;
  }
  return `${prefix}${Math.round(abs).toLocaleString("ja-JP")}万円`;
}

export function getMetricColor(value, inverted = false) {
  const normalized = inverted ? 100 - value : value;
  if (normalized >= 70) return "var(--safe)";
  if (normalized >= 40) return "var(--warning)";
  return "var(--danger)";
}

export function conditionToStatus(condition) {
  if (condition >= 65) return "safe";
  if (condition >= 40) return "warning";
  if (condition >= 20) return "danger";
  return "removal";
}

export function statusInfo(status) {
  return {
    safe: { label: "安全", color: "var(--safe)" },
    warning: { label: "警戒", color: "var(--warning)" },
    danger: { label: "危険", color: "var(--danger)" },
    removal: { label: "撤去候補", color: "var(--gray)" },
  }[status];
}

export function getWorstInfrastructure(state, kind) {
  return [...state.infrastructures]
    .filter((item) => item.kind === kind && item.operationStatus !== "removed")
    .sort((a, b) => a.condition - b.condition)[0] || [...state.infrastructures]
      .filter((item) => item.kind === kind)
      .sort((a, b) => a.condition - b.condition)[0];
}

export function summarizeBudgetAllocation(allocation) {
  const list = [];
  const centralInfra = allocation.bridge + allocation.road;
  if (centralInfra >= 35) {
    list.push({ key: "central", label: `中央維持 ${centralInfra}%`, detail: "橋と道路をやや厚めにすると、中央の不満を抑えやすい配分です。", tone: "positive" });
  } else {
    list.push({ key: "central", label: `中央維持 ${centralInfra}%`, detail: "中央の幹線維持がやや薄く、後半の反発が出やすい配分です。", tone: centralInfra >= 33 ? "neutral" : "negative" });
  }
  list.push({
    key: "disaster",
    label: `防災 ${allocation.disaster}%`,
    detail: allocation.disaster >= 15 ? "天候イベントに比較的耐えやすい水準です。" : "天候イベントで安全度が揺れやすい低めの水準です。",
    tone: allocation.disaster >= 15 ? "positive" : "negative",
  });
  list.push({
    key: "deconstruction",
    label: `減築 ${allocation.deconstruction}%`,
    detail: allocation.deconstruction >= 18 ? "将来負担を軽くしやすい配分です。" : "将来負担の整理はやや遅れやすい配分です。",
    tone: allocation.deconstruction >= 18 ? "positive" : allocation.deconstruction >= 15 ? "neutral" : "negative",
  });
  list.push({
    key: "outreach",
    label: `住民対応 ${allocation.outreach}%`,
    detail: allocation.outreach >= 16 ? "説明と火消しを回しやすい水準です。" : "年末の満足度回復が鈍くなりやすい水準です。",
    tone: allocation.outreach >= 16 ? "positive" : "negative",
  });
  list.push({
    key: "reserve",
    label: `予備費 ${allocation.reserve}%`,
    detail: allocation.reserve >= 15 ? "事故や入札不調への保険があります。" : "突発支出に対する余白が薄めです。",
    tone: allocation.reserve >= 15 ? "positive" : "negative",
  });
  return list;
}

export function summarizeEffectSignals(effect = {}, resolveAreaName = (areaId) => areaId) {
  const tags = [];
  if ((effect.safety || 0) > 0) tags.push(`安全 ${effect.safety > 0 ? "+" : ""}${Math.round(effect.safety * 10) / 10}`);
  if ((effect.fiscalHealth || 0) !== 0) tags.push(`財政 ${effect.fiscalHealth > 0 ? "+" : ""}${Math.round(effect.fiscalHealth * 10) / 10}`);
  if ((effect.support || 0) !== 0) tags.push(`支持 ${effect.support > 0 ? "+" : ""}${Math.round(effect.support * 10) / 10}`);
  if ((effect.satisfaction || 0) !== 0) tags.push(`満足 ${effect.satisfaction > 0 ? "+" : ""}${Math.round(effect.satisfaction * 10) / 10}`);
  if ((effect.rebellion || 0) !== 0) tags.push(`反乱 ${effect.rebellion > 0 ? "+" : ""}${Math.round(effect.rebellion * 10) / 10}`);
  if ((effect.futureBurden || 0) !== 0) tags.push(`将来負担 ${effect.futureBurden > 0 ? "+" : ""}${Math.round(effect.futureBurden * 10) / 10}`);
  if ((effect.remainingBudget || 0) !== 0) tags.push(`残予算 ${effect.remainingBudget > 0 ? "+" : ""}${Math.round(effect.remainingBudget)}`);
  if ((effect.reserveFund || 0) !== 0) tags.push(`予備費 ${effect.reserveFund > 0 ? "+" : ""}${Math.round(effect.reserveFund)}`);
  if (effect.regionalEffects) {
    Object.entries(effect.regionalEffects).forEach(([areaId, regional]) => {
      const parts = [];
      if (regional.satisfaction) parts.push(`満足 ${regional.satisfaction > 0 ? "+" : ""}${Math.round(regional.satisfaction * 10) / 10}`);
      if (regional.rebellion) parts.push(`反乱 ${regional.rebellion > 0 ? "+" : ""}${Math.round(regional.rebellion * 10) / 10}`);
      if (parts.length) tags.push(`${resolveAreaName(areaId)} ${parts.join(" / ")}`);
    });
  }
  return tags.slice(0, 4);
}

export function eventImpactScore(effect = {}) {
  let score = 0;
  score += Math.abs(effect.safety || 0) * 1.8;
  score += Math.abs(effect.fiscalHealth || 0) * 1.4;
  score += Math.abs(effect.support || 0) * 1.2;
  score += Math.abs(effect.satisfaction || 0) * 1.1;
  score += Math.abs(effect.rebellion || 0) * 1.6;
  score += Math.abs(effect.futureBurden || 0) * 1.3;
  score += Math.abs(effect.remainingBudget || 0) / 700;
  score += Math.abs(effect.reserveFund || 0) / 900;
  if (effect.regionalEffects) {
    Object.values(effect.regionalEffects).forEach((regional) => {
      score += Math.abs(regional.satisfaction || 0) * 0.8;
      score += Math.abs(regional.rebellion || 0) * 1.0;
    });
  }
  return score;
}
