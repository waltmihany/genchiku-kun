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

export const GAME_CORE_REACT_SHARED_CONTEXT_KEYS = Object.freeze(uniqueList([
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
  "gameState",
]));

export const GAME_CORE_TITLE_REACT_API_CONTEXT_KEYS = Object.freeze([
  "screenTransitions",
]);

export const GAME_CORE_ONBOARDING_REACT_API_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "setHasCompletedOnboarding",
  "screenTransitions",
]);

export const GAME_CORE_DASHBOARD_REACT_API_CONTEXT_KEYS = Object.freeze([
  "gameState",
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
  "render",
]);

export const GAME_CORE_EVENT_REACT_API_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "areaName",
  "labelEventKind",
  "balanceChoiceScore",
  "applyEventChoice",
]);

export const GAME_CORE_BUDGET_REACT_API_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "currentDramaProfile",
  "getBudgetTotal",
  "detectActiveBudgetPreset",
  "recommendBudgetPreset",
  "applyBudgetPreset",
  "autoBalanceBudget",
  "applyBudgetPlan",
  "adjustBudget",
  "setBudgetValue",
  "formatMoney",
]);

export function createGameCoreReactStateProxy(getState) {
  return new Proxy({}, {
    get(_target, prop) {
      return getState?.()?.[prop];
    },
    set(_target, prop, value) {
      const state = getState?.();
      if (!state) return false;
      state[prop] = value;
      return true;
    },
  });
}

export function createGameCoreReactSharedContext(source) {
  return createFrozenContext(source, GAME_CORE_REACT_SHARED_CONTEXT_KEYS);
}

export function createGameCoreTitleReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_TITLE_REACT_API_CONTEXT_KEYS);
}

export function createGameCoreOnboardingReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_ONBOARDING_REACT_API_CONTEXT_KEYS);
}

export function createGameCoreDashboardReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_DASHBOARD_REACT_API_CONTEXT_KEYS);
}

export function createGameCoreEventReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_EVENT_REACT_API_CONTEXT_KEYS);
}

export function createGameCoreBudgetReactApiContext(source) {
  return createFrozenContext(source, GAME_CORE_BUDGET_REACT_API_CONTEXT_KEYS);
}
