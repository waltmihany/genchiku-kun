import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./gameCorePublicContract.js";

export const GAME_CORE_PUBLIC_FACADE_POLICY = Object.freeze({
  owner: "legacy-game-core",
  publicApiModulePath: "src/legacy/gameCorePublicApi.js",
  bridgeFacadeModulePath: "src/legacy/public/gameCoreBridgeFacade.js",
  runtimeFacadeModulePath: "src/legacy/public/gameCoreRuntimeFacade.js",
  publicEntryModulePath: "src/legacy/gameCore.js",
  callableFactoryName: "createGameCoreCallablePublicApi",
  bridgeFactoryName: "createGameCoreBridgePublicApi",
  runtimeFactoryName: "createGameCoreRuntimePublicApi",
  bridgeAliasName: "createGameCorePublicApi",
  callableAliasName: "createCallablePublicApi",
});

export const GAME_CORE_PUBLIC_API_FACTORY_NAMES = Object.freeze([
  GAME_CORE_PUBLIC_FACADE_POLICY.callableFactoryName,
  GAME_CORE_PUBLIC_FACADE_POLICY.bridgeFactoryName,
  GAME_CORE_PUBLIC_FACADE_POLICY.runtimeFactoryName,
]);

export const GAME_CORE_PUBLIC_API_ALIAS_NAMES = Object.freeze([
  GAME_CORE_PUBLIC_FACADE_POLICY.bridgeAliasName,
  GAME_CORE_PUBLIC_FACADE_POLICY.callableAliasName,
]);

export const GAME_CORE_PUBLIC_FACADE_METHOD_GROUPS = Object.freeze({
  bridge: Object.freeze(GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES),
  runtime: Object.freeze(GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES),
});

export const GAME_CORE_PUBLIC_FACADE_MODULE_PATHS = Object.freeze([
  GAME_CORE_PUBLIC_FACADE_POLICY.publicApiModulePath,
  GAME_CORE_PUBLIC_FACADE_POLICY.bridgeFacadeModulePath,
  GAME_CORE_PUBLIC_FACADE_POLICY.runtimeFacadeModulePath,
  GAME_CORE_PUBLIC_FACADE_POLICY.publicEntryModulePath,
]);
