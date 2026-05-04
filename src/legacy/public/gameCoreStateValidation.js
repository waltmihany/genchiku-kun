import {
  buildInitialState,
  createRegionalMoods,
  createGameCoreInitialStateShape,
  GAME_CORE_STATE_POLICY,
  GAME_CORE_STATE_TOP_LEVEL_KEYS,
  GAME_CORE_STATE_INDICATORS_KEYS,
  GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS,
  GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS,
  GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
  GAME_CORE_STATE_ONBOARDING_SEEN_KEYS,
} from "../deps/gameCoreStateDefinitions.js";
import { averageRegionalValue, clone } from "../utils/gameCoreUtils.js";
import {
  GAME_CORE_STATE_EXPORT_NAMES,
  GAME_CORE_STATE_DECONSTRUCTION_PROJECT_KEYS,
  GAME_CORE_STATE_INFRASTRUCTURE_KEYS,
  GAME_CORE_STATE_REPORT_ENTRY_KEYS,
} from "./gameCoreStateContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: GAME_CORE_STATE_POLICY.modulePath,
    requiredSnippets: Object.freeze([
      ...GAME_CORE_STATE_EXPORT_NAMES.map((name) => `export function ${name}`),
      "regionalMoods,",
      "budgetAllocation:",
      "reportEntries:",
      "deconstructionProjects:",
      "infrastructures:",
      "onboardingSeen:",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function verifyExactKeys(issues, label, value, requiredKeys) {
  const actualKeys = Object.keys(value || {}).sort();
  const missingKeys = requiredKeys.filter((key) => !(key in (value || {})));
  const unexpectedKeys = actualKeys.filter((key) => !requiredKeys.includes(key));
  pushListIssue(issues, `missing keys for ${label}`, missingKeys);
  pushListIssue(issues, `unexpected keys for ${label}`, unexpectedKeys);
}

function verifyRequiredKeys(issues, label, value, requiredKeys) {
  const missingKeys = requiredKeys.filter((key) => !(key in (value || {})));
  pushListIssue(issues, `missing keys for ${label}`, missingKeys);
}

function verifyNumberFields(issues, label, value, keys) {
  const nonNumeric = keys.filter((key) => typeof value?.[key] !== "number");
  pushListIssue(issues, `non-number fields for ${label}`, nonNumeric);
}

function createSampleInitialState() {
  return buildInitialState({
    hasCompletedOnboarding: false,
    clone,
    averageRegionalValue,
  });
}

export function verifyGameCoreState({ sourceTexts }) {
  const issues = [];

  if (typeof createRegionalMoods !== "function") {
    issues.push("createRegionalMoods is not callable");
  }
  if (typeof buildInitialState !== "function") {
    issues.push("buildInitialState is not callable");
  }

  const sampleShape = createGameCoreInitialStateShape(
    GAME_CORE_STATE_TOP_LEVEL_KEYS.reduce((acc, key) => {
      acc[key] = key;
      return acc;
    }, {}),
  );
  verifyExactKeys(issues, "initial state shape factory", sampleShape, GAME_CORE_STATE_TOP_LEVEL_KEYS);
  if (!Object.isFrozen(sampleShape)) {
    issues.push("initial state shape factory result is not frozen");
  }

  const regionalMoods = createRegionalMoods();
  verifyExactKeys(issues, "regional moods root", regionalMoods, GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS);
  GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS.forEach((areaId) => {
    verifyExactKeys(
      issues,
      `regional moods.${areaId}`,
      regionalMoods[areaId],
      GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
    );
    verifyNumberFields(
      issues,
      `regional moods.${areaId}`,
      regionalMoods[areaId],
      GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
    );
  });

  const state = createSampleInitialState();
  verifyExactKeys(issues, "initial state", state, GAME_CORE_STATE_TOP_LEVEL_KEYS);
  verifyExactKeys(issues, "initial state indicators", state.indicators, GAME_CORE_STATE_INDICATORS_KEYS);
  verifyNumberFields(issues, "initial state indicators", state.indicators, GAME_CORE_STATE_INDICATORS_KEYS);
  verifyExactKeys(
    issues,
    "initial state budgetAllocation",
    state.budgetAllocation,
    GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS,
  );
  verifyNumberFields(
    issues,
    "initial state budgetAllocation",
    state.budgetAllocation,
    GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS,
  );
  verifyExactKeys(
    issues,
    "initial state regionalMoods",
    state.regionalMoods,
    GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS,
  );
  GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS.forEach((areaId) => {
    verifyExactKeys(
      issues,
      `initial state regionalMoods.${areaId}`,
      state.regionalMoods[areaId],
      GAME_CORE_STATE_REGIONAL_MOOD_KEYS,
    );
  });
  verifyExactKeys(
    issues,
    "initial state onboardingSeen",
    state.onboardingSeen,
    GAME_CORE_STATE_ONBOARDING_SEEN_KEYS,
  );

  if (!Array.isArray(state.reportEntries)) {
    issues.push("reportEntries is not an array");
  }
  if (!Array.isArray(state.deconstructionProjects) || state.deconstructionProjects.length === 0) {
    issues.push("deconstructionProjects is empty or not an array");
  } else {
    verifyRequiredKeys(
      issues,
      "deconstructionProjects[0]",
      state.deconstructionProjects[0],
      GAME_CORE_STATE_DECONSTRUCTION_PROJECT_KEYS,
    );
  }
  if (!Array.isArray(state.infrastructures) || state.infrastructures.length === 0) {
    issues.push("infrastructures is empty or not an array");
  } else {
    verifyRequiredKeys(
      issues,
      "infrastructures[0]",
      state.infrastructures[0],
      GAME_CORE_STATE_INFRASTRUCTURE_KEYS,
    );
  }
  if (!Array.isArray(state.regionalAlerts)) {
    issues.push("regionalAlerts is not an array");
  }
  if (!Array.isArray(state.log)) {
    issues.push("log is not an array");
  }
  if (state.reportEntries.length > 0) {
    verifyRequiredKeys(
      issues,
      "reportEntries[0]",
      state.reportEntries[0],
      GAME_CORE_STATE_REPORT_ENTRY_KEYS,
    );
  }

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing state snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden state patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_STATE_POLICY.owner,
      topLevelKeys: GAME_CORE_STATE_TOP_LEVEL_KEYS.length,
      indicatorKeys: GAME_CORE_STATE_INDICATORS_KEYS.length,
      budgetKeys: GAME_CORE_STATE_BUDGET_ALLOCATION_KEYS.length,
      regionalAreas: GAME_CORE_STATE_REGIONAL_MOODS_AREA_KEYS.length,
      exportNames: GAME_CORE_STATE_EXPORT_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreStateVerification(result) {
  if (result.ok) {
    return [
      "gameCore state verification: OK",
      `- owner: ${result.counts.owner}`,
      `- top-level keys: ${result.counts.topLevelKeys}`,
      `- indicator keys: ${result.counts.indicatorKeys}`,
      `- budget keys: ${result.counts.budgetKeys}`,
      `- regional areas: ${result.counts.regionalAreas}`,
      `- state exports: ${result.counts.exportNames}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore state verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreState(ctx) {
  const result = verifyGameCoreState(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreStateVerification(result));
  }
  return result;
}
