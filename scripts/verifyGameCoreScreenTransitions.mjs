import { readFile } from "node:fs/promises";

import * as publicEntryModule from "../src/legacy/gameCore.js";
import {
  assertGameCoreScreenTransitions,
  formatGameCoreScreenTransitionVerification,
} from "../src/legacy/public/gameCoreScreenTransitionValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/bridge/gameCoreBridgeApiBundle.js",
  "src/legacy/reactApi/gameCoreTitleReactApi.js",
  "src/legacy/reactApi/gameCoreOnboardingReactApi.js",
  "src/legacy/reactApi/gameCoreDashboardReactApi.js",
  "src/legacy/report/gameCoreReportApi.js",
  "src/legacy/progress/gameCoreProgressApi.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreScreenTransitions({
  publicEntryModule,
  sourceTexts,
});

console.log(formatGameCoreScreenTransitionVerification(result));
