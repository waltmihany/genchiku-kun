import { readFile } from "node:fs/promises";

import {
  assertGameCoreRuntimeBridgeContexts,
  formatGameCoreRuntimeBridgeVerification,
} from "../src/legacy/public/gameCoreRuntimeBridgeValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCoreRuntime.js",
  "src/legacy/runtime/gameCoreRuntimeBridgeContext.js",
  "src/legacy/runtime/gameCoreRuntimeController.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreRuntimeBridgeContexts({ sourceTexts });

console.log(formatGameCoreRuntimeBridgeVerification(result));
