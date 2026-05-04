import { createGameCoreRuntimeBridgeContextValue } from "../deps/gameCoreRuntimeBridgeContextDefinitions.js";

export function createGameCoreRuntimeBridgeContext(ctx) {
  const {
    deps,
    store,
    alertUser,
  } = ctx;

  const {
    averageRegionalValue,
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
    buildInitialGameState,
    resolveAreaName,
    resolveAreaInfrastructureStats,
    monthLabelFromState,
    getInfrastructureByIdFromState,
    getDeconstructionProjectByTargetFromState,
    deconstructionStatusLabelFromState,
    deconstructionModeLabelFromState,
    describeDeconstructionProjectFromState,
    createMonthlyEventPool,
  } = deps;

  function buildInitialState() {
    return buildInitialGameState({
      hasCompletedOnboarding: store.getHasCompletedOnboarding(),
      clone,
      averageRegionalValue,
    });
  }

  function areaName(areaId) {
    return resolveAreaName(store.getState(), areaId);
  }

  function areaInfrastructureStats(areaId) {
    return resolveAreaInfrastructureStats(store.getState(), areaId);
  }

  function monthLabel(monthIndex) {
    return monthLabelFromState(monthIndex);
  }

  function getInfrastructureById(itemId) {
    return getInfrastructureByIdFromState(store.getState(), itemId);
  }

  function getDeconstructionProjectByTarget(targetId) {
    return getDeconstructionProjectByTargetFromState(store.getState(), targetId);
  }

  function deconstructionStatusLabel(status) {
    return deconstructionStatusLabelFromState(status);
  }

  function deconstructionModeLabel(mode) {
    return deconstructionModeLabelFromState(mode);
  }

  function describeDeconstructionProject(project) {
    return describeDeconstructionProjectFromState(store.getState(), project, {
      formatMoney,
      areaName,
      getInfrastructureById,
      deconstructionModeLabel,
    });
  }

  function summarizeEffectSignalsForRuntime(effect = {}) {
    return summarizeEffectSignals(effect, areaName);
  }

  const monthlyEventPool = createMonthlyEventPool({ getWorstInfrastructure, getInfrastructureById });

  return createGameCoreRuntimeBridgeContextValue({
    alertUser,
    clone,
    clamp,
    formatMoney,
    getMetricColor,
    conditionToStatus,
    statusInfo,
    getWorstInfrastructure,
    summarizeBudgetAllocation,
    summarizeEffectSignals: summarizeEffectSignalsForRuntime,
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
    getState: store.getState,
    setState: store.setState,
    getAppRoot: store.getAppRoot,
    setHasCompletedOnboarding: store.setHasCompletedOnboarding,
    emitGameViewChange: store.emitGameViewChange,
  });
}
