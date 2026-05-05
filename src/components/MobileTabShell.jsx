import { useEffect, useMemo, useRef, useState } from "react";
import { MapView, getMapInfraDetail, pickTopDangerIds } from "./MapView.jsx";
import {
  describeRebellion,
  describeSatisfaction,
  describeFiscalHealth,
  describeFutureBurden,
  describeSafety,
  describeSupport,
  describeInfraCondition,
  infraOneLiner,
  infraReadingHint,
  buildTodayHighlights,
  buildNextActionHint,
  buildStaffPriority,
  buildFiscalDiagnosis,
} from "./humanizeHelpers.js";

const TABS = [
  { key: "map", label: "町を見る", icon: "🗺" },
  { key: "finance", label: "財政課", icon: "💴" },
  { key: "staff", label: "庁内会議", icon: "👥" },
  { key: "event", label: "緊急対応", icon: "⚠" },
  { key: "year", label: "年度記録", icon: "📅" },
];

function regionRiskTone(area) {
  if (area.rebellion >= 60 || area.satisfaction <= 35) return "negative";
  if (area.rebellion >= 40 || area.satisfaction <= 50) return "warning";
  return "positive";
}

function regionRiskLabel(tone) {
  if (tone === "negative") return "危険";
  if (tone === "warning") return "注意";
  return "安定";
}

function ValueWithMeaning({ label, value, suffix, info }) {
  if (!info) return null;
  return (
    <div className="value-with-meaning">
      <div className="value-with-meaning-row">
        <span className="value-with-meaning-num">{value}{suffix || ""}</span>
        <span className={`value-with-meaning-state tone-${info.tone}`}>{info.label}</span>
      </div>
      <span className="value-with-meaning-meaning">{info.meaning}</span>
    </div>
  );
}

