import { readFile } from "node:fs/promises";

import {
  assertGameCoreBridgeLeafApis,
  formatGameCoreBridgeLeafApiVerification,
} from "../src/legacy/public/gameCoreBridgeLeafApiValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/progress/gameCoreProgressApi.js",
  "src/legacy/report/gameCoreReportApi.js",
  "src/legacy/simulation/gameCoreSimulationApi.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreBridgeLeafApis({ sourceTexts });

console.log(formatGameCoreBridgeLeafApiVerification(result));
