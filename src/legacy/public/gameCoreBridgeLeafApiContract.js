import {
  GAME_CORE_PROGRESS_API_METHOD_NAMES,
  GAME_CORE_REPORT_API_METHOD_NAMES,
  GAME_CORE_SIMULATION_API_METHOD_NAMES,
} from "../deps/gameCoreBridgeLeafApiDefinitions.js";

export const GAME_CORE_BRIDGE_LEAF_API_POLICY = Object.freeze({
  owner: "legacy-game-core",
  placement: "src/legacy/deps/gameCoreBridgeLeafApiDefinitions.js",
});

export const GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS = Object.freeze([
  Object.freeze({
    key: "progress",
    modulePath: "src/legacy/progress/gameCoreProgressApi.js",
    factoryName: "createGameCoreProgressApiShape",
    methodNames: GAME_CORE_PROGRESS_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "report",
    modulePath: "src/legacy/report/gameCoreReportApi.js",
    factoryName: "createGameCoreReportApiShape",
    methodNames: GAME_CORE_REPORT_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "simulation",
    modulePath: "src/legacy/simulation/gameCoreSimulationApi.js",
    factoryName: "createGameCoreSimulationApiShape",
    methodNames: GAME_CORE_SIMULATION_API_METHOD_NAMES,
  }),
]);

export const GAME_CORE_BRIDGE_LEAF_API_FACTORY_NAMES = Object.freeze(
  GAME_CORE_BRIDGE_LEAF_API_SHAPE_SPECS.map((spec) => spec.factoryName),
);
