import { createGameCoreOnboardingReactApiShape } from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreOnboardingReactApi(ctx) {
  const {
    gameState,
    setHasCompletedOnboarding,
    screenTransitions,
  } = ctx;

  function completeOnboarding(skip = false) {
    gameState.onboardingActive = false;
    gameState.onboardingSeen = { dashboard: true, report: true, budget: true };
    setHasCompletedOnboarding?.(true);
    if (skip) {
      gameState.lastChoiceResult = "初回ガイドを閉じました。必要になったら、各画面の要約や因果マップを見ながら進められます。";
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
        lead: "最初の年は全部を読み込まなくて大丈夫です。3か所を見るだけで、足元の状況はつかめます。",
        bullets: [
          "上段の6指標を見る（とくに「反乱」「支持」「満足」は重要）",
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
        lead: "スタッフの言うことにはそれぞれクセがあります。「数字」と「解釈」を分けて読むと、次の一手が見えやすくなります。",
        bullets: [
          "一覧では『読む順』と『最優先』を目印にする",
          "因果マップで、今年の配分とイベントがどう年末に返ったかを見る",
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
        title: "予算は100%に揃え、穴を作りすぎないのが基本です",
        lead: "最初から極端に寄せず、今年の返りを見ながら少しずつ厚くしていくのがおすすめです。",
        bullets: [
          "プリセットかバランス型を起点にして、±1 / ±5で微調整する",
          "『前年度からの返り』を見ながら、今年の重点を決める",
          "「住民対応」は反乱ゲージを押さえる火消し枚で、薄くしすぎない",
        ],
        primaryLabel: "わかった、配分してみる",
        secondaryLabel: "スキップ",
      };
    }
    return null;
  }

  function getOnboardingViewModel() {
    const config = getOnboardingConfig();
    if (!config) return null;
    return {
      screen: config.screen,
      progress: onboardingProgressCount() + 1,
      totalSteps: 3,
      title: config.title,
      lead: config.lead,
      bullets: config.bullets,
      primaryLabel: config.primaryLabel,
      secondaryLabel: config.secondaryLabel,
      tips: ["最初から完璧を目指さなくて大丈夫です", "このガイドは今回だけ表示されます"],
    };
  }

  function runOnboardingSkipAction() {
    if (!getOnboardingConfig()) return;
    completeOnboarding(true);
    screenTransitions.renderCurrentScreen();
  }

  function runOnboardingPrimaryAction() {
    const config = getOnboardingConfig();
    if (!config) return;
    if (config.screen === "dashboard") {
      gameState.onboardingSeen.dashboard = true;
      screenTransitions.showReport();
      return;
    }
    if (config.screen === "report") {
      gameState.onboardingSeen.report = true;
      screenTransitions.showBudget();
      return;
    }
    if (config.screen === "budget") {
      gameState.onboardingSeen.budget = true;
      completeOnboarding(false);
      screenTransitions.renderCurrentScreen();
    }
  }

  return createGameCoreOnboardingReactApiShape({
    getOnboardingViewModel,
    runOnboardingPrimaryAction,
    runOnboardingSkipAction,
  });
}
