import {
  GAME_CORE_TITLE_REACT_API_METHOD_NAMES,
  GAME_CORE_ONBOARDING_REACT_API_METHOD_NAMES,
  GAME_CORE_DASHBOARD_REACT_API_METHOD_NAMES,
  GAME_CORE_EVENT_REACT_API_METHOD_NAMES,
  GAME_CORE_BUDGET_REACT_API_METHOD_NAMES,
  GAME_CORE_REACT_API_ASSEMBLY_METHOD_NAMES,
} from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export const GAME_CORE_REACT_API_ASSEMBLY_POLICY = Object.freeze({
  owner: "legacy-game-core",
  assemblyModulePath: "src/legacy/gameCoreReactApi.js",
  placement: "src/legacy/deps/gameCoreReactApiAssemblyDefinitions.js",
  assemblyFactoryName: "createGameCoreReactApiAssemblyShape",
});

export const GAME_CORE_REACT_API_SHAPE_SPECS = Object.freeze([
  Object.freeze({
    key: "title",
    modulePath: "src/legacy/reactApi/gameCoreTitleReactApi.js",
    factoryName: "createGameCoreTitleReactApiShape",
    methodNames: GAME_CORE_TITLE_REACT_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "onboarding",
    modulePath: "src/legacy/reactApi/gameCoreOnboardingReactApi.js",
    factoryName: "createGameCoreOnboardingReactApiShape",
    methodNames: GAME_CORE_ONBOARDING_REACT_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "dashboard",
    modulePath: "src/legacy/reactApi/gameCoreDashboardReactApi.js",
    factoryName: "createGameCoreDashboardReactApiShape",
    methodNames: GAME_CORE_DASHBOARD_REACT_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "event",
    modulePath: "src/legacy/reactApi/gameCoreEventReactApi.js",
    factoryName: "createGameCoreEventReactApiShape",
    methodNames: GAME_CORE_EVENT_REACT_API_METHOD_NAMES,
  }),
  Object.freeze({
    key: "budget",
    modulePath: "src/legacy/reactApi/gameCoreBudgetReactApi.js",
    factoryName: "createGameCoreBudgetReactApiShape",
    methodNames: GAME_CORE_BUDGET_REACT_API_METHOD_NAMES,
  }),
]);

export const GAME_CORE_REACT_API_ASSEMBLY_FACTORY_NAMES = Object.freeze([
  ...GAME_CORE_REACT_API_SHAPE_SPECS.map((spec) => spec.factoryName),
  GAME_CORE_REACT_API_ASSEMBLY_POLICY.assemblyFactoryName,
]);

export const GAME_CORE_REACT_API_ASSEMBLY_METHOD_KEY_NAMES = Object.freeze(
  GAME_CORE_REACT_API_ASSEMBLY_METHOD_NAMES,
);
