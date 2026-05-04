import { GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS } from "../public/gameCorePublicContract.js";

function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_PROGRESS_API_METHOD_NAMES = Object.freeze([
  "currentDramaProfile",
  "getMostVolatileRegion",
  "applyBudgetPlan",
  "getBudgetTotal",
  "applyBudgetPreset",
  "detectActiveBudgetPreset",
  "recommendBudgetPreset",
  "autoBalanceBudget",
  "adjustBudget",
  "setBudgetValue",
  "applyEventChoice",
  "advanceMonth",
  "checkGameState",
  "setGameOver",
  "balanceChoiceScore",
]);

export const GAME_CORE_REPORT_API_METHOD_NAMES = Object.freeze([
  "buildYearCausalSummary",
  "generateYearEndReport",
  "buildResultReviewData",
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.report,
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.result,
]);

export const GAME_CORE_SIMULATION_API_METHOD_NAMES = Object.freeze([
  "runSingleAutoSimulation",
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.simulation,
]);

export function createGameCoreProgressApiShape(source) {
  return createFrozenShape(source, GAME_CORE_PROGRESS_API_METHOD_NAMES);
}

export function createGameCoreReportApiShape(source) {
  return createFrozenShape(source, GAME_CORE_REPORT_API_METHOD_NAMES);
}

export function createGameCoreSimulationApiShape(source) {
  return createFrozenShape(source, GAME_CORE_SIMULATION_API_METHOD_NAMES);
}
