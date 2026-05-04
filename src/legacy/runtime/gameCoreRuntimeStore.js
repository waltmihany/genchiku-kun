import {
  createGameCoreRuntimeStoreShape,
  createGameCoreRuntimeViewSnapshot,
} from "../deps/gameCoreRuntimeStoreDefinitions.js";

export function createGameCoreRuntimeStore() {
  let appRoot = null;
  let hasCompletedOnboarding = false;
  let gameState = null;
  let bridge = null;
  const gameViewListeners = new Set();

  function getState() {
    return gameState;
  }

  function setState(nextState) {
    gameState = nextState;
  }

  function getAppRoot() {
    return appRoot;
  }

  function setAppRoot(nextRoot) {
    appRoot = nextRoot;
  }

  function getHasCompletedOnboarding() {
    return hasCompletedOnboarding;
  }

  function setHasCompletedOnboarding(value) {
    hasCompletedOnboarding = value;
  }

  function getBridge() {
    return bridge;
  }

  function setBridge(nextBridge) {
    bridge = nextBridge;
  }

  function getGameViewSnapshot() {
    return createGameCoreRuntimeViewSnapshot({
      screen: gameState?.screen || "title",
      year: gameState?.year || 1,
      phase: gameState?.phase || "report",
    });
  }

  function emitGameViewChange() {
    const snapshot = getGameViewSnapshot();
    gameViewListeners.forEach((listener) => listener(snapshot));
  }

  function subscribeGameView(listener) {
    gameViewListeners.add(listener);
    listener(getGameViewSnapshot());
    return () => {
      gameViewListeners.delete(listener);
    };
  }

  return createGameCoreRuntimeStoreShape({
    getState,
    setState,
    getAppRoot,
    setAppRoot,
    getHasCompletedOnboarding,
    setHasCompletedOnboarding,
    getBridge,
    setBridge,
    getGameViewSnapshot,
    emitGameViewChange,
    subscribeGameView,
  });
}
