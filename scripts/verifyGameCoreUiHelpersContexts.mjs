import { readFile } from "node:fs/promises";

import {
  assertGameCoreUiHelpersContexts,
  formatGameCoreUiHelpersVerification,
} from "../src/legacy/public/gameCoreUiHelpersValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCoreUiHelpers.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreUiHelpersContexts({
  sourceTexts,
});

console.log(formatGameCoreUiHelpersVerification(result));
