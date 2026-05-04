import * as publicApiModule from "../gameCorePublicApi.js";
import * as bridgeFacadeModule from "./gameCoreBridgeFacade.js";
import * as runtimeFacadeModule from "./gameCoreRuntimeFacade.js";
import * as publicEntryModule from "../gameCore.js";
import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./gameCorePublicContract.js";
import {
  GAME_CORE_PUBLIC_FACADE_POLICY,
  GAME_CORE_PUBLIC_API_FACTORY_NAMES,
  GAME_CORE_PUBLIC_API_ALIAS_NAMES,
} from "./gameCorePublicFacadeContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCorePublicApi.js",
    requiredSnippets: Object.freeze([
      "GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES",
      "GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES",
      "export function createGameCoreCallablePublicApi",
      "return Object.freeze(",
      "export function createGameCoreBridgePublicApi",
      "export function createGameCoreRuntimePublicApi",
      "export const createGameCorePublicApi = createGameCoreBridgePublicApi",
      "export const createCallablePublicApi = createGameCoreCallablePublicApi",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+Object\.fromEntries\(/,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/public/gameCoreBridgeFacade.js",
    requiredSnippets: Object.freeze([
      "createGameCoreBridgePublicApi(getBridge)",
      "const gameCoreBridgeFacade = createGameCoreBridgePublicApi(getBridge)",
      "} = gameCoreBridgeFacade;",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/public/gameCoreRuntimeFacade.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimePublicApi(getRuntime)",
      "const gameCoreRuntimeFacade = createGameCoreRuntimePublicApi(getRuntime)",
      "} = gameCoreRuntimeFacade;",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/gameCore.js",
    requiredSnippets: Object.freeze([
      "export * from \"./public/gameCoreRuntimeFacade.js\";",
      "export * from \"./public/gameCoreBridgeFacade.js\";",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function findUnexpectedKeys(source, expectedKeys) {
  return Object.keys(source)
    .filter((key) => !expectedKeys.includes(key))
    .sort();
}

function createSampleCallableSource(methodNames, label) {
  return Object.fromEntries(
    methodNames.map((methodName) => [
      methodName,
      (...args) => `${label}:${methodName}:${args.join("|")}`,
    ]),
  );
}

function verifyForwarderShape(issues, label, createdApi, methodNames) {
  const missingKeys = methodNames.filter((name) => !(name in createdApi));
  const unexpectedKeys = findUnexpectedKeys(createdApi, methodNames);
  pushListIssue(issues, `missing methods on ${label}`, missingKeys);
  pushListIssue(issues, `unexpected methods on ${label}`, unexpectedKeys);
  if (!Object.isFrozen(createdApi)) {
    issues.push(`${label} is not frozen`);
  }
}

export function verifyGameCorePublicFacades({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing public API factories",
    findMissingCallableNames(publicApiModule, GAME_CORE_PUBLIC_API_FACTORY_NAMES),
  );
  pushListIssue(
    issues,
    "missing public API aliases",
    findMissingCallableNames(publicApiModule, GAME_CORE_PUBLIC_API_ALIAS_NAMES),
  );

  if (publicApiModule.createGameCorePublicApi !== publicApiModule.createGameCoreBridgePublicApi) {
    issues.push("createGameCorePublicApi alias does not match createGameCoreBridgePublicApi");
  }
  if (publicApiModule.createCallablePublicApi !== publicApiModule.createGameCoreCallablePublicApi) {
    issues.push("createCallablePublicApi alias does not match createGameCoreCallablePublicApi");
  }

  const callableMethodNames = ["alpha", "beta"];
  let activeCallableSource = createSampleCallableSource(callableMethodNames, "first");
  const callableApi = publicApiModule.createGameCoreCallablePublicApi(
    () => activeCallableSource,
    callableMethodNames,
  );
  verifyForwarderShape(issues, "callable public API", callableApi, callableMethodNames);

  const firstCallableResult = callableApi.alpha("x");
  activeCallableSource = createSampleCallableSource(callableMethodNames, "second");
  const secondCallableResult = callableApi.alpha("y");
  if (firstCallableResult !== "first:alpha:x") {
    issues.push("callable public API did not forward to the first active source");
  }
  if (secondCallableResult !== "second:alpha:y") {
    issues.push("callable public API did not resolve the latest getter source on invocation");
  }

  const bridgeApi = publicApiModule.createGameCoreBridgePublicApi(
    () => createSampleCallableSource(GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES, "bridge"),
  );
  verifyForwarderShape(issues, "bridge public API", bridgeApi, GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES);
  const bridgeProbe = bridgeApi.runBalanceBatch("recommended");
  if (bridgeProbe !== "bridge:runBalanceBatch:recommended") {
    issues.push("bridge public API did not forward runBalanceBatch correctly");
  }

  const runtimeApi = publicApiModule.createGameCoreRuntimePublicApi(
    () => createSampleCallableSource(GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES, "runtime"),
  );
  verifyForwarderShape(issues, "runtime public API", runtimeApi, GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES);
  const runtimeProbe = runtimeApi.getGameViewSnapshot("now");
  if (runtimeProbe !== "runtime:getGameViewSnapshot:now") {
    issues.push("runtime public API did not forward getGameViewSnapshot correctly");
  }

  pushListIssue(
    issues,
    "missing bridge facade methods",
    findMissingCallableNames(bridgeFacadeModule, GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "unexpected bridge facade exports",
    findUnexpectedKeys(bridgeFacadeModule, GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "missing runtime facade methods",
    findMissingCallableNames(runtimeFacadeModule, GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "unexpected runtime facade exports",
    findUnexpectedKeys(runtimeFacadeModule, GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "missing stable entry methods",
    findMissingCallableNames(
      publicEntryModule,
      [...GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES, ...GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES],
    ),
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing public facade snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden public facade patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_PUBLIC_FACADE_POLICY.owner,
      factories: GAME_CORE_PUBLIC_API_FACTORY_NAMES.length,
      aliases: GAME_CORE_PUBLIC_API_ALIAS_NAMES.length,
      bridgeMethods: GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES.length,
      runtimeMethods: GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCorePublicFacadeVerification(result) {
  if (result.ok) {
    return [
      "gameCore public facade verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- aliases: ${result.counts.aliases}`,
      `- bridge methods: ${result.counts.bridgeMethods}`,
      `- runtime methods: ${result.counts.runtimeMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore public facade verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCorePublicFacades(ctx) {
  const result = verifyGameCorePublicFacades(ctx);
  if (!result.ok) {
    throw new Error(formatGameCorePublicFacadeVerification(result));
  }
  return result;
}
