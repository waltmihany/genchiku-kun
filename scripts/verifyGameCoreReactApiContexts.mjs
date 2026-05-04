import { readFile } from "node:fs/promises";

import {
  assertGameCoreReactApiContexts,
  formatGameCoreReactApiVerification,
} from "../src/legacy/public/gameCoreReactApiValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCoreReactApi.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreReactApiContexts({
  sourceTexts,
});

console.log(formatGameCoreReactApiVerification(result));
