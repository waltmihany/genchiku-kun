export const GAME_CORE_SCREEN_SHELL_STATE_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/components/GameScreens.jsx",
});

export const GAME_CORE_SCREEN_SHELL_STATE_SPECS = Object.freeze([
  Object.freeze({
    componentName: "BudgetScreenShell",
    stateVariableNames: Object.freeze(["showCarryover", "showNotes", "showGuide", "expandedRow"]),
    usesEffect: false,
  }),
  Object.freeze({
    componentName: "ReportScreenShell",
    stateVariableNames: Object.freeze(["showSummary", "showGuide", "showCausal", "showTrace", "showQuickSummary", "showFacts", "showBias"]),
    usesEffect: false,
  }),
  Object.freeze({
    componentName: "ResultScreenShell",
    stateVariableNames: Object.freeze(["showFlow", "showDiagnosis"]),
    usesEffect: false,
  }),
  Object.freeze({
    componentName: "EventScreenShell",
    stateVariableNames: Object.freeze(["expandedIndex"]),
    usesEffect: true,
    effectDependencySnippets: Object.freeze(["viewModel?.eventKey", "viewModel?.recommendedIndex"]),
  }),
]);
