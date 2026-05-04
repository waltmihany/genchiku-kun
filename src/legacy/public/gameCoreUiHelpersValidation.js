import {
  createGameCoreUiStateProxy,
  createGameCoreUiElementLocator,
  createGameCoreUiSharedContext,
  createGameCoreMapUiHelpersContext,
  createGameCoreDashboardUiHelpersContext,
  createGameCoreOnboardingUiHelpersContext,
} from "../deps/gameCoreUiHelperContextDefinitions.js";
import {
  GAME_CORE_UI_HELPERS_POLICY,
  GAME_CORE_UI_HELPERS_MANAGED_SCREEN_KEYS,
  GAME_CORE_UI_CONTEXT_FACTORY_NAMES,
  GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS,
} from "./gameCoreUiHelpersContract.js";

const CONTEXT_FACTORY_MAP = Object.freeze({
  createGameCoreUiStateProxy,
  createGameCoreUiElementLocator,
  createGameCoreUiSharedContext,
  createGameCoreMapUiHelpersContext,
  createGameCoreDashboardUiHelpersContext,
  createGameCoreOnboardingUiHelpersContext,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCoreUiHelpers.js",
    requiredSnippets: Object.freeze([
      "createGameCoreUiStateProxy",
      "createGameCoreUiElementLocator",
      "createGameCoreUiSharedContext",
      "createGameCoreMapUiHelpersContext",
      "createGameCoreDashboardUiHelpersContext",
      "createGameCoreOnboardingUiHelpersContext",
      "const sharedUiContext = createGameCoreUiSharedContext({",
      "const getElement = createGameCoreUiElementLocator(sharedUiContext.getAppRoot);",
      "createGameCoreMapUiHelpers(createGameCoreMapUiHelpersContext({",
      "createGameCoreDashboardUiHelpers(createGameCoreDashboardUiHelpersContext({",
      "createGameCoreOnboardingUiHelpers(createGameCoreOnboardingUiHelpersContext({",
    ]),
    forbiddenPatterns: Object.freeze([
      /new Proxy\(\{\}, \{/,
      /function getElement\(id\) \{/,
      /createGameCoreMapUiHelpers\(\{/,
      /createGameCoreDashboardUiHelpers\(\{/,
      /createGameCoreOnboardingUiHelpers\(\{/,
    ]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function createSampleSource(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = () => key;
    return acc;
  }, {});
}

export function verifyGameCoreUiHelpersContexts({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing UI helper context factories",
    findMissingCallableNames(CONTEXT_FACTORY_MAP, GAME_CORE_UI_CONTEXT_FACTORY_NAMES),
  );

  const proxy = createGameCoreUiStateProxy(() => ({ screen: "title" }));
  if (proxy.screen !== "title") {
    issues.push("UI helper state proxy does not read from getState");
  }

  const getElement = createGameCoreUiElementLocator(() => ({
    querySelector: (selector) => selector,
  }));
  if (getElement("screenContainer") !== "#screenContainer") {
    issues.push("UI element locator does not resolve query selector ids");
  }

  const sharedContext = createGameCoreUiSharedContext(createSampleSource(["getState", "getAppRoot", "gameState"]));
  if (!Object.isFrozen(sharedContext)) {
    issues.push("shared UI context is not frozen");
  }

  pushListIssue(
    issues,
    "duplicate managed UI screens",
    GAME_CORE_UI_HELPERS_MANAGED_SCREEN_KEYS.filter((screen, index, values) => values.indexOf(screen) !== index),
  );

  GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS.forEach((spec) => {
    const factory = CONTEXT_FACTORY_MAP[spec.contextFactoryName];
    const createdContext = factory(createSampleSource(spec.requiredContextKeys));
    const missingKeys = spec.requiredContextKeys.filter((key) => !(key in createdContext));
    const unexpectedKeys = Object.keys(createdContext)
      .filter((key) => !spec.requiredContextKeys.includes(key))
      .sort();
    pushListIssue(issues, `missing UI helper context keys for ${spec.key}`, missingKeys);
    pushListIssue(issues, `unexpected UI helper context keys for ${spec.key}`, unexpectedKeys);
    if (!Object.isFrozen(createdContext)) {
      issues.push(`UI helper context is not frozen for ${spec.key}`);
    }
  });

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing UI helper snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden UI helper patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_UI_HELPERS_POLICY.owner,
      contextFactories: GAME_CORE_UI_CONTEXT_FACTORY_NAMES.length,
      subHelpers: GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS.length,
      managedScreens: GAME_CORE_UI_HELPERS_MANAGED_SCREEN_KEYS.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreUiHelpersVerification(result) {
  if (result.ok) {
    return [
      "gameCore UI helpers context verification: OK",
      `- owner: ${result.counts.owner}`,
      `- context factories: ${result.counts.contextFactories}`,
      `- sub helpers: ${result.counts.subHelpers}`,
      `- managed screens: ${result.counts.managedScreens}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore UI helpers context verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreUiHelpersContexts(ctx) {
  const result = verifyGameCoreUiHelpersContexts(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreUiHelpersVerification(result));
  }
  return result;
}
