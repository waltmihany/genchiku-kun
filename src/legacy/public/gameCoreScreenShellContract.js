import {
  GAME_CORE_REACT_OVERLAY_SPECS,
  GAME_CORE_REACT_SCREEN_SPECS,
} from "./gameCoreReactScreenContract.js";

function uniqueList(values) {
  return [...new Set(values)];
}

function createShellPropSpec(spec, keyName) {
  return Object.freeze({
    key: spec[keyName],
    componentName: spec.componentName,
    propNames: Object.freeze([
      "viewModel",
      ...Object.keys(spec.actionMethodNames),
    ]),
  });
}

export const GAME_CORE_SCREEN_SHELL_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/components/GameScreens.jsx",
  propsSource: "src/legacy/public/gameCoreReactScreenContract.js",
  viewModelPropName: "viewModel",
});

export const GAME_CORE_SCREEN_SHELL_PROP_SPECS = Object.freeze([
  ...GAME_CORE_REACT_SCREEN_SPECS.map((spec) => createShellPropSpec(spec, "componentName")),
  ...GAME_CORE_REACT_OVERLAY_SPECS.map((spec) => createShellPropSpec(spec, "overlayKey")),
]);

export const GAME_CORE_SCREEN_SHELL_COMPONENT_NAMES = Object.freeze(
  uniqueList(GAME_CORE_SCREEN_SHELL_PROP_SPECS.map((spec) => spec.componentName)).sort(),
);

export const GAME_CORE_SCREEN_SHELL_PROP_NAMES = Object.freeze(
  uniqueList(GAME_CORE_SCREEN_SHELL_PROP_SPECS.flatMap((spec) => spec.propNames)).sort(),
);
