import { createGameCoreOnboardingUiHelpersShape } from "../deps/gameCoreUiHelpersAssemblyDefinitions.js";

export function createGameCoreOnboardingUiHelpers(ctx) {
  const {
    gameState,
    getAppRoot,
    getElement,
    setHasCompletedOnboarding,
    render,
    setScreen,
  } = ctx;

  function completeOnboarding(skip = false) {
    gameState.onboardingActive = false;
    gameState.onboardingSeen = { dashboard: true, report: true, budget: true };
    setHasCompletedOnboarding(true);
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
    const appRoot = getAppRoot();
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

  return createGameCoreOnboardingUiHelpersShape({
    completeOnboarding,
    onboardingProgressCount,
    getOnboardingConfig,
    renderOnboardingOverlay,
  });
}
