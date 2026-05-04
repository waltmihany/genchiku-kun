import {
  createGameCoreRuntimeViewSnapshot,
  createGameCoreRuntimeStoreShape,
  createGameCoreRuntimeControllerShape,
} from "../deps/gameCoreRuntimeStoreDefinitions.js";
import { createGameCoreRuntimeStore } from "../runtime/gameCoreRuntimeStore.js";
import { createGameCoreRuntime } from "../gameCoreRuntime.js";
import {
  GAME_CORE_RUNTIME_STORE_POLICY,
  GAME_CORE_RUNTIME_STORE_FACTORY_NAMES,
  GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEY_NAMES,
  GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES,
  GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES,
  GAME_CORE_RUNTIME_PUBLIC_SURFACE_METHOD_KEY_NAMES,
} from "./gameCoreRuntimeStoreContract.js";

const FACTORY_MAP = Object.freeze({
  createGameCoreRuntimeViewSnapshot,
  createGameCoreRuntimeStoreShape,
  createGameCoreRuntimeControllerShape,
});

const SOURCE_RULES = Object.freeze([
  Object.freeze({
    filePath: "src/legacy/runtime/gameCoreRuntimeStore.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimeViewSnapshot",
      "createGameCoreRuntimeStoreShape",
      "return createGameCoreRuntimeViewSnapshot({",
      "return createGameCoreRuntimeStoreShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*screen:\s*gameState\?\.screen/s,
      /return\s+\{\s*getState,/s,
    ]),
  }),
  Object.freeze({
    filePath: "src/legacy/runtime/gameCoreRuntimeController.js",
    requiredSnippets: Object.freeze([
      "createGameCoreRuntimeControllerShape",
      "return createGameCoreRuntimeControllerShape({",
    ]),
    forbiddenPatterns: Object.freeze([
      /return\s+\{\s*getBridge:/s,
    ]),
  }),
]);

function pushListIssue(issues, label, values) {
  if (!values.length) return;
  issues.push(`${label}: ${values.join(", ")}`);
}

function findMissingCallableNames(source, names) {
  return names.filter((name) => typeof source?.[name] !== "function").sort();
}

function createSampleCallableSource(keys) {
  return keys.reduce((acc, key) => {
    acc[key] = () => key;
    return acc;
  }, {});
}

function verifyCreatedShape(issues, label, createdShape, requiredKeys) {
  const missingKeys = requiredKeys.filter((key) => !(key in createdShape));
  const unexpectedKeys = Object.keys(createdShape)
    .filter((key) => !requiredKeys.includes(key))
    .sort();
  pushListIssue(issues, `missing keys for ${label}`, missingKeys);
  pushListIssue(issues, `unexpected keys for ${label}`, unexpectedKeys);
  if (!Object.isFrozen(createdShape)) {
    issues.push(`${label} is not frozen`);
  }
}

