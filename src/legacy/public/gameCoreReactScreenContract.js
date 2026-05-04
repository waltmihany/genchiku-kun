import {
  GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES,
} from "./gameCorePublicContract.js";

function uniqueList(values) {
  return [...new Set(values)];
}

function bindActionProps(gameCore, actionMethodNames = {}) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(actionMethodNames).map(([propName, methodName]) => [
        propName,
        gameCore[methodName],
      ]),
    ),
  );
}

function createResolvedBinding(spec, gameCore, components) {
  return Object.freeze({
    ...spec,
    Component: components[spec.componentName],
    getViewModel: gameCore[spec.viewModelMethodName],
    actionProps: bindActionProps(gameCore, spec.actionMethodNames),
  });
}

export const GAME_CORE_REACT_SCREEN_SPECS = Object.freeze([
  Object.freeze({
    screenKeys: Object.freeze(["title"]),
    componentName: "TitleScreenShell",
    viewModelMethodName: "getTitleViewModel",
    actionMethodNames: Object.freeze({
      onStart: "runTitleStartGame",
    }),
    integrationKind: "legacy-bound",
    shellKind: "pure-view",
  }),
  Object.freeze({
    screenKeys: Object.freeze(["dashboard"]),
    componentName: "DashboardScreenShell",
    viewModelMethodName: "getDashboardViewModel",
    actionMethodNames: Object.freeze({
      onPrimaryAction: "runDashboardPrimaryAction",
      onSelectMapTarget: "runDashboardSelectMapTarget",
    }),
    integrationKind: "legacy-bound",
    shellKind: "pure-view",
  }),
  Object.freeze({
    screenKeys: Object.freeze(["budget"]),
    componentName: "BudgetScreenShell",
    viewModelMethodName: "getBudgetViewModel",
    actionMethodNames: Object.freeze({
      onSelectPreset: "runBudgetSelectPreset",
      onAutoBalance: "runBudgetAutoBalance",
      onApplyPlan: "runBudgetApplyPlan",
      onStep: "runBudgetStep",
      onSetValue: "runBudgetSetValue",
    }),
    integrationKind: "legacy-bound",
    shellKind: "view-with-local-ui-state",
  }),
  Object.freeze({
    screenKeys: Object.freeze(["report"]),
    componentName: "ReportScreenShell",
    viewModelMethodName: "getReportViewModel",
    actionMethodNames: Object.freeze({
      onSelectEntry: "runReportSelectEntry",
      onOpenBudget: "runReportOpenBudget",
    }),
    integrationKind: "legacy-bound",
    shellKind: "view-with-local-ui-state",
  }),
  Object.freeze({
    screenKeys: Object.freeze(["event"]),
    componentName: "EventScreenShell",
    viewModelMethodName: "getEventViewModel",
    actionMethodNames: Object.freeze({
      onChoose: "runEventChooseChoice",
    }),
    integrationKind: "legacy-bound",
    shellKind: "view-with-local-ui-state",
  }),
  Object.freeze({
    screenKeys: Object.freeze(["clear", "gameover"]),
    componentName: "ResultScreenShell",
    viewModelMethodName: "getResultViewModel",
    actionMethodNames: Object.freeze({
      onRestart: "runResultRestart",
      onReviewReport: "runResultReviewReport",
    }),
    integrationKind: "legacy-bound",
    shellKind: "view-with-local-ui-state",
  }),
]);

export const GAME_CORE_REACT_OVERLAY_SPECS = Object.freeze([
  Object.freeze({
    overlayKey: "onboarding",
    componentName: "OnboardingOverlay",
    viewModelMethodName: "getOnboardingViewModel",
    actionMethodNames: Object.freeze({
      onPrimaryAction: "runOnboardingPrimaryAction",
      onSkip: "runOnboardingSkipAction",
    }),
    integrationKind: "legacy-bound",
    shellKind: "pure-view",
  }),
]);

export const GAME_CORE_REACT_RUNTIME_SPEC = Object.freeze({
  snapshotMethodName: "getGameViewSnapshot",
  subscribeMethodName: "subscribeGameView",
  mountMethodName: "mountLegacyGame",
  topbarActionMethodNames: Object.freeze({
    onRestart: "runRestartFromTopbar",
  }),
});

