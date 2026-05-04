globalThis.alert = () => {};

import { readFile } from "node:fs/promises";

import {
  assertGameCoreRuntimeStore,
  formatGameCoreRuntimeStoreVerification,
} from "../src/legacy/public/gameCoreRuntimeStoreValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/runtime/gameCoreRuntimeStore.js",
  "src/legacy/runtime/gameCoreRuntimeController.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreRuntimeStore({ sourceTexts });

console.log(formatGameCoreRuntimeStoreVerification(result));
