from pathlib import Path


def replace_once(text: str, before: str, after: str, label: str) -> str:
    if before not in text:
        raise RuntimeError(f"Missing pattern for {label}")
    return text.replace(before, after, 1)

app_path = Path("src/App.jsx")
app = app_path.read_text()
app = replace_once(
    app,
    '  getGameViewSnapshot,\n  getReportViewModel,\n  mountLegacyGame,',
    '  getGameViewSnapshot,\n  getReportViewModel,\n  getResultViewModel,\n  mountLegacyGame,',
    'App import getResultViewModel',
)
app = replace_once(
    app,
    '  runDashboardPrimaryAction,\n  runReportOpenBudget,\n  runReportSelectEntry,\n  subscribeGameView,',
    '  runDashboardPrimaryAction,\n  runReportOpenBudget,\n  runReportSelectEntry,\n  runResultRestart,\n  runResultReviewReport,\n  subscribeGameView,',
    'App import result actions',
)
app = replace_once(
    app,
    '  BudgetScreenShell,\n  DashboardScreenShell,\n  ReportScreenShell,\n} from "./components/GameScreens";',
    '  BudgetScreenShell,\n  DashboardScreenShell,\n  ReportScreenShell,\n  ResultScreenShell,\n} from "./components/GameScreens";',
    'App import ResultScreenShell',
)
app = replace_once(
    app,
    '  if (screen === "report") {\n    return (\n      <ReportScreenShell\n        viewModel={getReportViewModel()}\n        onSelectEntry={runReportSelectEntry}\n        onOpenBudget={runReportOpenBudget}\n      />\n    );\n  }\n  return null;',
    '  if (screen === "report") {\n    return (\n      <ReportScreenShell\n        viewModel={getReportViewModel()}\n        onSelectEntry={runReportSelectEntry}\n        onOpenBudget={runReportOpenBudget}\n      />\n    );\n  }\n  if (screen === "clear" || screen === "gameover") {\n    return (\n      <ResultScreenShell\n        viewModel={getResultViewModel()}\n        onRestart={runResultRestart}\n        onReviewReport={runResultReviewReport}\n      />\n    );\n  }\n  return null;',
    'App ReactManagedScreen result case',
)
app = replace_once(
    app,
    '    if (!["dashboard", "budget", "report"].includes(view.screen)) return;',
    '    if (!["dashboard", "budget", "report", "clear", "gameover"].includes(view.screen)) return;',
    'App managed screens list',
)
app_path.write_text(app)

