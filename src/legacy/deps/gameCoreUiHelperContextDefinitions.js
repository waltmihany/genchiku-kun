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

export const GAME_CORE_UI_SHARED_CONTEXT_KEYS = Object.freeze(uniqueList([
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
  "gameState",
]));

export const GAME_CORE_MAP_UI_HELPERS_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "getElement",
  "areaInfrastructureStats",
  "areaName",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "deconstructionStatusLabel",
  "conditionToStatus",
  "statusInfo",
  "getWorstInfrastructure",
]);

export const GAME_CORE_DASHBOARD_UI_HELPERS_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "getElement",
  "getMetricColor",
  "areaInfrastructureStats",
  "areaName",
  "monthLabel",
  "deconstructionStatusLabel",
  "describeDeconstructionProject",
  "getWorstInfrastructure",
  "currentDramaProfile",
  "getMostVolatileRegion",
  "advanceMonth",
  "renderMap",
  "setScreen",
]);

export const GAME_CORE_ONBOARDING_UI_HELPERS_CONTEXT_KEYS = Object.freeze([
  "gameState",
  "getAppRoot",
  "getElement",
  "setHasCompletedOnboarding",
  "render",
  "setScreen",
]);

export function createGameCoreUiStateProxy(getState) {
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

export function createGameCoreUiElementLocator(getAppRoot) {
  return function getElement(id) {
    return getAppRoot?.()?.querySelector(`#${id}`) || null;
  };
}

export function createGameCoreUiSharedContext(source) {
  return createFrozenContext(source, GAME_CORE_UI_SHARED_CONTEXT_KEYS);
}

export function createGameCoreMapUiHelpersContext(source) {
  return createFrozenContext(source, GAME_CORE_MAP_UI_HELPERS_CONTEXT_KEYS);
}

export function createGameCoreDashboardUiHelpersContext(source) {
  return createFrozenContext(source, GAME_CORE_DASHBOARD_UI_HELPERS_CONTEXT_KEYS);
}

export function createGameCoreOnboardingUiHelpersContext(source) {
  return createFrozenContext(source, GAME_CORE_ONBOARDING_UI_HELPERS_CONTEXT_KEYS);
}
