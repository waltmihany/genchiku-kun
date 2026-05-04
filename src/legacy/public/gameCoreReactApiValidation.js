import {
  createGameCoreReactStateProxy,
  createGameCoreReactSharedContext,
  createGameCoreTitleReactApiContext,
  createGameCoreOnboardingReactApiContext,
  createGameCoreDashboardReactApiContext,
  createGameCoreEventReactApiContext,
  createGameCoreBudgetReactApiContext,
} from "../deps/gameCoreReactApiContextDefinitions.js";
import {
  GAME_CORE_REACT_API_POLICY,
  GAME_CORE_REACT_CONTEXT_FACTORY_NAMES,
  GAME_CORE_REACT_SUB_API_CONTEXT_SPECS,
} from "./gameCoreReactApiContract.js";

const CONTEXT_FACTORY_MAP = Object.freeze({
  createGameCoreReactStateProxy,
  createGameCoreReactSharedContext,
  createGameCoreTitleReactApiContext,
  createGameCoreOnboardingReactApiContext,
  createGameCoreDashboardReactApiContext,
  createGameCoreEventReactApiContext,
  createGameCoreBudgetReactApiContext,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCoreReactApi.js",
    requiredSnippets: Object.freeze([
      "createGameCoreReactStateProxy",
      "createGameCoreReactSharedContext",
      "createGameCoreTitleReactApiContext",
      "createGameCoreOnboardingReactApiContext",
      "createGameCoreDashboardReactApiContext",
      "createGameCoreEventReactApiContext",
      "createGameCoreBudgetReactApiContext",
      "const sharedReactContext = createGameCoreReactSharedContext({",
      "createGameCoreTitleReactApi(",
      "createGameCoreTitleReactApiContext(sharedReactContext)",
      "createGameCoreOnboardingReactApiContext(sharedReactContext)",
      "createGameCoreDashboardReactApiContext(sharedReactContext)",
      "createGameCoreEventReactApiContext(sharedReactContext)",
      "createGameCoreBudgetReactApiContext(sharedReactContext)",
    ]),
    forbiddenPatterns: Object.freeze([
      /const sharedCtx = \{/,
      /createGameCoreTitleReactApi\(sharedCtx\)/,
      /createGameCoreOnboardingReactApi\(sharedCtx\)/,
      /createGameCoreDashboardReactApi\(sharedCtx\)/,
      /createGameCoreEventReactApi\(sharedCtx\)/,
      /createGameCoreBudgetReactApi\(sharedCtx\)/,
      /new Proxy\(\{\}, \{/,
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

export function verifyGameCoreReactApiContexts({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing react context factories",
    findMissingCallableNames(CONTEXT_FACTORY_MAP, GAME_CORE_REACT_CONTEXT_FACTORY_NAMES),
  );

  const proxy = createGameCoreReactStateProxy(() => ({ screen: "title" }));
  if (proxy.screen !== "title") {
    issues.push("react state proxy does not read from getState");
  }

  const sharedContext = createGameCoreReactSharedContext(createSampleSource(["getState", "screenTransitions", "gameState"]));
  if (!Object.isFrozen(sharedContext)) {
    issues.push("shared react context is not frozen");
  }

  GAME_CORE_REACT_SUB_API_CONTEXT_SPECS.forEach((spec) => {
    const factory = CONTEXT_FACTORY_MAP[spec.contextFactoryName];
    const createdContext = factory(createSampleSource(spec.requiredContextKeys));
    const missingKeys = spec.requiredContextKeys.filter((key) => !(key in createdContext));
    const unexpectedKeys = Object.keys(createdContext)
      .filter((key) => !spec.requiredContextKeys.includes(key))
      .sort();
    pushListIssue(issues, `missing react context keys for ${spec.key}`, missingKeys);
    pushListIssue(issues, `unexpected react context keys for ${spec.key}`, unexpectedKeys);
    if (!Object.isFrozen(createdContext)) {
      issues.push(`react context is not frozen for ${spec.key}`);
    }
  });

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing react API snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden react API patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_REACT_API_POLICY.owner,
      contextFactories: GAME_CORE_REACT_CONTEXT_FACTORY_NAMES.length,
      subApis: GAME_CORE_REACT_SUB_API_CONTEXT_SPECS.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreReactApiVerification(result) {
  if (result.ok) {
    return [
      "gameCore React API context verification: OK",
      `- owner: ${result.counts.owner}`,
      `- context factories: ${result.counts.contextFactories}`,
      `- sub APIs: ${result.counts.subApis}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore React API context verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreReactApiContexts(ctx) {
  const result = verifyGameCoreReactApiContexts(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreReactApiVerification(result));
  }
  return result;
}