game_core_path = Path("src/legacy/gameCore.js")
game_core = game_core_path.read_text()
game_core = replace_once(
    game_core,
    'const REACT_MANAGED_SCREENS = new Set(["dashboard", "budget", "report"]);',
    'const REACT_MANAGED_SCREENS = new Set(["dashboard", "budget", "report", "clear", "gameover"]);',
    'gameCore managed screens set',
)
result_view_model_block = '''

export function getResultViewModel() {
  const review = buildResultReviewData();
  const isClear = gameState.screen === "clear";
  const headline = isClear ? "10年クリア！" : "ゲームオーバー";
  const badge = isClear ? "完走の振り返り" : "敗因の振り返り";
  const lead = isClear
    ? gameState.clearMessage
    : `${gameState.gameOverReason} ただし、どこで崩れたかは次の一手に変えられます。`;
  const closing = isClear
    ? "全部は救えなくても、守る順番を見切って町をつなぎました。次はもっと余裕を残しての完走も狙えます。"
    : "数字と地区感情の崩れ方を見直せば、同じ局面でもかなり粘れます。最後の年の因果を下で確認できます。";
  const sectionTitle = isClear ? "持ちこたえた理由" : "崩れた理由";
  const secondaryTitle = isClear ? "次に崩れやすい火種" : "次回の立て直し方";
  const topRiskRegion = review.regions[0] || { name: "町全体", satisfaction: 0, rebellion: 0 };
  const calmRegion = review.regions[review.regions.length - 1] || topRiskRegion;
  const topInfra = review.weakestInfra[0] || null;
  const leadBudget = review.causal.budgetFocus?.[0] || null;
  const leadEvent = review.causal.eventHighlights?.[0] || null;
  const leadOutcome = review.causal.outcomeSignals?.[0] || null;
  const focusSummary = isClear
    ? `${calmRegion.name}を最後まで安定圏に残せたことが完走の芯でした。`
    : `${topRiskRegion.name}の反発と積み残しが最後に重なって崩れました。`;
  const actionLead = isClear
    ? `${topRiskRegion.name}と${topInfra ? topInfra.name : "主要インフラ"}を次回の先行監視にすると、もっと余裕を持って完走しやすくなります。`
    : `${review.subFactors[0]?.detail || "次回は予算の穴を先に埋めるところから立て直しましょう。"}`;
  const focusChips = [
    review.causal.budgetLabel || "手動配分",
    `${topRiskRegion.name} 反発 ${topRiskRegion.rebellion}`,
    topInfra ? `${topInfra.name} 状態 ${topInfra.condition}` : "大きな損傷なし",
    gameState.reportEntries?.length ? "年度末レポートあり" : "レポートなし",
  ];
  const nextSteps = isClear
    ? [
        review.subFactors[0] || { title: "残る火種", detail: actionLead },
        review.subFactors[1] || { title: "危うい地区", detail: `${topRiskRegion.name}の警戒を継続します。` },
        review.subFactors[2] || { title: "要注意インフラ", detail: topInfra ? `${topInfra.name}を優先監視に。` : "大きな損傷はありません。" },
      ]
    : [
        review.subFactors[0] || { title: "次回の予算修正", detail: actionLead },
        review.subFactors[1] || { title: "イベント判断の見直し", detail: leadEvent ? `${leadEvent.month}の判断を見直します。` : "イベント選択の比較を増やします。" },
        review.subFactors[2] || { title: "先に守る対象", detail: topInfra ? `${topInfra.name}と${topRiskRegion.name}を先に守ります。` : `${topRiskRegion.name}を先に立て直します。` },
      ];
  return {
    isClear,
    toneClass: isClear ? "clear" : "gameover",
    headline,
    badge,
    lead,
    closing,
    sectionTitle,
    secondaryTitle,
    focusSummary,
    actionLead,
    focusChips,
    nextSteps,
    metricCards: review.metricCards,
    mainFactors: review.mainFactors,
    subFactors: review.subFactors,
    budgetLabel: review.causal.budgetLabel || "手動配分",
    flowPreview: `${leadBudget?.label || "配分のクセは小さめ"} / ${leadEvent?.title || "出来事は分散"} / ${leadOutcome?.label || "年末総括"}`,
    diagnosisPreview: `${topRiskRegion.name}が最大リスク。${topInfra ? `${topInfra.area}の${topInfra.name}が要監視。` : "大きな損傷インフラはありません。"}`,
    budgetFocusItems: (review.causal.budgetFocus || []).slice(0, 3),
    eventHighlights: (review.causal.eventHighlights || []).slice(0, 3),
    outcomeSignals: (review.causal.outcomeSignals || []).slice(0, 4),
    regions: review.regions,
    weakestInfra: review.weakestInfra,
    hasReport: Boolean(gameState.reportEntries?.length),
  };
}

export function runResultRestart() {
  resetGame(true);
}

export function runResultReviewReport() {
  if (!gameState?.reportEntries?.length) return;
  gameState.screen = "report";
  render();
}
'''
game_core = replace_once(
    game_core,
    'export function runReportOpenBudget() {\n  gameState.phase = "budget";\n  setScreen("budget");\n}\n\nfunction createRegionalMoods() {',
    'export function runReportOpenBudget() {\n  gameState.phase = "budget";\n  setScreen("budget");\n}\n' + result_view_model_block + '\nfunction createRegionalMoods() {',
    'gameCore insert result view model/actions',
)
game_core_path.write_text(game_core)

screens_path = Path("src/components/GameScreens.jsx")
screens = screens_path.read_text()
if 'export function ResultScreenShell' in screens:
    raise RuntimeError('ResultScreenShell already exists')
