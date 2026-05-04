import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./gameCorePublicContract.js";

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

function findUnexpectedExportNames(source, expectedNames, allowedExtraNames = []) {
  const expected = new Set([...expectedNames, ...allowedExtraNames]);
  return Object.keys(source)
    .filter((name) => !expected.has(name))
    .sort();
}

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

export function verifyGameCorePublicLayer({
  bridge,
  publicApi,
  runtimeInstance,
  publicEntryModule,
  bridgeFacadeModule,
  runtimeFacadeModule,
}) {
  const bridgeNames = [...GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES];
  const runtimeNames = [...GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES];
  const publicNames = [...runtimeNames, ...bridgeNames];
  const issues = [];

  pushListIssue(issues, "duplicate bridge contract names", findDuplicateNames(bridgeNames));
  pushListIssue(issues, "duplicate runtime contract names", findDuplicateNames(runtimeNames));
  pushListIssue(
    issues,
    "bridge/runtime contract overlap",
    bridgeNames.filter((name) => runtimeNames.includes(name)).sort(),
  );
  pushListIssue(
    issues,
    "missing bridge methods on bridge public shape",
    findMissingCallableNames(bridge, bridgeNames),
  );
  pushListIssue(
    issues,
    "missing bridge methods on public API adapter",
    findMissingCallableNames(publicApi, bridgeNames),
  );
  pushListIssue(
    issues,
    "missing runtime methods on runtime instance",
    findMissingCallableNames(runtimeInstance, runtimeNames),
  );
  pushListIssue(
    issues,
    "missing bridge methods on bridge facade module",
    findMissingCallableNames(bridgeFacadeModule, bridgeNames),
  );
  pushListIssue(
    issues,
    "missing runtime methods on runtime facade module",
    findMissingCallableNames(runtimeFacadeModule, runtimeNames),
  );
  pushListIssue(
    issues,
    "missing public methods on stable entry module",
    findMissingCallableNames(publicEntryModule, publicNames),
  );
  pushListIssue(
    issues,
    "unexpected public API adapter exports",
    findUnexpectedExportNames(publicApi, bridgeNames),
  );
  pushListIssue(
    issues,
    "unexpected bridge facade exports",
    findUnexpectedExportNames(bridgeFacadeModule, bridgeNames),
  );
  pushListIssue(
    issues,
    "unexpected runtime facade exports",
    findUnexpectedExportNames(runtimeFacadeModule, runtimeNames),
  );
  pushListIssue(
    issues,
    "unexpected stable entry exports",
    findUnexpectedExportNames(publicEntryModule, uniqueList(publicNames)),
  );

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      bridge: bridgeNames.length,
      runtime: runtimeNames.length,
      public: uniqueList(publicNames).length,
    },
  };
}

export function formatGameCorePublicLayerVerification(result) {
  if (result.ok) {
    return [
      "gameCore public layer verification: OK",
      `- bridge methods: ${result.counts.bridge}`,
      `- runtime methods: ${result.counts.runtime}`,
      `- stable entry methods: ${result.counts.public}`,
    ].join("\n");
  }

  return [
    "gameCore public layer verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCorePublicLayer(ctx) {
  const result = verifyGameCorePublicLayer(ctx);
  if (!result.ok) {
    throw new Error(formatGameCorePublicLayerVerification(result));
  }
  return result;
}
