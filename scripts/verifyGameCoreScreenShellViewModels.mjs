import { readFile } from "node:fs/promises";

import {
  assertGameCoreScreenShellViewModels,
  formatGameCoreScreenShellViewModelVerification,
} from "../src/legacy/public/gameCoreScreenShellViewModelValidation.js";

const SOURCE_FILE_PATHS = [
  "src/components/GameScreens.jsx",
];

const sourceEntries = await Promise.all(
  SOURCE_FILE_PATHS.map(async (filePath) => [
    filePath,
    await readFile(new URL(`../${filePath}`, import.meta.url), "utf8"),
  ]),
);

const sourceTexts = Object.fromEntries(sourceEntries);
const result = assertGameCoreScreenShellViewModels({ sourceTexts });

console.log(formatGameCoreScreenShellViewModelVerification(result));
