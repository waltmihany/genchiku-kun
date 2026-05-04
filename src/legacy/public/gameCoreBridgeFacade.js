import { createGameCoreBridgePublicApi } from "../gameCorePublicApi.js";
import { getBridge } from "../gameCoreRuntime.js";

/**
 * Internal facade for bridge-backed public methods.
 *
 * Keep imports routed through `src/legacy/gameCore.js` unless you are working
 * inside the legacy public-layer assembly itself.
 */
const gameCoreBridgeFacade = createGameCoreBridgePublicApi(getBridge);

export const {
  runBalanceBatch,
  getTitleViewModel,
  runTitleStartGame,
  runRestartFromTopbar,
  getOnboardingViewModel,
  runOnboardingPrimaryAction,
  runOnboardingSkipAction,
  getDashboardViewModel,
  runDashboardPrimaryAction,
  runDashboardSelectMapTarget,
  getEventViewModel,
  runEventChooseChoice,
  getBudgetViewModel,
  runBudgetSelectPreset,
  runBudgetAutoBalance,
  runBudgetApplyPlan,
  runBudgetStep,
  runBudgetSetValue,
  getReportViewModel,
  runReportSelectEntry,
  runReportOpenBudget,
  getResultViewModel,
  runResultRestart,
  runResultReviewReport,
} = gameCoreBridgeFacade;
