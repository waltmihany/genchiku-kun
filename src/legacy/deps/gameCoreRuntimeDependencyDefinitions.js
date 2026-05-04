import { createMonthlyEventPool } from "../../data/monthlyEventPool.js";
import {
  averageRegionalValue,
  clone,
  clamp,
  formatMoney,
  getMetricColor,
  conditionToStatus,
  statusInfo,
  getWorstInfrastructure,
  summarizeBudgetAllocation,
  summarizeEffectSignals as summarizeEffectSignalsUtil,
  eventImpactScore,
} from "../utils/gameCoreUtils.js";
import {
  buildInitialState as buildInitialGameState,
  areaName as resolveAreaName,
  areaInfrastructureStats as resolveAreaInfrastructureStats,
  monthLabel as monthLabelFromState,
  getInfrastructureById as getInfrastructureByIdFromState,
  getDeconstructionProjectByTarget as getDeconstructionProjectByTargetFromState,
  deconstructionStatusLabel as deconstructionStatusLabelFromState,
  deconstructionModeLabel as deconstructionModeLabelFromState,
  describeDeconstructionProject as describeDeconstructionProjectFromState,
} from "../state/gameCoreState.js";
import { createGameCoreBridge } from "../gameCoreBridge.js";
import {
  createGameCoreBridgeDependencies,
  defaultGameCoreBridgeDependencies,
} from "./gameCoreBridgeDependencyDefinitions.js";

export const defaultGameCoreRuntimeDependencies = Object.freeze({
  createMonthlyEventPool,
  createGameCoreBridge,
  bridgeDependencies: defaultGameCoreBridgeDependencies,
  averageRegionalValue,
  clone,
  clamp,
  formatMoney,
  getMetricColor,
  conditionToStatus,
  statusInfo,
  getWorstInfrastructure,
  summarizeBudgetAllocation,
  summarizeEffectSignals: summarizeEffectSignalsUtil,
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
});

export function createGameCoreRuntimeDependencies(overrides = {}) {
  return Object.freeze({
    ...defaultGameCoreRuntimeDependencies,
    ...overrides,
    bridgeDependencies: createGameCoreBridgeDependencies(
      overrides.bridgeDependencies || defaultGameCoreRuntimeDependencies.bridgeDependencies,
    ),
  });
}
