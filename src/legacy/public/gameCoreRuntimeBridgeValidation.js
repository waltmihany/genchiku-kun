import {
  createGameCoreRuntimeBridgeContextInput,
  createGameCoreRuntimeBridgeContextValue,
  createGameCoreRuntimeControllerContext,
} from "../deps/gameCoreRuntimeBridgeContextDefinitions.js";
import {
  GAME_CORE_RUNTIME_BRIDGE_POLICY,
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_FACTORY_NAMES,
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEY_NAMES,
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES,
  GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEY_NAMES,
  GAME_CORE_RUNTIME_TO_BRIDGE_REQUIRED_KEY_NAMES,
} from "./gameCoreRuntimeBridgeContract.js";

const CONTEXT_FACTORY_MAP = Object.freeze({
  createGameCoreRuntimeBridgeContextInput,
  createGameCoreRuntimeBridgeContextValue,
  createGameCoreRuntimeControllerContext,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCoreRuntime.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimeBridgeContextInput",
      "createGameCoreRuntimeControllerContext",
      "createGameCoreRuntimeBridgeContext(",
      "createGameCoreRuntimeBridgeContextInput({",
      "createGameCoreRuntimeController(",
      "createGameCoreRuntimeControllerContext({",
    ]),
    forbiddenPatterns: Object.freeze([
      /createGameCoreRuntimeBridgeContext\(\{/,
      /createGameCoreRuntimeController\(\{/,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/runtime/gameCoreRuntimeBridgeContext.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimeBridgeContextValue",
      "return createGameCoreRuntimeBridgeContextValue({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*alertUser,/,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/runtime/gameCoreRuntimeController.js",
    requiredSnippets: Object.freeze([
      "bridgeContext.buildInitialState()",
      "...bridgeContext,",
    ]),
    forbiddenPatterns: Object.freeze([
      /\bbridgeCtx\b/,
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

export function verifyGameCoreRuntimeBridgeContexts({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing runtime bridge context factories",
    findMissingCallableNames(CONTEXT_FACTORY_MAP, GAME_CORE_RUNTIME_BRIDGE_CONTEXT_FACTORY_NAMES),
  );

  const bridgeInput = createGameCoreRuntimeBridgeContextInput(
    createSampleSource(GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEY_NAMES),
  );
  const bridgeValue = createGameCoreRuntimeBridgeContextValue(
    createSampleSource(GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES),
  );
  const controllerContext = createGameCoreRuntimeControllerContext(
    createSampleSource(GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEY_NAMES),
  );

  [
    ["runtime bridge input", bridgeInput, GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEY_NAMES],
    ["runtime bridge value", bridgeValue, GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES],
    ["runtime controller context", controllerContext, GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEY_NAMES],
  ].forEach(([label, createdContext, requiredKeys]) => {
    const missingKeys = requiredKeys.filter((key) => !(key in createdContext));
    const unexpectedKeys = Object.keys(createdContext)
      .filter((key) => !requiredKeys.includes(key))
      .sort();
    pushListIssue(issues, `missing keys for ${label}`, missingKeys);
    pushListIssue(issues, `unexpected keys for ${label}`, unexpectedKeys);
    if (!Object.isFrozen(createdContext)) {
      issues.push(`${label} is not frozen`);
    }
  });

  pushListIssue(
    issues,
    "runtime bridge value missing bridge bundle keys",
    GAME_CORE_RUNTIME_TO_BRIDGE_REQUIRED_KEY_NAMES
      .filter((key) => !GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES.includes(key))
      .sort(),
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing runtime bridge snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden runtime bridge patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_RUNTIME_BRIDGE_POLICY.owner,
      contextFactories: GAME_CORE_RUNTIME_BRIDGE_CONTEXT_FACTORY_NAMES.length,
      bridgeInputKeys: GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEY_NAMES.length,
      bridgeValueKeys: GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES.length,
      controllerContextKeys: GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreRuntimeBridgeVerification(result) {
  if (result.ok) {
    return [
      "gameCore runtime bridge context verification: OK",
      `- owner: ${result.counts.owner}`,
      `- context factories: ${result.counts.contextFactories}`,
      `- bridge input keys: ${result.counts.bridgeInputKeys}`,
      `- bridge value keys: ${result.counts.bridgeValueKeys}`,
      `- controller context keys: ${result.counts.controllerContextKeys}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore runtime bridge context verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreRuntimeBridgeContexts(ctx) {
  const result = verifyGameCoreRuntimeBridgeContexts(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreRuntimeBridgeVerification(result));
  }
  return result;
}
