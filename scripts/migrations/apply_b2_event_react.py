from pathlib import Path


def replace_once(text: str, before: str, after: str, label: str) -> str:
    if before not in text:
        raise RuntimeError(f"Missing pattern for {label}")
    return text.replace(before, after, 1)

app_path = Path("src/App.jsx")
app = app_path.read_text()
app = replace_once(
    app,
    '  getDashboardViewModel,\n  getGameViewSnapshot,\n  getReportViewModel,',
    '  getDashboardViewModel,\n  getEventViewModel,\n  getGameViewSnapshot,\n  getReportViewModel,',
    'App import getEventViewModel',
)
app = replace_once(
    app,
    '  runDashboardPrimaryAction,\n  runReportOpenBudget,',
    '  runDashboardPrimaryAction,\n  runEventChooseChoice,\n  runReportOpenBudget,',
    'App import runEventChooseChoice',
)
app = replace_once(
    app,
    '  DashboardScreenShell,\n  ReportScreenShell,\n  ResultScreenShell,',
    '  DashboardScreenShell,\n  EventScreenShell,\n  ReportScreenShell,\n  ResultScreenShell,',
    'App import EventScreenShell',
)
app = replace_once(
    app,
    '  if (screen === "report") {\n    return (\n      <ReportScreenShell\n        viewModel={getReportViewModel()}\n        onSelectEntry={runReportSelectEntry}\n        onOpenBudget={runReportOpenBudget}\n      />\n    );\n  }\n  if (screen === "clear" || screen === "gameover") {',
    '  if (screen === "report") {\n    return (\n      <ReportScreenShell\n        viewModel={getReportViewModel()}\n        onSelectEntry={runReportSelectEntry}\n        onOpenBudget={runReportOpenBudget}\n      />\n    );\n  }\n  if (screen === "event") {\n    return (\n      <EventScreenShell\n        viewModel={getEventViewModel()}\n        onChoose={runEventChooseChoice}\n      />\n    );\n  }\n  if (screen === "clear" || screen === "gameover") {',
    'App ReactManagedScreen event case',
)
app = replace_once(
    app,
    '    if (!["dashboard", "budget", "report", "clear", "gameover"].includes(view.screen)) return;',
    '    if (!["dashboard", "budget", "report", "event", "clear", "gameover"].includes(view.screen)) return;',
    'App managed screens include event',
)
app_path.write_text(app)

game_core_path = Path("src/legacy/gameCore.js")
game_core = game_core_path.read_text()
game_core = replace_once(
    game_core,
    'const REACT_MANAGED_SCREENS = new Set(["dashboard", "budget", "report", "clear", "gameover"]);',
    'const REACT_MANAGED_SCREENS = new Set(["dashboard", "budget", "report", "event", "clear", "gameover"]);',
    'gameCore managed screens include event',
)
game_core = replace_once(
    game_core,
    '  if (screen === "dashboard") return "mapArea";\n  if (screen === "budget") return "budgetStatus";\n  if (screen === "report") return "reportList";\n  return "";',
    '  if (screen === "dashboard") return "mapArea";\n  if (screen === "budget") return "budgetStatus";\n  if (screen === "report") return "reportList";\n  if (screen === "event") return "reactScreenHost";\n  return "";',
    'gameCore event mount id',
)

