import { createGameCoreBridgePublicSurfaceShape } from "../deps/gameCoreBridgeAssemblyDefinitions.js";
import { createGameCoreBridgePublicMethodForwarders } from "../public/gameCorePublicContract.js";

export function createGameCoreBridgePublicShape(ctx) {
  const {
    render,
    generateYearEndReport,
    buildYearCausalSummary,
    buildResultReviewData,
    simulationApi,
    reactApi,
    reportApi,
  } = ctx;

  return createGameCoreBridgePublicSurfaceShape({
    render,
    generateYearEndReport,
    buildYearCausalSummary,
    buildResultReviewData,
    ...createGameCoreBridgePublicMethodForwarders({
      simulationApi,
      reactApi,
      reportApi,
    }),
  });
}
