import {
  GAME_CORE_SCREEN_SHELL_VIEW_MODEL_POLICY,
  GAME_CORE_SCREEN_SHELL_VIEW_MODEL_SPECS,
} from "./gameCoreScreenShellViewModelContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/components/GameScreens.jsx",
    requiredSnippets: Object.freeze([
      "viewModel.progress",
      "viewModel.map",
      "viewModel.rows",
      "viewModel.selected",
      "viewModel.toneClass",
      "viewModel?.recommendedIndex",
      "viewModel.eyebrow",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function extractComponentChunk(sourceText, componentName) {
  const start = sourceText.indexOf(`export function ${componentName}`);
  if (start === -1) return "";
  const nextIndex = sourceText.indexOf("export function ", start + 1);
  return sourceText.slice(start, nextIndex === -1 ? sourceText.length : nextIndex);
}

function extractTopLevelViewModelKeys(componentSource) {
  return [...new Set(
    [...componentSource.matchAll(/viewModel(?:\?\.|\.)([A-Za-z0-9_]+)/g)].map(([, keyName]) => keyName),
  )].sort();
}

export function verifyGameCoreScreenShellViewModels({ sourceTexts }) {
  const issues = [];
  const sourceText = sourceTexts["src/components/GameScreens.jsx"] || "";

  GAME_CORE_SCREEN_SHELL_VIEW_MODEL_SPECS.forEach((spec) => {
    const componentSource = extractComponentChunk(sourceText, spec.componentName);
    if (!componentSource) {
      issues.push(`missing screen shell for view-model contract: ${spec.componentName}`);
      return;
    }

    const actualKeys = extractTopLevelViewModelKeys(componentSource);
    const missingKeys = spec.topLevelViewModelKeys.filter((keyName) => !actualKeys.includes(keyName));
    const unexpectedKeys = actualKeys
      .filter((keyName) => !spec.topLevelViewModelKeys.includes(keyName))
      .sort();
    pushListIssue(issues, `missing view-model keys on ${spec.componentName}`, missingKeys);
    pushListIssue(issues, `unexpected view-model keys on ${spec.componentName}`, unexpectedKeys);
  });

  SOURCE_RULES.forEach((rule) => {
    const currentSourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !currentSourceText.includes(snippet));
    pushListIssue(issues, `missing screen shell view-model snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(currentSourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden screen shell view-model patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_SCREEN_SHELL_VIEW_MODEL_POLICY.owner,
      components: GAME_CORE_SCREEN_SHELL_VIEW_MODEL_SPECS.length,
      topLevelKeys: GAME_CORE_SCREEN_SHELL_VIEW_MODEL_SPECS.reduce((sum, spec) => sum + spec.topLevelViewModelKeys.length, 0),
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreScreenShellViewModelVerification(result) {
  if (result.ok) {
    return [
      "gameCore screen shell view-model verification: OK",
      `- owner: ${result.counts.owner}`,
      `- components: ${result.counts.components}`,
      `- top-level view-model keys: ${result.counts.topLevelKeys}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore screen shell view-model verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreScreenShellViewModels(ctx) {
  const result = verifyGameCoreScreenShellViewModels(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreScreenShellViewModelVerification(result));
  }
  return result;
}
