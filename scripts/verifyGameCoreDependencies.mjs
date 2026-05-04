import { readFile } from "node:fs/promises";

import {
  defaultGameCoreBridgeDependencies,
} from "../src/legacy/deps/gameCoreBridgeDependencyDefinitions.js";
import {
  defaultGameCoreRuntimeDependencies,
} from "../src/legacy/deps/gameCoreRuntimeDependencyDefinitions.js";
import {
  assertGameCoreDependencies,
  formatGameCoreDependencyVerification,
} from "../src/legacy/public/gameCoreDependencyValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/bridge/gameCoreBridgeApiBundle.js",
  "src/legacy/deps/gameCoreBridgeDependencyDefinitions.js",
  "src/legacy/deps/gameCoreRuntimeDependencyDefinitions.js",
  "src/legacy/gameCoreBridge.js",
  "src/legacy/gameCoreRuntime.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreDependencies({
  bridgeDependencies: defaultGameCoreBridgeDependencies,
  runtimeDependencies: defaultGameCoreRuntimeDependencies,
  sourceTexts,
});

console.log(formatGameCoreDependencyVerification(result));
