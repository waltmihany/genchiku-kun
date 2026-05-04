import { useEffect, useRef, useState } from "react";
import * as gameCore from "./legacy/gameCore";
import {
  BudgetScreenShell,
  DashboardScreenShell,
  EventScreenShell,
  OnboardingOverlay,
  ReportScreenShell,
  ResultScreenShell,
  TitleScreenShell,
} from "./components/GameScreens";
import {
  createGameCoreReactBindings,
} from "./legacy/public/gameCoreReactScreenContract.js";

const GAME_CORE_SCREEN_COMPONENTS = {
  TitleScreenShell,
  DashboardScreenShell,
  BudgetScreenShell,
  ReportScreenShell,
  EventScreenShell,
  ResultScreenShell,
};

const GAME_CORE_OVERLAY_COMPONENTS = {
  OnboardingOverlay,
};

const gameCoreReactBindings = createGameCoreReactBindings({
  gameCore,
  screenComponents: GAME_CORE_SCREEN_COMPONENTS,
  overlayComponents: GAME_CORE_OVERLAY_COMPONENTS,
});

function ReactManagedScreen({ screen }) {
  const binding = gameCoreReactBindings.screens[screen];
  if (!binding) return null;

  const { Component, getViewModel, actionProps } = binding;
  return <Component viewModel={getViewModel()} {...actionProps} />;
}

export default function App() {
  const hostRef = useRef(null);
  const onboardingBinding = gameCoreReactBindings.overlays.onboarding;
  const runtimeBindings = gameCoreReactBindings.runtime;
  const [view, setView] = useState(() => runtimeBindings.getGameViewSnapshot());

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const unsubscribe = runtimeBindings.subscribeGameView(setView);
    const cleanup = runtimeBindings.mountLegacyGame(hostRef.current);
    return () => {
      unsubscribe();
      cleanup?.();
    };
  }, [runtimeBindings]);

  return (
    <div ref={hostRef} className="app-shell">
      <header className="topbar">
        <div>
          <h1>減築くん v4</h1>
          <p className="subtitle">10年で町を持ちこたえさせる、地域別インフラ予算サバイバル</p>
        </div>
        <div className="topbar-actions">
          <button id="restartTopBtn" className="ghost-btn" onClick={runtimeBindings.topbarActionProps.onRestart}>はじめから</button>
        </div>
      </header>

      <main className="screen-stage">
        <div id="reactScreenHost">
          <ReactManagedScreen screen={view.screen} />
        </div>
        <div id="screenContainer"></div>
      </main>

      <onboardingBinding.Component
        viewModel={onboardingBinding.getViewModel()}
        {...onboardingBinding.actionProps}
      />
    </div>
  );
}
