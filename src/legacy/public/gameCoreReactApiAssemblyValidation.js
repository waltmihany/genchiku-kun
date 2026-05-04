import {
  createGameCoreTitleReactApiShape,
  createGameCoreOnboardingReactApiShape,
  createGameCoreDashboardReactApiShape,
  createGameCoreEventReactApiShape,
  createGameCoreBudgetReactApiShape,
  createGameCoreReactApiAssemblyShape,
} from "../deps/gameCoreReactApiAssemblyDefinitions.js";
import { createGameCoreReactApi } from "../gameCoreReactApi.js";
import { createGameCoreTitleReactApi } from "../reactApi/gameCoreTitleReactApi.js";
import { createGameCoreOnboardingReactApi } from "../reactApi/gameCoreOnboardingReactApi.js";
import { createGameCoreDashboardReactApi } from "../reactApi/gameCoreDashboardReactApi.js";
import { createGameCoreEventReactApi } from "../reactApi/gameCoreEventReactApi.js";
import { createGameCoreBudgetReactApi } from "../reactApi/gameCoreBudgetReactApi.js";
import {
  GAME_CORE_REACT_API_ASSEMBLY_POLICY,
  GAME_CORE_REACT_API_SHAPE_SPECS,
  GAME_CORE_REACT_API_ASSEMBLY_FACTORY_NAMES,
  GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES,
} from "./gameCoreReactApiAssemblyContract.js";

const FACTORY_MAP = Object.freeze({
  createGameCoreTitleReactApiShape,
  createGameCoreOnboardingReactApiShape,
  createGameCoreDashboardReactApiShape,
  createGameCoreEventReactApiShape,
  createGameCoreBudgetReactApiShape,
  createGameCoreReactApiAssemblyShape,
});

const SUB_API_FACTORY_MAP = Object.freeze({
  title: createGameCoreTitleReactApi,
  onboarding: createGameCoreOnboardingReactApi,
  dashboard: createGameCoreDashboardReactApi,
  event: createGameCoreEventReactApi,
  budget: createGameCoreBudgetReactApi,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCoreReactApi.js",
    requiredSnippets: Object.freeze([
      "createGameCoreReactApiAssemblyShape",
      "return createGameCoreReactApiAssemblyShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*\.\.\.titleApi,/s,
    ]),
  }),
  ...GAME_CORE_REACT_API_SHAPE_SPECS.map((spec) => Object.freeze({
    filePath: spec.modulePath,
    requiredSnippets: Object.freeze([
      spec.factoryName,
      `return ${spec.factoryName}({`,
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*get[A-Z]|return\s+\{\s*run[A-Z]/s,
    ]),
  })),
]);

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

