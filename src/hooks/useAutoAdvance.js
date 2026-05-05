import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useAutoAdvance
 *
 * 自動年度進行のためのReactフック。
 * legacy側のadvanceMonth()を一定間隔で呼び続け、
 * 重要イベント発生・年度末・ゲーム終了で停止する。
 *
 * モード:
 *   - "manual"      : 手動月送り（既存挙動）
 *   - "annualAuto"  : 年度自動進行（年度内は自動、イベント/年度末で停止）
 *
 * 将来の "dailyYear" モード拡張のために、
 * intervalMs を外から差し替えられる構造にしている。
 */
export function useAutoAdvance({
  view,
  advanceMonth,
  intervalMs = 1500,
  defaultMode = "annualAuto",
}) {
  const [mode, setMode] = useState(defaultMode);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  // 進行を停止すべき条件
  const shouldStop = useCallback((v) => {
    if (!v) return true;
    if (v.screen === "event") return true;       // イベント対応待ち
    if (v.screen === "report") return true;      // 年度末レポート
    if (v.screen === "budget") return true;      // 予算配分待ち
    if (v.screen === "clear" || v.screen === "gameover") return true;
    if (v.screen === "title") return true;
    if (v.phase === "report" || v.phase === "budget") return true;
    if (v.pendingEvent) return true;
    return false;
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    if (mode !== "annualAuto") return;
    if (shouldStop(view)) return;
    setIsRunning(true);
  }, [mode, shouldStop, view]);

  // view変化に応じて停止判定
  useEffect(() => {
    if (!isRunning) return;
    if (shouldStop(view)) {
      stop();
    }
  }, [view, isRunning, shouldStop, stop]);

  // タイマー駆動
  useEffect(() => {
    if (!isRunning) return undefined;
    timerRef.current = setInterval(() => {
      advanceMonth?.();
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRunning, advanceMonth, intervalMs]);

  // unmount時クリーンアップ
  useEffect(() => stop, [stop]);

  return {
    mode,
    setMode,
    isRunning,
    start,
    stop,
    canStart: mode === "annualAuto" && !shouldStop(view),
  };
}
