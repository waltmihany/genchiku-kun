import { useEffect, useMemo, useRef, useState } from "react";
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
import { MobileTabShell } from "./components/MobileTabShell.jsx";
import {
  createGameCoreReactBindings,
} from "./legacy/public/gameCoreReactScreenContract.js";
import { useAutoAdvance } from "./hooks/useAutoAdvance.js";

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

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 760px)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia("(max-width: 760px)");
    const handler = (event) => setIsMobile(event.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);
  return isMobile;
}

export default function App() {
  const hostRef = useRef(null);
  const onboardingBinding = gameCoreReactBindings.overlays.onboarding;
  const runtimeBindings = gameCoreReactBindings.runtime;
  const [view, setView] = useState(() => runtimeBindings.getGameViewSnapshot());
  const isMobile = useIsMobileViewport();

  const dashboardBinding = gameCoreReactBindings.screens.dashboard;
  const advanceMonth = dashboardBinding?.actionProps?.onPrimaryAction;

  const auto = useAutoAdvance({
    view,
    advanceMonth,
    intervalMs: 1500,
    defaultMode: "annualAuto",
  });

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const unsubscribe = runtimeBindings.subscribeGameView(setView);
    const cleanup = runtimeBindings.mountLegacyGame(hostRef.current);
    return () => {
      unsubscribe();
      cleanup?.();
    };
  }, [runtimeBindings]);

  const subtitle = useMemo(() => {
    if (auto.isRunning) return "自動年度進行中…重要イベントで停止します";
    if (auto.canStart) return "「年度を開始」で4月から自動進行します";
    return "10年で町を持ちこたえさせる、地域別インフラ予算サバイバル";
  }, [auto.isRunning, auto.canStart]);

  // ゲーム開始後（タイトル以外）のモバイルではヘッダを極限まで圧縮してマップ領域を拡大
  const compactHeader = isMobile && view.screen !== "title";
  const onTitle = view.screen === "title";

  // 「はじめから」確認ダイアログ
  const handleRestartConfirm = () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm("ここまでの進行状況を破棄して初期化します。よろしいですか？");
      if (!ok) return;
    }
    runtimeBindings.topbarActionProps.onRestart();
  };

  return (
    <div ref={hostRef} className={`app-shell ${compactHeader ? "compact-header" : ""}`}>
      <header className={`topbar ${compactHeader ? "is-compact" : ""}`}>
        {onTitle ? (
          <>
            <div>
              <h1>減築くん v5</h1>
              <p className="subtitle">{subtitle}</p>
            </div>
            <div className="topbar-actions">
              <button id="restartTopBtn" className="ghost-btn" onClick={handleRestartConfirm}>はじめから</button>
            </div>
          </>
        ) : (
          <>
            {/* プレイ中はロゴを軽く表示し、操作ボタンはタブ側へ移動 */}
            <div className="topbar-brand" aria-label="減築くん v5">減築くん</div>
            <div className="topbar-actions">
              {auto.isRunning && (
                <span className="topbar-status-pill" aria-live="polite">進行中</span>
              )}
            </div>
          </>
        )}
      </header>

      <main className="screen-stage">
        {isMobile && view.screen === "dashboard" ? (
          <MobileTabShell
            view={view}
            bindings={gameCoreReactBindings}
            auto={auto}
            onRestart={handleRestartConfirm}
          />
        ) : (
          <>
            <div id="reactScreenHost">
              <ReactManagedScreen screen={view.screen} />
            </div>
            <div id="screenContainer"></div>
          </>
        )}
      </main>

      <onboardingBinding.Component
        viewModel={onboardingBinding.getViewModel()}
        {...onboardingBinding.actionProps}
      />
    </div>
  );
}
