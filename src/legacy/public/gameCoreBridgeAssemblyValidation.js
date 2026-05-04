import {
  createGameCoreBridgeApiBundleShape,
  createGameCoreBridgePublicSurfaceShape,
} from "../deps/gameCoreBridgeAssemblyDefinitions.js";
import { createGameCoreBridgeApiBundle } from "../bridge/gameCoreBridgeApiBundle.js";
import { createGameCoreBridgePublicShape } from "../bridge/gameCoreBridgePublicShape.js";
import { createGameCoreBridge } from "../gameCoreBridge.js";
import { GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS } from "./gameCorePublicContract.js";
import {
  GAME_CORE_BRIDGE_ASSEMBLY_POLICY,
  GAME_CORE_BRIDGE_ASSEMBLY_FACTORY_NAMES,
  GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES,
  GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES,
  GAME_CORE_BRIDGE_PUBLIC_METHOD_KEY_NAMES,
} from "./gameCoreBridgeAssemblyContract.js";

const FACTORY_MAP = Object.freeze({
  createGameCoreBridgeApiBundleShape,
  createGameCoreBridgePublicSurfaceShape,
  createGameCoreBridge,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/bridge/gameCoreBridgeApiBundle.js",
    requiredSnippets: Object.freeze([
      "createGameCoreBridgeApiBundleShape",
      "return createGameCoreBridgeApiBundleShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*render,\s*progressApi,/s,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/bridge/gameCoreBridgePublicShape.js",
    requiredSnippets: Object.freeze([
      "createGameCoreBridgePublicSurfaceShape",
      "return createGameCoreBridgePublicSurfaceShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*render,\s*generateYearEndReport,/s,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/gameCoreBridge.js",
    requiredSnippets: Object.freeze([
      "createGameCoreBridgeDependencies(dependencies)",
      "createGameCoreBridgeApiBundle({",
      "return createGameCoreBridgePublicShape(bundle)",
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

function createSampleCallableSource(keys, label) {
  return keys.reduce((acc, key) => {
    acc[key] = (...args) => ({ key, label, args });
    return acc;
  }, {});
}

function verifyCreatedShape(issues, label, createdShape, requiredKeys) {
  const missingKeys = requiredKeys.filter((key) => !(key in createdShape));
  const unexpectedKeys = Object.keys(createdShape)
    .filter((key) => !requiredKeys.includes(key))
    .sort();
  pushListIssue(issues, `missing keys for ${label}`, missingKeys);
  pushListIssue(issues, `unexpected keys for ${label}`, unexpectedKeys);
  if (!Object.isFrozen(createdShape)) {
    issues.push(`${label} is not frozen`);
  }
}

function createBridgeSourceMethods(sourceKey) {
  const groupNames = Object.entries(GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS)
    .filter(([groupName]) => {
      if (sourceKey === "simulationApi") return groupName === "simulation";
      if (sourceKey === "reactApi") {
        return ["title", "onboarding", "dashboard", "event", "budget"].includes(groupName);
      }
      return ["report", "result"].includes(groupName);
    })
    .flatMap(([, methodNames]) => methodNames);

  return createSampleCallableSource(groupNames, sourceKey);
}

function createFakeBridgeDependencies() {
  return {
    createGameCoreReactApi: () => createBridgeSourceMethods("reactApi"),
    createGameCoreProgressApi: () => ({
      currentDramaProfile: () => ({ tension: 0.25 }),
      getMostVolatileRegion: () => ({ areaId: "central", score: 0.2 }),
      applyBudgetPlan: () => ({ ok: true }),
      getBudgetTotal: () => 100,
      applyBudgetPreset: () => ({ ok: true }),
      detectActiveBudgetPreset: () => ({ key: "balanced", label: "Balanced" }),
      recommendBudgetPreset: () => ({ key: "balanced", label: "Balanced" }),
      autoBalanceBudget: () => ({ ok: true }),
      adjustBudget: () => ({ ok: true }),
      setBudgetValue: () => ({ ok: true }),
      applyEventChoice: () => ({ ok: true }),
      advanceMonth: () => ({ ok: true }),
      balanceChoiceScore: () => 0.5,
    }),
    createGameCoreReportApi: () => ({
      ...createBridgeSourceMethods("reportApi"),
      generateYearEndReport: () => [{ id: "report-1" }],
      buildYearCausalSummary: () => ({ summary: "ok" }),
      buildResultReviewData: () => ({ review: "ok" }),
    }),
    createGameCoreSimulationApi: () => createBridgeSourceMethods("simulationApi"),
    createGameCoreUiHelpers: () => ({
      setScreen: () => {},
      render: () => ({ rendered: true }),
      phaseLabel: () => "report",
      buildSummaryMessage: () => "summary",
      phaseActionText: () => "next",
      pickStripComment: () => "comment",
      labelEventKind: () => "event",
    }),
  };
}

function createSampleBridgeContext() {
  let state = {
    screen: "title",
    year: 1,
    phase: "report",
  };

  return {
    getState: () => state,
    setState: (nextState) => {
      state = nextState;
    },
    getAppRoot: () => null,
    setHasCompletedOnboarding: () => {},
    emitGameViewChange: () => {},
    alertUser: () => {},
    clone: (value) => value,
    clamp: (value) => value,
    formatMoney: (value) => String(value),
    getMetricColor: () => "neutral",
    conditionToStatus: () => ({ tone: "neutral" }),
    statusInfo: () => ({ label: "ok" }),
    getWorstInfrastructure: () => ({
      name: "Bridge A",
      condition: 55,
      importance: 60,
      burden: 20,
      area: "central",
    }),
    summarizeBudgetAllocation: () => ({ summary: "balanced" }),
    summarizeEffectSignals: () => ({ summary: "steady" }),
    eventImpactScore: () => 0.4,
    averageRegionalValue: () => 0.5,
    areaInfrastructureStats: () => ({ bridge: 1, road: 1 }),
    areaName: (areaId) => areaId,
    monthLabel: (month) => `M${month}`,
    getInfrastructureById: () => null,
    getDeconstructionProjectByTarget: () => null,
    deconstructionStatusLabel: () => "active",
    describeDeconstructionProject: () => "project",
    buildInitialState: () => ({
      screen: "title",
      year: 1,
      phase: "report",
      reportEntries: [],
      selectedReportId: null,
      budgetAllocation: {},
    }),
    monthlyEventPool: () => [],
    resetGame: () => {},
  };
}

export function verifyGameCoreBridgeAssembly({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing bridge assembly factories",
    findMissingCallableNames(FACTORY_MAP, GAME_CORE_BRIDGE_ASSEMBLY_FACTORY_NAMES),
  );

  verifyCreatedShape(
    issues,
    "bridge api bundle shape",
    createGameCoreBridgeApiBundleShape(
      createSampleCallableSource(GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES, "bundle"),
    ),
    GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES,
  );

  verifyCreatedShape(
    issues,
    "bridge public surface shape",
    createGameCoreBridgePublicSurfaceShape(
      createSampleCallableSource(GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES, "public"),
    ),
    GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES,
  );

  const dependencies = createFakeBridgeDependencies();
  const bridgeContext = createSampleBridgeContext();

  const bundle = createGameCoreBridgeApiBundle({
    deps: dependencies,
    ...bridgeContext,
  });
  verifyCreatedShape(
    issues,
    "bridge api bundle",
    bundle,
    GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES,
  );
  pushListIssue(
    issues,
    "missing public bridge methods on api bundle react/report/simulation apis",
    GAME_CORE_BRIDGE_PUBLIC_METHOD_KEY_NAMES.filter((methodName) => {
      if (typeof bundle.simulationApi?.[methodName] === "function") return false;
      if (typeof bundle.reactApi?.[methodName] === "function") return false;
      if (typeof bundle.reportApi?.[methodName] === "function") return false;
      return true;
    }),
  );

  const publicShape = createGameCoreBridgePublicShape(bundle);
  verifyCreatedShape(
    issues,
    "bridge public shape",
    publicShape,
    GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES,
  );

  const bridge = createGameCoreBridge({
    dependencies,
    ...createSampleBridgeContext(),
  });
  verifyCreatedShape(
    issues,
    "bridge assembly",
    bridge,
    GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES,
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing bridge assembly snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden bridge assembly patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_BRIDGE_ASSEMBLY_POLICY.owner,
      factories: GAME_CORE_BRIDGE_ASSEMBLY_FACTORY_NAMES.length,
      bundleKeys: GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES.length,
      publicShapeKeys: GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES.length,
      publicMethods: GAME_CORE_BRIDGE_PUBLIC_METHOD_KEY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreBridgeAssemblyVerification(result) {
  if (result.ok) {
    return [
      "gameCore bridge assembly verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- bundle keys: ${result.counts.bundleKeys}`,
      `- public shape keys: ${result.counts.publicShapeKeys}`,
      `- public methods: ${result.counts.publicMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore bridge assembly verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreBridgeAssembly(ctx) {
  const result = verifyGameCoreBridgeAssembly(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreBridgeAssemblyVerification(result));
  }
  return result;
}
