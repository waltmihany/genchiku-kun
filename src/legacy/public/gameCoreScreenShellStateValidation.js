import {
  GAME_CORE_SCREEN_SHELL_STATE_POLICY,
  GAME_CORE_SCREEN_SHELL_STATE_SPECS,
} from "./gameCoreScreenShellStateContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/components/GameScreens.jsx",
    requiredSnippets: Object.freeze([
      "const [showCarryover, setShowCarryover] = useState(Boolean(viewModel.carryover));",
      "const [showNotes, setShowNotes] = useState(false);",
      "const [showGuide, setShowGuide] = useState(false);",
      "const [expandedRow, setExpandedRow] = useState(viewModel.rows[0]?.key || null);",
      "const [showSummary, setShowSummary] = useState(true);",
      "const [showCausal, setShowCausal] = useState(false);",
      "const [showFlow, setShowFlow] = useState(false);",
      "const [expandedIndex, setExpandedIndex] = useState(viewModel?.recommendedIndex ?? 0);",
      "useEffect(() => {",
      "}, [viewModel?.eventKey, viewModel?.recommendedIndex]);",
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

function extractStateVariableNames(componentSource) {
  return [...componentSource.matchAll(/const\s*\[\s*([A-Za-z0-9_]+)\s*,\s*[A-Za-z0-9_]+\s*\]\s*=\s*useState\(/g)]
    .map(([, variableName]) => variableName)
    .sort();
}

export function verifyGameCoreScreenShellState({ sourceTexts }) {
  const issues = [];
  const sourceText = sourceTexts["src/components/GameScreens.jsx"] || "";

  GAME_CORE_SCREEN_SHELL_STATE_SPECS.forEach((spec) => {
    const componentSource = extractComponentChunk(sourceText, spec.componentName);
    if (!componentSource) {
      issues.push(`missing stateful screen shell export: ${spec.componentName}`);
      return;
    }

    const actualStateVariableNames = extractStateVariableNames(componentSource);
    const missingStateVariableNames = spec.stateVariableNames.filter((name) => !actualStateVariableNames.includes(name));
    const unexpectedStateVariableNames = actualStateVariableNames
      .filter((name) => !spec.stateVariableNames.includes(name))
      .sort();
    pushListIssue(issues, `missing local state variables on ${spec.componentName}`, missingStateVariableNames);
    pushListIssue(issues, `unexpected local state variables on ${spec.componentName}`, unexpectedStateVariableNames);

    const hasUseEffect = componentSource.includes("useEffect(() => {");
    if (hasUseEffect !== spec.usesEffect) {
      issues.push(`useEffect usage mismatch on ${spec.componentName}`);
    }

    if (spec.usesEffect) {
      const missingDependencySnippets = (spec.effectDependencySnippets || []).filter(
        (snippet) => !componentSource.includes(snippet),
      );
      pushListIssue(issues, `missing effect dependency snippets on ${spec.componentName}`, missingDependencySnippets);
    }
  });

  SOURCE_RULES.forEach((rule) => {
    const currentSourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !currentSourceText.includes(snippet));
    pushListIssue(issues, `missing screen shell state snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(currentSourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden screen shell state patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_SCREEN_SHELL_STATE_POLICY.owner,
      statefulComponents: GAME_CORE_SCREEN_SHELL_STATE_SPECS.length,
      stateVariables: GAME_CORE_SCREEN_SHELL_STATE_SPECS.reduce((sum, spec) => sum + spec.stateVariableNames.length, 0),
      effectfulComponents: GAME_CORE_SCREEN_SHELL_STATE_SPECS.filter((spec) => spec.usesEffect).length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreScreenShellStateVerification(result) {
  if (result.ok) {
    return [
      "gameCore screen shell state verification: OK",
      `- owner: ${result.counts.owner}`,
      `- stateful components: ${result.counts.statefulComponents}`,
      `- local state variables: ${result.counts.stateVariables}`,
      `- effectful components: ${result.counts.effectfulComponents}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore screen shell state verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreScreenShellState(ctx) {
  const result = verifyGameCoreScreenShellState(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreScreenShellStateVerification(result));
  }
  return result;
}
