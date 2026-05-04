import {
  GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEYS,
  GAME_CORE_RUNTIME_STORE_METHOD_NAMES,
  GAME_CORE_RUNTIME_CONTROLLER_METHOD_NAMES,
} from "../deps/gameCoreRuntimeStoreDefinitions.js";
import { GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES } from "./gameCorePublicContract.js";

export const GAME_CORE_RUNTIME_STORE_POLICY = Object.freeze({
  owner: "legacy-game-core",
  runtimeModulePath: "src/legacy/gameCoreRuntime.js",
  storeModulePath: "src/legacy/runtime/gameCoreRuntimeStore.js",
  controllerModulePath: "src/legacy/runtime/gameCoreRuntimeController.js",
  placement: "src/legacy/deps/gameCoreRuntimeStoreDefinitions.js",
  snapshotFactoryName: "createGameCoreRuntimeViewSnapshot",
  storeShapeFactoryName: "createGameCoreRuntimeStoreShape",
  controllerShapeFactoryName: "createGameCoreRuntimeControllerShape",
});

export const GAME_CORE_RUNTIME_STORE_FACTORY_NAMES = Object.freeze([
  GAME_CORE_RUNTIME_STORE_POLICY.snapshotFactoryName,
  GAME_CORE_RUNTIME_STORE_POLICY.storeShapeFactoryName,
  GAME_CORE_RUNTIME_STORE_POLICY.controllerShapeFactoryName,
]);

export const GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEYS,
);

export const GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_STORE_METHOD_NAMES,
);

export const GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_CONTROLLER_METHOD_NAMES,
);

export const GAME_CORE_RUNTIME_PUBLIC_SURFACE_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
);
