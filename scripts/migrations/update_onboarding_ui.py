from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3/src')
game_core = root / 'legacy' / 'gameCore.js'
styles = root / 'styles.css'

core_text = game_core.read_text()

if 'let hasCompletedOnboarding = false;' not in core_text:
    core_text = core_text.replace('let appRoot = null;\n', 'let appRoot = null;\nlet hasCompletedOnboarding = false;\n')

core_text = core_text.replace(
    '    lastChoiceResult: "",\n    currentYearEvents: [],\n    currentYearBudgetDecision: null,\n    lastYearCausalSummary: null,\n    log: ["町の新年度準備を開始。まずは現場の声を読むところからです。"],',
    '    lastChoiceResult: "",\n    currentYearEvents: [],\n    currentYearBudgetDecision: null,\n    lastYearCausalSummary: null,\n    onboardingActive: !hasCompletedOnboarding,\n    onboardingSeen: { dashboard: false, report: false, budget: false },\n    log: ["町の新年度準備を開始。まずは現場の声を読むところからです。"],'
)

helper_block = '''
function completeOnboarding(skip = false) {
  gameState.onboardingActive = false;
  gameState.onboardingSeen = { dashboard: true, report: true, budget: true };
  hasCompletedOnboarding = true;
  if (skip) {
    gameState.lastChoiceResult = "初回チュートリアルを閉じました。必要になったら画面の要約や因果マップを見ながら進められます。";
  }
}

function onboardingProgressCount() {
  return ["dashboard", "report", "budget"].filter((key) => gameState.onboardingSeen?.[key]).length;
}

function getOnboardingConfig() {
  if (!gameState.onboardingActive || gameState.year !== 1) return null;
  const seen = gameState.onboardingSeen || {};
  if (gameState.screen === "dashboard" && !seen.dashboard) {
    return {
      screen: "dashboard",
      step: 1,
      title: "まずは町の全体像をつかみましょう",
      lead: "最初の年は、全部を完璧に読む必要はありません。まずは3か所だけ見れば十分です。",
      bullets: [
        "上段の6指標で、危険か安定かをざっくり確認する",
        "マップと要注意地区で、どこが火種かを見る",
        "右側の『つぎの行動』から年度末レポートへ進む",
      ],
      primaryLabel: "レポートを見に行く",
      secondaryLabel: "スキップ",
    };
  }
  if (gameState.screen === "report" && !seen.report) {
    return {
      screen: "report",
      step: 2,
      title: "レポートは『事実 → バイアス → 予算』で読みます",
      lead: "担当者はそれぞれ見え方にクセがあります。数字と解釈を分けて読むと迷いにくくなります。",
      bullets: [
        "一覧では『読む順』と『最優先』を目印にする",
        "因果マップで、今年の配分とイベントがどう年末へ返ったかを見る",
        "詳細では『来年度で迷ったら』を次の予算のヒントに使う",
      ],
      primaryLabel: "予算画面へ進む",
      secondaryLabel: "スキップ",
    };
  }
  if (gameState.screen === "budget" && !seen.budget) {
    return {
      screen: "budget",
      step: 3,
      title: "予算は100%に合わせ、穴を作りすぎないのが基本です",
      lead: "最初は極端に寄せすぎず、今年の返りを見ながら少しだけ厚くするのがおすすめです。",
      bullets: [
        "プリセットかバランス型を起点にして、±1 / ±5で微調整する",
        "『前年度からの返り』で何を受けて今年を決めるか確認する",
        "迷ったら中央維持・防災・住民対応を薄くしすぎない",
      ],
      primaryLabel: "わかった、配分してみる",
      secondaryLabel: "スキップ",
    };
  }
  return null;
}

function renderOnboardingOverlay() {
  const existing = appRoot?.querySelector("#onboardingOverlay");
  if (existing) existing.remove();
  const config = getOnboardingConfig();
  if (!config || !appRoot) return;

  const progress = onboardingProgressCount() + 1;
  const html = `
    <div id="onboardingOverlay" class="onboarding-overlay">
      <div class="onboarding-card card">
        <div class="onboarding-progress">初回ガイド ${progress}/3</div>
        <h3>${config.title}</h3>
        <p class="onboarding-lead">${config.lead}</p>
        <div class="onboarding-bullets">
          ${config.bullets.map((item) => `<div class="onboarding-bullet"><span>•</span><p>${item}</p></div>`).join("")}
        </div>
        <div class="onboarding-tip-row">
          <span class="inline-chip">最初は完璧を目指さなくてOK</span>
          <span class="inline-chip">このガイドは今回だけ表示</span>
        </div>
        <div class="onboarding-actions">
          <button id="onboardingSkipBtn" class="ghost-btn">${config.secondaryLabel}</button>
          <button id="onboardingPrimaryBtn" class="primary-btn">${config.primaryLabel}</button>
        </div>
      </div>
    </div>
  `;
  appRoot.insertAdjacentHTML("beforeend", html);

  const skipBtn = getElement("onboardingSkipBtn");
  const primaryBtn = getElement("onboardingPrimaryBtn");
  if (skipBtn) {
    skipBtn.onclick = () => {
      completeOnboarding(true);
      render();
    };
  }
  if (primaryBtn) {
    primaryBtn.onclick = () => {
      if (config.screen === "dashboard") {
        gameState.onboardingSeen.dashboard = true;
        setScreen("report");
        return;
      }
      if (config.screen === "report") {
        gameState.onboardingSeen.report = true;
        gameState.phase = "budget";
        setScreen("budget");
        return;
      }
      if (config.screen === "budget") {
        gameState.onboardingSeen.budget = true;
        completeOnboarding(false);
        render();
      }
    };
  }
}
'''

