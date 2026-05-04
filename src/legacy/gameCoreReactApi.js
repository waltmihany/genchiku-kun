import { createGameCoreTitleReactApi } from "./reactApi/gameCoreTitleReactApi.js";
import { createGameCoreOnboardingReactApi } from "./reactApi/gameCoreOnboardingReactApi.js";
import { createGameCoreDashboardReactApi } from "./reactApi/gameCoreDashboardReactApi.js";
import { createGameCoreEventReactApi } from "./reactApi/gameCoreEventReactApi.js";
import { createGameCoreBudgetReactApi } from "./reactApi/gameCoreBudgetReactApi.js";
import {
  createGameCoreReactStateProxy,
  createGameCoreReactSharedContext,
  createGameCoreTitleReactApiContext,
  createGameCoreOnboardingReactApiContext,
  createGameCoreDashboardReactApiContext,
  createGameCoreEventReactApiContext,
  createGameCoreBudgetReactApiContext,
} from "./deps/gameCoreReactApiContextDefinitions.js";
import { createGameCoreReactApiAssemblyShape } from "./deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreReactApi(ctx) {
  const gameState = createGameCoreReactStateProxy(ctx.getState);
  const sharedReactContext = createGameCoreReactSharedContext({
    ...ctx,
    gameState,
  });

  const titleApi = createGameCoreTitleReactApi(
    createGameCoreTitleReactApiContext(sharedReactContext),
  );
  const onboardingApi = createGameCoreOnboardingReactApi(
    createGameCoreOnboardingReactApiContext(sharedReactContext),
  );
  const dashboardApi = createGameCoreDashboardReactApi(
    createGameCoreDashboardReactApiContext(sharedReactContext),
  );
  const eventApi = createGameCoreEventReactApi(
    createGameCoreEventReactApiContext(sharedReactContext),
  );
  const budgetApi = createGameCoreBudgetReactApi(
    createGameCoreBudgetReactApiContext(sharedReactContext),
  );

  return createGameCoreReactApiAssemblyShape({
    ...titleApi,
    ...onboardingApi,
    ...dashboardApi,
    ...eventApi,
    ...budgetApi,
  });
}
