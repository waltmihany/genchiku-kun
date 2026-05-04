import {
  averageRegionalValue,
  clone,
  clamp,
  formatMoney,
  getMetricColor,
  conditionToStatus,
  statusInfo,
  getWorstInfrastructure,
  summarizeBudgetAllocation,
  summarizeEffectSignals,
  eventImpactScore,
} from "../utils/gameCoreUtils.js";

function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_UTILS_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/legacy/utils/gameCoreUtils.js",
  placement: "src/legacy/deps/gameCoreUtilsDefinitions.js",
});

export const GAME_CORE_UTILS_FUNCTION_NAMES = Object.freeze([
  "averageRegionalValue",
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
]);

export const defaultGameCoreUtils = Object.freeze({
  averageRegionalValue,
  clone,
  clamp,
  formatMoney,
  getMetricColor,
  conditionToStatus,
  statusInfo,
  getWorstInfrastructure,
  summarizeBudgetAllocation,
  summarizeEffectSignals,
  eventImpactScore,
});

export function createGameCoreUtilsShape(source) {
  return createFrozenShape(source, GAME_CORE_UTILS_FUNCTION_NAMES);
}
