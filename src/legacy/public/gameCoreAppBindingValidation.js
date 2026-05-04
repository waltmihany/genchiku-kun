import {
  createGameCoreReactBindings,
  GAME_CORE_REACT_OVERLAY_SPECS,
  GAME_CORE_REACT_RUNTIME_SPEC,
  GAME_CORE_REACT_SCREEN_SPECS,
} from "./gameCoreReactScreenContract.js";
import {
  GAME_CORE_APP_BINDING_POLICY,
  GAME_CORE_APP_BINDING_GROUP_NAMES,
  GAME_CORE_APP_MANAGED_SCREEN_KEYS,
  GAME_CORE_APP_OVERLAY_KEYS,
  GAME_CORE_APP_RUNTIME_METHOD_NAMES,
} from "./gameCoreAppBindingContract.js";

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/App.jsx",
    requiredSnippets: Object.freeze([
      "createGameCoreReactBindings",
      "const gameCoreReactBindings = createGameCoreReactBindings({",
      "screenComponents: GAME_CORE_SCREEN_COMPONENTS",
      "overlayComponents: GAME_CORE_OVERLAY_COMPONENTS",
      "const onboardingBinding = gameCoreReactBindings.overlays.onboarding",
      "const runtimeBindings = gameCoreReactBindings.runtime",
      "useState(() => runtimeBindings.getGameViewSnapshot())",
      "const unsubscribe = runtimeBindings.subscribeGameView(setView)",
      "const cleanup = runtimeBindings.mountLegacyGame(hostRef.current)",
      '<div id="reactScreenHost">',
      '<div id="screenContainer"></div>',
      'id="restartTopBtn"',
      '<ReactManagedScreen screen={view.screen} />',
      '<onboardingBinding.Component',
    ]),
    forbiddenPatterns: Object.freeze([
      /createGameCoreReactScreenRegistry\(/,
      /createGameCoreReactOverlayRegistry\(/,
      /createGameCoreReactRuntimeBindings\(/,
      /Object\.freeze\(\{\s*screens:/s,
    ]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function findUnexpectedKeys(source, expectedKeys) {
  return Object.keys(source)
    .filter((key) => !expectedKeys.includes(key))
    .sort();
}

function createSampleGameCoreMethod(methodName) {
  return (...args) => ({
    methodName,
    args,
  });
}

function createSampleGameCore() {
  const methodNames = [
    ...GAME_CORE_REACT_SCREEN_SPECS.map((spec) => spec.viewModelMethodName),
    ...GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.viewModelMethodName),
    ...GAME_CORE_REACT_SCREEN_SPECS.flatMap((spec) => Object.values(spec.actionMethodNames)),
    ...GAME_CORE_REACT_OVERLAY_SPECS.flatMap((spec) => Object.values(spec.actionMethodNames)),
    ...GAME_CORE_APP_RUNTIME_METHOD_NAMES,
    ...Object.values(GAME_CORE_REACT_RUNTIME_SPEC.topbarActionMethodNames),
  ];

  return Object.freeze(
    Object.fromEntries(
      [...new Set(methodNames)].map((methodName) => [methodName, createSampleGameCoreMethod(methodName)]),
    ),
  );
}

function createSampleComponents(componentNames, prefix) {
  return Object.freeze(
    Object.fromEntries(
      componentNames.map((name) => [
        name,
        function ComponentStub() {
          return `${prefix}:${name}`;
        },
      ]),
    ),
  );
}

export function verifyGameCoreAppBindings({ sourceTexts }) {
  const issues = [];

  const sampleGameCore = createSampleGameCore();
  const screenComponents = createSampleComponents(
    [...new Set(GAME_CORE_REACT_SCREEN_SPECS.map((spec) => spec.componentName))].sort(),
    "screen",
  );
  const overlayComponents = createSampleComponents(
    [...new Set(GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.componentName))].sort(),
    "overlay",
  );

  const bindings = createGameCoreReactBindings({
    gameCore: sampleGameCore,
    screenComponents,
    overlayComponents,
  });

  pushListIssue(
    issues,
    "unexpected app binding groups",
    findUnexpectedKeys(bindings, GAME_CORE_APP_BINDING_GROUP_NAMES),
  );
  if (!Object.isFrozen(bindings)) {
    issues.push("app bindings object is not frozen");
  }

  GAME_CORE_APP_BINDING_GROUP_NAMES.forEach((groupName) => {
    if (!bindings[groupName]) {
      issues.push(`missing app binding group: ${groupName}`);
    } else if (!Object.isFrozen(bindings[groupName])) {
      issues.push(`app binding group is not frozen: ${groupName}`);
    }
  });

  GAME_CORE_REACT_SCREEN_SPECS.forEach((spec) => {
    spec.screenKeys.forEach((screenKey) => {
      const binding = bindings.screens?.[screenKey];
      if (!binding) {
        issues.push(`missing screen binding: ${screenKey}`);
        return;
      }
      if (binding.Component !== screenComponents[spec.componentName]) {
        issues.push(`screen binding component mismatch: ${screenKey}`);
      }
      if (binding.getViewModel !== sampleGameCore[spec.viewModelMethodName]) {
        issues.push(`screen binding view-model mismatch: ${screenKey}`);
      }
      const actionKeys = Object.keys(spec.actionMethodNames);
      const missingActionProps = actionKeys.filter((key) => typeof binding.actionProps?.[key] !== "function");
      pushListIssue(issues, `missing action props for screen ${screenKey}`, missingActionProps);
    });
  });

  pushListIssue(
    issues,
    "unexpected screen binding keys",
    findUnexpectedKeys(bindings.screens || {}, GAME_CORE_APP_MANAGED_SCREEN_KEYS),
  );

  GAME_CORE_REACT_OVERLAY_SPECS.forEach((spec) => {
    const binding = bindings.overlays?.[spec.overlayKey];
    if (!binding) {
      issues.push(`missing overlay binding: ${spec.overlayKey}`);
      return;
    }
    if (binding.Component !== overlayComponents[spec.componentName]) {
      issues.push(`overlay binding component mismatch: ${spec.overlayKey}`);
    }
    if (binding.getViewModel !== sampleGameCore[spec.viewModelMethodName]) {
      issues.push(`overlay binding view-model mismatch: ${spec.overlayKey}`);
    }
    const actionKeys = Object.keys(spec.actionMethodNames);
    const missingActionProps = actionKeys.filter((key) => typeof binding.actionProps?.[key] !== "function");
    pushListIssue(issues, `missing action props for overlay ${spec.overlayKey}`, missingActionProps);
  });

  pushListIssue(
    issues,
    "unexpected overlay binding keys",
    findUnexpectedKeys(bindings.overlays || {}, GAME_CORE_APP_OVERLAY_KEYS),
  );

  const runtimeBindings = bindings.runtime || {};
  GAME_CORE_APP_RUNTIME_METHOD_NAMES.forEach((methodName) => {
    if (runtimeBindings[methodName] !== sampleGameCore[methodName]) {
      issues.push(`runtime binding mismatch: ${methodName}`);
    }
  });
  if (typeof runtimeBindings.topbarActionProps?.onRestart !== "function") {
    issues.push("missing runtime topbar restart binding");
  }
  if (runtimeBindings.topbarActionProps?.onRestart !== sampleGameCore.runRestartFromTopbar) {
    issues.push("runtime topbar restart binding mismatch");
  }

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing app binding snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden app binding patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_APP_BINDING_POLICY.owner,
      bindingGroups: GAME_CORE_APP_BINDING_GROUP_NAMES.length,
      screens: GAME_CORE_APP_MANAGED_SCREEN_KEYS.length,
      overlays: GAME_CORE_APP_OVERLAY_KEYS.length,
      runtimeMethods: GAME_CORE_APP_RUNTIME_METHOD_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreAppBindingVerification(result) {
  if (result.ok) {
    return [
      "gameCore app binding verification: OK",
      `- owner: ${result.counts.owner}`,
      `- binding groups: ${result.counts.bindingGroups}`,
      `- managed screens: ${result.counts.screens}`,
      `- overlays: ${result.counts.overlays}`,
      `- runtime methods: ${result.counts.runtimeMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore app binding verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreAppBindings(ctx) {
  const result = verifyGameCoreAppBindings(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreAppBindingVerification(result));
  }
  return result;
}
