import {
  GAME_CORE_REACT_OVERLAY_COMPONENT_NAMES,
  GAME_CORE_REACT_SCREEN_COMPONENT_NAMES,
  GAME_CORE_REACT_SCREEN_KEYS,
  GAME_CORE_REACT_OVERLAY_SPECS,
  GAME_CORE_REACT_RUNTIME_METHOD_NAMES,
} from "./gameCoreReactScreenContract.js";

export const GAME_CORE_APP_BINDING_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/App.jsx",
  bindingFactoryName: "createGameCoreReactBindings",
  screenHostId: "reactScreenHost",
  legacyScreenContainerId: "screenContainer",
  topbarRestartButtonId: "restartTopBtn",
});

export const GAME_CORE_APP_BINDING_GROUP_NAMES = Object.freeze([
  "screens",
  "overlays",
  "runtime",
]);

export const GAME_CORE_APP_SCREEN_COMPONENT_NAMES = Object.freeze(
  GAME_CORE_REACT_SCREEN_COMPONENT_NAMES,
);

export const GAME_CORE_APP_OVERLAY_COMPONENT_NAMES = Object.freeze(
  GAME_CORE_REACT_OVERLAY_COMPONENT_NAMES,
);

export const GAME_CORE_APP_MANAGED_SCREEN_KEYS = Object.freeze(
  GAME_CORE_REACT_SCREEN_KEYS,
);

export const GAME_CORE_APP_OVERLAY_KEYS = Object.freeze(
  GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => spec.overlayKey),
);

export const GAME_CORE_APP_RUNTIME_METHOD_NAMES = Object.freeze(
  GAME_CORE_REACT_RUNTIME_METHOD_NAMES,
);
