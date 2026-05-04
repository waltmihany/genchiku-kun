import { GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS } from "../public/gameCorePublicContract.js";

function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_TITLE_REACT_API_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.title,
]);

export const GAME_CORE_ONBOARDING_REACT_API_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.onboarding,
]);

export const GAME_CORE_DASHBOARD_REACT_API_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.dashboard,
]);

export const GAME_CORE_EVENT_REACT_API_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.event,
]);

export const GAME_CORE_BUDGET_REACT_API_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_GROUPS.budget,
]);

export const GAME_CORE_REACT_API_ASSEMBLY_METHOD_NAMES = Object.freeze([
  ...GAME_CORE_TITLE_REACT_API_METHOD_NAMES,
  ...GAME_CORE_ONBOARDING_REACT_API_METHOD_NAMES,
  ...GAME_CORE_DASHBOARD_REACT_API_METHOD_NAMES,
  ...GAME_CORE_EVENT_REACT_API_METHOD_NAMES,
  ...GAME_CORE_BUDGET_REACT_API_METHOD_NAMES,
]);

export function createGameCoreTitleReactApiShape(source) {
  return createFrozenShape(source, GAME_CORE_TITLE_REACT_API_METHOD_NAMES);
}

export function createGameCoreOnboardingReactApiShape(source) {
  return createFrozenShape(source, GAME_CORE_ONBOARDING_REACT_API_METHOD_NAMES);
}

export function createGameCoreDashboardReactApiShape(source) {
  return createFrozenShape(source, GAME_CORE_DASHBOARD_REACT_API_METHOD_NAMES);
}

export function createGameCoreEventReactApiShape(source) {
  return createFrozenShape(source, GAME_CORE_EVENT_REACT_API_METHOD_NAMES);
}

export function createGameCoreBudgetReactApiShape(source) {
  return createFrozenShape(source, GAME_CORE_BUDGET_REACT_API_METHOD_NAMES);
}

export function createGameCoreReactApiAssemblyShape(source) {
  return createFrozenShape(source, GAME_CORE_REACT_API_ASSEMBLY_METHOD_NAMES);
}
