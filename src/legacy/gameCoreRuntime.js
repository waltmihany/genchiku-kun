import {
  createGameCoreRuntimeDependencies,
  defaultGameCoreRuntimeDependencies,
} from "./deps/gameCoreRuntimeDependencyDefinitions.js";
import { createGameCoreRuntimeStore } from "./runtime/gameCoreRuntimeStore.js";
import { createGameCoreRuntimeBridgeContext } from "./runtime/gameCoreRuntimeBridgeContext.js";
import { createGameCoreRuntimeController } from "./runtime/gameCoreRuntimeController.js";
import {
  createGameCoreRuntimeBridgeContextInput,
  createGameCoreRuntimeControllerContext,
} from "./deps/gameCoreRuntimeBridgeContextDefinitions.js";

export function createGameCoreRuntime({
  alertUser = (message) => alert(message),
  dependencies = defaultGameCoreRuntimeDependencies,
} = {}) {
  const deps = createGameCoreRuntimeDependencies(dependencies);
  const store = createGameCoreRuntimeStore();
  const bridgeContext = createGameCoreRuntimeBridgeContext(
    createGameCoreRuntimeBridgeContextInput({
      deps,
      store,
      alertUser,
    }),
  );

  return createGameCoreRuntimeController(
    createGameCoreRuntimeControllerContext({
      deps,
      store,
      bridgeContext,
    }),
  );
}

const defaultRuntime = createGameCoreRuntime();

export function getRuntime() {
  return defaultRuntime;
}

export function getBridge() {
  return getRuntime().getBridge();
}
