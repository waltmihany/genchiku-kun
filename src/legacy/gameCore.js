/**
 * Stable public entry point for the legacy game core.
 *
 * App/UI code should import from this module only.
 * Files under `src/legacy/public/` are internal facades used to assemble this
 * surface and are not intended as direct application entry points.
 */
export * from "./public/gameCoreRuntimeFacade.js";
export * from "./public/gameCoreBridgeFacade.js";
