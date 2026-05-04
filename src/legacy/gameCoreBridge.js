import {
  createGameCoreBridgeDependencies,
  defaultGameCoreBridgeDependencies,
} from "./deps/gameCoreBridgeDependencyDefinitions.js";
import { createGameCoreBridgeApiBundle } from "./bridge/gameCoreBridgeApiBundle.js";
import { createGameCoreBridgePublicShape } from "./bridge/gameCoreBridgePublicShape.js";

export function createGameCoreBridge(ctx) {
  const {
    dependencies = defaultGameCoreBridgeDependencies,
    ...restCtx
  } = ctx;

  const deps = createGameCoreBridgeDependencies(dependencies);
  const bundle = createGameCoreBridgeApiBundle({
    deps,
    ...restCtx,
  });

  return createGameCoreBridgePublicShape(bundle);
}
