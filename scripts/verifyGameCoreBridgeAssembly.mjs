globalThis.alert = () => {};

import { readFile } from "node:fs/promises";

import {
  assertGameCoreBridgeAssembly,
  formatGameCoreBridgeAssemblyVerification,
} from "../src/legacy/public/gameCoreBridgeAssemblyValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/bridge/gameCoreBridgeApiBundle.js",
  "src/legacy/bridge/gameCoreBridgePublicShape.js",
  "src/legacy/gameCoreBridge.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreBridgeAssembly({ sourceTexts });

console.log(formatGameCoreBridgeAssemblyVerification(result));
