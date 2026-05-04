import {
  GAME_CORE_REACT_APP_BOUND_METHOD_NAMES,
  GAME_CORE_REACT_OVERLAY_SPECS,
  GAME_CORE_REACT_RUNTIME_METHOD_NAMES,
  GAME_CORE_REACT_RUNTIME_SPEC,
  GAME_CORE_REACT_SCREEN_ACTION_METHOD_NAMES,
  GAME_CORE_REACT_SCREEN_KEYS,
  GAME_CORE_REACT_SCREEN_SPECS,
  GAME_CORE_REACT_SCREEN_VIEW_MODEL_METHOD_NAMES,
  isGameCoreReactBridgeMethod,
  isGameCoreReactRuntimeMethod,
} from "./gameCoreReactScreenContract.js";

function uniqueList(values) {
  return [...new Set(values)];
}

function findDuplicateNames(values) {
  const counts = new Map();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value)
    .sort();
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

export function verifyGameCoreReactScreenBindings({
  publicEntryModule,
  gameScreenExportNames,
}) {
  const issues = [];
  const runtimeActionMethodNames = Object.values(GAME_CORE_REACT_RUNTIME_SPEC.topbarActionMethodNames);
  const componentNames = [
    ...GAME_CORE_REACT_SCREEN_SPECS.map((spec) => spec.componentName),
    ...GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.componentName),
  ];
  const missingComponents = uniqueList(componentNames)
    .filter((name) => !gameScreenExportNames.includes(name))
    .sort();

  pushListIssue(issues, "duplicate screen keys", findDuplicateNames(GAME_CORE_REACT_SCREEN_KEYS));
  pushListIssue(issues, "duplicate screen components", findDuplicateNames(componentNames));
  pushListIssue(
    issues,
    "screen view-model methods not in bridge contract",
    GAME_CORE_REACT_SCREEN_VIEW_MODEL_METHOD_NAMES
      .filter((name) => !isGameCoreReactBridgeMethod(name))
      .sort(),
  );
  pushListIssue(
    issues,
    "screen action methods not in bridge contract",
    GAME_CORE_REACT_SCREEN_ACTION_METHOD_NAMES
      .filter((name) => !isGameCoreReactBridgeMethod(name))
      .sort(),
  );
  pushListIssue(
    issues,
    "runtime methods not in runtime contract",
    GAME_CORE_REACT_RUNTIME_METHOD_NAMES
      .filter((name) => !isGameCoreReactRuntimeMethod(name))
      .sort(),
  );
  pushListIssue(
    issues,
    "topbar action methods not in bridge contract",
    runtimeActionMethodNames
      .filter((name) => !isGameCoreReactBridgeMethod(name))
      .sort(),
  );
  pushListIssue(
    issues,
    "missing app-bound methods on stable entry module",
    findMissingCallableNames(publicEntryModule, GAME_CORE_REACT_APP_BOUND_METHOD_NAMES),
  );
  pushListIssue(issues, "missing exported React screen shells", missingComponents);

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      screens: GAME_CORE_REACT_SCREEN_KEYS.length,
      overlays: GAME_CORE_REACT_OVERLAY_SPECS.length,
      viewModels: GAME_CORE_REACT_SCREEN_VIEW_MODEL_METHOD_NAMES.length,
      actions: uniqueList([
        ...GAME_CORE_REACT_SCREEN_ACTION_METHOD_NAMES,
        ...runtimeActionMethodNames,
      ]).length,
      runtime: GAME_CORE_REACT_RUNTIME_METHOD_NAMES.length,
      appBound: GAME_CORE_REACT_APP_BOUND_METHOD_NAMES.length,
    },
  };
}

export function formatGameCoreReactScreenVerification(result) {
  if (result.ok) {
    return [
      "gameCore React screen binding verification: OK",
      `- managed screens: ${result.counts.screens}`,
      `- overlays: ${result.counts.overlays}`,
      `- view-model methods: ${result.counts.viewModels}`,
      `- action methods: ${result.counts.actions}`,
      `- runtime methods: ${result.counts.runtime}`,
      `- app-bound methods: ${result.counts.appBound}`,
    ].join("\n");
  }

  return [
    "gameCore React screen binding verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreReactScreenBindings(ctx) {
  const result = verifyGameCoreReactScreenBindings(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreReactScreenVerification(result));
  }
  return result;
}
