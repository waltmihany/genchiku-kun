/**
 * Legacy gameCore public layer contract.
 *
 * Application code should import from `src/legacy/gameCore.js` only.
 * Files under `src/legacy/public/` are internal facade adapters that exist to
 * compose the public surface, not to serve as direct app entry points.
 */

export const GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES = Object.freeze([
  "getGameViewSnapshot",
  "subscribeGameView",
  "mountLegacyGame",
]);

export const GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS = Object.freeze({
  simulation: Object.freeze([
    "runBalanceBatch",
  ]),
  title: Object.freeze([
    "getTitleViewModel",
    "runTitleStartGame",
    "runRestartFromTopbar",
  ]),
  onboarding: Object.freeze([
    "getOnboardingViewModel",
    "runOnboardingPrimaryAction",
    "runOnboardingSkipAction",
  ]),
  dashboard: Object.freeze([
    "getDashboardViewModel",
    "runDashboardPrimaryAction",
    "runDashboardSelectMapTarget",
  ]),
  event: Object.freeze([
    "getEventViewModel",
    "runEventChooseChoice",
  ]),
  budget: Object.freeze([
    "getBudgetViewModel",
    "runBudgetSelectPreset",
    "runBudgetAutoBalance",
    "runBudgetApplyPlan",
    "runBudgetStep",
    "runBudgetSetValue",
  ]),
  report: Object.freeze([
    "getReportViewModel",
    "runReportSelectEntry",
    "runReportOpenBudget",
  ]),
  result: Object.freeze([
    "getResultViewModel",
    "runResultRestart",
    "runResultReviewReport",
  ]),
});

export const GAME_CORE_BRIDGE_PUBLIC_METHOD_SOURCES = Object.freeze({
  simulation: "simulationApi",
  title: "reactApi",
  onboarding: "reactApi",
  dashboard: "reactApi",
  event: "reactApi",
  budget: "reactApi",
  report: "reportApi",
  result: "reportApi",
});

export const GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES = Object.freeze(
  Object.values(GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS).flat(),
);

export function createGameCoreBridgePublicMethodForwarders(sourceMap) {
  return Object.fromEntries(
    Object.entries(GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS).flatMap(([groupName, methodNames]) => {
      const sourceKey = GAME_CORE_BRIDGE_PUBLIC_METHOD_SOURCES[groupName];
      const source = sourceMap[sourceKey];
      return methodNames.map((methodName) => [
        methodName,
        (...args) => source?.[methodName](...args),
      ]);
    }),
  );
}
