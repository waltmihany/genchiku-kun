import { createGameCoreRuntimeControllerShape } from "../deps/gameCoreRuntimeStoreDefinitions.js";

export function createGameCoreRuntimeController(ctx) {
  const {
    deps,
    store,
    bridgeContext,
  } = ctx;

  const {
    createGameCoreBridge,
    bridgeDependencies,
  } = deps;

  function resetGame(startImmediately = false) {
    const nextState = bridgeContext.buildInitialState();
    store.setState(nextState);
    const bridge = store.getBridge();
    nextState.reportEntries = bridge.generateYearEndReport(nextState, true);
    nextState.selectedReportId = nextState.reportEntries[0]?.id || null;
    nextState.screen = startImmediately ? "dashboard" : "title";
    bridge.render();
  }

  const bridge = createGameCoreBridge({
    dependencies: bridgeDependencies,
    ...bridgeContext,
    resetGame,
  });

  store.setBridge(bridge);

  function mountLegacyGame(rootElement) {
    store.setAppRoot(rootElement);
    resetGame(false);
    return () => {
      if (store.getAppRoot() === rootElement) {
        store.setAppRoot(null);
      }
    };
  }

  return createGameCoreRuntimeControllerShape({
    getBridge: store.getBridge,
    getGameViewSnapshot: store.getGameViewSnapshot,
    subscribeGameView: store.subscribeGameView,
    mountLegacyGame,
    resetGame,
  });
}
