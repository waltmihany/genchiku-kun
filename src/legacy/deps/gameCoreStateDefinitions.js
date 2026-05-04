import {
  buildInitialState,
  createRegionalMoods,
} from "../state/gameCoreState.js";

function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_STATE_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/legacy/state/gameCoreState.js",
  placement: "src/legacy/deps/gameCoreStateDefinitions.js",
  builderName: "buildInitialState",
  regionalMoodsFactoryName: "createRegionalMoods",
});

export const GAME_CORE_STATE_TOP_LEVEL_KEYS = Object.freeze([
  "screen",
  "phase",
  "year",
  "totalYears",
  "monthIndex",
  "annualBudgetBase",
  "annualBudget",
  "remainingBudget",
  "reserveFund",
  "emergencyDebt",
  "indicators",
  "regionalMoods",
  "regionalAlerts",
  "deconstructionProjects",
  "deconstructionHistory",
  "latestDeconstructionAction",
  "latestDeconstructionTargetId",
  "budgetAllocation",
  "areas",
  "facilities",
  "rivers",
  "roads",
  "bridges",
  "infrastructures",
  "reportEntries",
  "selectedReportId",
  "selectedMapTargetId",
  "pendingEvent",
  "lastChoiceResult",
  "currentYearEvents",
  "currentYearBudgetDecision",
  "lastYearCausalSummary",
  "onboardingActive",
  "onboardingSeen",
  "log",
  "gameOverReason",
  "clearMessage",
]);

export const GAME_CORE_STATE_INDICATORS_KEYS = Object.freeze([
  "satisfaction",
  "safety",
  "fiscalHealth",
  "futureBurden",
  "support",
  "rebellion",
]);

export const GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS = Object.freeze([
  "bridge",
  "road",
  "disaster",
  "deconstruction",
  "outreach",
  "reserve",
]);

export const GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS = Object.freeze([
  "central",
  "mountain",
  "river",
  "tourism",
]);

export const GAME_CORE_STATE_REGIONAL_MOOD_KEYS = Object.freeze([
  "satisfaction",
  "rebellion",
]);

export const GAME_CORE_STATE_ONBOARDING_SEEN_KEYS = Object.freeze([
  "dashboard",
  "report",
  "budget",
]);

export function createGameCoreInitialStateShape(source) {
  return createFrozenShape(source, GAME_CORE_STATE_TOP_LEVEL_KEYS);
}

export { buildInitialState, createRegionalMoods };
