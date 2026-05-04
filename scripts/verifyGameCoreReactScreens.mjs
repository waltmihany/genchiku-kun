import { readFile } from "node:fs/promises";

import * as publicEntryModule from "../src/legacy/gameCore.js";
import {
  assertGameCoreReactScreenBindings,
  formatGameCoreReactScreenVerification,
} from "../src/legacy/public/gameCoreReactScreenValidation.js";

function extractExportedFunctionNames(sourceText) {
  return [...sourceText.matchAll(/export function\s+([A-Za-z0-9_]+)/g)]
    .map(([, name]) => name)
    .sort();
}

const gameScreensSource = await readFile(new URL("../src/components/GameScreens.jsx", import.meta.url), "utf8");
const gameScreenExportNames = extractExportedFunctionNames(gameScreensSource);

const result = assertGameCoreReactScreenBindings({
  publicEntryModule,
  gameScreenExportNames,
});

console.log(formatGameCoreReactScreenVerification(result));
