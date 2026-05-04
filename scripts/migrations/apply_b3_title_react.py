from pathlib import Path


def replace_once(text: str, before: str, after: str, label: str) -> str:
    if before not in text:
        raise RuntimeError(f"Missing pattern for {label}")
    return text.replace(before, after, 1)

app_path = Path("src/App.jsx")
app = app_path.read_text()
app = replace_once(
    app,
    '  getEventViewModel,\n  getGameViewSnapshot,\n  getReportViewModel,',
    '  getEventViewModel,\n  getGameViewSnapshot,\n  getReportViewModel,\n  getTitleViewModel,',
    'App import getTitleViewModel',
)
app = replace_once(
    app,
    '  runEventChooseChoice,\n  runReportOpenBudget,',
    '  runEventChooseChoice,\n  runReportOpenBudget,\n  runTitleStartGame,',
    'App import runTitleStartGame',
)
app = replace_once(
    app,
    '  EventScreenShell,\n  ReportScreenShell,\n  ResultScreenShell,',
    '  EventScreenShell,\n  ReportScreenShell,\n  ResultScreenShell,\n  TitleScreenShell,',
    'App import TitleScreenShell',
)
app = replace_once(
    app,
    'function ReactManagedScreen({ screen }) {\n  if (screen === "dashboard") {',
    'function ReactManagedScreen({ screen }) {\n  if (screen === "title") {\n    return (\n      <TitleScreenShell\n        viewModel={getTitleViewModel()}\n        onStart={runTitleStartGame}\n      />\n    );\n  }\n  if (screen === "dashboard") {',
    'App ReactManagedScreen title case',
)
app = replace_once(
    app,
    '    if (!["dashboard", "budget", "report", "event", "clear", "gameover"].includes(view.screen)) return;',
    '    if (!["title", "dashboard", "budget", "report", "event", "clear", "gameover"].includes(view.screen)) return;',
    'App managed screens include title',
)
app_path.write_text(app)

game_core_path = Path("src/legacy/gameCore.js")
game_core = game_core_path.read_text()
game_core = replace_once(
    game_core,
    'const REACT_MANAGED_SCREENS = new Set(["dashboard", "budget", "report", "event", "clear", "gameover"]);',
    'const REACT_MANAGED_SCREENS = new Set(["title", "dashboard", "budget", "report", "event", "clear", "gameover"]);',
    'gameCore managed screens include title',
)
game_core = replace_once(
    game_core,
    'function getReactManagedMountId(screen) {\n  if (screen === "dashboard") return "mapArea";\n  if (screen === "budget") return "budgetStatus";\n  if (screen === "report") return "reportList";\n  if (screen === "event") return "reactScreenHost";\n  return "";\n}',
    'function getReactManagedMountId(screen) {\n  if (screen === "title") return "reactScreenHost";\n  if (screen === "dashboard") return "mapArea";\n  if (screen === "budget") return "budgetStatus";\n  if (screen === "report") return "reportList";\n  if (screen === "event") return "reactScreenHost";\n  return "";\n}',
    'gameCore title mount id',
)

insert_block = '''

export function getTitleViewModel() {
  return {
    eyebrow: "Municipal Infrastructure Budget Simulation",
    title: "読む力で生き残る、町政サバイバル。",
    description: "あなたは人口減少に悩む町のインフラ担当。10年間、橋・道路・防災・減築・住民対応・予備費を配分し、町全体の破綻だけでなく、地域ごとの怒りも抑えながら町を持ちこたえさせます。",
    points: [
      "担当者は全員ちょっと偏っている",
      "地域ごとに機嫌が違う",
      "減築はCPUが具体対象を進める",
      "10年の判断が後半に返ってくる",
    ],
    stats: [
      { title: "勝利条件", text: "10年生存し、町政を崩壊させない" },
      { title: "敗北条件", text: "満足度0 / 財政崩壊 / 重大事故 / 支持率0 / 反乱MAX" },
      { title: "v3移植方針", text: "UIは仮でも、v2のロジックと進行を先に保つ" },
    ],
    startLabel: "ゲーム開始",
  };
}

export function runTitleStartGame() {
  gameState.screen = "dashboard";
  render();
}
'''

game_core = replace_once(
    game_core,
    'function buildDashboardStatItems() {',
    insert_block + '\nfunction buildDashboardStatItems() {',
    'gameCore insert title view model',
)

game_core_path.write_text(game_core)

screens_path = Path("src/components/GameScreens.jsx")
screens = screens_path.read_text()
if 'export function TitleScreenShell' in screens:
    raise RuntimeError('TitleScreenShell already exists')
insert_component = '''

export function TitleScreenShell({ viewModel, onStart }) {
  return (
    <section className="screen title-screen card">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">{viewModel.eyebrow}</p>
          <h2>{viewModel.title}</h2>
          <p>{viewModel.description}</p>
          <div className="title-points">
            {viewModel.points.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
          <button id="startGameBtn" className="primary-btn large" onClick={onStart}>{viewModel.startLabel}</button>
        </div>
        <div className="mini-board">
          {viewModel.stats.map((item) => (
            <div key={item.title} className="mini-stat">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
'''
screens = screens.rstrip() + insert_component + '\n'
screens_path.write_text(screens)

print('B-3 title react migration applied')
