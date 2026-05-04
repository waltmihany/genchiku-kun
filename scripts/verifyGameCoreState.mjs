import { readFile } from "node:fs/promises";

import {
  assertGameCoreState,
  formatGameCoreStateVerification,
} from "../src/legacy/public/gameCoreStateValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/state/gameCoreState.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreState({ sourceTexts });

console.log(formatGameCoreStateVerification(result));
