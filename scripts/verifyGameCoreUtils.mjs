import { readFile } from "node:fs/promises";

import {
  assertGameCoreUtils,
  formatGameCoreUtilsVerification,
} from "../src/legacy/public/gameCoreUtilsValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/utils/gameCoreUtils.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreUtils({ sourceTexts });

console.log(formatGameCoreUtilsVerification(result));
