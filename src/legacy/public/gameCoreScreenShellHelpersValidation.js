import {
  GAME_CORE_SCREEN_SHELL_HELPERS_POLICY,
  GAME_CORE_SCREEN_SHELL_HELPER_SPECS,
} from "./gameCoreScreenShellHelpersContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/components/GameScreens.jsx",
    requiredSnippets: Object.freeze([
      "function Meter({ value, color })",
      "function handleMapTargetKeyDown(event, targetId, onSelectMapTarget)",
      "function DashboardMapSection({ map, onSelectMapTarget })",
      "<Meter value={stat.meterValue} color={stat.meterColor} />",
      "<DashboardMapSection map={viewModel.map} onSelectMapTarget={onSelectMapTarget} />",
      "handleMapTargetKeyDown(event, road.id, onSelectMapTarget)",
      "handleMapTargetKeyDown(event, bridge.id, onSelectMapTarget)",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function extractHelperSignatures(sourceText) {
  const helperMap = new Map();
  [...sourceText.matchAll(/function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g)].forEach(([, helperName, paramsText]) => {
    const trimmed = paramsText.trim();
    const signatureKind = trimmed.startsWith("{") ? "destructured-object" : "positional-params";
    const normalized = trimmed
      .replace(/[{}]/g, "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    helperMap.set(helperName, {
      signatureKind,
      parameterNames: normalized,
    });
  });
  return helperMap;
}

export function verifyGameCoreScreenShellHelpers({ sourceTexts }) {
  const issues = [];
  const sourceText = sourceTexts["src/components/GameScreens.jsx"] || "";
  const helperSignatures = extractHelperSignatures(sourceText);

  GAME_CORE_SCREEN_SHELL_HELPER_SPECS.forEach((spec) => {
    const actual = helperSignatures.get(spec.helperName);
    if (!actual) {
      issues.push(`missing screen shell helper: ${spec.helperName}`);
      return;
    }
    if (actual.signatureKind !== spec.signatureKind) {
      issues.push(`screen shell helper signature kind mismatch: ${spec.helperName}`);
    }
    const missingParameterNames = spec.parameterNames.filter((name) => !actual.parameterNames.includes(name));
    const unexpectedParameterNames = actual.parameterNames
      .filter((name) => !spec.parameterNames.includes(name))
      .sort();
    pushListIssue(issues, `missing parameters on helper ${spec.helperName}`, missingParameterNames);
    pushListIssue(issues, `unexpected parameters on helper ${spec.helperName}`, unexpectedParameterNames);
  });

  SOURCE_RULES.forEach((rule) => {
    const currentSourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !currentSourceText.includes(snippet));
    pushListIssue(issues, `missing screen shell helper snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(currentSourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden screen shell helper patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_SCREEN_SHELL_HELPERS_POLICY.owner,
      helpers: GAME_CORE_SCREEN_SHELL_HELPER_SPECS.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreScreenShellHelpersVerification(result) {
  if (result.ok) {
    return [
      "gameCore screen shell helper verification: OK",
      `- owner: ${result.counts.owner}`,
      `- helpers: ${result.counts.helpers}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore screen shell helper verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreScreenShellHelpers(ctx) {
  const result = verifyGameCoreScreenShellHelpers(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreScreenShellHelpersVerification(result));
  }
  return result;
}