result_component = '''

export function ResultScreenShell({ viewModel, onRestart, onReviewReport }) {
  const [showFlow, setShowFlow] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  return (
    <section className="screen result-screen card">
      <div className="result-body">
        <div className={`result-shell ${viewModel.toneClass}`}>
          <section className={`result-hero ${viewModel.toneClass}`}>
            <span className="result-badge">{viewModel.badge}</span>
            <h2>{viewModel.headline}</h2>
            <p className="result-lead">{viewModel.lead}</p>
            <p className="result-closing">{viewModel.closing}</p>
          </section>

          <section className={`result-mobile-focus-card ${viewModel.toneClass}`}>
            <strong>結論を先に</strong>
            <p>{viewModel.focusSummary}</p>
            <div className="result-focus-chips">
              {viewModel.focusChips.map((item) => (
                <span key={item} className="inline-chip">{item}</span>
              ))}
            </div>
          </section>

          <section className={`result-action-hero ${viewModel.toneClass}`}>
            <strong>{viewModel.isClear ? "次に伸ばす一手" : "次にやる一手"}</strong>
            <p>{viewModel.actionLead}</p>
            <div className="result-next-step-list">
              {viewModel.nextSteps.map((item, index) => (
                <div key={`${item.title}-${index}`} className={`result-next-step-item ${item.tone || "neutral"}`}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="result-metrics">
            {viewModel.metricCards.map((item) => (
              <article key={item.key} className={`result-metric-card ${item.tone}`}>
                <p className="eyebrow">{item.label}</p>
                <strong>{item.value}{item.suffix}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </section>

          <section className="result-section-grid">
            <article className="result-section-card">
              <div className="section-heading">
                <h3>{viewModel.sectionTitle}</h3>
                <span className={`inline-chip ${viewModel.isClear ? "positive" : "negative"}`}>{viewModel.budgetLabel}</span>
              </div>
              <div className="result-review-list">
                {viewModel.mainFactors.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`result-review-item ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="result-section-card">
              <div className="section-heading">
                <h3>{viewModel.secondaryTitle}</h3>
                <span className="inline-chip neutral">次回の見どころ</span>
              </div>
              <div className="result-review-list">
                {viewModel.subFactors.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`result-review-item ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={`result-collapsible-card ${showFlow ? "expanded" : "collapsed"}`} data-result-section="flow">
            <div className="result-section-head">
              <div>
                <h3>最後の年の因果フロー</h3>
                <p className="result-section-subtext">配分 → 判断 → 年末結果</p>
              </div>
              <button type="button" className="ghost-btn result-toggle-btn" aria-expanded={showFlow} onClick={() => setShowFlow((value) => !value)}>
                {showFlow ? "閉じる" : "詳細を見る"}
              </button>
            </div>
            <div className="result-collapsed-preview">{viewModel.flowPreview}</div>
            <div className="result-collapsible-body">
              <div className="result-flow-grid">
                <article className="result-flow-step">
                  <p className="eyebrow">配分のクセ</p>
                  <ul>
                    {viewModel.budgetFocusItems.map((item, index) => (
                      <li key={`${item.label}-${index}`}>
                        <span className={`inline-chip ${item.tone}`}>{item.label}</span>
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </article>
                <article className="result-flow-step">
                  <p className="eyebrow">強く効いた出来事</p>
                  <ul>
                    {viewModel.eventHighlights.length ? viewModel.eventHighlights.map((item, index) => (
                      <li key={`${item.title}-${index}`}>
                        <strong>{item.month} / {item.title}</strong>
                        <p>{item.choiceLabel}</p>
                        <div className="event-effect-row">
                          {(item.signals || []).slice(0, 3).map((signal) => (
                            <span key={signal} className="inline-chip neutral">{signal}</span>
                          ))}
                        </div>
                      </li>
                    )) : <li><p>大きなイベントより、毎月の維持と説明の積み重ねが中心でした。</p></li>}
                  </ul>
                </article>
                <article className="result-flow-step">
                  <p className="eyebrow">年末に残った数字</p>
                  <ul>
                    {viewModel.outcomeSignals.map((item, index) => (
                      <li key={`${item.label}-${index}`}>
                        <span className={`inline-chip ${item.tone}`}>{item.label}</span>
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>

          <section className={`result-collapsible-card ${showDiagnosis ? "expanded" : "collapsed"}`} data-result-section="diagnosis">
            <div className="result-section-head">
              <div>
                <h3>地区とインフラの診断</h3>
                <p className="result-section-subtext">次回の監視対象をまとめて確認</p>
              </div>
              <button type="button" className="ghost-btn result-toggle-btn" aria-expanded={showDiagnosis} onClick={() => setShowDiagnosis((value) => !value)}>
                {showDiagnosis ? "閉じる" : "詳細を見る"}
              </button>
            </div>
            <div className="result-collapsed-preview">{viewModel.diagnosisPreview}</div>
            <div className="result-collapsible-body">
              <div className="result-section-grid spotlight">
                <article className="result-section-card">
                  <div className="section-heading">
                    <h3>地区の温度差</h3>
                    <span className="inline-chip neutral">満足 / 反発</span>
                  </div>
                  <div className="result-region-list">
                    {viewModel.regions.map((region) => (
                      <div key={region.areaId} className={`result-region-item ${region.rebellion >= 55 ? "negative" : region.rebellion >= 35 ? "neutral" : "positive"}`}>
                        <strong>{region.name}</strong>
                        <span>満足 {region.satisfaction}</span>
                        <span>反発 {region.rebellion}</span>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="result-section-card">
                  <div className="section-heading">
                    <h3>傷みが残ったインフラ</h3>
                    <span className="inline-chip neutral">要監視トップ3</span>
                  </div>
                  <div className="result-infra-list">
                    {viewModel.weakestInfra.length ? viewModel.weakestInfra.map((item) => (
                      <div key={item.id} className={`result-infra-item ${item.condition <= 25 ? "negative" : item.condition <= 45 ? "neutral" : "positive"}`}>
                        <strong>{item.name}</strong>
                        <p>{item.area} / {item.kind}</p>
                        <span>状態 {item.condition} ・ 維持負担 {item.burden}</span>
                      </div>
                    )) : <p className="empty-detail">大きく傷んだインフラはありません。</p>}
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="result-actions">
        {viewModel.hasReport ? <button id="reviewResultBtn" className="ghost-btn" onClick={onReviewReport}>最後の年度末レポートを見る</button> : <div />}
        <button id="restartResultBtn" className="primary-btn" onClick={onRestart}>もう一度遊ぶ</button>
      </div>
    </section>
  );
}
'''
screens = screens.rstrip() + result_component + '\n'
screens_path.write_text(screens)

print('B-1 result react migration applied')
