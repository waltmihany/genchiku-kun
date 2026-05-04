import { createGameCoreScreenTransitions } from "../gameCoreScreenTransitions.js";
import {
  GAME_CORE_SCREEN_TRANSITION_ACTION_METHOD_NAMES,
  GAME_CORE_SCREEN_TRANSITION_BRIDGE_ACTION_METHOD_NAMES,
  GAME_CORE_SCREEN_TRANSITION_HELPER_METHOD_NAMES,
  GAME_CORE_SCREEN_TRANSITION_MANAGED_SCREEN_NAMES,
  GAME_CORE_SCREEN_TRANSITION_POLICY,
  GAME_CORE_SCREEN_TRANSITION_RUNTIME_ACTION_METHOD_NAMES,
  uniqueGameCoreScreenTransitionManagedScreens,
} from "./gameCoreScreenTransitionContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/bridge/gameCoreBridgeApiBundle.js",
    requiredSnippets: Object.freeze([
      "createGameCoreScreenTransitions",
      "const screenTransitions = createGameCoreScreenTransitions",
      "screenTransitions,",
    ]),
    forbiddenPatterns: Object.freeze([]),
  }),
  Object.freeze({
    filePath: "src/legacy/reactApi/gameCoreTitleReactApi.js",
    requiredSnippets: Object.freeze([
      "screenTransitions.showDashboard()",
      "screenTransitions.restartToTitle()",
    ]),
    forbiddenPatterns: Object.freeze([/gameState\.screen\s*=\s*\"dashboard\"/, /resetGame\(/]),
  }),
  Object.freeze({
    filePath: "src/legacy/reactApi/gameCoreOnboardingReactApi.js",
    requiredSnippets: Object.freeze([
      "screenTransitions.showReport()",
      "screenTransitions.showBudget()",
      "screenTransitions.renderCurrentScreen()",
    ]),
    forbiddenPatterns: Object.freeze([/setScreen\(/]),
  }),
  Object.freeze({
    filePath: "src/legacy/reactApi/gameCoreDashboardReactApi.js",
    requiredSnippets: Object.freeze([
      "screenTransitions.showReport()",
      "screenTransitions.showBudget()",
    ]),
    forbiddenPatterns: Object.freeze([/setScreen\(/]),
  }),
  Object.freeze({
    filePath: "src/legacy/report/gameCoreReportApi.js",
    requiredSnippets: Object.freeze([
      "screenTransitions.showBudget()",
      "screenTransitions.restartToDashboard()",
      "screenTransitions.showReport()",
    ]),
    forbiddenPatterns: Object.freeze([/setScreen\(/, /resetGame\(/, /gameState\.screen\s*=\s*\"report\"/]),
  }),
  Object.freeze({
    filePath: "src/legacy/progress/gameCoreProgressApi.js",
    requiredSnippets: Object.freeze([
      "screenTransitions.showDashboard()",
      "screenTransitions.showEvent()",
      "screenTransitions.showClear()",
      "screenTransitions.showGameOver()",
    ]),
    forbiddenPatterns: Object.freeze([/setScreen\(/, /gameState\.screen\s*=\s*\"dashboard\"/, /gameState\.screen\s*=\s*\"clear\"/, /gameState\.screen\s*=\s*\"gameover\"/]),
  }),
]);

function uniqueList(values) {
  return [...new Set(values)];
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

export function verifyGameCoreScreenTransitions({
  publicEntryModule,
  sourceTexts,
}) {
  const issues = [];
  const transitionController = createGameCoreScreenTransitions({
    gameState: { screen: "title", phase: "report" },
    setScreen: () => {},
    render: () => {},
    resetGame: () => {},
  });

  pushListIssue(
    issues,
    "missing bridge transition methods on stable entry module",
    findMissingCallableNames(publicEntryModule, GAME_CORE_SCREEN_TRANSITION_BRIDGE_ACTION_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "missing runtime transition methods on stable entry module",
    findMissingCallableNames(publicEntryModule, GAME_CORE_SCREEN_TRANSITION_RUNTIME_ACTION_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "missing screen transition helper methods",
    findMissingCallableNames(transitionController, GAME_CORE_SCREEN_TRANSITION_HELPER_METHOD_NAMES),
  );
  pushListIssue(
    issues,
    "duplicate managed screens",
    GAME_CORE_SCREEN_TRANSITION_MANAGED_SCREEN_NAMES.filter((screen, index, values) => values.indexOf(screen) !== index),
  );

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing transition snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden transition patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      policy: GAME_CORE_SCREEN_TRANSITION_POLICY.navigationOwner,
      managedScreens: uniqueGameCoreScreenTransitionManagedScreens().length,
      bridgeActions: GAME_CORE_SCREEN_TRANSITION_BRIDGE_ACTION_METHOD_NAMES.length,
      runtimeActions: GAME_CORE_SCREEN_TRANSITION_RUNTIME_ACTION_METHOD_NAMES.length,
      helperMethods: GAME_CORE_SCREEN_TRANSITION_HELPER_METHOD_NAMES.length,
      sourceRules: SOURCE_RULES.length,
      transitionActions: GAME_CORE_SCREEN_TRANSITION_ACTION_METHOD_NAMES.length,
    },
  };
}

export function formatGameCoreScreenTransitionVerification(result) {
  if (result.ok) {
    return [
      "gameCore screen transition verification: OK",
      `- navigation owner: ${result.counts.policy}`,
      `- managed screens: ${result.counts.managedScreens}`,
      `- bridge transition actions: ${result.counts.bridgeActions}`,
      `- runtime transition actions: ${result.counts.runtimeActions}`,
      `- transition helper methods: ${result.counts.helperMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore screen transition verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreScreenTransitions(ctx) {
  const result = verifyGameCoreScreenTransitions(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreScreenTransitionVerification(result));
  }
  return result;
}
