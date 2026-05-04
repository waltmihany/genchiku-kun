globalThis.alert = () => {};

import * as publicEntryModule from "../src/legacy/gameCore.js";
import * as bridgeFacadeModule from "../src/legacy/public/gameCoreBridgeFacade.js";
import * as runtimeFacadeModule from "../src/legacy/public/gameCoreRuntimeFacade.js";
import { createGameCorePublicApi } from "../src/legacy/gameCorePublicApi.js";
import { createGameCoreRuntime, getBridge } from "../src/legacy/gameCoreRuntime.js";
import {
  assertGameCorePublicLayer,
  formatGameCorePublicLayerVerification,
} from "../src/legacy/public/gameCorePublicLayerValidation.js";

const bridge = getBridge();
const publicApi = createGameCorePublicApi(getBridge);
const runtimeInstance = createGameCoreRuntime({
  alertUser: () => {},
});

const result = assertGameCorePublicLayer({
  bridge,
  publicApi,
  runtimeInstance,
  publicEntryModule,
  bridgeFacadeModule,
  runtimeFacadeModule,
});

console.log(formatGameCorePublicLayerVerification(result));
