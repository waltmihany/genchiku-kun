export function createGameCoreScreenTransitions(ctx) {
  const {
    gameState,
    setScreen,
    render,
    resetGame,
  } = ctx;

  function showScreen(screen) {
    if (typeof setScreen === "function") {
      return setScreen(screen);
    }
    gameState.screen = screen;
    return render?.();
  }

  function showTitle() {
    return showScreen("title");
  }

  function showDashboard() {
    return showScreen("dashboard");
  }

  function showBudget() {
    gameState.phase = "budget";
    return showScreen("budget");
  }

  function showReport() {
    return showScreen("report");
  }

  function showEvent() {
    return showScreen("event");
  }

  function showClear() {
    return showScreen("clear");
  }

  function showGameOver() {
    return showScreen("gameover");
  }

  function renderCurrentScreen() {
    return render?.();
  }

  function restartToTitle() {
    return resetGame?.(false);
  }

  function restartToDashboard() {
    return resetGame?.(true);
  }

  return {
    showTitle,
    showDashboard,
    showBudget,
    showReport,
    showEvent,
    showClear,
    showGameOver,
    renderCurrentScreen,
    restartToTitle,
    restartToDashboard,
  };
}
