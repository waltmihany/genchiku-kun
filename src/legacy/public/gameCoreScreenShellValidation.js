import {
  GAME_CORE_SCREEN_SHELL_COMPONENT_NAMES,
  GAME_CORE_SCREEN_SHELL_POLICY,
  GAME_CORE_SCREEN_SHELL_PROP_SPECS,
} from "./gameCoreScreenShellContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/components/GameScreens.jsx",
    requiredSnippets: Object.freeze([
      "export function OnboardingOverlay({ viewModel, onPrimaryAction, onSkip })",
      "export function DashboardScreenShell({ viewModel, onPrimaryAction, onSelectMapTarget })",
      "export function BudgetScreenShell({ viewModel, onSelectPreset, onAutoBalance, onApplyPlan, onStep, onSetValue })",
      "export function ReportScreenShell({ viewModel, onSelectEntry, onOpenBudget })",
      "export function ResultScreenShell({ viewModel, onRestart, onReviewReport })",
      "export function EventScreenShell({ viewModel, onChoose })",
      "export function TitleScreenShell({ viewModel, onStart })",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function uniqueList(values) {
  return [...new Set(values)];
}

function extractExportedComponentProps(sourceText) {
  return Object.fromEntries(
    [...sourceText.matchAll(/export function\s+([A-Za-z0-9_]+)\s*\(\{([^}]*)\}\)/g)].map(([, componentName, propsText]) => [
      componentName,
      propsText
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ]),
  );
}

export function verifyGameCoreScreenShells({ sourceTexts }) {
  const issues = [];
  const sourceText = sourceTexts["src/components/GameScreens.jsx"] || "";
  const exportedPropsByComponent = extractExportedComponentProps(sourceText);

  pushListIssue(
    issues,
    "missing screen shell exports",
    GAME_CORE_SCREEN_SHELL_COMPONENT_NAMES
      .filter((componentName) => !(componentName in exportedPropsByComponent))
      .sort(),
  );

  GAME_CORE_SCREEN_SHELL_PROP_SPECS.forEach((spec) => {
    const actualPropNames = exportedPropsByComponent[spec.componentName] || [];
    const missingPropNames = spec.propNames.filter((propName) => !actualPropNames.includes(propName));
    const unexpectedPropNames = actualPropNames
      .filter((propName) => !spec.propNames.includes(propName))
      .sort();
    pushListIssue(issues, `missing props on ${spec.componentName}`, missingPropNames);
    pushListIssue(issues, `unexpected props on ${spec.componentName}`, unexpectedPropNames);
  });

  pushListIssue(
    issues,
    "duplicate screen shell component names",
    uniqueList(
      GAME_CORE_SCREEN_SHELL_COMPONENT_NAMES.filter((name, index, values) => values.indexOf(name) !== index),
    ),
  );

  SOURCE_RULES.forEach((rule) => {
    const currentSourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !currentSourceText.includes(snippet));
    pushListIssue(issues, `missing screen shell snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(currentSourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden screen shell patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_SCREEN_SHELL_POLICY.owner,
      components: GAME_CORE_SCREEN_SHELL_COMPONENT_NAMES.length,
      propSpecs: GAME_CORE_SCREEN_SHELL_PROP_SPECS.length,
      uniqueProps: uniqueList(GAME_CORE_SCREEN_SHELL_PROP_SPECS.flatMap((spec) => spec.propNames)).length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreScreenShellVerification(result) {
  if (result.ok) {
    return [
      "gameCore screen shell verification: OK",
      `- owner: ${result.counts.owner}`,
      `- components: ${result.counts.components}`,
      `- prop specs: ${result.counts.propSpecs}`,
      `- unique props: ${result.counts.uniqueProps}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore screen shell verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreScreenShells(ctx) {
  const result = verifyGameCoreScreenShells(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreScreenShellVerification(result));
  }
  return result;
}
