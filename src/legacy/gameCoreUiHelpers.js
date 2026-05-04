import { createGameCoreDashboardUiHelpers } from "./uiHelpers/gameCoreDashboardUiHelpers.js";
import { createGameCoreMapUiHelpers } from "./uiHelpers/gameCoreMapUiHelpers.js";
import { createGameCoreOnboardingUiHelpers } from "./uiHelpers/gameCoreOnboardingUiHelpers.js";
import {
  createGameCoreUiStateProxy,
  createGameCoreUiElementLocator,
  createGameCoreUiSharedContext,
  createGameCoreMapUiHelpersContext,
  createGameCoreDashboardUiHelpersContext,
  createGameCoreOnboardingUiHelpersContext,
} from "./deps/gameCoreUiHelperContextDefinitions.js";
import { createGameCoreUiHelpersAssemblyShape } from "./deps/gameCoreUiHelpersAssemblyDefinitions.js";

const REACT_MANAGED_SCREENS = new Set(["title", "dashboard", "budget", "report", "event", "clear", "gameover"]);

export function createGameCoreUiHelpers(ctx) {
  const gameState = createGameCoreUiStateProxy(ctx.getState);
  const sharedUiContext = createGameCoreUiSharedContext({
    ...ctx,
    gameState,
  });
  const getElement = createGameCoreUiElementLocator(sharedUiContext.getAppRoot);

  function render() {
    const appRoot = sharedUiContext.getAppRoot();
    if (!appRoot) return;
    const container = getElement("screenContainer");
    if (!container) return;

    sharedUiContext.emitGameViewChange();
    container.innerHTML = "";

    if (REACT_MANAGED_SCREENS.has(gameState.screen)) {
      return;
    }
  }

  function setScreen(screen) {
    gameState.screen = screen;
    if (sharedUiContext.getAppRoot()) render();
  }

  const mapUi = createGameCoreMapUiHelpers(createGameCoreMapUiHelpersContext({
    ...sharedUiContext,
    getElement,
  }));

  const dashboardUi = createGameCoreDashboardUiHelpers(createGameCoreDashboardUiHelpersContext({
    ...sharedUiContext,
    getElement,
    renderMap: (...args) => mapUi.renderMap(...args),
    setScreen,
  }));

  const onboardingUi = createGameCoreOnboardingUiHelpers(createGameCoreOnboardingUiHelpersContext({
    gameState,
    getAppRoot: sharedUiContext.getAppRoot,
    getElement,
    setHasCompletedOnboarding: sharedUiContext.setHasCompletedOnboarding,
    render,
    setScreen,
  }));

  function renderBudget() {
    return;
  }

  function labelEventKind(kind) {
    return {
      weather: "天候",
      resident: "住民対応",
      infrastructure: "インフラ",
      finance: "財政",
      bonus: "チャンス",
    }[kind] || "臨時";
  }

  function renderReport() {
    return;
  }

  return createGameCoreUiHelpersAssemblyShape({
    renderRegionGrid: dashboardUi.renderRegionGrid,
    setScreen,
    completeOnboarding: onboardingUi.completeOnboarding,
    onboardingProgressCount: onboardingUi.onboardingProgressCount,
    getOnboardingConfig: onboardingUi.getOnboardingConfig,
    renderOnboardingOverlay: onboardingUi.renderOnboardingOverlay,
    render,
    renderDashboard: dashboardUi.renderDashboard,
    phaseLabel: dashboardUi.phaseLabel,
    buildSummaryMessage: dashboardUi.buildSummaryMessage,
    buildDashboardActions: dashboardUi.buildDashboardActions,
    phaseActionText: dashboardUi.phaseActionText,
    attachDashboardActionHandlers: dashboardUi.attachDashboardActionHandlers,
    renderDeconstructionList: dashboardUi.renderDeconstructionList,
    renderMap: mapUi.renderMap,
    renderStaffStrip: mapUi.renderStaffStrip,
    pickStripComment: mapUi.pickStripComment,
    renderBudget,
    labelEventKind,
    renderReport,
  });
}
