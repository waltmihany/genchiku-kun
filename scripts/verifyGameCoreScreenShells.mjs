import { readFile } from "node:fs/promises";

import {
  assertGameCoreScreenShells,
  formatGameCoreScreenShellVerification,
} from "../src/legacy/public/gameCoreScreenShellValidation.js";

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
const result = assertGameCoreScreenShells({ sourceTexts });

console.log(formatGameCoreScreenShellVerification(result));
