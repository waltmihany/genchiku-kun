from pathlib import Path

root = Path('/home/user/genchiku-kun-v3')
core_path = root / 'src/legacy/gameCore.js'
utils_path = root / 'src/legacy/gameCoreUtils.js'
state_path = root / 'src/legacy/gameCoreState.js'

utils_text = '''import { AREA_ORDER } from "../data/gameStaticData.js";

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
'''

state_text = '''import { DECONSTRUCTION_CANDIDATES } from "../data/deconstructionCandidates.js";
import { MONTHS } from "../data/gameStaticData.js";
import { mapData } from "../data/mapData.js";

export function createRegionalMoods() {
  return {
    central: { satisfaction: 74, rebellion: 16 },
    mountain: { satisfaction: 68, rebellion: 24 },
    river: { satisfaction: 71, rebellion: 18 },
    tourism: { satisfaction: 75, rebellion: 14 },
  };
}

export function buildDeconstructionProjects() {
  return DECONSTRUCTION_CANDIDATES.map((candidate) => ({
    ...candidate,
    status: "idle",
    progress: 0,
    startedYear: null,
    startedMonth: null,
    completedYear: null,
    completedMonth: null,
    cpuReason: "まだ選定されていません。",
    expectedEffectNote: candidate.expectedBenefit,
    lastNote: "対象選定待ち",
  }));
}

export function buildInitialState({ hasCompletedOnboarding, clone, averageRegionalValue }) {
  const regionalMoods = createRegionalMoods();
  return {
    screen: "title",
    phase: "report",
    year: 1,
    totalYears: 10,
    monthIndex: 0,
    annualBudgetBase: 120000,
    annualBudget: 120000,
    remainingBudget: 120000,
    reserveFund: 9000,
    emergencyDebt: 0,
    indicators: {
      satisfaction: averageRegionalValue(regionalMoods, "satisfaction"),
      safety: 66,
      fiscalHealth: 60,
      futureBurden: 56,
      support: 67,
      rebellion: averageRegionalValue(regionalMoods, "rebellion"),
    },
    regionalMoods,
    regionalAlerts: [],
    deconstructionProjects: buildDeconstructionProjects(),
    deconstructionHistory: [],
    latestDeconstructionAction: "",
    latestDeconstructionTargetId: "",
    budgetAllocation: {
      bridge: 18,
      road: 18,
      disaster: 16,
      deconstruction: 16,
      outreach: 14,
      reserve: 18,
    },
    areas: clone(mapData.areas),
    facilities: clone(mapData.facilities),
    rivers: clone(mapData.rivers),
    roads: clone(mapData.roads),
    bridges: clone(mapData.bridges),
    infrastructures: clone(mapData.infrastructures),
    reportEntries: [],
    selectedReportId: null,
    selectedMapTargetId: [...mapData.infrastructures].sort((a, b) => a.condition - b.condition)[0]?.id || "bridgeA",
    pendingEvent: null,
    lastChoiceResult: "",
    currentYearEvents: [],
    currentYearBudgetDecision: null,
    lastYearCausalSummary: null,
    onboardingActive: !hasCompletedOnboarding,
    onboardingSeen: { dashboard: false, report: false, budget: false },
    log: ["町の新年度準備を開始。まずは現場の声を読むところからです。"],
    gameOverReason: "",
    clearMessage: "",
  };
}

export function areaName(state, areaId) {
  return state?.areas.find((area) => area.id === areaId)?.name || mapData.areas.find((area) => area.id === areaId)?.name || areaId;
}

export function areaInfrastructureStats(state, areaId) {
  const list = state.infrastructures.filter((item) => item.area === areaId && item.operationStatus !== "removed");
  const worst = [...list].sort((a, b) => a.condition - b.condition)[0] || null;
  const avgCondition = list.length ? list.reduce((sum, item) => sum + item.condition, 0) / list.length : 60;
  const avgBurden = list.length ? list.reduce((sum, item) => sum + item.burden, 0) / list.length : 12;
  return { list, worst, avgCondition, avgBurden };
}

export function monthLabel(monthIndex) {
  return MONTHS[(monthIndex + MONTHS.length) % MONTHS.length];
}

export function getInfrastructureById(state, itemId) {
  return state?.infrastructures.find((item) => item.id === itemId);
}

export function getDeconstructionProjectByTarget(state, targetId) {
  return state?.deconstructionProjects.find((project) => project.targetId === targetId);
}

export function deconstructionStatusLabel(status) {
  return {
    idle: "候補",
    active: "進行中",
    done: "完了",
    blocked: "保留",
  }[status] || "待機";
}

export function deconstructionModeLabel(mode) {
  return {
    remove: "撤去",
    close: "閉鎖",
    restrict: "制限",
  }[mode] || "整理";
}

export function describeDeconstructionProject(state, project, helpers) {
  const { formatMoney, areaName, getInfrastructureById, deconstructionModeLabel } = helpers;
  const infra = getInfrastructureById(project.targetId);
  const mood = state?.regionalMoods?.[project.area] || { satisfaction: 60, rebellion: 20 };
  if (!infra) {
    return {
      factLine: `${areaName(project.area)} / ${project.name}`,
      scoreLine: `方式 ${deconstructionModeLabel(project.mode)} ・ 必要進捗 ${project.requiredProgress}% ・ 月目安 ${formatMoney(project.monthlyNeed)}`,
      riskLine: project.residentRisk || "地域反発に注意",
    };
  }
  return {
    factLine: `${areaName(project.area)} / ${infra.name} / 状態 ${Math.round(infra.condition)} / 重要度 ${Math.round(infra.importance)} / 将来負担 ${Math.round(infra.burden)}`,
    scoreLine: `方式 ${deconstructionModeLabel(project.mode)} ・ 必要進捗 ${project.requiredProgress}% ・ 月目安 ${formatMoney(project.monthlyNeed)}`,
    riskLine: `地域空気 満足度 ${Math.round(mood.satisfaction)} / 反乱 ${Math.round(mood.rebellion)} ・ ${project.residentRisk}`,
  };
}
'''

