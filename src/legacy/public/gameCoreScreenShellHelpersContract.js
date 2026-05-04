export const GAME_CORE_SCREEN_SHELL_HELPERS_POLICY = Object.freeze({
  owner: "legacy-game-core",
  modulePath: "src/components/GameScreens.jsx",
});

export const GAME_CORE_SCREEN_SHELL_HELPER_SPECS = Object.freeze([
  Object.freeze({
    helperName: "Meter",
    parameterNames: Object.freeze(["value", "color"]),
    signatureKind: "destructured-object",
  }),
  Object.freeze({
    helperName: "handleMapTargetKeyDown",
    parameterNames: Object.freeze(["event", "targetId", "onSelectMapTarget"]),
    signatureKind: "positional-params",
  }),
  Object.freeze({
    helperName: "DashboardMapSection",
    parameterNames: Object.freeze(["map", "onSelectMapTarget"]),
    signatureKind: "destructured-object",
  }),
]);

export const GAME_CORE_SCREEN_SHELL_HELPER_NAMES = Object.freeze(
  GAME_CORE_SCREEN_SHELL_HELPER_SPECS.map((spec) => spec.helperName),
);
