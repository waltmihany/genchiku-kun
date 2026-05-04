import {
  GAME_CORE_MAP_UI_HELPERS_CONTEXT_KEYS,
  GAME_CORE_DASHBOARD_UI_HELPERS_CONTEXT_KEYS,
  GAME_CORE_ONBOARDING_UI_HELPERS_CONTEXT_KEYS,
  GAME_CORE_UI_SHARED_CONTEXT_KEYS,
} from "../deps/gameCoreUiHelperContextDefinitions.js";
import { GAME_CORE_REACT_SCREEN_KEYS } from "./gameCoreReactScreenContract.js";

function uniqueList(values) {
  return [...new Set(values)];
}

export const GAME_CORE_UI_HELPERS_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/legacy/gameCoreUiHelpers.js",
  placement: "src/legacy/deps/gameCoreUiHelperContextDefinitions.js",
  stateProxyFactoryName: "createGameCoreUiStateProxy",
  elementLocatorFactoryName: "createGameCoreUiElementLocator",
  sharedContextFactoryName: "createGameCoreUiSharedContext",
});

export const GAME_CORE_UI_HELPERS_MANAGED_SCREEN_KEYS = Object.freeze(
  uniqueList(GAME_CORE_REACT_SCREEN_KEYS),
);

export const GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS = Object.freeze([
  Object.freeze({
    key: "map",
    helperFactoryName: "createGameCoreMapUiHelpers",
    contextFactoryName: "createGameCoreMapUiHelpersContext",
    requiredContextKeys: GAME_CORE_MAP_UI_HELPERS_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "dashboard",
    helperFactoryName: "createGameCoreDashboardUiHelpers",
    contextFactoryName: "createGameCoreDashboardUiHelpersContext",
    requiredContextKeys: GAME_CORE_DASHBOARD_UI_HELPERS_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "onboarding",
    helperFactoryName: "createGameCoreOnboardingUiHelpers",
    contextFactoryName: "createGameCoreOnboardingUiHelpersContext",
    requiredContextKeys: GAME_CORE_ONBOARDING_UI_HELPERS_CONTEXT_KEYS,
  }),
]);

export const GAME_CORE_UI_CONTEXT_FACTORY_NAMES = Object.freeze([
  GAME_CORE_UI_HELPERS_POLICY.stateProxyFactoryName,
  GAME_CORE_UI_HELPERS_POLICY.elementLocatorFactoryName,
  GAME_CORE_UI_HELPERS_POLICY.sharedContextFactoryName,
  ...GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS.map((spec) => spec.contextFactoryName),
]);

export const GAME_CORE_UI_CONTEXT_KEY_NAMES = Object.freeze(
  uniqueList([
    ...GAME_CORE_UI_SHARED_CONTEXT_KEYS,
    ...GAME_CORE_UI_SUB_HELPER_CONTEXT_SPECS.flatMap((spec) => spec.requiredContextKeys),
  ]).sort(),
);
