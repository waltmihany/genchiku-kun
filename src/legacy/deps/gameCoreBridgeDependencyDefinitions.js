import { createGameCoreReactApi } from "../gameCoreReactApi.js";
import { createGameCoreProgressApi } from "../progress/gameCoreProgressApi.js";
import { createGameCoreReportApi } from "../report/gameCoreReportApi.js";
import { createGameCoreSimulationApi } from "../simulation/gameCoreSimulationApi.js";
import { createGameCoreUiHelpers } from "../gameCoreUiHelpers.js";

export const defaultGameCoreBridgeDependencies = Object.freeze({
  createGameCoreReactApi,
  createGameCoreProgressApi,
  createGameCoreReportApi,
  createGameCoreSimulationApi,
  createGameCoreUiHelpers,
});

export function createGameCoreBridgeDependencies(overrides = {}) {
  return Object.freeze({
    ...defaultGameCoreBridgeDependencies,
    ...overrides,
  });
}
