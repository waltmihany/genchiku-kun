function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_MAP_UI_HELPER_METHOD_NAMES = Object.freeze([
  "renderMap",
  "renderStaffStrip",
  "pickStripComment",
]);

export const GAME_CORE_DASHBOARD_UI_HELPER_METHOD_NAMES = Object.freeze([
  "renderRegionGrid",
  "renderDashboard",
  "phaseLabel",
  "buildSummaryMessage",
  "buildDashboardActions",
  "phaseActionText",
  "attachDashboardActionHandlers",
  "renderDeconstructionList",
]);

export const GAME_CORE_ONBOARDING_UI_HELPER_METHOD_NAMES = Object.freeze([
  "completeOnboarding",
  "onboardingProgressCount",
  "getOnboardingConfig",
  "renderOnboardingOverlay",
]);

export const GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_NAMES = Object.freeze([
  "renderRegionGrid",
  "setScreen",
  "completeOnboarding",
  "onboardingProgressCount",
  "getOnboardingConfig",
  "renderOnboardingOverlay",
  "render",
  "renderDashboard",
  "phaseLabel",
  "buildSummaryMessage",
  "buildDashboardActions",
  "phaseActionText",
  "attachDashboardActionHandlers",
  "renderDeconstructionList",
  "renderMap",
  "renderStaffStrip",
  "pickStripComment",
  "renderBudget",
  "labelEventKind",
  "renderReport",
]);

export function createGameCoreMapUiHelpersShape(source) {
  return createFrozenShape(source, GAME_CORE_MAP_UI_HELPER_METHOD_NAMES);
}

export function createGameCoreDashboardUiHelpersShape(source) {
  return createFrozenShape(source, GAME_CORE_DASHBOARD_UI_HELPER_METHOD_NAMES);
}

export function createGameCoreOnboardingUiHelpersShape(source) {
  return createFrozenShape(source, GAME_CORE_ONBOARDING_UI_HELPER_METHOD_NAMES);
}

export function createGameCoreUiHelpersAssemblyShape(source) {
  return createFrozenShape(source, GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_NAMES);
}
