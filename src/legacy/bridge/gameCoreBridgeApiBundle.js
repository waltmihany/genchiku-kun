import { createGameCoreScreenTransitions } from "../gameCoreScreenTransitions.js";
import {
  createGameCoreProgressApiContext,
  createGameCoreUiHelpersContext,
  createGameCoreReactApiContext,
  createGameCoreReportApiContext,
  createGameCoreSimulationApiContext,
} from "../deps/gameCoreBridgeBundleContextDefinitions.js";
import { createGameCoreBridgeApiBundleShape } from "../deps/gameCoreBridgeAssemblyDefinitions.js";

export function createGameCoreBridgeApiBundle(ctx) {
  const {
    deps,
    getState,
    setState,
    getAppRoot,
    setHasCompletedOnboarding,
    emitGameViewChange,
    alertUser,
    clone,
    clamp,
    formatMoney,
    getMetricColor,
    conditionToStatus,
    statusInfo,
    getWorstInfrastructure,
    summarizeBudgetAllocation,
    summarizeEffectSignals,
    eventImpactScore,
    averageRegionalValue,
    areaInfrastructureStats,
    areaName,
    monthLabel,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    deconstructionStatusLabel,
    describeDeconstructionProject,
    buildInitialState,
    monthlyEventPool,
    resetGame,
  } = ctx;

  const {
    createGameCoreReactApi,
    createGameCoreProgressApi,
    createGameCoreReportApi,
    createGameCoreSimulationApi,
    createGameCoreUiHelpers,
  } = deps;

  const gameState = new Proxy({}, {
    get(_target, prop) {
      return getState()?.[prop];
    },
    set(_target, prop, value) {
      const state = getState();
      if (!state) return false;
      state[prop] = value;
      return true;
    },
  });

  let uiApi = null;
  let reportApi = null;

  function setScreen(...args) {
    return uiApi?.setScreen(...args);
  }

  function render(...args) {
    return uiApi?.render(...args);
  }

  const screenTransitions = createGameCoreScreenTransitions({
    gameState,
    setScreen,
    render,
    resetGame,
  });

  const progressApi = createGameCoreProgressApi(createGameCoreProgressApiContext({
    getState,
    alertUser,
    clone,
    clamp,
    formatMoney,
    conditionToStatus,
    areaInfrastructureStats,
    getWorstInfrastructure,
    areaName,
    monthLabel,
    averageRegionalValue,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    summarizeBudgetAllocation,
    summarizeEffectSignals,
    eventImpactScore,
    render,
    screenTransitions,
    monthlyEventPool,
    buildYearCausalSummary: (...args) => reportApi.buildYearCausalSummary(...args),
    generateYearEndReport: (...args) => reportApi.generateYearEndReport(...args),
  }));

  const currentDramaProfile = (...args) => progressApi.currentDramaProfile(...args);
  const getMostVolatileRegion = (...args) => progressApi.getMostVolatileRegion(...args);
  const applyBudgetPlan = (...args) => progressApi.applyBudgetPlan(...args);
  const getBudgetTotal = (...args) => progressApi.getBudgetTotal(...args);
  const applyBudgetPreset = (...args) => progressApi.applyBudgetPreset(...args);
  const detectActiveBudgetPreset = (...args) => progressApi.detectActiveBudgetPreset(...args);
  const recommendBudgetPreset = (...args) => progressApi.recommendBudgetPreset(...args);
  const autoBalanceBudget = (...args) => progressApi.autoBalanceBudget(...args);
  const adjustBudget = (...args) => progressApi.adjustBudget(...args);
  const setBudgetValue = (...args) => progressApi.setBudgetValue(...args);
  const applyEventChoice = (...args) => progressApi.applyEventChoice(...args);
  const advanceMonth = (...args) => progressApi.advanceMonth(...args);
  const balanceChoiceScore = (...args) => progressApi.balanceChoiceScore(...args);

  uiApi = createGameCoreUiHelpers(createGameCoreUiHelpersContext({
    getState,
    getAppRoot,
    setHasCompletedOnboarding,
    emitGameViewChange,
    getMetricColor,
    areaInfrastructureStats,
    areaName,
    monthLabel,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    deconstructionStatusLabel,
    describeDeconstructionProject,
    conditionToStatus,
    statusInfo,
    getWorstInfrastructure,
    currentDramaProfile,
    getMostVolatileRegion,
    advanceMonth,
  }));

  const phaseLabel = (...args) => uiApi.phaseLabel(...args);
  const buildSummaryMessage = (...args) => uiApi.buildSummaryMessage(...args);
  const phaseActionText = (...args) => uiApi.phaseActionText(...args);
  const pickStripComment = (...args) => uiApi.pickStripComment(...args);
  const labelEventKind = (...args) => uiApi.labelEventKind(...args);

  const reactApi = createGameCoreReactApi(createGameCoreReactApiContext({
    getState,
    getMetricColor,
    areaInfrastructureStats,
    areaName,
    describeDeconstructionProject,
    monthLabel,
    deconstructionStatusLabel,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    conditionToStatus,
    statusInfo,
    pickStripComment,
    currentDramaProfile,
    getWorstInfrastructure,
    getMostVolatileRegion,
    phaseLabel,
    formatMoney,
    buildSummaryMessage,
    phaseActionText,
    screenTransitions,
    advanceMonth,
    labelEventKind,
    balanceChoiceScore,
    applyEventChoice,
    getBudgetTotal,
    detectActiveBudgetPreset,
    recommendBudgetPreset,
    applyBudgetPreset,
    autoBalanceBudget,
    applyBudgetPlan,
    adjustBudget,
    setBudgetValue,
    setHasCompletedOnboarding,
    render,
  }));

  reportApi = createGameCoreReportApi(createGameCoreReportApiContext({
    getState,
    clamp,
    formatMoney,
    areaName,
    getWorstInfrastructure,
    currentDramaProfile,
    summarizeBudgetAllocation,
    render,
    screenTransitions,
  }));

  const generateYearEndReport = (...args) => reportApi.generateYearEndReport(...args);
  const buildYearCausalSummary = (...args) => reportApi.buildYearCausalSummary(...args);
  const buildResultReviewData = (...args) => reportApi.buildResultReviewData(...args);

  const simulationApi = createGameCoreSimulationApi(createGameCoreSimulationApiContext({
    getState,
    setState,
    clone,
    buildInitialState,
    generateYearEndReport,
    recommendBudgetPreset,
    applyBudgetPlan,
    applyEventChoice,
    advanceMonth,
    balanceChoiceScore,
  }));

  return createGameCoreBridgeApiBundleShape({
    render,
    progressApi,
    uiApi,
    reactApi,
    reportApi,
    simulationApi,
    generateYearEndReport,
    buildYearCausalSummary,
    buildResultReviewData,
  });
}
