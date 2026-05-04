import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./gameCorePublicContract.js";
import { GAME_CORE_REACT_SCREEN_KEYS } from "./gameCoreReactScreenContract.js";

function uniqueList(values) {
  return [...new Set(values)];
}

export const GAME_CORE_SCREEN_TRANSITION_POLICY = Object.freeze({
  navigationOwner: "legacy-game-core",
  reactRole: "render-only",
  transitionAdapterName: "screenTransitions",
  stableEntryModule: "src/legacy/gameCore.js",
});

export const GAME_CORE_SCREEN_TRANSITION_MANAGED_SCREEN_NAMES = Object.freeze(
  uniqueList(GAME_CORE_REACT_SCREEN_KEYS),
);

export const GAME_CORE_SCREEN_TRANSITION_HELPER_METHOD_NAMES = Object.freeze([
  "showTitle",
  "showDashboard",
  "showBudget",
  "showReport",
  "showEvent",
  "showClear",
  "showGameOver",
  "renderCurrentScreen",
  "restartToTitle",
  "restartToDashboard",
]);

export const GAME_CORE_SCREEN_TRANSITION_ACTION_SPECS = Object.freeze([
  Object.freeze({ actionMethodName: "runTitleStartGame", owner: "bridge", transition: "showDashboard" }),
  Object.freeze({ actionMethodName: "runRestartFromTopbar", owner: "bridge", transition: "restartToTitle" }),
  Object.freeze({ actionMethodName: "runOnboardingPrimaryAction", owner: "bridge", transition: "conditional" }),
  Object.freeze({ actionMethodName: "runOnboardingSkipAction", owner: "bridge", transition: "renderCurrentScreen" }),
  Object.freeze({ actionMethodName: "runDashboardPrimaryAction", owner: "bridge", transition: "conditional" }),
  Object.freeze({ actionMethodName: "runBudgetApplyPlan", owner: "bridge", transition: "progress-driven" }),
  Object.freeze({ actionMethodName: "runEventChooseChoice", owner: "bridge", transition: "progress-driven" }),
  Object.freeze({ actionMethodName: "runReportOpenBudget", owner: "bridge", transition: "showBudget" }),
  Object.freeze({ actionMethodName: "runResultRestart", owner: "bridge", transition: "restartToDashboard" }),
  Object.freeze({ actionMethodName: "runResultReviewReport", owner: "bridge", transition: "showReport" }),
  Object.freeze({ actionMethodName: "mountLegacyGame", owner: "runtime", transition: "reset-on-mount" }),
]);

export const GAME_CORE_SCREEN_TRANSITION_ACTION_METHOD_NAMES = Object.freeze(
  GAME_CORE_SCREEN_TRANSITION_ACTION_SPECS.map((spec) => spec.actionMethodName),
);

export const GAME_CORE_SCREEN_TRANSITION_BRIDGE_ACTION_METHOD_NAMES = Object.freeze(
  GAME_CORE_SCREEN_TRANSITION_ACTION_SPECS
    .filter((spec) => spec.owner === "bridge")
    .map((spec) => spec.actionMethodName),
);

export const GAME_CORE_SCREEN_TRANSITION_RUNTIME_ACTION_METHOD_NAMES = Object.freeze(
  GAME_CORE_SCREEN_TRANSITION_ACTION_SPECS
    .filter((spec) => spec.owner === "runtime")
    .map((spec) => spec.actionMethodName),
);

export function isGameCoreScreenTransitionBridgeMethod(methodName) {
  return GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES.includes(methodName);
}

export function isGameCoreScreenTransitionRuntimeMethod(methodName) {
  return GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES.includes(methodName);
}

export function uniqueGameCoreScreenTransitionManagedScreens() {
  return uniqueList(GAME_CORE_SCREEN_TRANSITION_MANAGED_SCREEN_NAMES);
}
