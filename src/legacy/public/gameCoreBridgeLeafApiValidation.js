import {
  createGameCoreProgressApiShape,
  createGameCoreReportApiShape,
  createGameCoreSimulationApiShape,
} from "../deps/gameCoreBridgeLeafApiDefinitions.js";
import { createGameCoreProgressApi } from "../progress/gameCoreProgressApi.js";
import { createGameCoreReportApi } from "../report/gameCoreReportApi.js";
import { createGameCoreSimulationApi } from "../simulation/gameCoreSimulationApi.js";
import {
  GAME_CORE_BRIDGE_LEAF_API_POLICY,
  GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS,
  GAME_CORE_BRIDGE_LEAF_API_FACTORY_NAMES,
} from "./gameCoreBridgeLeafApiContract.js";

const FACTORY_MAP = Object.freeze({
  createGameCoreProgressApiShape,
  createGameCoreReportApiShape,
  createGameCoreSimulationApiShape,
});

const API_FACTORY_MAP = Object.freeze({
  progress: createGameCoreProgressApi,
  report: createGameCoreReportApi,
  simulation: createGameCoreSimulationApi,
});

const SOURCE_RULES = Object.freeze(
  GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS.map((spec) => Object.freeze({
    filePath: spec.modulePath,
    requiredSnippets: Object.freeze([
      spec.factoryName,
      `return ${spec.factoryName}({`,
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*currentDramaProfile|return\s+\{\s*buildYearCausalSummary|return\s+\{\s*runSingleAutoSimulation/s,
    ]),
  })),
);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function createSampleCallableSource(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = () => key;
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

function createSampleBridgeLeafApiCtx() {
  let state = {
    year: 1,
    monthIndex: 0,
    phase: "report",
    screen: "dashboard",
    indicators: {
      satisfaction: 60,
      safety: 60,
      fiscalHealth: 60,
      futureBurden: 40,
      support: 60,
      rebellion: 20,
    },
    remainingBudget: 5000,
    reserveFund: 1000,
    annualBudget: 50000,
    budgetAllocation: {
      bridge: 18,
      road: 16,
      disaster: 16,
      deconstruction: 16,
      outreach: 17,
      reserve: 17,
    },
    regionalMoods: {
      central: { satisfaction: 60, rebellion: 20 },
      river: { satisfaction: 60, rebellion: 20 },
      mountain: { satisfaction: 60, rebellion: 20 },
      coast: { satisfaction: 60, rebellion: 20 },
      tourism: { satisfaction: 60, rebellion: 20 },
    },
    infrastructures: [],
    deconstructionProjects: [],
    currentYearEvents: [],
    reportEntries: [],
    selectedReportId: null,
    pendingEvent: null,
    log: [],
    deconstructionHistory: [],
  };

  return {
    getState: () => state,
    setState: (nextState) => {
      state = nextState;
    },
    alertUser: () => {},
    clone: (value) => value,
    clamp: (value) => value,
    formatMoney: (value) => String(value),
    conditionToStatus: () => "safe",
    areaInfrastructureStats: () => ({ avgCondition: 60, avgBurden: 20, list: [], worst: null }),
    getWorstInfrastructure: () => ({ id: "bridgeA", name: "橋A", area: "central", kind: "bridge", condition: 60, importance: 60, burden: 20, status: "safe" }),
    areaName: (areaId) => areaId,
    monthLabel: (month) => `M${month}`,
    averageRegionalValue: () => 60,
    getInfrastructureById: () => null,
    getDeconstructionProjectByTarget: () => null,
    summarizeBudgetAllocation: () => [],
    summarizeEffectSignals: () => [],
    eventImpactScore: () => 1,
    render: () => {},
    screenTransitions: {
      showGameOver: () => {},
      showReport: () => {},
      showBudget: () => {},
      showDashboard: () => {},
      showClear: () => {},
      restartToDashboard: () => {},
    },
    monthlyEventPool: () => [],
    buildYearCausalSummary: () => ({ budgetFocus: [], eventHighlights: [], outcomeSignals: [], carryovers: [] }),
    generateYearEndReport: () => [],
    currentDramaProfile: () => ({ subtitle: "導入期", summaryLead: "summary", actionHint: "hint" }),
    recommendBudgetPreset: () => ({ key: "balanced", reason: "balanced" }),
    applyBudgetPlan: () => {},
    applyEventChoice: () => {},
    advanceMonth: () => {},
    balanceChoiceScore: () => 1,
  };
}

export function verifyGameCoreBridgeLeafApis({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing bridge leaf API factories",
    findMissingCallableNames(FACTORY_MAP, GAME_CORE_BRIDGE_LEAF_API_FACTORY_NAMES),
  );

  GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS.forEach((spec) => {
    const shapeFactory = FACTORY_MAP[spec.factoryName];
    verifyCreatedShape(
      issues,
      `${spec.key} API shape factory`,
      shapeFactory(createSampleCallableSource(spec.methodNames)),
      spec.methodNames,
    );
  });

  const sampleCtx = createSampleBridgeLeafApiCtx();
  GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS.forEach((spec) => {
    const api = API_FACTORY_MAP[spec.key](sampleCtx);
    verifyCreatedShape(issues, `${spec.key} API`, api, spec.methodNames);
  });

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing bridge leaf API snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden bridge leaf API patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_BRIDGE_LEAF_API_POLICY.owner,
      factories: GAME_CORE_BRIDGE_LEAF_API_FACTORY_NAMES.length,
      apiSurfaces: GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS.length,
      methodCounts: GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS
        .map((spec) => `${spec.key}:${spec.methodNames.length}`)
        .join(", "),
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreBridgeLeafApiVerification(result) {
  if (result.ok) {
    return [
      "gameCore bridge leaf API verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- API surfaces: ${result.counts.apiSurfaces}`,
      `- method counts: ${result.counts.methodCounts}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore bridge leaf API verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreBridgeLeafApis(ctx) {
  const result = verifyGameCoreBridgeLeafApis(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreBridgeLeafApiVerification(result));
  }
  return result;
}
