import {
  defaultGameCoreBridgeDependencies,
} from "../deps/gameCoreBridgeDependencyDefinitions.js";
import {
  defaultGameCoreRuntimeDependencies,
} from "../deps/gameCoreRuntimeDependencyDefinitions.js";
import {
  GAME_CORE_PROGRESS_API_CONTEXT_KEYS,
  GAME_CORE_UI_HELPERS_CONTEXT_KEYS,
  GAME_CORE_REACT_API_CONTEXT_KEYS,
  GAME_CORE_REPORT_API_CONTEXT_KEYS,
  GAME_CORE_SIMULATION_API_CONTEXT_KEYS,
} from "../deps/gameCoreBridgeBundleContextDefinitions.js";

function uniqueList(values) {
  return [...new Set(values)];
}

export const GAME_CORE_DEPENDENCY_POLICY = Object.freeze({
  owner: "legacy-game-core",
  placement: "src/legacy/deps",
  bridgeBundleModule: "src/legacy/bridge/gameCoreBridgeApiBundle.js",
  bridgeDependencyModule: "src/legacy/deps/gameCoreBridgeDependencyDefinitions.js",
  runtimeDependencyModule: "src/legacy/deps/gameCoreRuntimeDependencyDefinitions.js",
});

export const GAME_CORE_BRIDGE_DEPENDENCY_CREATOR_NAMES = Object.freeze(
  Object.keys(defaultGameCoreBridgeDependencies).sort(),
);

export const GAME_CORE_RUNTIME_DEPENDENCY_NAMES = Object.freeze(
  Object.keys(defaultGameCoreRuntimeDependencies).sort(),
);

export const GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS = Object.freeze([
  Object.freeze({
    key: "progressApi",
    createMethodName: "createGameCoreProgressApiContext",
    requiredContextKeys: GAME_CORE_PROGRESS_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "uiHelpers",
    createMethodName: "createGameCoreUiHelpersContext",
    requiredContextKeys: GAME_CORE_UI_HELPERS_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "reactApi",
    createMethodName: "createGameCoreReactApiContext",
    requiredContextKeys: GAME_CORE_REACT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "reportApi",
    createMethodName: "createGameCoreReportApiContext",
    requiredContextKeys: GAME_CORE_REPORT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "simulationApi",
    createMethodName: "createGameCoreSimulationApiContext",
    requiredContextKeys: GAME_CORE_SIMULATION_API_CONTEXT_KEYS,
  }),
]);

export const GAME_CORE_BRIDGE_BUNDLE_CONTEXT_FACTORY_NAMES = Object.freeze(
  GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS.map((spec) => spec.createMethodName),
);

export const GAME_CORE_BRIDGE_BUNDLE_CONTEXT_KEY_NAMES = Object.freeze(
  uniqueList(
    GAME_CORE_BRIDGE_BUNDLE_CONTEXT_SPECS.flatMap((spec) => spec.requiredContextKeys),
  ).sort(),
);