function TodayHighlights({ items, variant = "full" }) {
  if (!items || items.length === 0) return null;
  // コンパクトモード: タイトルだけ見せてタップで展開
  if (variant === "collapsed") {
    const topTone = items.find((i) => i.tone === "negative")?.tone
      || items.find((i) => i.tone === "warning")?.tone
      || items[0].tone;
    return (
      <details className={`today-highlights compact tone-${topTone}`}>
        <summary>📌 今日見るべきこと ({items.length})</summary>
        {items.map((item, idx) => (
          <div key={idx} className={`today-highlight-item tone-${item.tone}`}>
            <span className="today-highlight-num" aria-hidden="true">{idx + 1}</span>
            <div className="today-highlight-body">
              <span className="today-highlight-title">{item.title}</span>
              <span className="today-highlight-detail">{item.detail}</span>
            </div>
          </div>
        ))}
      </details>
    );
  }
  return (
    <div className="today-highlights" aria-label="今日見るべきこと">
      <h4 className="today-highlights-title">📌 今日見るべきこと</h4>
      {items.map((item, idx) => (
        <div key={idx} className={`today-highlight-item tone-${item.tone}`}>
          <span className="today-highlight-num" aria-hidden="true">{idx + 1}</span>
          <div className="today-highlight-body">
            <span className="today-highlight-title">{item.title}</span>
            <span className="today-highlight-detail">{item.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NextActionHint({ hint }) {
  if (!hint) return null;
  return (
    <div className={`next-action-hint tone-${hint.tone}`}>{hint.text}</div>
  );
}

function buildWarnedIds(bindings) {
  const ids = [];
  const dashboardVM = bindings.screens.dashboard?.getViewModel?.();
  dashboardVM?.map?.focusCards?.slice(0, 2).forEach((card) => {
    if (card.tone === "negative") ids.push(card.id);
  });
  return Array.from(new Set(ids));
}

function MapTab({ dashboardVM, bindings, onSelectMapTarget, reducedMotion, todayItems, nextHint, pulseIds }) {
  // ポップアップを閉じた ID を記憶（runDashboardSelectMapTarget は null 不可のため、UI 側で隠す）
  const [dismissedId, setDismissedId] = useState(null);
  if (!dashboardVM) return <p className="tab-empty">マップ情報を準備中です。</p>;
  const regions = dashboardVM.regions || [];
  const infrastructures = dashboardVM.infrastructures || [];
  const rawSelectedId = dashboardVM.selectedMapTargetId || dashboardVM.map?.inspector?.targetId;
  // ユーザーが閉じた ID と一致したらポップアップを出さない
  const selectedId = rawSelectedId === dismissedId ? null : rawSelectedId;
  const warnedIds = useMemo(() => buildWarnedIds(bindings), [bindings, dashboardVM]);
  const topDangerIds = useMemo(() => pickTopDangerIds(infrastructures, 3), [infrastructures]);

  // 選択 ID が外部で変わったら dismiss 状態をリセット
  useEffect(() => {
    if (rawSelectedId && rawSelectedId !== dismissedId) {
      setDismissedId(null);
    }
  }, [rawSelectedId, dismissedId]);

  const selectedInfra = infrastructures.find((i) => i.id === selectedId);
  const staffComments = useMemo(() => {
    const map = {};
    (dashboardVM.staffItems || []).forEach((s) => {
      map[s.key] = s.comment;
    });
    return map;
  }, [dashboardVM.staffItems]);

  const detail = getMapInfraDetail(
    selectedInfra,
    regions,
    dashboardVM.deconstructionItems,
    staffComments,
  );
  const oneLiner = detail ? infraOneLiner(selectedInfra, detail.region) : "";
  const readingHint = detail ? infraReadingHint(selectedInfra, detail.region, dashboardVM.indicators) : "";
  const condInfo = detail ? describeInfraCondition(detail.condition) : null;

  const detailBadgeTone = detail
    ? detail.statusLabel === "安全"
      ? "positive"
      : detail.statusLabel === "注意"
        ? "warning"
        : "negative"
    : "neutral";

  // ポップアップを閉じる：selectedMapTargetId を null にできないため、
  // ローカルに dismissedId を保持して表示だけ隠す。
  const handleClosePopup = () => {
    if (rawSelectedId) setDismissedId(rawSelectedId);
  };
  // 地図要素タップで選択 ID が同じになってもポップアップを再表示したい
  const handleSelect = (id) => {
    setDismissedId(null);
    onSelectMapTarget?.(id);
  };

  return (
    <div className="tab-pane map-tab-pane">
      {/* タイトルは画面節約のため非表示。SR向けに視覚非表示で残す。 */}
      <h3 className="sr-only">町の状況図</h3>
      <div className="map-board-eyebrow" aria-hidden="true">町の状況図 ・ 土木管理ボード</div>

      <TodayHighlights items={todayItems} variant="compact" />
      <NextActionHint hint={nextHint} />

      <div className="map-stage">
        <MapView
          regions={regions}
          infrastructures={infrastructures}
          selectedId={selectedId}
          onSelect={handleSelect}
          warnedIds={warnedIds}
          reducedMotion={reducedMotion}
          pulseIds={pulseIds}
          topDangerIds={topDangerIds}
          enablePan={true}
          onEmptyTap={handleClosePopup}
        />

        {detail && (
          <div
            className="mv-detail-popup"
            role="dialog"
            aria-label={`${detail.name}の詳細`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="mv-detail-popup-close"
              onClick={handleClosePopup}
              aria-label="閉じる"
            >
              ✕
            </button>
            <div className="mv-detail-head">
              <div>
                <strong>{detail.name}</strong>
                <div className="mv-detail-sub">{detail.kind} ・ {detail.areaName}</div>
              </div>
              <span className={`risk-badge tone-${detailBadgeTone}`}>{detail.statusLabel}</span>
            </div>
            {oneLiner && <p className="mv-detail-oneliner">{oneLiner}</p>}
            <div className="mv-detail-meta-rich compact">
              <div className="mv-detail-meta-cell">
                <div className="mv-detail-meta-cell-label">老朽度</div>
                <ValueWithMeaning value={100 - detail.condition} info={condInfo} />
              </div>
              <div className="mv-detail-meta-cell">
                <div className="mv-detail-meta-cell-label">将来負担</div>
                <div className="value-with-meaning">
                  <div className="value-with-meaning-row">
                    <span className="value-with-meaning-num">{detail.burden}</span>
                    <span className={`value-with-meaning-state tone-${detail.burden >= 16 ? "negative" : detail.burden >= 12 ? "warning" : "positive"}`}>
                      {detail.burden >= 16 ? "重い" : detail.burden >= 12 ? "並" : "軽い"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {detail.staffComment && (
              <p className="mv-detail-staff-line">担当: {detail.staffComment}</p>
            )}
            {readingHint && <p className="mv-detail-hint">{readingHint}</p>}
            {detail.project && detail.project.statusLabel && (
              <p className="mv-detail-staff-line">減築: {detail.project.statusLabel}（{detail.project.progress}%）</p>
            )}
          </div>
        )}
      </div>

      <div className="region-strip-mobile">
        {regions.map((region) => {
          const tone = regionRiskTone(region);
          return (
            <div key={region.id} className={`region-strip-item tone-${tone}`}>
              <span className="region-strip-name">{region.name}</span>
              <span className={`risk-badge tone-${tone}`}>{regionRiskLabel(tone)}</span>
              <span className="region-strip-mood">満{region.satisfaction}/反{region.rebellion}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceTab({ dashboardVM, todayItems, nextHint, todayVariant = "collapsed" }) {
  if (!dashboardVM) return <p className="tab-empty">財政情報を準備中です。</p>;
  const stats = dashboardVM.stats || [];
  const fiscalStat = stats.find((s) => s.key === "fiscalHealth");
  const futureStat = stats.find((s) => s.key === "futureBurden");
  const supportStat = stats.find((s) => s.key === "support");
  const safetyStat = stats.find((s) => s.key === "safety");

  const reserveFundStr = dashboardVM.subtitle?.match(/予備費 ([^ ]+)/)?.[1] || "—";
  const annualBudgetStr = dashboardVM.subtitle?.match(/年間予算 ([^ ]+)/)?.[1] || "—";

  const fiscalInfo = fiscalStat ? describeFiscalHealth(fiscalStat.value) : null;
  const burdenInfo = futureStat ? describeFutureBurden(futureStat.value) : null;
  const safetyInfo = safetyStat ? describeSafety(safetyStat.value) : null;
  const supportInfo = supportStat ? describeSupport(supportStat.value) : null;

  const diagnosis = buildFiscalDiagnosis({
    indicators: dashboardVM.indicators || {},
    reserveFund: dashboardVM.indicators?.reserveFund,
    remainingBudget: dashboardVM.indicators?.remainingBudget,
  });

  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title office-heading"><span className="office-heading-eyebrow">庁内資料</span>財政課の診断</h3>
      <TodayHighlights items={todayItems} variant={todayVariant} />
      <NextActionHint hint={nextHint} />

      {fiscalInfo && (
        <div className={`fiscal-headline report-panel tone-${fiscalInfo.tone}`}>
          <span className="fiscal-label">財政課の見立て</span>
          <strong>{fiscalInfo.label}</strong>
        </div>
      )}

      <div className="finance-card-grid">
        <div className="finance-card">
          <span>今年度予算</span>
          <strong>{annualBudgetStr}</strong>
          <small>町に使えるお金</small>
        </div>
        <div className="finance-card">
          <span>予備費</span>
          <strong>{reserveFundStr}</strong>
          <small>災害対応の余力</small>
        </div>
        {fiscalStat && (
          <div className="finance-card">
            <span>財政健全度</span>
            <ValueWithMeaning value={fiscalStat.value} info={fiscalInfo} />
          </div>
        )}
        {futureStat && (
          <div className="finance-card">
            <span>将来維持負担</span>
            <ValueWithMeaning value={futureStat.value} info={burdenInfo} />
          </div>
        )}
        {safetyStat && (
          <div className="finance-card">
            <span>安全度</span>
            <ValueWithMeaning value={safetyStat.value} info={safetyInfo} />
          </div>
        )}
        {supportStat && (
          <div className="finance-card">
            <span>支持率</span>
            <ValueWithMeaning value={supportStat.value} info={supportInfo} />
          </div>
        )}
      </div>

      <h4 className="map-tab-sub-title">財政診断</h4>
      <div className="fiscal-diagnosis">
        {diagnosis.map((line, idx) => (
          <div key={idx} className="fiscal-diagnosis-line">{line}</div>
        ))}
      </div>
    </div>
  );
}

function StaffTab({ dashboardVM, todayItems, nextHint, todayVariant = "collapsed" }) {
  if (!dashboardVM) return <p className="tab-empty">担当者の情報を準備中です。</p>;

  const prioritized = useMemo(() => buildStaffPriority({
    staffItems: dashboardVM.staffItems || [],
    regions: dashboardVM.regions || [],
    infrastructures: dashboardVM.infrastructures || [],
    indicators: dashboardVM.indicators || {},
  }), [dashboardVM]);

  const highCount = prioritized.filter((p) => p.priority === "high").length;
  const summary = highCount > 0
    ? `今年は${prioritized.filter((p) => p.priority === "high").map((p) => p.role).join("・")}を上から読みましょう。`
    : "今年は突出した警戒対象はありません。気になる担当者から読んで構いません。";

  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title office-heading"><span className="office-heading-eyebrow">庁内会議</span>担当者からの報告</h3>
      <TodayHighlights items={todayItems} variant={todayVariant} />
      <NextActionHint hint={nextHint} />

      <p className="staff-priority-summary office-callout">「{summary}」</p>

      <div className="staff-card-grid">
        {prioritized.map((item) => (
          <div key={item.key} className={`staff-card report-panel tone-${item.tone || "neutral"}`}>
            <div className="report-panel-band">{item.role}</div>
            <div className="staff-card-head">
              <span className="staff-avatar" aria-hidden="true">{item.avatar || "👤"}</span>
              <div>
                <strong>{item.name}<span className={`staff-priority-badge priority-${item.priority}`}>{item.priorityLabel}</span></strong>
                <span className="staff-role">{item.role}</span>
              </div>
            </div>
            <p className="staff-comment quote-line">「{item.comment}」</p>
            {item.priorityReason && <p className="staff-priority-reason">{item.priorityReason}</p>}
            {item.warning && <p className="staff-warning">・警戒：{item.warning}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTab({ view, bindings, onChoose, todayItems, nextHint, todayVariant = "collapsed" }) {
  const eventVM = bindings.screens.event?.getViewModel?.();
  if (!eventVM) {
    return (
      <div className="tab-pane">
        <h3 className="tab-pane-title office-heading"><span className="office-heading-eyebrow">緊急対応室</span>出動案件はありません</h3>
        <TodayHighlights items={todayItems} variant={todayVariant} />
        <NextActionHint hint={nextHint} />
        <p className="tab-empty">今のところ出動案件はありません。年度を進めると、必要に応じて現場から連絡が入ります。</p>
      </div>
    );
  }
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title office-heading"><span className="office-heading-eyebrow alarm">緊急対応案件</span>{eventVM.title}</h3>
      <p className="event-body office-body">{eventVM.body}</p>
      <div className="event-meta-row">
        {eventVM.metaChips?.map((chip, idx) => (
          <span key={idx} className={`inline-chip tone-${chip.tone || "neutral"}`}>{chip.label}</span>
        ))}
      </div>
      <p className="event-decision-lead">さて、どう判断しますか。</p>
      <div className="event-choice-list">
        {eventVM.choices?.map((choice) => (
          <button
            key={choice.index}
            type="button"
            className={`choice-btn judgment-btn ${choice.recommended ? "recommended" : ""}`}
            onClick={() => onChoose?.(choice.index)}
          >
            {choice.recommended && <span className="judgment-stamp">担当推奨</span>}
            <strong className="judgment-title">{choice.label}</strong>
            <div className="judgment-desc">{choice.previewText}</div>
            <div className="judgment-forecast">
              <span className="judgment-forecast-label">見込み</span>
              <div className="choice-chips">
                {choice.effectChips?.slice(0, 3).map((chip, idx) => (
                  <span key={idx} className={`inline-chip tone-${chip.tone}`}>{chip.label}</span>
                ))}
              </div>
            </div>
            {choice.riskLabel && <small className="choice-risk">{choice.riskLabel}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

function YearTab({ view, dashboardVM, auto, onOpenReport, onOpenBudget, onRestart, todayItems, nextHint, todayVariant = "collapsed" }) {
  const log = dashboardVM?.recentLog || [];
  const [showDanger, setShowDanger] = useState(false);
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">年度記録</h3>
      <TodayHighlights items={todayItems} variant={todayVariant} />
      <NextActionHint hint={nextHint} />

      <div className="year-status-card report-panel">
        <div className="report-panel-band">進行状況</div>
        <div className="year-status-row">
          <span>現在</span>
          <strong>{view.year}年目 {dashboardVM?.monthLabel || ""}</strong>
        </div>
        <div className="year-status-row">
          <span>進行</span>
          <strong>{auto.isRunning ? "自動進行中" : auto.canStart ? "停止中（開始可能）" : "停止中"}</strong>
        </div>
        <div className="year-actions">
          {auto.canStart && (
            <button type="button" className="primary-btn weighty" onClick={auto.start}>年度を開始する</button>
          )}
          {auto.isRunning && (
            <button type="button" className="ghost-btn" onClick={auto.stop}>進行を一時停止</button>
          )}
          {view.phase === "report" && (
            <button type="button" className="primary-btn weighty" onClick={onOpenReport}>年度末レポートを見る</button>
          )}
          {view.phase === "budget" && (
            <button type="button" className="primary-btn weighty" onClick={onOpenBudget}>予算配分を開く</button>
          )}
        </div>
      </div>
      <h4 className="year-log-title">町の出来事記録</h4>
      <ul className="year-log-list">
        {log.slice(0, 8).map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
        {log.length === 0 && <li className="muted">まだ大きな動きはありません。</li>}
      </ul>

      {/* 「はじめから」は誤操作防止のため、年度記録タブの最下部に折りたたみで配置。 */}
      {onRestart && (
        <details
          className="danger-zone"
          open={showDanger}
          onToggle={(e) => setShowDanger(e.currentTarget.open)}
        >
          <summary>やり直し・初期化</summary>
          <p className="danger-zone-note">今の進行状況は全て破棄されます。誤操作にご注意ください。</p>
          <button type="button" className="ghost-btn danger" onClick={onRestart}>はじめからやり直す</button>
        </details>
      )}
    </div>
  );
}

/**
 * useTabSwipe (v5.2強化)
 * - 横スワイプで隣のタブに移動
 * - 縦スクロールと干渉しないよう、横移動が縦移動より大きい場合のみ切替
 * - マップ上のタップ操作と干渉しないよう、閾値を 60px 以上に
 * - 横スクロール可能要素（map-view など）の上から開始した場合はスワイプを無効化
 */
function useTabSwipe({ tabs, currentTab, onChange }) {
  const startRef = useRef(null);
  const movedRef = useRef(false);
  const blockedRef = useRef(false);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
    movedRef.current = false;
    // 横スクロール可能要素から開始した場合、スワイプを無効化
    blockedRef.current = false;
    let el = e.target;
    while (el && el !== e.currentTarget) {
      if (el.classList && (el.classList.contains("map-view") || el.classList.contains("preset-row"))) {
        blockedRef.current = true;
        break;
      }
      el = el.parentElement;
    }
  };

  const onTouchMove = (e) => {
    if (!startRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = t.clientY - startRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      movedRef.current = true;
    }
  };

  const onTouchEnd = (e) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start || blockedRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (!movedRef.current) return;
    // 横スワイプ条件: 横移動 60px 以上 + 縦より明確に大きい
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    const idx = tabs.findIndex((tt) => tt.key === currentTab);
    if (idx < 0) return;
    if (dx < 0 && idx < tabs.length - 1) onChange(tabs[idx + 1].key);
    else if (dx > 0 && idx > 0) onChange(tabs[idx - 1].key);
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * useChangedInfraIds
 * 月送り時に condition が変化したインフラを検出し、
 * 一定時間 pulseIds として返す。
 */
function useChangedInfraIds(infrastructures) {
  const prevRef = useRef(new Map());
  const [pulseIds, setPulseIds] = useState([]);

  useEffect(() => {
    const next = new Map();
    const changed = [];
    infrastructures.forEach((i) => {
      next.set(i.id, i.condition);
      const before = prevRef.current.get(i.id);
      if (typeof before === "number" && Math.abs(before - i.condition) >= 1.5) {
        changed.push(i.id);
      }
    });
    prevRef.current = next;
    if (changed.length > 0) {
      setPulseIds(changed);
      const t = setTimeout(() => setPulseIds([]), 1700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [infrastructures]);

  return pulseIds;
}

export function MobileTabShell({ view, bindings, auto, onRestart }) {
  const dashboardBinding = bindings.screens.dashboard;
  const dashboardVM = dashboardBinding?.getViewModel?.();
  const eventVM = bindings.screens.event?.getViewModel?.();

  const [tab, setTab] = useState("map");

  // 重要イベント発生時はイベントタブへ自動遷移
  useEffect(() => {
    if (eventVM) setTab("event");
  }, [eventVM]);

  const tabBadges = useMemo(() => {
    const badges = {};
    if (eventVM) badges.event = "!";
    if (view.phase === "report") badges.year = "📋";
    if (view.phase === "budget") badges.year = "💴";
    return badges;
  }, [eventVM, view.phase]);

  const onChoose = bindings.screens.event?.actionProps?.onChoose;
  const onOpenReport = dashboardBinding?.actionProps?.onPrimaryAction;
  const onOpenBudget = dashboardBinding?.actionProps?.onPrimaryAction;
  const onSelectMapTarget = dashboardBinding?.actionProps?.onSelectMapTarget;

  const reducedMotion = false;

  // 「今日見るべき3つ」「次にすべきヒント」
  const todayItems = useMemo(() => buildTodayHighlights({
    regions: dashboardVM?.regions || [],
    infrastructures: dashboardVM?.infrastructures || [],
    indicators: dashboardVM?.indicators || {},
    reserveFund: dashboardVM?.indicators?.reserveFund,
    remainingBudget: dashboardVM?.indicators?.remainingBudget,
    year: view.year,
  }), [dashboardVM, view.year]);

  const nextHint = useMemo(() => buildNextActionHint({
    phase: view.phase,
    hasPendingEvent: !!eventVM,
    isRunning: auto.isRunning,
    todayItems,
  }), [view.phase, eventVM, auto.isRunning, todayItems]);

  // 月送り変化のハイライト
  const pulseIds = useChangedInfraIds(dashboardVM?.infrastructures || []);

  const swipeHandlers = useTabSwipe({
    tabs: TABS,
    currentTab: tab,
    onChange: setTab,
  });

  let pane;
  if (tab === "map") {
    pane = (
      <MapTab
        dashboardVM={dashboardVM}
        bindings={bindings}
        onSelectMapTarget={onSelectMapTarget}
        reducedMotion={reducedMotion}
        todayItems={todayItems}
        nextHint={nextHint}
        pulseIds={pulseIds}
      />
    );
  } else if (tab === "finance") {
    pane = <FinanceTab dashboardVM={dashboardVM} todayItems={todayItems} nextHint={nextHint} />;
  } else if (tab === "staff") {
    pane = <StaffTab dashboardVM={dashboardVM} todayItems={todayItems} nextHint={nextHint} />;
  } else if (tab === "event") {
    pane = <EventTab view={view} bindings={bindings} onChoose={onChoose} todayItems={todayItems} nextHint={nextHint} />;
  } else {
    pane = (
      <YearTab
        view={view}
        dashboardVM={dashboardVM}
        auto={auto}
        onOpenReport={onOpenReport}
        onOpenBudget={onOpenBudget}
        onRestart={onRestart}
        todayItems={todayItems}
        nextHint={nextHint}
      />
    );
  }

  return (
    <div className="mobile-tab-shell">
      <div
        className="mobile-tab-content"
        key={tab}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchMove={swipeHandlers.onTouchMove}
        onTouchEnd={swipeHandlers.onTouchEnd}
      >
        {pane}
      </div>
      <nav className="mobile-tab-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`mobile-tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span className="mobile-tab-icon" aria-hidden="true">{t.icon}</span>
            <span className="mobile-tab-label">{t.label}</span>
            {tabBadges[t.key] && <span className="mobile-tab-badge">{tabBadges[t.key]}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