if 'function completeOnboarding(skip = false)' not in core_text:
    core_text = core_text.replace('function setScreen(screen) {\n  gameState.screen = screen;\n  if (appRoot) render();\n}\n', 'function setScreen(screen) {\n  gameState.screen = screen;\n  if (appRoot) render();\n}\n\n' + helper_block + '\n')

render_old = '''  bindTopButtons();
}'''
render_new = '''  bindTopButtons();
  renderOnboardingOverlay();
}'''
if render_old in core_text and 'renderOnboardingOverlay();' not in core_text:
    core_text = core_text.replace(render_old, render_new)

game_core.write_text(core_text)

styles_text = styles.read_text()
extra_css = '''

.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(61, 58, 54, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.onboarding-card {
  width: min(680px, 100%);
  padding: 24px;
  border-radius: 24px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16);
}

.onboarding-progress {
  display: inline-block;
  margin-bottom: 12px;
  border-radius: 999px;
  background: #f8efe5;
  border: 1px solid #efdfcf;
  color: #7a5f4a;
  padding: 7px 11px;
  font-size: 0.84rem;
  font-weight: 700;
}

.onboarding-card h3 {
  margin: 0 0 10px;
  font-size: 1.5rem;
}

.onboarding-lead {
  margin: 0;
  color: var(--muted);
  line-height: 1.75;
}

.onboarding-bullets {
  display: grid;
  gap: 10px;
  margin: 16px 0;
}

.onboarding-bullet {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 16px;
  background: #fff8f2;
  border: 1px solid #f1e4d7;
}

.onboarding-bullet span {
  font-weight: 800;
  color: #a37045;
}

.onboarding-bullet p {
  margin: 0;
  line-height: 1.7;
  color: #5c534b;
}

.onboarding-tip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.onboarding-actions {
  display: flex;
  gap: 12px;
}

.onboarding-actions .primary-btn,
.onboarding-actions .ghost-btn {
  flex: 1;
}

@media (max-width: 760px) {
  .onboarding-overlay {
    padding: 14px;
    align-items: flex-end;
  }

  .onboarding-card {
    padding: 18px;
    border-radius: 22px 22px 18px 18px;
  }

  .onboarding-actions {
    flex-direction: column;
  }
}
'''
if 'onboarding-overlay' not in styles_text:
    styles_text += extra_css
styles.write_text(styles_text)

print('Onboarding UI updates applied successfully')