utils_path.write_text(utils_text)
state_path.write_text(state_text)

core = core_path.read_text()


def extract_function(text: str, name: str):
    marker = f'function {name}('
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f'{name} not found')
    first_brace = text.find('{', start)
    if first_brace == -1:
        raise SystemExit(f'{name} opening brace not found')
    brace = 0
    end = None
    for i in range(first_brace, len(text)):
        ch = text[i]
        if ch == '{':
            brace += 1
        elif ch == '}':
            brace -= 1
            if brace == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit(f'{name} end not found')
    return text[start:end]

remove_order = [
    'createRegionalMoods',
    'averageRegionalValue',
    'buildDeconstructionProjects',
    'clone',
    'clamp',
    'formatMoney',
    'getMetricColor',
    'conditionToStatus',
    'statusInfo',
    'getWorstInfrastructure',
    'buildInitialState',
    'summarizeBudgetAllocation',
    'summarizeEffectSignals',
    'eventImpactScore',
    'areaName',
    'areaInfrastructureStats',
    'monthLabel',
    'getInfrastructureById',
    'getDeconstructionProjectByTarget',
    'deconstructionStatusLabel',
    'deconstructionModeLabel',
    'describeDeconstructionProject',
]

for name in remove_order:
    block = extract_function(core, name)
    core = core.replace(block + '\n\n', '', 1)
    core = core.replace(block + '\n', '', 1)
    core = core.replace(block, '', 1)

core = core.replace('import { DECONSTRUCTION_CANDIDATES } from "../data/deconstructionCandidates.js";\n', '')
core = core.replace('import { mapData } from "../data/mapData.js";\n', '')

import_marker = 'import { createMonthlyEventPool } from "../data/monthlyEventPool.js";\n'
if import_marker not in core:
    raise SystemExit('monthlyEventPool import marker not found')
new_imports = '''import { createMonthlyEventPool } from "../data/monthlyEventPool.js";\nimport { averageRegionalValue, clone, clamp, formatMoney, getMetricColor, conditionToStatus, statusInfo, getWorstInfrastructure, summarizeBudgetAllocation, summarizeEffectSignals as summarizeEffectSignalsUtil, eventImpactScore } from "./gameCoreUtils.js";\nimport { buildInitialState as buildInitialGameState, areaName as resolveAreaName, areaInfrastructureStats as resolveAreaInfrastructureStats, monthLabel as monthLabelFromState, getInfrastructureById as getInfrastructureByIdFromState, getDeconstructionProjectByTarget as getDeconstructionProjectByTargetFromState, deconstructionStatusLabel as deconstructionStatusLabelFromState, deconstructionModeLabel as deconstructionModeLabelFromState, describeDeconstructionProject as describeDeconstructionProjectFromState } from "./gameCoreState.js";\n'''
core = core.replace(import_marker, new_imports, 1)

insert_marker = 'let gameState = null;\n'
if insert_marker not in core:
    raise SystemExit('gameState marker not found')
wrapper_block = '''let gameState = null;\n\nfunction buildInitialState() {\n  return buildInitialGameState({ hasCompletedOnboarding, clone, averageRegionalValue });\n}\n\nfunction areaName(areaId) {\n  return resolveAreaName(gameState, areaId);\n}\n\nfunction areaInfrastructureStats(areaId) {\n  return resolveAreaInfrastructureStats(gameState, areaId);\n}\n\nfunction monthLabel(monthIndex) {\n  return monthLabelFromState(monthIndex);\n}\n\nfunction getInfrastructureById(itemId) {\n  return getInfrastructureByIdFromState(gameState, itemId);\n}\n\nfunction getDeconstructionProjectByTarget(targetId) {\n  return getDeconstructionProjectByTargetFromState(gameState, targetId);\n}\n\nfunction deconstructionStatusLabel(status) {\n  return deconstructionStatusLabelFromState(status);\n}\n\nfunction deconstructionModeLabel(mode) {\n  return deconstructionModeLabelFromState(mode);\n}\n\nfunction describeDeconstructionProject(project) {\n  return describeDeconstructionProjectFromState(gameState, project, {\n    formatMoney,\n    areaName,\n    getInfrastructureById,\n    deconstructionModeLabel,\n  });\n}\n\nfunction summarizeEffectSignals(effect = {}) {\n  return summarizeEffectSignalsUtil(effect, areaName);\n}\n'''
core = core.replace(insert_marker, wrapper_block, 1)

core_path.write_text(core)
print('C-5 split state/utils applied')
