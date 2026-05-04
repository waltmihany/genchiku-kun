import { GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES } from "../public/gameCorePublicContract.js";

function createFrozenShape(source, keys) {
  return Object.freeze(
    keys.reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {}),
  );
}

export const GAME_CORE_BRIDGE_API_BUNDLE_KEYS = Object.freeze([
  "render",
  "progressApi",
  "uiApi",
  "reactApi",
  "reportApi",
  "simulationApi",
  "generateYearEndReport",
  "buildYearCausalSummary",
  "buildResultReviewData",
]);

export const GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEYS = Object.freeze([
  "render",
  "generateYearEndReport",
  "buildYearCausalSummary",
  "buildResultReviewData",
  ...GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
]);

export function createGameCoreBridgeApiBundleShape(source) {
  return createFrozenShape(source, GAME_CORE_BRIDGE_API_BUNDLE_KEYS);
}

export function createGameCoreBridgePublicSurfaceShape(source) {
  return createFrozenShape(source, GAME_CORE_BRIDGE_PUBLIC_SHAPE_KEYS);
}
