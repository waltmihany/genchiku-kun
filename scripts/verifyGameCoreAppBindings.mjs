import { readFile } from "node:fs/promises";

import {
  assertGameCoreAppBindings,
  formatGameCoreAppBindingVerification,
} from "../src/legacy/public/gameCoreAppBindingValidation.js";

const SOURCE_FILE_PATHS = [
  "src/App.jsx",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreAppBindings({ sourceTexts });

console.log(formatGameCoreAppBindingVerification(result));
