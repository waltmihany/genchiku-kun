import { DECONSTRUCTION_CANDIDATES } from "../../data/deconstructionCandidates.js";
import { MONTHS } from "../../data/gameStaticData.js";
import { mapData } from "../../data/mapData.js";

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
