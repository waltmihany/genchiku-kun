function uniqueList(values) {
  return [...new Set(values)];
}

function createFrozenContext(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_PROGRESS_API_CONTEXT_KEYS = Object.freeze(uniqueList([
  "getState",
  "alertUser",
  "clone",
  "clamp",
  "formatMoney",
  "conditionToStatus",
  "areaInfrastructureStats",
  "getWorstInfrastructure",
  "areaName",
  "monthLabel",
  "averageRegionalValue",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "summarizeBudgetAllocation",
  "summarizeEffectSignals",
  "eventImpactScore",
  "render",
  "screenTransitions",
  "monthlyEventPool",
  "buildYearCausalSummary",
  "generateYearEndReport",
]));

export const GAME_CORE_UI_HELPERS_CONTEXT_KEYS = Object.freeze(uniqueList([
  "getState",
  "getAppRoot",
  "setHasCompletedOnboarding",
  "emitGameViewChange",
  "getMetricColor",
  "areaInfrastructureStats",
  "areaName",
  "monthLabel",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "deconstructionStatusLabel",
  "describeDeconstructionProject",
  "conditionToStatus",
  "statusInfo",
  "getWorstInfrastructure",
  "currentDramaProfile",
  "getMostVolatileRegion",
  "advanceMonth",
]));

export const GAME_CORE_REACT_API_CONTEXT_KEYS = Object.freeze(uniqueList([
  "getState",
  "getMetricColor",
  "areaInfrastructureStats",
  "areaName",
  "describeDeconstructionProject",
  "monthLabel",
  "deconstructionStatusLabel",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "conditionToStatus",
  "statusInfo",
  "pickStripComment",
  "currentDramaProfile",
  "getWorstInfrastructure",
  "getMostVolatileRegion",
  "phaseLabel",
  "formatMoney",
  "buildSummaryMessage",
  "phaseActionText",
  "screenTransitions",
  "advanceMonth",
  "labelEventKind",
  "balanceChoiceScore",
  "applyEventChoice",
  "getBudgetTotal",
  "detectActiveBudgetPreset",
  "recommendBudgetPreset",
  "applyBudgetPreset",
  "autoBalanceBudget",
  "applyBudgetPlan",
  "adjustBudget",
  "setBudgetValue",
  "setHasCompletedOnboarding",
  "render",
]));

export const GAME_CORE_REPORT_API_CONTEXT_KEYS = Object.freeze(uniqueList([
  "getState",
  "clamp",
  "formatMoney",
  "areaName",
  "getWorstInfrastructure",
  "currentDramaProfile",
  "summarizeBudgetAllocation",
  "render",
  "screenTransitions",
]));

export const GAME_CORE_SIMULATION_API_CONTEXT_KEYS = Object.freeze(uniqueList([
  "getState",
  "setState",
  "clone",
  "buildInitialState",
  "generateYearEndReport",
  "recommendBudgetPreset",
  "applyBudgetPlan",
  "applyEventChoice",
  "advanceMonth",
  "balanceChoiceScore",
]));

export function createGameCoreProgressApiContext(source) {
  return createFrozenContext(source, GAME_CORE_PROGRESS_API_CONTEXT_KEYS);
}

export function createGameCoreUiHelpersContext(source) {
  return createFrozenContext(source, GAME_CORE_UI_HELPERS_CONTEXT_KEYS);
}

export function createGameCoreReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_REACT_API_CONTEXT_KEYS);
}

export function createGameCoreReportApiContext(source) {
  return createFrozenContext(source, GAME_CORE_REPORT_API_CONTEXT_KEYS);
}

export function createGameCoreSimulationApiContext(source) {
  return createFrozenContext(source, GAME_CORE_SIMULATION_API_CONTEXT_KEYS);
}
