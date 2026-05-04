import {
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEYS,
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEYS,
  GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEYS,
} from "../deps/gameCoreRuntimeBridgeContextDefinitions.js";

export const GAME_CORE_RUNTIME_BRIDGE_POLICY = Object.freeze({
  owner: "legacy-game-core",
  runtimeModulePath: "src/legacy/gameCoreRuntime.js",
  bridgeContextModulePath: "src/legacy/runtime/gameCoreRuntimeBridgeContext.js",
  controllerModulePath: "src/legacy/runtime/gameCoreRuntimeController.js",
  placement: "src/legacy/deps/gameCoreRuntimeBridgeContextDefinitions.js",
});

export const GAME_CORE_RUNTIME_BRIDGE_CONTEXT_FACTORY_NAMES = Object.freeze([
  "createGameCoreRuntimeBridgeContextInput",
  "createGameCoreRuntimeBridgeContextValue",
  "createGameCoreRuntimeControllerContext",
]);

export const GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_INPUT_KEYS,
);

export const GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEYS,
);

export const GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_CONTROLLER_CONTEXT_KEYS,
);

export const GAME_CORE_RUNTIME_TO_BRIDGE_REQUIRED_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_BRIDGE_CONTEXT_VALUE_KEYS,
);