insert_block = '''

export function getEventViewModel() {
  const event = gameState.pendingEvent;
  if (!event) return null;

  const pressureChips = [];
  if (gameState.indicators.safety < 58) pressureChips.push("安全度が低め");
  if (gameState.indicators.fiscalHealth < 52 || gameState.remainingBudget < 0) pressureChips.push("財政に余裕が少ない");
  if (gameState.indicators.rebellion > 34 || gameState.indicators.support < 62) pressureChips.push("住民感情が荒れやすい");
  if (gameState.indicators.futureBurden > 58) pressureChips.push("将来負担が重め");
  if (!pressureChips.length) pressureChips.push("全体は持ちこたえ中");

  const urgencyScore =
    (event.kind === "infrastructure" ? 2 : 0) +
    (event.kind === "weather" ? 1 : 0) +
    (gameState.indicators.safety < 55 ? 1 : 0) +
    (gameState.indicators.rebellion > 40 ? 1 : 0);
  const urgency = urgencyScore >= 3 ? { label: "緊急度 高", tone: "negative" } : urgencyScore >= 2 ? { label: "緊急度 中", tone: "neutral" } : { label: "緊急度 低", tone: "positive" };

  const metricDefs = {
    remainingBudget: { label: "残予算", inverse: false },
    reserveFund: { label: "予備費", inverse: false },
    safety: { label: "安全", inverse: false },
    fiscalHealth: { label: "財政", inverse: false },
    support: { label: "支持", inverse: false },
    satisfaction: { label: "満足", inverse: false },
    futureBurden: { label: "将来負担", inverse: true },
    rebellion: { label: "反乱", inverse: true },
  };

  const previewDefs = [
    { key: "safety", label: "安全", weight: 1.2 },
    { key: "fiscalHealth", label: "財政", weight: 1.05 },
    { key: "support", label: "支持", weight: 0.9 },
    { key: "satisfaction", label: "満足", weight: 0.9 },
    { key: "futureBurden", label: "将来負担", weight: 1.15 },
    { key: "rebellion", label: "反乱", weight: 1.15 },
    { key: "remainingBudget", label: "残予算", weight: 1 / 950 },
    { key: "reserveFund", label: "予備費", weight: 1 / 1100 },
  ];

  const effectTone = (key, value) => {
    if (!value) return "neutral";
    const inverse = metricDefs[key]?.inverse;
    const good = inverse ? value < 0 : value > 0;
    return good ? "positive" : "negative";
  };

  const formatDelta = (value) => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}`;
  };

  const buildMetricChips = (effect = {}) => {
    const chips = Object.keys(metricDefs).flatMap((key) => {
      const value = effect[key];
      if (value is None):
          pass
    });
  };
'''

