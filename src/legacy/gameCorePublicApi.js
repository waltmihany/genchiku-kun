import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./public/gameCorePublicContract.js";

/**
 * Creates a callable public API facade from a getter and a contract-defined
 * method list.
 */
export function createGameCoreCallablePublicApi(getSource, methodNames) {
  const call = (methodName) => (...args) => getSource()?.[methodName](...args);

  return Object.freeze(
    Object.fromEntries(
      methodNames.map((methodName) => [methodName, call(methodName)]),
    ),
  );
}

/**
 * Bridge-to-public adapter.
 *
 * This module converts the bridge object's callable methods into the stable
 * public API that `src/legacy/gameCore.js` re-exports.
 */
export function createGameCoreBridgePublicApi(getBridge) {
  return createGameCoreCallablePublicApi(getBridge, GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES);
}

/**
 * Runtime-to-public adapter.
 *
 * This mirrors the bridge-side adapter so runtime public methods are also
 * assembled from the public contract rather than hand-written re-exports.
 */
export function createGameCoreRuntimePublicApi(getRuntime) {
  return createGameCoreCallablePublicApi(getRuntime, GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES);
}

/**
 * Backward-compatible alias kept while internal naming is being unified.
 */
export const createGameCorePublicApi = createGameCoreBridgePublicApi;

/**
 * Backward-compatible alias kept while internal naming is being unified.
 */
export const createCallablePublicApi = createGameCoreCallablePublicApi;
