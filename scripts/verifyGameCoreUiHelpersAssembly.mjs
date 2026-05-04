import { readFile } from "node:fs/promises";

import {
  assertGameCoreUiHelpersAssembly,
  formatGameCoreUiHelpersAssemblyVerification,
} from "../src/legacy/public/gameCoreUiHelpersAssemblyValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCoreUiHelpers.js",
  "src/legacy/uiHelpers/gameCoreMapUiHelpers.js",
  "src/legacy/uiHelpers/gameCoreDashboardUiHelpers.js",
  "src/legacy/uiHelpers/gameCoreOnboardingUiHelpers.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreUiHelpersAssembly({ sourceTexts });

console.log(formatGameCoreUiHelpersAssemblyVerification(result));
