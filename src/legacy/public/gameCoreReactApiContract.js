import {
  GAME_CORE_TITLE_REACT_API_CONTEXT_KEYS,
  GAME_CORE_ONBOARDING_REACT_API_CONTEXT_KEYS,
  GAME_CORE_DASHBOARD_REACT_API_CONTEXT_KEYS,
  GAME_CORE_EVENT_REACT_API_CONTEXT_KEYS,
  GAME_CORE_BUDGET_REACT_API_CONTEXT_KEYS,
  GAME_CORE_REACT_SHARED_CONTEXT_KEYS,
} from "../deps/gameCoreReactApiContextDefinitions.js";

function uniqueList(values) {
  return [...new Set(values)];
}

export const GAME_CORE_REACT_API_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/legacy/gameCoreReactApi.js",
  placement: "src/legacy/deps/gameCoreReactApiContextDefinitions.js",
  stateProxyFactoryName: "createGameCoreReactStateProxy",
  sharedContextFactoryName: "createGameCoreReactSharedContext",
});

export const GAME_CORE_REACT_SUB_API_CONTEXT_SPECS = Object.freeze([
  Object.freeze({
    key: "title",
    apiFactoryName: "createGameCoreTitleReactApi",
    contextFactoryName: "createGameCoreTitleReactApiContext",
    requiredContextKeys: GAME_CORE_TITLE_REACT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "onboarding",
    apiFactoryName: "createGameCoreOnboardingReactApi",
    contextFactoryName: "createGameCoreOnboardingReactApiContext",
    requiredContextKeys: GAME_CORE_ONBOARDING_REACT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "dashboard",
    apiFactoryName: "createGameCoreDashboardReactApi",
    contextFactoryName: "createGameCoreDashboardReactApiContext",
    requiredContextKeys: GAME_CORE_DASHBOARD_REACT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "event",
    apiFactoryName: "createGameCoreEventReactApi",
    contextFactoryName: "createGameCoreEventReactApiContext",
    requiredContextKeys: GAME_CORE_EVENT_REACT_API_CONTEXT_KEYS,
  }),
  Object.freeze({
    key: "budget",
    apiFactoryName: "createGameCoreBudgetReactApi",
    contextFactoryName: "createGameCoreBudgetReactApiContext",
    requiredContextKeys: GAME_CORE_BUDGET_REACT_API_CONTEXT_KEYS,
  }),
]);

export const GAME_CORE_REACT_SUB_API_FACTORY_NAMES = Object.freeze(
  GAME_CORE_REACT_SUB_API_CONTEXT_SPECS.map((spec) => spec.apiFactoryName),
);

export const GAME_CORE_REACT_CONTEXT_FACTORY_NAMES = Object.freeze([
  GAME_CORE_REACT_API_POLICY.stateProxyFactoryName,
  GAME_CORE_REACT_API_POLICY.sharedContextFactoryName,
  ...GAME_CORE_REACT_SUB_API_CONTEXT_SPECS.map((spec) => spec.contextFactoryName),
]);

export const GAME_CORE_REACT_CONTEXT_KEY_NAMES = Object.freeze(
  uniqueList([
    ...GAME_CORE_REACT_SHARED_CONTEXT_KEYS,
    ...GAME_CORE_REACT_SUB_API_CONTEXT_SPECS.flatMap((spec) => spec.requiredContextKeys),
  ]).sort(),
);