# Build the large block in Python to avoid escaping mistakes.
insert_block = '''

export function getEventViewModel() {
  const event = gameState.pendingEvent;
  if (!event) return null;

  const pressureChips = [];
  if (gameState.indicators.safety < 58) pressureChips.push("安全度が低め");
  if (gameState.indicators.fiscalHealth < 52 || gameState.remainingBudget < 0) pressureChips.push("財政に余裕が少ない");
  if (gameState.indicators.rebellion > 34 || gameState.indicators.support < 62) pressureChips.push("住民感情が荒れやすい");
  if (gameState.indicators.futureBurden > 58) pressureChips.push("将来負担が重め");
  if (!pressureChips.length) pressureChips.push("全体は持ちこたえ中");

  const urgencyScore =
    (event.kind === "infrastructure" ? 2 : 0) +
    (event.kind === "weather" ? 1 : 0) +
    (gameState.indicators.safety < 55 ? 1 : 0) +
    (gameState.indicators.rebellion > 40 ? 1 : 0);
  const urgency = urgencyScore >= 3 ? { label: "緊急度 高", tone: "negative" } : urgencyScore >= 2 ? { label: "緊急度 中", tone: "neutral" } : { label: "緊急度 低", tone: "positive" };

  const metricDefs = {
    remainingBudget: { label: "残予算", inverse: false },
    reserveFund: { label: "予備費", inverse: false },
    safety: { label: "安全", inverse: false },
    fiscalHealth: { label: "財政", inverse: false },
    support: { label: "支持", inverse: false },
    satisfaction: { label: "満足", inverse: false },
    futureBurden: { label: "将来負担", inverse: true },
    rebellion: { label: "反乱", inverse: true },
  };

  const previewDefs = [
    { key: "safety", label: "安全", weight: 1.2 },
    { key: "fiscalHealth", label: "財政", weight: 1.05 },
    { key: "support", label: "支持", weight: 0.9 },
    { key: "satisfaction", label: "満足", weight: 0.9 },
    { key: "futureBurden", label: "将来負担", weight: 1.15 },
    { key: "rebellion", label: "反乱", weight: 1.15 },
    { key: "remainingBudget", label: "残予算", weight: 1 / 950 },
    { key: "reserveFund", label: "予備費", weight: 1 / 1100 },
  ];

  const effectTone = (key, value) => {
    if (!value) return "neutral";
    const inverse = metricDefs[key]?.inverse;
    const good = inverse ? value < 0 : value > 0;
    return good ? "positive" : "negative";
  };

  const formatDelta = (value) => {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}`;
  };

  const buildMetricChips = (effect = {}) => {
    const chips = Object.keys(metricDefs).flatMap((key) => {
      const value = effect[key];
      if (value === undefined || value === 0) return [];
      return [{ label: `${metricDefs[key].label} ${formatDelta(value)}`, tone: effectTone(key, value) }];
    });
    if (effect.regionalEffects) {
      Object.entries(effect.regionalEffects).forEach(([areaId, regional]) => {
        const parts = [];
        if (regional.satisfaction) parts.push(`満足 ${formatDelta(regional.satisfaction)}`);
        if (regional.rebellion) parts.push(`反乱 ${formatDelta(regional.rebellion)}`);
        if (parts.length) chips.push({ label: `${areaName(areaId)} ${parts.join(" / ")}`, tone: "neutral" });
      });
    }
    return chips;
  };

  const choiceAngle = (choice) => {
    const effect = choice.effect || {};
    if ((effect.safety || 0) >= 4 && (effect.remainingBudget || 0) < 0) return "安全優先";
    if ((effect.remainingBudget || 0) >= 1000 || (effect.fiscalHealth || 0) >= 3) return "財政優先";
    if ((effect.satisfaction || 0) >= 3 || (effect.support || 0) >= 2 || (effect.regionalEffects && JSON.stringify(effect.regionalEffects).includes("satisfaction"))) return "対話重視";
    if ((effect.futureBurden || 0) <= -3) return "将来軽減";
    if ((effect.futureBurden || 0) >= 3 || (effect.rebellion || 0) >= 3) return "短期しのぎ";
    return "均衡判断";
  };

  const choiceRiskNote = (choice) => {
    const effect = choice.effect || {};
    if ((effect.rebellion || 0) > 0 || (effect.futureBurden || 0) > 0) return "後で重くなる可能性あり";
    if ((effect.remainingBudget || 0) < -1200 || (effect.fiscalHealth || 0) < -3) return "コストは重め";
    if ((effect.satisfaction || 0) > 0 || (effect.support || 0) > 0) return "住民感情は整えやすい";
    if ((effect.safety || 0) > 0) return "事故回避を優先";
    return "大きな偏りは小さめ";
  };

  const effectDirectionLabel = (key, value) => {
    const inverse = metricDefs[key]?.inverse;
    const good = inverse ? value < 0 : value > 0;
    if (key === "remainingBudget" || key === "reserveFund") {
      return `${previewDefs.find((item) => item.key === key)?.label || metricDefs[key]?.label}${value > 0 ? "増" : "減"}`;
    }
    return `${previewDefs.find((item) => item.key === key)?.label || metricDefs[key]?.label}${good ? "改善" : "悪化"}`;
  };

  const summarizeChoiceImpact = (choice) => {
    const effect = choice.effect || {};
    const ranked = previewDefs
      .map((def) => ({ key: def.key, value: effect[def.key] || 0, weight: Math.abs(effect[def.key] || 0) * def.weight }))
      .filter((item) => item.value !== 0)
      .sort((a, b) => b.weight - a.weight);
    const score = ranked.slice(0, 3).reduce((sum, item) => sum + item.weight, 0);
    const impactLabel = score >= 8 ? "影響大" : score >= 4 ? "影響中" : "影響小";
    const impactTone = score >= 8 ? "negative" : score >= 4 ? "neutral" : "positive";
    const topEffects = ranked.slice(0, 2).map((item) => effectDirectionLabel(item.key, item.value));
    return {
      impactLabel,
      impactTone,
      previewText: topEffects.length ? topEffects.join(" / ") : "変化は比較的小さめ",
    };
  };

  const axisChips = [];
  if (gameState.indicators.safety < 58 || event.kind === "infrastructure" || event.kind === "weather") axisChips.push("安全を落とさない");
  if (gameState.indicators.fiscalHealth < 52 || gameState.remainingBudget < 0) axisChips.push("使いすぎに注意");
  if (gameState.indicators.rebellion > 34 || gameState.indicators.support < 62) axisChips.push("住民感情を荒らさない");
  if (gameState.indicators.futureBurden > 58) axisChips.push("将来負担を増やさない");
  if (!axisChips.length) axisChips.push("大きな穴を作らない");

  let recommendedIndex = 0;
  let bestScore = -Infinity;
  event.choices.forEach((choice, index) => {
    const score = balanceChoiceScore(choice);
    if (score > bestScore) {
      bestScore = score;
      recommendedIndex = index;
    }
  });

  return {
    eventKey: `${event.id}-${gameState.year}-${gameState.monthIndex}`,
    metaChips: [
      { label: `${gameState.year}年目 ${MONTHS[gameState.monthIndex]}`, tone: "" },
      { label: `イベント: ${labelEventKind(event.kind)}`, tone: "" },
      urgency,
    ],
    title: event.title,
    body: event.body,
    guideTags: ["おすすめは「バランス寄り」表示", "先に詳細を見る → 下で決定", "色チップは増減の方向を表示"],
    contextCards: [
      {
        title: "まず見る",
        text: `今月は「${axisChips[0]}」が優先です。${pressureChips[0]}ので、最初にここを外さない選択肢から見ましょう。`,
        chips: pressureChips.slice(0, 3),
        focus: True
      },
      {
        title: "判断の軸",
        text: "安全・財政・住民感情・将来負担のどれを守るかで正解が変わります。いま弱い軸を補える案を優先すると事故が減ります。",
        chips: axisChips,
        focus: False
      },
      {
        title: "操作のコツ",
        text: "カードを開くと「影響」「数字の増減」「選んだ後の結果」が見えます。決定は下のボタンなので、誤タップしにくくしてあります。",
        chips: [],
        focus: False
      },
    ],
    recommendedIndex,
    choices: event.choices.map((choice, index) => {
      const effect = choice.effect || {};
      const regionalTouched = effect.regionalEffects ? Object.keys(effect.regionalEffects).map((areaId) => areaName(areaId)).join(" / ") : "町全体";
      const impact = summarizeChoiceImpact(choice);
      const riskNote = choiceRiskNote(choice);
      return {
        index,
        label: choice.label,
        regionalTouched,
        impactLabel: impact.impactLabel,
        impactTone: impact.impactTone,
        angleLabel: choiceAngle(choice),
        riskLabel: riskNote,
        recommended: index == recommendedIndex,
        previewText: impact.previewText,
        collapsedPreview: `${riskNote}。${choice.result}`,
        effectChips: buildMetricChips(effect),
        resultText: choice.result,
      };
    }),
  };
}

export function runEventChooseChoice(choiceIndex) {
  applyEventChoice(choiceIndex);
}
'''.replace('True', 'true').replace('False', 'false').replace(' == ', ' === ')

