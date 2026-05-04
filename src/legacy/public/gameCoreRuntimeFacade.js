import { createGameCoreRuntimePublicApi } from "../gameCorePublicApi.js";
import { getRuntime } from "../gameCoreRuntime.js";

/**
 * Internal facade for runtime-backed public methods.
 *
 * Keep imports routed through `src/legacy/gameCore.js` unless you are working
 * inside the legacy public-layer assembly itself.
 */
const gameCoreRuntimeFacade = createGameCoreRuntimePublicApi(getRuntime);

export const {
  getGameViewSnapshot,
  subscribeGameView,
  mountLegacyGame,
} = gameCoreRuntimeFacade;
