import {
  GAME_CORE_MAP_UI_HELPER_METHOD_NAMES,
  GAME_CORE_DASHBOARD_UI_HELPER_METHOD_NAMES,
  GAME_CORE_ONBOARDING_UI_HELPER_METHOD_NAMES,
  GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_NAMES,
} from "../deps/gameCoreUiHelpersAssemblyDefinitions.js";

export const GAME_CORE_UI_HELPERS_ASSEMBLY_POLICY = Object.freeze({
  owner: "legacy-game-core",
  assemblyModulePath: "src/legacy/gameCoreUiHelpers.js",
  placement: "src/legacy/deps/gameCoreUiHelpersAssemblyDefinitions.js",
  assemblyFactoryName: "createGameCoreUiHelpersAssemblyShape",
});

export const GAME_CORE_UI_HELPER_SHAPE_SPECS = Object.freeze([
  Object.freeze({
    key: "map",
    modulePath: "src/legacy/uiHelpers/gameCoreMapUiHelpers.js",
    factoryName: "createGameCoreMapUiHelpersShape",
    methodNames: GAME_CORE_MAP_UI_HELPER_METHOD_NAMES,
  }),
  Object.freeze({
    key: "dashboard",
    modulePath: "src/legacy/uiHelpers/gameCoreDashboardUiHelpers.js",
    factoryName: "createGameCoreDashboardUiHelpersShape",
    methodNames: GAME_CORE_DASHBOARD_UI_HELPER_METHOD_NAMES,
  }),
  Object.freeze({
    key: "onboarding",
    modulePath: "src/legacy/uiHelpers/gameCoreOnboardingUiHelpers.js",
    factoryName: "createGameCoreOnboardingUiHelpersShape",
    methodNames: GAME_CORE_ONBOARDING_UI_HELPER_METHOD_NAMES,
  }),
]);

export const GAME_CORE_UI_HELPERS_ASSEMBLY_FACTORY_NAMES = Object.freeze([
  ...GAME_CORE_UI_HELPER_SHAPE_SPECS.map((spec) => spec.factoryName),
  GAME_CORE_UI_HELPERS_ASSEMBLY_POLICY.assemblyFactoryName,
]);

export const GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_UI_HELPERS_ASSEMBLY_METHOD_NAMES,
);
