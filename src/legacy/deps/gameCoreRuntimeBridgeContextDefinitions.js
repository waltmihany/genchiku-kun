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

export const GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEYS = Object.freeze([
  "deps",
  "store",
  "alertUser",
]);

export const GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEYS = Object.freeze(uniqueList([
  "alertUser",
  "clone",
  "clamp",
  "formatMoney",
  "getMetricColor",
  "conditionToStatus",
  "statusInfo",
  "getWorstInfrastructure",
  "summarizeBudgetAllocation",
  "summarizeEffectSignals",
  "eventImpactScore",
  "averageRegionalValue",
  "areaInfrastructureStats",
  "areaName",
  "monthLabel",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "deconstructionStatusLabel",
  "describeDeconstructionProject",
  "buildInitialState",
  "monthlyEventPool",
  "getState",
  "setState",
  "getAppRoot",
  "setHasCompletedOnboarding",
  "emitGameViewChange",
]));

export const GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEYS = Object.freeze([
  "deps",
  "store",
  "bridgeContext",
]);

export function createGameCoreRuntimeBridgeContextInput(source) {
  return createFrozenContext(source, GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEYS);
}

export function createGameCoreRuntimeBridgeContextValue(source) {
  return createFrozenContext(source, GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEYS);
}

export function createGameCoreRuntimeControllerContext(source) {
  return createFrozenContext(source, GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEYS);
}
