import {
  GAME_CORE_BRIDGE_API_BUNDLE_KEYS,
  GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEYS,
} from "../deps/gameCoreBridgeAssemblyDefinitions.js";
import { GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES } from "./gameCorePublicContract.js";

export const GAME_CORE_BRIDGE_ASSEMBLY_POLICY = Object.freeze({
  owner: "legacy-game-core",
  bridgeModulePath: "src/legacy/gameCoreBridge.js",
  bridgeBundleModulePath: "src/legacy/bridge/gameCoreBridgeApiBundle.js",
  bridgePublicShapeModulePath: "src/legacy/bridge/gameCoreBridgePublicShape.js",
  placement: "src/legacy/deps/gameCoreBridgeAssemblyDefinitions.js",
  bundleShapeFactoryName: "createGameCoreBridgeApiBundleShape",
  publicShapeFactoryName: "createGameCoreBridgePublicSurfaceShape",
  bridgeFactoryName: "createGameCoreBridge",
});

export const GAME_CORE_BRIDGE_ASSEMBLY_FACTORY_NAMES = Object.freeze([
  GAME_CORE_BRIDGE_ASSEMBLY_POLICY.bundleShapeFactoryName,
  GAME_CORE_BRIDGE_ASSEMBLY_POLICY.publicShapeFactoryName,
  GAME_CORE_BRIDGE_ASSEMBLY_POLICY.bridgeFactoryName,
]);

export const GAME_CORE_BRIDGE_API_BUNDLE_KEY_NAMES = Object.freeze(
  GAME_CORE_BRIDGE_API_BUNDLE_KEYS,
);

export const GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEY_NAMES = Object.freeze(
  GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEYS,
);

export const GAME_CORE_BRIDGE_PUBLIC_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
);