export function verifyGameCoreRuntimeStore({ sourceTexts }) {
  const issues = [];

  pushListIssue(
    issues,
    "missing runtime store factories",
    findMissingCallableNames(FACTORY_MAP, GAME_CORE_RUNTIME_STORE_FACTORY_NAMES),
  );

  verifyCreatedShape(
    issues,
    "runtime view snapshot",
    createGameCoreRuntimeViewSnapshot({
      screen: "dashboard",
      year: 3,
      phase: "budget",
      ignored: true,
    }),
    GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEY_NAMES,
  );

  verifyCreatedShape(
    issues,
    "runtime store shape",
    createGameCoreRuntimeStoreShape(
      createSampleCallableSource(GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES),
    ),
    GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES,
  );

  verifyCreatedShape(
    issues,
    "runtime controller shape",
    createGameCoreRuntimeControllerShape(
      createSampleCallableSource(GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES),
    ),
    GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES,
  );

  const store = createGameCoreRuntimeStore();
  pushListIssue(
    issues,
    "missing methods on runtime store",
    findMissingCallableNames(store, GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES),
  );
  if (!Object.isFrozen(store)) {
    issues.push("runtime store is not frozen");
  }

  const defaultSnapshot = store.getGameViewSnapshot();
  verifyCreatedShape(
    issues,
    "runtime store default snapshot",
    defaultSnapshot,
    GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEY_NAMES,
  );
  if (defaultSnapshot.screen !== "title" || defaultSnapshot.year !== 1 || defaultSnapshot.phase !== "report") {
    issues.push("runtime store default snapshot does not match title/year1/report fallback");
  }

  const receivedSnapshots = [];
  const unsubscribe = store.subscribeGameView((snapshot) => {
    receivedSnapshots.push(snapshot);
  });
  if (receivedSnapshots.length !== 1) {
    issues.push("runtime store subscribeGameView should emit the current snapshot immediately");
  }

  store.setState({
    screen: "event",
    year: 4,
    phase: "monthly",
  });
  store.emitGameViewChange();

  const updatedSnapshot = receivedSnapshots.at(-1);
  if (
    updatedSnapshot?.screen !== "event"
    || updatedSnapshot?.year !== 4
    || updatedSnapshot?.phase !== "monthly"
  ) {
    issues.push("runtime store emitGameViewChange did not publish the updated snapshot");
  }

  const receivedCountBeforeUnsubscribe = receivedSnapshots.length;
  unsubscribe();
  store.setState({
    screen: "budget",
    year: 5,
    phase: "budget",
  });
  store.emitGameViewChange();
  if (receivedSnapshots.length !== receivedCountBeforeUnsubscribe) {
    issues.push("runtime store unsubscribe did not detach the listener");
  }

  const runtimeInstance = createGameCoreRuntime({
    alertUser: () => {},
  });
  pushListIssue(
    issues,
    "missing controller methods on runtime instance",
    findMissingCallableNames(runtimeInstance, GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES),
  );
  pushListIssue(
    issues,
    "missing runtime public methods on runtime instance",
    findMissingCallableNames(runtimeInstance, GAME_CORE_RUNTIME_PUBLIC_SURFACE_METHOD_KEY_NAMES),
  );
  if (!Object.isFrozen(runtimeInstance)) {
    issues.push("runtime controller is not frozen");
  }

  SOURCE_RULES.forEach((rule) => {
    const sourceText = sourceTexts[rule.filePath] || "";
    const missingSnippets = rule.requiredSnippets.filter((snippet) => !sourceText.includes(snippet));
    pushListIssue(issues, `missing runtime store snippets in ${rule.filePath}`, missingSnippets);
    const matchedPatterns = rule.forbiddenPatterns
      .filter((pattern) => pattern.test(sourceText))
      .map((pattern) => pattern.toString());
    pushListIssue(issues, `forbidden runtime store patterns in ${rule.filePath}`, matchedPatterns);
  });

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      owner: GAME_CORE_RUNTIME_STORE_POLICY.owner,
      factories: GAME_CORE_RUNTIME_STORE_FACTORY_NAMES.length,
      snapshotKeys: GAME_CORE_RUNTIME_VIEW_SNAPSHOT_KEY_NAMES.length,
      storeMethods: GAME_CORE_RUNTIME_STORE_METHOD_KEY_NAMES.length,
      controllerMethods: GAME_CORE_RUNTIME_CONTROLLER_METHOD_KEY_NAMES.length,
      publicMethods: GAME_CORE_RUNTIME_PUBLIC_SURFACE_METHOD_KEY_NAMES.length,
      sourceRules: SOURCE_RULES.length,
    },
  };
}

export function formatGameCoreRuntimeStoreVerification(result) {
  if (result.ok) {
    return [
      "gameCore runtime store verification: OK",
      `- owner: ${result.counts.owner}`,
      `- factories: ${result.counts.factories}`,
      `- snapshot keys: ${result.counts.snapshotKeys}`,
      `- store methods: ${result.counts.storeMethods}`,
      `- controller methods: ${result.counts.controllerMethods}`,
      `- public methods: ${result.counts.publicMethods}`,
      `- checked source files: ${result.counts.sourceRules}`,
    ].join("\n");
  }

  return [
    "gameCore runtime store verification: FAILED",
    ...result.issues.map((issue) => `- ${issue}`),
  ].join("\n");
}

export function assertGameCoreRuntimeStore(ctx) {
  const result = verifyGameCoreRuntimeStore(ctx);
  if (!result.ok) {
    throw new Error(formatGameCoreRuntimeStoreVerification(result));
  }
  return result;
}
