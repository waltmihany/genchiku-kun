import {
  createGameCoreBridgeDependencies,
} from "../deps/gameCoreBridgeDependencyDefinitions.js";
import {
  createGameCoreRuntimeDependencies,
} from "../deps/gameCoreRuntimeDependencyDefinitions.js";
import {
  createGameCoreProgressApiContext,
  createGameCoreUiHelpersContext,
  createGameCoreReactApiContext,
  createGameCoreReportApiContext,
  createGameCoreSimulationApiContext,
} from "../deps/gameCoreBridgeBundleContextDefinitions.js";
import {
  GAME_CORE_DEPENDENCY_POLICY,
  GAME_CORE_BRIDGE_DEPENDENCY_CREATOR_NAMES,
  GAME_CORE_RUNTIME_DEPENDENCY_NAMES,
  GAME_CORE_BRIDGE_BUNDLE_CONTEXT_FACTORY_NAMES,
  GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS,
} from "./gameCoreDependencyContract.js";

const CONTEXT_FACTORY_MAP = Object.freeze({
  createGameCoreProgressApiContext,
  createGameCoreUiHelpersContext,
  createGameCoreReactApiContext,
  createGameCoreReportApiContext,
  createGameCoreSimulationApiContext,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/bridge/gameCoreBridgeApiBundle.js",
    requiredSnippets: Object.freeze([
      "createGameCoreProgressApiContext",
      "createGameCoreUiHelpersContext",
      "createGameCoreReactApiContext",
      "createGameCoreReportApiContext",
      "createGameCoreSimulationApiContext",
      "createGameCoreProgressApi(createGameCoreProgressApiContext({",
      "createGameCoreUiHelpers(createGameCoreUiHelpersContext({",
      "createGameCoreReactApi(createGameCoreReactApiContext({",
      "createGameCoreReportApi(createGameCoreReportApiContext({",
      "createGameCoreSimulationApi(createGameCoreSimulationApiContext({",
    ]),
    forbiddenPatterns: Object.freeze([
      /createGameCoreProgressApi\(\{/,
      /createGameCoreUiHelpers\(\{/,
      /createGameCoreReactApi\(\{/,
      /createGameCoreReportApi\(\{/,
      /createGameCoreSimulationApi\(\{/,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/deps/gameCoreBridgeDependencyDefinitions.js",
    requiredSnippets: Object.freeze([
      "export const defaultGameCoreBridgeDependencies",
      "export function createGameCoreBridgeDependencies",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/deps/gameCoreRuntimeDependencyDefinitions.js",
    requiredSnippets: Object.freeze([
      "export const defaultGameCoreRuntimeDependencies",
      "bridgeDependencies: defaultGameCoreBridgeDependencies",
      "createGameCoreBridgeDependencies(",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/gameCoreBridge.js",
    requiredSnippets: Object.freeze([
      "createGameCoreBridgeDependencies(dependencies)",
      "createGameCoreBridgeApiBundle",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/gameCoreRuntime.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimeDependencies(dependencies)",
      "createGameCoreRuntimeBridgeContext",
      "createGameCoreRuntimeController",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function uniqueList(values) {
  return [...new Set(values)];
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function createSampleSourceForContext(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = () => key;
    return acc;
  }, {});
}

export function verifyGameCoreDependencies({
  bridgeDependencies,
  runtimeDependencies,
  sourceTexts,
}) {
  const issues = [];
  const createdBridgeDependencies = createGameCoreBridgeDependencies(bridgeDependencies);
  const createdRuntimeDependencies = createGameCoreRuntimeDependencies(runtimeDependencies);

  pushListIssue(
    issues,
    "missing bridge dependency creators",
    findMissingCallableNames(createdBridgeDependencies, GAME_CORE_BRIDGE_DEPENDENCY_CREATOR_NAMES),
  );
  pushListIssue(
    issues,
    "missing runtime dependency members",
    GAME_CORE_RUNTIME_DEPENDENCY_NAMES.filter((name) => createdRuntimeDependencies?.[name] == null).sort(),
  );
  pushListIssue(
    issues,
    "missing bridge bundle context factories",
    findMissingCallableNames(CONTEXT_FACTORY_MAP, GAME_CORE_BRIDGE_BUNDLE_CONTEXT_FACTORY_NAMES),
  );

  GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS.forEach((spec) => {
    const factory = CONTEXT_FACTORY_MAP[spec.createMethodName];
    const sampleSource = createSampleSourceForContext(spec.requiredContextKeys);
    const createdContext = factory(sampleSource);
    const missingKeys = spec.requiredContextKeys.filter((key) => !(key in createdContext));
    const unexpectedKeys = Object.keys(createdContext)
      .filter((key) => !spec.requiredContextKeys.includes(key))
      .sort();
    pushListIssue(issues, `missing context keys for ${spec.key}`, missingKeys);
    pushListIssue(issues, `unexpected context keys for ${spec.key}`, unexpectedKeys);
    if (!Object.isFrozen(createdContext)) {
      issues.push(`context is not frozen for ${spec.key}`);
    }
  });

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing dependency snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden dependency patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_DEPENDENCY_POLICY.owner,
      bridgeCreators: GAME_CORE_BRIDGE_DEPENDENCY_CREATOR_NAMES.length,
      runtimeDependencies: GAME_CORE_RUNTIME_DEPENDENCY_NAMES.length,
      contextFactories: GAME_CORE_BRIDGE_BUNDLE_CONTEXT_FACTORY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
      uniqueContextKeys: uniqueList(
        GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS.flatMap((spec) => spec.requiredContextKeys),
      ).length,
    },
  };
}

export function formatGameCoreDependencyVerification(result) {
  if (result.ok) {
    return [
      "gameCore dependency layout verification: OK",
      `- owner: ${result.counts.owner}`,
      `- bridge dependency creators: ${result.counts.bridgeCreators}`,
      `- runtime dependency members: ${result.counts.runtimeDependencies}`,
      `- bridge bundle context factories: ${result.counts.contextFactories}`,
      `- checked source files: ${result.counts.sourceRules}`,
      `- unique context keys: ${result.counts.uniqueContextKeys}`,
    ].join("\n");
  }

  return [
    "gameCore dependency layout verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreDependencies(ctx) {
  const result = verifyGameCoreDependencies(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreDependencyVerification(result));
  }
  return result;
}
