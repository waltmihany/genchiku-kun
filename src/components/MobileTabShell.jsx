import { useEffect, useMemo, useState } from "react";

const TABS = [
  { key: "map", label: "マップ", icon: "🗺" },
  { key: "finance", label: "財政", icon: "💴" },
  { key: "staff", label: "担当者", icon: "👥" },
  { key: "event", label: "イベント", icon: "⚠" },
  { key: "year", label: "年度", icon: "📅" },
];

function fiscalStateLabel(value) {
  if (value >= 70) return { label: "健全", tone: "positive" };
  if (value >= 50) return { label: "注意", tone: "neutral" };
  if (value >= 30) return { label: "危険", tone: "warning" };
  return { label: "破綻寸前", tone: "negative" };
}

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

function MapTab({ dashboardVM }) {
  if (!dashboardVM) return <p className="tab-empty">マップ情報を準備中です。</p>;
  const regions = dashboardVM.regions || [];
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">自治体マップ</h3>
      <p className="tab-pane-lead">地区ごとの状態を一覧で確認できます。色は反乱・満足の状態を示します。</p>
      <div className="region-grid-mobile">
        {regions.map((region) => {
          const tone = regionRiskTone(region);
          return (
            <div key={region.id} className={`region-card-mobile tone-${tone}`}>
              <div className="region-card-head">
                <strong>{region.name}</strong>
                <span className={`risk-badge tone-${tone}`}>{regionRiskLabel(tone)}</span>
              </div>
              <div className="region-card-stats">
                <div>満足 {region.satisfaction}</div>
                <div>反乱 {region.rebellion}</div>
              </div>
              {region.note && <p className="region-card-note">{region.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinanceTab({ dashboardVM }) {
  if (!dashboardVM) return <p className="tab-empty">財政情報を準備中です。</p>;
  const stats = dashboardVM.stats || [];
  const fiscalStat = stats.find((s) => s.key === "fiscalHealth");
  const futureStat = stats.find((s) => s.key === "futureBurden");
  const fiscal = fiscalStat ? fiscalStateLabel(fiscalStat.value) : null;

  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">財政状況</h3>
      {fiscal && (
        <div className={`fiscal-headline tone-${fiscal.tone}`}>
          <span className="fiscal-label">財政状態</span>
          <strong>{fiscal.label}</strong>
        </div>
      )}
      <div className="finance-card-grid">
        <div className="finance-card">
          <span>今年度予算</span>
          <strong>{dashboardVM.subtitle?.match(/年間予算 ([^ ]+)/)?.[1] || "—"}</strong>
        </div>
        <div className="finance-card">
          <span>予備費</span>
          <strong>{dashboardVM.subtitle?.match(/予備費 ([^ ]+)/)?.[1] || "—"}</strong>
        </div>
        {fiscalStat && (
          <div className="finance-card">
            <span>財政健全度</span>
            <strong>{fiscalStat.value}</strong>
            <small>{fiscalStat.stateLabel}</small>
          </div>
        )}
        {futureStat && (
          <div className="finance-card">
            <span>将来維持負担</span>
            <strong>{futureStat.value}</strong>
            <small>{futureStat.stateLabel}</small>
          </div>
        )}
      </div>
      <p className="tab-pane-note">{dashboardVM.summaryMessage}</p>
    </div>
  );
}

function StaffTab({ dashboardVM }) {
  if (!dashboardVM) return <p className="tab-empty">担当者の情報を準備中です。</p>;
  const items = dashboardVM.staffItems || [];
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">担当者の意見</h3>
      <p className="tab-pane-lead">それぞれの担当者は見え方にクセがあります。次の年度予算のヒントとして読みましょう。</p>
      <div className="staff-card-grid">
        {items.map((item) => (
          <div key={item.key} className={`staff-card tone-${item.tone || "neutral"}`}>
            <div className="staff-card-head">
              <span className="staff-avatar" aria-hidden="true">{item.avatar || "👤"}</span>
              <div>
                <strong>{item.name}</strong>
                <span className="staff-role">{item.role}</span>
              </div>
            </div>
            <p className="staff-comment">{item.comment}</p>
            {item.warning && <p className="staff-warning">警戒: {item.warning}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventTab({ view, bindings, onChoose }) {
  const eventVM = bindings.screens.event?.getViewModel?.();
  if (!eventVM) {
    return (
      <div className="tab-pane">
        <h3 className="tab-pane-title">未対応のイベント</h3>
        <p className="tab-empty">現在、対応待ちのイベントはありません。年度を進めると必要なときに通知されます。</p>
      </div>
    );
  }
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">{eventVM.title}</h3>
      <p className="event-body">{eventVM.body}</p>
      <div className="event-meta-row">
        {eventVM.metaChips?.map((chip, idx) => (
          <span key={idx} className={`inline-chip tone-${chip.tone || "neutral"}`}>{chip.label}</span>
        ))}
      </div>
      <div className="event-choice-list">
        {eventVM.choices?.map((choice) => (
          <button
            key={choice.index}
            type="button"
            className={`choice-btn ${choice.recommended ? "recommended" : ""}`}
            onClick={() => onChoose?.(choice.index)}
          >
            <strong>{choice.label}</strong>
            <div className="choice-preview">{choice.previewText}</div>
            <div className="choice-chips">
              {choice.effectChips?.slice(0, 3).map((chip, idx) => (
                <span key={idx} className={`inline-chip tone-${chip.tone}`}>{chip.label}</span>
              ))}
            </div>
            <small className="choice-risk">{choice.riskLabel}（見込み）</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function YearTab({ view, dashboardVM, auto, onOpenReport, onOpenBudget }) {
  const log = dashboardVM?.recentLog || [];
  return (
    <div className="tab-pane">
      <h3 className="tab-pane-title">年度の進行</h3>
      <div className="year-status-card">
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
            <button type="button" className="primary-btn" onClick={auto.start}>年度を開始</button>
          )}
          {auto.isRunning && (
            <button type="button" className="ghost-btn" onClick={auto.stop}>一時停止</button>
          )}
          {view.phase === "report" && (
            <button type="button" className="primary-btn" onClick={onOpenReport}>年度末レポートを見る</button>
          )}
          {view.phase === "budget" && (
            <button type="button" className="primary-btn" onClick={onOpenBudget}>予算配分を開く</button>
          )}
        </div>
      </div>
      <h4 className="year-log-title">主な出来事</h4>
      <ul className="year-log-list">
        {log.slice(0, 8).map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
        {log.length === 0 && <li className="muted">まだ大きな動きはありません。</li>}
      </ul>
    </div>
  );
}

export function MobileTabShell({ view, bindings, auto }) {
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

  let pane;
  if (tab === "map") pane = <MapTab dashboardVM={dashboardVM} />;
  else if (tab === "finance") pane = <FinanceTab dashboardVM={dashboardVM} />;
  else if (tab === "staff") pane = <StaffTab dashboardVM={dashboardVM} />;
  else if (tab === "event") pane = <EventTab view={view} bindings={bindings} onChoose={onChoose} />;
  else pane = <YearTab view={view} dashboardVM={dashboardVM} auto={auto} onOpenReport={onOpenReport} onOpenBudget={onOpenBudget} />;

  return (
    <div className="mobile-tab-shell">
      <div className="mobile-tab-content">{pane}</div>
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
