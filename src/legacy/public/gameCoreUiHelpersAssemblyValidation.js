import {
  createGameCoreMapUiHelpersShape,
  createGameCoreDashboardUiHelpersShape,
  createGameCoreOnboardingUiHelpersShape,
  createGameCoreUiHelpersAssemblyShape,
} from "../deps/gameCoreUiHelpersAssemblyDefinitions.js";
import { createGameCoreUiHelpers } from "../gameCoreUiHelpers.js";
import { createGameCoreMapUiHelpers } from "../uiHelpers/gameCoreMapUiHelpers.js";
import { createGameCoreDashboardUiHelpers } from "../uiHelpers/gameCoreDashboardUiHelpers.js";
import { createGameCoreOnboardingUiHelpers } from "../uiHelpers/gameCoreOnboardingUiHelpers.js";
import {
  GAME_CORE_UI_HELPERS_ASSEMBLY_POLICY,
  GAME_CORE_UI_HELPER_SHAPE_SPECS,
  GAME_CORE_UI_HELPERS_ASSEMBLY_FACTORY_NAMES,
  GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES,
} from "./gameCoreUiHelpersAssemblyContract.js";

const FACTORY_MAP = Object.freeze({
  createGameCoreMapUiHelpersShape,
  createGameCoreDashboardUiHelpersShape,
  createGameCoreOnboardingUiHelpersShape,
  createGameCoreUiHelpersAssemblyShape,
});

