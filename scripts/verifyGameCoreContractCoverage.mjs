import { readdir, readFile } from "node:fs/promises";

import {
  assertGameCoreContractCoverage,
  formatGameCoreContractCoverageVerification,
} from "../src/legacy/public/gameCoreVerificationCoverageValidation.js";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const existingScriptFiles = (await readdir(new URL("../scripts/", import.meta.url)))
  .filter((name) => name.endsWith(".mjs"))
  .map((name) => `scripts/${name}`)
  .sort();

const result = assertGameCoreContractCoverage({
  packageJson,
  existingScriptFiles,
});

console.log(formatGameCoreContractCoverageVerification(result));