export const GAME_CORE_REACT_SCREEN_VIEW_MODEL_METHOD_NAMES = Object.freeze(uniqueList([
  ...GAME_CORE_REACT_SCREEN_SPECS.map((spec) => spec.viewModelMethodName),
  ...GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.viewModelMethodName),
]));

export const GAME_CORE_REACT_SCREEN_ACTION_METHOD_NAMES = Object.freeze(uniqueList([
  ...GAME_CORE_REACT_SCREEN_SPECS.flatMap((spec) => Object.values(spec.actionMethodNames)),
  ...GAME_CORE_REACT_OVERLAY_SPECS.flatMap((spec) => Object.values(spec.actionMethodNames)),
  ...Object.values(GAME_CORE_REACT_RUNTIME_SPEC.topbarActionMethodNames),
]));

export const GAME_CORE_REACT_RUNTIME_METHOD_NAMES = Object.freeze([
  GAME_CORE_REACT_RUNTIME_SPEC.snapshotMethodName,
  GAME_CORE_REACT_RUNTIME_SPEC.subscribeMethodName,
  GAME_CORE_REACT_RUNTIME_SPEC.mountMethodName,
]);

export const GAME_CORE_REACT_APP_BOUND_METHOD_NAMES = Object.freeze(uniqueList([
  ...GAME_CORE_REACT_RUNTIME_METHOD_NAMES,
  ...GAME_CORE_REACT_SCREEN_VIEW_MODEL_METHOD_NAMES,
  ...GAME_CORE_REACT_SCREEN_ACTION_METHOD_NAMES,
]));

export const GAME_CORE_REACT_SCREEN_KEYS = Object.freeze(
  GAME_CORE_REACT_SCREEN_SPECS.flatMap((spec) => spec.screenKeys),
);

export const GAME_CORE_REACT_SCREEN_COMPONENT_NAMES = Object.freeze(
  uniqueList(GAME_CORE_REACT_SCREEN_SPECS.map((spec) => spec.componentName)).sort(),
);

export const GAME_CORE_REACT_OVERLAY_COMPONENT_NAMES = Object.freeze(
  uniqueList(GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.componentName)).sort(),
);

export function createGameCoreReactScreenRegistry({ gameCore, components }) {
  return Object.freeze(
    Object.fromEntries(
      GAME_CORE_REACT_SCREEN_SPECS.flatMap((spec) => {
        const resolved = createResolvedBinding(spec, gameCore, components);
        return spec.screenKeys.map((screenKey) => [screenKey, resolved]);
      }),
    ),
  );
}

export function createGameCoreReactOverlayRegistry({ gameCore, components }) {
  return Object.freeze(
    Object.fromEntries(
      GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => [
        spec.overlayKey,
        createResolvedBinding(spec, gameCore, components),
      ]),
    ),
  );
}

export function createGameCoreReactRuntimeBindings(gameCore) {
  return Object.freeze({
    getGameViewSnapshot: gameCore[GAME_CORE_REACT_RUNTIME_SPEC.snapshotMethodName],
    subscribeGameView: gameCore[GAME_CORE_REACT_RUNTIME_SPEC.subscribeMethodName],
    mountLegacyGame: gameCore[GAME_CORE_REACT_RUNTIME_SPEC.mountMethodName],
    topbarActionProps: bindActionProps(gameCore, GAME_CORE_REACT_RUNTIME_SPEC.topbarActionMethodNames),
  });
}

export function createGameCoreReactBindings({ gameCore, screenComponents, overlayComponents }) {
  return Object.freeze({
    screens: createGameCoreReactScreenRegistry({
      gameCore,
      components: screenComponents,
    }),
    overlays: createGameCoreReactOverlayRegistry({
      gameCore,
      components: overlayComponents,
    }),
    runtime: createGameCoreReactRuntimeBindings(gameCore),
  });
}

export function isGameCoreReactBridgeMethod(methodName) {
  return GAME_CORE_BRIDGE_PUBLIC_METHOD_NAMES.includes(methodName);
}

export function isGameCoreReactRuntimeMethod(methodName) {
  return GAME_CORE_RUNTIME_PUBLIC_METHOD_NAMES.includes(methodName);
}