const SUB_HELPER_FACTORY_MAP = Object.freeze({
  map: createGameCoreMapUiHelpers,
  dashboard: createGameCoreDashboardUiHelpers,
  onboarding: createGameCoreOnboardingUiHelpers,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/gameCoreUiHelpers.js",
    requiredSnippets: Object.freeze([
      "createGameCoreUiHelpersAssemblyShape",
      "return createGameCoreUiHelpersAssemblyShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*renderRegionGrid:/s,
    ]),
  }),
  ...GAME_CORE_UI_HELPER_SHAPE_SPECS.map((spec) => Object.freeze({
    filePath: spec.modulePath,
    requiredSnippets: Object.freeze([
      spec.factoryName,
      `return ${spec.factoryName}({`,
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*render[A-Z]|return\s+\{\s*completeOnboarding/s,
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

function createSampleUiHelpersCtx() {
  const root = {
    querySelector: (selector) => ({
      selector,
      innerHTML: "",
      addEventListener: () => {},
      insertAdjacentHTML: () => {},
      remove: () => {},
      querySelectorAll: () => [],
    }),
    insertAdjacentHTML: () => {},
  };

  const gameState = {
    screen: "dashboard",
    phase: "report",
    year: 1,
    monthIndex: 0,
    selectedMapTargetId: null,
    indicators: {
      satisfaction: 60,
      safety: 60,
      fiscalHealth: 60,
      futureBurden: 40,
      support: 60,
      rebellion: 20,
    },
    regionalMoods: {
      central: { satisfaction: 60, rebellion: 20 },
      river: { satisfaction: 60, rebellion: 20 },
      mountain: { satisfaction: 60, rebellion: 20 },
      coast: { satisfaction: 60, rebellion: 20 },
      tourism: { satisfaction: 60, rebellion: 20 },
    },
    deconstructionProjects: [],
    infrastructures: [],
    areas: [],
    rivers: [],
    roads: [],
    bridges: [],
    facilities: [],
    onboardingActive: true,
    onboardingSeen: { dashboard: false, report: false, budget: false },
    lastChoiceResult: "",
    reserveFund: 1000,
    annualBudget: 50000,
    remainingBudget: 5000,
  };

  return {
    getState: () => gameState,
    getAppRoot: () => root,
    setHasCompletedOnboarding: () => {},
    emitGameViewChange: () => {},
    getMetricColor: () => "#888",
    areaInfrastructureStats: () => ({ avgCondition: 60, avgBurden: 20, list: [], worst: null }),
    areaName: (areaId) => areaId,
    monthLabel: (month) => `M${month}`,
    getInfrastructureById: () => null,
    getDeconstructionProjectByTarget: () => null,
    deconstructionStatusLabel: () => "進行中",
    describeDeconstructionProject: () => ({ factLine: "fact", scoreLine: "score", riskLine: "risk" }),
    conditionToStatus: () => "safe",
    statusInfo: () => ({ label: "安定", color: "#0a0" }),
    getWorstInfrastructure: () => ({ id: "bridgeA", name: "橋A", area: "central", kind: "bridge", condition: 60, importance: 60, burden: 20, status: "safe" }),
    currentDramaProfile: () => ({ subtitle: "導入期", summaryLead: "summary", actionHint: "hint" }),
    getMostVolatileRegion: () => ({ areaId: "central", satisfaction: 60, rebellion: 20 }),
    advanceMonth: () => {},
  };
}

export function verifyGameCoreUiHelpersAssembly({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing UI helper assembly factories",
    findMissingCallableNames(FACTORY_MAP, GAME_CORE_UI_HELPERS_ASSEMBLY_FACTORY_NAMES),
  );

  GAME_CORE_UI_HELPER_SHAPE_SPECS.forEach((spec) => {
    const shapeFactory = FACTORY_MAP[spec.factoryName];
    verifyCreatedShape(
      issues,
      `${spec.key} UI helper shape factory`,
      shapeFactory(createSampleCallableSource(spec.methodNames)),
      spec.methodNames,
    );
  });

  verifyCreatedShape(
    issues,
    "UI helper assembly shape factory",
    createGameCoreUiHelpersAssemblyShape(
      createSampleCallableSource(GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES),
    ),
    GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES,
  );

  const sampleCtx = createSampleUiHelpersCtx();
  const sampleSubHelperCtx = {
    gameState: sampleCtx.getState(),
    getElement: () => null,
    getAppRoot: sampleCtx.getAppRoot,
    setHasCompletedOnboarding: sampleCtx.setHasCompletedOnboarding,
    render: () => {},
    setScreen: () => {},
    getMetricColor: sampleCtx.getMetricColor,
    areaInfrastructureStats: sampleCtx.areaInfrastructureStats,
    areaName: sampleCtx.areaName,
    monthLabel: sampleCtx.monthLabel,
    deconstructionStatusLabel: sampleCtx.deconstructionStatusLabel,
    describeDeconstructionProject: sampleCtx.describeDeconstructionProject,
    getWorstInfrastructure: sampleCtx.getWorstInfrastructure,
    currentDramaProfile: sampleCtx.currentDramaProfile,
    getMostVolatileRegion: sampleCtx.getMostVolatileRegion,
    advanceMonth: sampleCtx.advanceMonth,
    renderMap: () => {},
    getInfrastructureById: sampleCtx.getInfrastructureById,
    getDeconstructionProjectByTarget: sampleCtx.getDeconstructionProjectByTarget,
    conditionToStatus: sampleCtx.conditionToStatus,
    statusInfo: sampleCtx.statusInfo,
  };

  GAME_CORE_UI_HELPER_SHAPE_SPECS.forEach((spec) => {
    const createdHelper = SUB_HELPER_FACTORY_MAP[spec.key](sampleSubHelperCtx);
    verifyCreatedShape(issues, `${spec.key} UI helper`, createdHelper, spec.methodNames);
  });

  const uiHelpers = createGameCoreUiHelpers(sampleCtx);
  verifyCreatedShape(
    issues,
    "UI helper assembly",
    uiHelpers,
    GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES,
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing UI helper assembly snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden UI helper assembly patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_UI_HELPERS_ASSEMBLY_POLICY.owner,
      factories: GAME_CORE_UI_HELPERS_ASSEMBLY_FACTORY_NAMES.length,
      subHelpers: GAME_CORE_UI_HELPER_SHAPE_SPECS.length,
      assemblyMethods: GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreUiHelpersAssemblyVerification(result) {
  if (result.ok) {
    return [
      "gameCore UI helper assembly verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- sub helpers: ${result.counts.subHelpers}`,
      `- assembly methods: ${result.counts.assemblyMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore UI helper assembly verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreUiHelpersAssembly(ctx) {
  const result = verifyGameCoreUiHelpersAssembly(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreUiHelpersAssemblyVerification(result));
  }
  return result;
}
