export const GAME_CORE_SCREEN_SHELL_VIEW_MODEL_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/components/GameScreens.jsx",
});

export const GAME_CORE_SCREEN_SHELL_VIEW_MODEL_SPECS = Object.freeze([
  Object.freeze({
    componentName: "OnboardingOverlay",
    topLevelViewModelKeys: Object.freeze(["progress", "totalSteps", "title", "lead", "bullets", "tips", "secondaryLabel", "primaryLabel"]),
  }),
  Object.freeze({
    componentName: "DashboardScreenShell",
    topLevelViewModelKeys: Object.freeze(["yearLabel", "subtitle", "chips", "stats", "regions", "map", "summaryChips", "summaryMessage", "lastChoiceResult", "actionText", "primaryActionLabel", "deconstructionItems", "staffItems", "stickySubtext", "stickyActionLabel"]),
  }),
  Object.freeze({
    componentName: "BudgetScreenShell",
    topLevelViewModelKeys: Object.freeze(["carryover", "rows", "noteItems", "guideCards", "mixSegments", "overviewCards", "presets", "warningMode", "recommendedPresetLabel", "recommendedReason", "presetSummary", "dramaSubtitle", "activePresetLabel", "activePresetVoice", "total", "year"]),
  }),
  Object.freeze({
    componentName: "ReportScreenShell",
    topLevelViewModelKeys: Object.freeze(["selected", "summaries", "guides", "causalColumns", "entries"]),
  }),
  Object.freeze({
    componentName: "ResultScreenShell",
    topLevelViewModelKeys: Object.freeze(["toneClass", "badge", "headline", "lead", "closing", "focusSummary", "focusChips", "isClear", "actionLead", "nextSteps", "metricCards", "sectionTitle", "budgetLabel", "mainFactors", "secondaryTitle", "subFactors", "flowPreview", "budgetFocusItems", "eventHighlights", "outcomeSignals", "diagnosisPreview", "regions", "weakestInfra", "hasReport"]),
  }),
  Object.freeze({
    componentName: "EventScreenShell",
    topLevelViewModelKeys: Object.freeze(["recommendedIndex", "eventKey", "metaChips", "title", "body", "contextCards", "guideTags", "choices"]),
  }),
  Object.freeze({
    componentName: "TitleScreenShell",
    topLevelViewModelKeys: Object.freeze(["eyebrow", "title", "description", "points", "startLabel", "stats"]),
  }),
]);
