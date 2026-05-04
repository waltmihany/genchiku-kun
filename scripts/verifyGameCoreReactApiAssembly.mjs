import { readFile } from "node:fs/promises";

import {
  assertGameCoreReactApiAssembly,
  formatGameCoreReactApiAssemblyVerification,
} from "../src/legacy/public/gameCoreReactApiAssemblyValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCoreReactApi.js",
  "src/legacy/reactApi/gameCoreTitleReactApi.js",
  "src/legacy/reactApi/gameCoreOnboardingReactApi.js",
  "src/legacy/reactApi/gameCoreDashboardReactApi.js",
  "src/legacy/reactApi/gameCoreEventReactApi.js",
  "src/legacy/reactApi/gameCoreBudgetReactApi.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreReactApiAssembly({ sourceTexts });

console.log(formatGameCoreReactApiAssemblyVerification(result));
