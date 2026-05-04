import {
  createGameCoreUtilsShape,
  defaultGameCoreUtils,
  GAME_CORE_UTILS_POLICY,
  GAME_CORE_UTILS_FUNCTION_NAMES,
} from "../deps/gameCoreUtilsDefinitions.js";
import { defaultGameCoreRuntimeDependencies } from "../deps/gameCoreRuntimeDependencyDefinitions.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: GAME_CORE_UTILS_POLICY.modulePath,
    requiredSnippets: Object.freeze(
      GAME_CORE_UTILS_FUNCTION_NAMES.map((name) => `export function ${name}`),
    ),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function verifyExactKeys(issues, label, value, requiredKeys) {
  const actualKeys = Object.keys(value || {}).sort();
  const missingKeys = requiredKeys.filter((key) => !(key in (value || {})));
  const unexpectedKeys = actualKeys.filter((key) => !requiredKeys.includes(key));
  pushListIssue(issues, `missing keys for ${label}`, missingKeys);
  pushListIssue(issues, `unexpected keys for ${label}`, unexpectedKeys);
}

export function verifyGameCoreUtils({ sourceTexts }) {
  const issues = [];

  verifyExactKeys(issues, "default utils", defaultGameCoreUtils, GAME_CORE_UTILS_FUNCTION_NAMES);
  const nonCallable = GAME_CORE_UTILS_FUNCTION_NAMES.filter(
    (name) => typeof defaultGameCoreUtils[name] !== "function",
  );
  pushListIssue(issues, "non-callable utils", nonCallable);

  const shapedUtils = createGameCoreUtilsShape(defaultGameCoreUtils);
  verifyExactKeys(issues, "utils shape factory", shapedUtils, GAME_CORE_UTILS_FUNCTION_NAMES);
  if (!Object.isFrozen(shapedUtils)) {
    issues.push("utils shape factory result is not frozen");
  }

  const missingRuntimeCoverage = GAME_CORE_UTILS_FUNCTION_NAMES.filter(
    (name) => typeof defaultGameCoreRuntimeDependencies[name] !== "function",
  );
  pushListIssue(issues, "missing runtime dependency coverage for utils", missingRuntimeCoverage);

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing utils snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden utils patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_UTILS_POLICY.owner,
      utils: GAME_CORE_UTILS_FUNCTION_NAMES.length,
      runtimeCoverage: GAME_CORE_UTILS_FUNCTION_NAMES.length - missingRuntimeCoverage.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreUtilsVerification(result) {
  if (result.ok) {
    return [
      "gameCore utils verification: OK",
      `- owner: ${result.counts.owner}`,
      `- exported utils: ${result.counts.utils}`,
      `- runtime dependency coverage: ${result.counts.runtimeCoverage}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore utils verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreUtils(ctx) {
  const result = verifyGameCoreUtils(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreUtilsVerification(result));
  }
  return result;
}
