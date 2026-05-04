function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEYS = Object.freeze([
  "screen",
  "year",
  "phase",
]);

export const GAME_CORE_RUNTIME_STORE_METHOD_NAMES = Object.freeze([
  "getState",
  "setState",
  "getAppRoot",
  "setAppRoot",
  "getHasCompletedOnboarding",
  "setHasCompletedOnboarding",
  "getBridge",
  "setBridge",
  "getGameViewSnapshot",
  "emitGameViewChange",
  "subscribeGameView",
]);

export const GAME_CORE_RUNTIME_CONTROLLER_METHOD_NAMES = Object.freeze([
  "getBridge",
  "getGameViewSnapshot",
  "subscribeGameView",
  "mountLegacyGame",
  "resetGame",
]);

export function createGameCoreRuntimeViewSnapshot(source) {
  return createFrozenShape(source, GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEYS);
}

export function createGameCoreRuntimeStoreShape(source) {
  return createFrozenShape(source, GAME_CORE_RUNTIME_STORE_METHOD_NAMES);
}

export function createGameCoreRuntimeControllerShape(source) {
  return createFrozenShape(source, GAME_CORE_RUNTIME_CONTROLLER_METHOD_NAMES);
}