function createSampleReactApiCtx() {
  const gameState = {
    screen: "dashboard",
    phase: "report",
    year: 1,
    monthIndex: 0,
    indicators: {
      satisfaction: 60,
      safety: 60,
      fiscalHealth: 60,
      futureBurden: 40,
      support: 60,
      rebellion: 20,
    },
    remainingBudget: 10000,
    reserveFund: 5000,
    annualBudget: 50000,
    budgetAllocation: {
      bridge: 18,
      road: 16,
      disaster: 16,
      deconstruction: 16,
      outreach: 17,
      reserve: 17,
    },
    infrastructures: [],
    deconstructionProjects: [],
    areas: [],
    rivers: [],
    roads: [],
    bridges: [],
    facilities: [],
    regionalMoods: {
      central: { satisfaction: 60, rebellion: 20 },
      river: { satisfaction: 60, rebellion: 20 },
      mountain: { satisfaction: 60, rebellion: 20 },
      coast: { satisfaction: 60, rebellion: 20 },
      tourism: { satisfaction: 60, rebellion: 20 },
    },
    onboardingActive: true,
    onboardingSeen: { dashboard: false, report: false, budget: false },
  };

  return {
    gameState,
    getState: () => gameState,
    getMetricColor: () => "#888",
    areaInfrastructureStats: () => ({ avgCondition: 60, avgBurden: 20, list: [], worst: null }),
    areaName: (areaId) => areaId,
    describeDeconstructionProject: () => ({ factLine: "fact", scoreLine: "score", riskLine: "risk" }),
    monthLabel: (month) => `M${month}`,
    deconstructionStatusLabel: () => "進行中",
    getInfrastructureById: () => null,
    getDeconstructionProjectByTarget: () => null,
    conditionToStatus: () => "safe",
    statusInfo: () => ({ label: "安定", color: "#0a0" }),
    pickStripComment: () => "comment",
    currentDramaProfile: () => ({ subtitle: "導入期", summaryLead: "summary", actionHint: "hint" }),
    getWorstInfrastructure: () => ({ id: "bridgeA", name: "橋A", area: "central", kind: "bridge", condition: 60, importance: 60, burden: 20, status: "safe" }),
    getMostVolatileRegion: () => ({ areaId: "central", satisfaction: 60, rebellion: 20 }),
    phaseLabel: () => "年度末レポート待ち",
    formatMoney: (value) => String(value),
    buildSummaryMessage: () => "summary",
    phaseActionText: () => "action",
    screenTransitions: {
      showDashboard: () => {},
      restartToTitle: () => {},
      renderCurrentScreen: () => {},
      showReport: () => {},
      showBudget: () => {},
    },
    advanceMonth: () => {},
    labelEventKind: () => "イベント",
    balanceChoiceScore: () => 1,
    applyEventChoice: () => {},
    getBudgetTotal: () => 100,
    detectActiveBudgetPreset: () => "balanced",
    recommendBudgetPreset: () => ({ key: "balanced", reason: "balanced" }),
    applyBudgetPreset: () => {},
    autoBalanceBudget: () => {},
    applyBudgetPlan: () => {},
    adjustBudget: () => {},
    setBudgetValue: () => {},
    setHasCompletedOnboarding: () => {},
    render: () => {},
  };
}

export function verifyGameCoreReactApiAssembly({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing react API assembly factories",
    findMissingCallableNames(FACTORY_MAP, GAME_CORE_REACT_API_ASSEMBLY_FACTORY_NAMES),
  );

  GAME_CORE_REACT_API_SHAPE_SPECS.forEach((spec) => {
    const shapeFactory = FACTORY_MAP[spec.factoryName];
    verifyCreatedShape(
      issues,
      `${spec.key} react api shape factory`,
      shapeFactory(createSampleCallableSource(spec.methodNames)),
      spec.methodNames,
    );
  });

  verifyCreatedShape(
    issues,
    "react api assembly shape factory",
    createGameCoreReactApiAssemblyShape(
      createSampleCallableSource(GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES),
    ),
    GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES,
  );

  const sampleCtx = createSampleReactApiCtx();
  GAME_CORE_REACT_API_SHAPE_SPECS.forEach((spec) => {
    const createdApi = SUB_API_FACTORY_MAP[spec.key](sampleCtx);
    verifyCreatedShape(issues, `${spec.key} react api`, createdApi, spec.methodNames);
  });

  const reactApi = createGameCoreReactApi(sampleCtx);
  verifyCreatedShape(
    issues,
    "react api assembly",
    reactApi,
    GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES,
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing react assembly snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden react assembly patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_REACT_API_ASSEMBLY_POLICY.owner,
      factories: GAME_CORE_REACT_API_ASSEMBLY_FACTORY_NAMES.length,
      subApis: GAME_CORE_REACT_API_SHAPE_SPECS.length,
      assemblyMethods: GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreReactApiAssemblyVerification(result) {
  if (result.ok) {
    return [
      "gameCore React API assembly verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- sub APIs: ${result.counts.subApis}`,
      `- assembly methods: ${result.counts.assemblyMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore React API assembly verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreReactApiAssembly(ctx) {
  const result = verifyGameCoreReactApiAssembly(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreReactApiAssemblyVerification(result));
  }
  return result;
}
