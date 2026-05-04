globalThis.alert = () => {};

import { readFile } from "node:fs/promises";

import {
  assertGameCorePublicFacades,
  formatGameCorePublicFacadeVerification,
} from "../src/legacy/public/gameCorePublicFacadeValidation.js";

const SOURCE_FILE_PATHS = [
  "src/legacy/gameCorePublicApi.js",
  "src/legacy/public/gameCoreBridgeFacade.js",
  "src/legacy/public/gameCoreRuntimeFacade.js",
  "src/legacy/gameCore.js",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCorePublicFacades({ sourceTexts });

console.log(formatGameCorePublicFacadeVerification(result));