game_core = replace_once(
    game_core,
    'export function getBudgetViewModel() {',
    insert_block + '\nexport function getBudgetViewModel() {',
    'gameCore insert event view model before budget view model',
)

game_core_path.write_text(game_core)

screens_path = Path("src/components/GameScreens.jsx")
screens = screens_path.read_text()
screens = replace_once(
    screens,
    'import { useState } from "react";',
    'import { useEffect, useState } from "react";',
    'GameScreens import useEffect',
)
if 'export function EventScreenShell' in screens:
    raise RuntimeError('EventScreenShell already exists')

insert_component = '''

export function EventScreenShell({ viewModel, onChoose }) {
  const [expandedIndex, setExpandedIndex] = useState(viewModel?.recommendedIndex ?? 0);

  useEffect(() => {
    setExpandedIndex(viewModel?.recommendedIndex ?? 0);
  }, [viewModel?.eventKey, viewModel?.recommendedIndex]);

  if (!viewModel) {
    return (
      <section className="screen event-screen">
        <section className="card event-card">
          <div className="empty-detail">イベントは発生していません。</div>
        </section>
      </section>
    );
  }

  return (
    <section className="screen event-screen">
      <section className="card event-card">
        <div className="event-meta">
          {viewModel.metaChips.map((chip) => (
            <span key={chip.label} className={`inline-chip ${chip.tone || ""}`.trim()}>{chip.label}</span>
          ))}
        </div>
        <h3>{viewModel.title}</h3>
        <p className="event-body">{viewModel.body}</p>

        <div className="event-context-grid">
          {viewModel.contextCards.map((card) => (
            <div key={card.title} className={`event-context-card ${card.focus ? "event-mobile-focus-card" : ""}`.trim()}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
              {card.chips?.length ? (
                <div className="event-context-chips" style={{ marginTop: 10 }}>
                  {card.chips.map((chip) => (
                    <span key={`${card.title}-${chip}`} className="inline-chip">{chip}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="effects-preview">
          <div className="event-inline-guide">
            {viewModel.guideTags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="choice-list">
          {viewModel.choices.map((choice) => {
            const isExpanded = expandedIndex === choice.index;
            return (
              <article key={choice.index} className={`choice-btn event-choice-card ${isExpanded ? "expanded" : "collapsed"} ${choice.recommended ? "recommended" : ""}`.trim()}>
                <button
                  type="button"
                  className="event-choice-toggle"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : choice.index)}
                >
                  <div className="choice-card-head">
                    <div>
                      <div className="choice-index">選択肢 {choice.index + 1}</div>
                      <strong>{choice.label}</strong>
                    </div>
                    <div className="choice-head-side">
                      <span className="inline-chip">影響: {choice.regionalTouched}</span>
                      <span className={`inline-chip ${choice.impactTone}`}>{choice.impactLabel}</span>
                    </div>
                  </div>
                  <div className="choice-tag-row">
                    <span className="choice-tone-pill">{choice.angleLabel}</span>
                    <span className="choice-note-pill">{choice.riskLabel}</span>
                    {choice.recommended ? <span className="choice-recommend-pill">バランス寄り</span> : null}
                  </div>
                  <div className="choice-summary-row">
                    <span className="choice-summary-pill">要点</span>
                    <span className="choice-summary-text">{choice.previewText}</span>
                    <span className="event-choice-toggle-icon">{isExpanded ? "閉じる" : "詳細を見る"}</span>
                  </div>
                  <div className="choice-collapsed-preview">{choice.collapsedPreview}</div>
                </button>
                <div className="event-choice-detail">
                  <div className={`choice-effects-grid ${choice.effectChips.length ? "" : "empty"}`.trim()}>
                    {choice.effectChips.length ? choice.effectChips.map((chip) => (
                      <span key={chip.label} className={`event-effect-chip ${chip.tone}`}>{chip.label}</span>
                    )) : <span className="event-effect-chip neutral">数値変化は小さめ</span>}
                  </div>
                  <div className="choice-result-preview">選ぶと: {choice.resultText}</div>
                  <div className="event-choice-actions">
                    <button type="button" className="ghost-btn" onClick={() => setExpandedIndex(-1)}>閉じる</button>
                    <button type="button" className="primary-btn" onClick={() => onChoose(choice.index)}>この案にする</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
'''

screens = screens.rstrip() + insert_component + '\n'
screens_path.write_text(screens)

print('B-2 event react migration applied')
