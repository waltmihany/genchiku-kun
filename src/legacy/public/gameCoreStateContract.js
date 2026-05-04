import {
  GAME_CORE_STATE_POLICY,
  GAME_CORE_STATE_TOP_LEVEL_KEYS,
  GAME_CORE_STATE_INDICATORS_KEYS,
  GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS,
  GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS,
  GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
  GAME_CORE_STATE_ONBOARDING_SEEN_KEYS,
} from "../deps/gameCoreStateDefinitions.js";

export const GAME_CORE_STATE_EXPORT_NAMES = Object.freeze([
  "createRegionalMoods",
  "buildDeconstructionProjects",
  "buildInitialState",
  "areaName",
  "areaInfrastructureStats",
  "monthLabel",
  "getInfrastructureById",
  "getDeconstructionProjectByTarget",
  "deconstructionStatusLabel",
  "deconstructionModeLabel",
  "describeDeconstructionProject",
]);

export const GAME_CORE_STATE_DECONSTRUCTION_PROJECT_KEYS = Object.freeze([
  "id",
  "targetId",
  "name",
  "actionLabel",
  "kind",
  "area",
  "mode",
  "requiredProgress",
  "monthlyNeed",
  "mapBadge",
  "residentRisk",
  "expectedBenefit",
  "status",
  "progress",
  "startedYear",
  "startedMonth",
  "completedYear",
  "completedMonth",
  "cpuReason",
  "expectedEffectNote",
  "lastNote",
]);

export const GAME_CORE_STATE_INFRASTRUCTURE_KEYS = Object.freeze([
  "id",
  "name",
  "kind",
  "condition",
  "importance",
  "burden",
  "area",
  "status",
]);

export const GAME_CORE_STATE_REPORT_ENTRY_KEYS = Object.freeze([
  "id",
  "category",
  "title",
]);

export const GAME_CORE_STATE_CONTRACT = Object.freeze({
  policy: GAME_CORE_STATE_POLICY,
  topLevelKeys: GAME_CORE_STATE_TOP_LEVEL_KEYS,
  indicatorsKeys: GAME_CORE_STATE_INDICATORS_KEYS,
  budgetAllocationKeys: GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS,
  regionalMoodAreaKeys: GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS,
  regionalMoodKeys: GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
  onboardingSeenKeys: GAME_CORE_STATE_ONBOARDING_SEEN_KEYS,
  deconstructionProjectKeys: GAME_CORE_STATE_DECONSTRUCTION_PROJECT_KEYS,
  infrastructureKeys: GAME_CORE_STATE_INFRASTRUCTURE_KEYS,
  reportEntryKeys: GAME_CORE_STATE_REPORT_ENTRY_KEYS,
  exportNames: GAME_CORE_STATE_EXPORT_NAMES,
});
