import { BUDGET_PRESETS, budgetCategories } from "../../data/gameStaticData.js";
import { createGameCoreBudgetReactApiShape } from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreBudgetReactApi(ctx) {
  const {
    gameState,
    currentDramaProfile,
    getBudgetTotal,
    detectActiveBudgetPreset,
    recommendBudgetPreset,
    applyBudgetPreset,
    autoBalanceBudget,
    applyBudgetPlan,
    adjustBudget,
    setBudgetValue,
    formatMoney,
  } = ctx;

  function getBudgetViewModel() {
    const drama = currentDramaProfile();
    const total = getBudgetTotal();
    const activePreset = detectActiveBudgetPreset();
    const recommendedPreset = recommendBudgetPreset();
    const presetSummary = BUDGET_PRESETS.find((preset) => preset.key === activePreset)?.summary || "手動調整中: 触った項目に合わせて他の配分が自動で100%へ再調整されます。";
    const allocation = gameState.budgetAllocation;
    const annualBudget = gameState.annualBudget;
    const safetyShare = allocation.bridge + allocation.road + allocation.disaster;
    const residentShare = allocation.outreach + allocation.road;
    const restructureShare = allocation.deconstruction;
    const reserveShare = allocation.reserve;
    const centralInfraShare = allocation.bridge + allocation.road;
    const eventShieldShare = allocation.disaster + allocation.reserve;
    const balanceReference = BUDGET_PRESETS.find((preset) => preset.key === "balanced")?.allocation || allocation;
    const presetVoices = {
      safetyFirst: "事故をまず止める守り型",
      fiscalRecovery: "赤字と将来負担を止血する節約型",
      residentFocus: "反発を落ち着かせる火消し型",
      reductionPush: "終盤に備える整理加速型",
      balanced: "全体崩れを防ぐ均衡型",
    };
    const rowHints = {
      bridge: "橋の事故回避と中央・川沿いの安心感に効きます。",
      road: "生活動線と中央の満足度を支えやすい配分です。",
      disaster: "台風・豪雨イベント時の安全度低下を抑えます。",
      deconstruction: "後年の将来負担を軽くする代わりに、地域反発に注意です。",
      outreach: "住民説明と年末の空気改善に効く短期火消し枠です。",
      reserve: "事故・入札不調・赤字補填の保険として働きます。",
    };
    const rowRoles = {
      bridge: "幹線と橋の安心感",
      road: "生活動線の維持",
      disaster: "イベント耐久",
      deconstruction: "終盤の息切れ防止",
      outreach: "不満の火消し",
      reserve: "突発出費の保険",
    };
    const warnings = [];
    if (centralInfraShare < 34) warnings.push("中央の幹線維持が薄めで、後半に不満が出やすい配分です。");
    if (allocation.disaster < 15) warnings.push("防災が薄めで、天候イベントで安全度が揺れやすい状態です。");
    if (allocation.outreach < 16) warnings.push("住民対応が薄めで、年末の満足度回復が鈍くなりやすい位置です。");
    if (allocation.deconstruction < 16) warnings.push("将来負担が残りやすく、終盤に息切れしやすい配分です。");
    if (allocation.reserve < 15) warnings.push("突発出費への保険が薄めで、イベント耐久が下がりやすい状態です。");
    const goodPoints = [];
    if (safetyShare >= 49) goodPoints.push("安全側に厚めで、事故リスクを押さえやすい配分です。");
    if (residentShare >= 35) goodPoints.push("生活路線と住民対応が厚めで、局地反発を鎮めやすい配分です。");
    if (restructureShare >= 18) goodPoints.push("減築が進めやすく、将来負担を軽めに保ちやすい配分です。");
    if (reserveShare >= 18) goodPoints.push("予備費が厚めで、想定外の出費に耐えやすい状態です。");

    const overviewCards = [
      {
        key: "safety",
        label: "安全寄り",
        value: `${safetyShare}%`,
        tone: safetyShare >= 49 ? "positive" : safetyShare >= 45 ? "neutral" : "negative",
        state: safetyShare >= 49 ? "厚め" : safetyShare >= 45 ? "並" : "薄め",
      },
      {
        key: "resident",
        label: "火消し寄り",
        value: `${residentShare}%`,
        tone: residentShare >= 35 ? "positive" : residentShare >= 31 ? "neutral" : "negative",
        state: residentShare >= 35 ? "強い" : residentShare >= 31 ? "並" : "弱い",
      },
      {
        key: "future",
        label: "将来整理",
        value: `${restructureShare}%`,
        tone: restructureShare >= 18 ? "positive" : restructureShare >= 15 ? "neutral" : "negative",
        state: restructureShare >= 18 ? "進む" : restructureShare >= 15 ? "並" : "遅い",
      },
      {
        key: "reserve",
        label: "突発耐久",
        value: `${reserveShare}%`,
        tone: reserveShare >= 18 ? "positive" : reserveShare >= 15 ? "neutral" : "negative",
        state: reserveShare >= 18 ? "厚い" : reserveShare >= 15 ? "並" : "薄い",
      },
    ];

    const guideCards = [
      {
        key: "central",
        label: "中央の安定",
        value: `${centralInfraShare}%`,
        tone: centralInfraShare >= 34 ? "positive" : centralInfraShare >= 31 ? "neutral" : "negative",
        note: centralInfraShare >= 34 ? "中央の反発を抑えやすい配分です。" : "中央の不満が溜まりやすい境目です。",
      },
      {
        key: "shield",
        label: "イベント耐久",
        value: `${eventShieldShare}%`,
        tone: eventShieldShare >= 31 ? "positive" : eventShieldShare >= 28 ? "neutral" : "negative",
        note: eventShieldShare >= 31 ? "台風・豪雨や突発出費に比較的強めです。" : "天候イベントと臨時出費にやや弱めです。",
      },
      {
        key: "outreach",
        label: "住民火消し",
        value: `${residentShare}%`,
        tone: residentShare >= 35 ? "positive" : residentShare >= 31 ? "neutral" : "negative",
        note: residentShare >= 35 ? "局地炎上の鎮火に向いた年です。" : "説明不足が起きると反発が残りやすい年です。",
      },
      {
        key: "late",
        label: "終盤の軽さ",
        value: `${restructureShare}%`,
        tone: restructureShare >= 18 ? "positive" : restructureShare >= 15 ? "neutral" : "negative",
        note: restructureShare >= 18 ? "将来負担を軽くしやすい配分です。" : "後半の息切れ対策としては控えめです。",
      },
    ];

    const presets = BUDGET_PRESETS.map((preset) => ({
      key: preset.key,
      label: preset.label,
      summary: preset.summary,
      voice: presetVoices[preset.key] || "",
      active: activePreset === preset.key,
      recommended: recommendedPreset.key === preset.key,
    }));

    const rows = budgetCategories.map((cat) => {
      const value = allocation[cat.key];
      const amount = annualBudget * value / 100;
      const delta = value - (balanceReference[cat.key] || 0);
      return {
        key: cat.key,
        label: cat.label,
        description: cat.description,
        value,
        amountLabel: formatMoney(amount),
        roleLabel: rowRoles[cat.key],
        deltaTone: delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral",
        deltaText: delta == 0 ? "基準どおり" : `${delta > 0 ? "+" : ""}${delta}%`,
        hint: rowHints[cat.key],
      };
    });

    return {
      total,
      year: gameState.year,
      dramaSubtitle: drama.subtitle,
      activePresetLabel: activePreset ? BUDGET_PRESETS.find((preset) => preset.key === activePreset)?.label || "" : "",
      activePresetVoice: presetVoices[activePreset] || "手動調整中",
      recommendedPresetLabel: BUDGET_PRESETS.find((preset) => preset.key === recommendedPreset.key)?.label || "",
      presetSummary,
      recommendedReason: recommendedPreset.reason,
      carryover: gameState.lastYearCausalSummary
        ? {
            text: gameState.lastYearCausalSummary.carryovers[0],
            signals: gameState.lastYearCausalSummary.outcomeSignals.slice(0, 3),
          }
        : null,
      overviewCards,
      warningMode: warnings.length > 0,
      noteItems: warnings.length ? warnings : goodPoints.length ? goodPoints : ["大きな穴は少ないですが、何を伸ばしたいかを決めるともっと強くなります。"],
      mixSegments: budgetCategories.map((cat) => ({ key: cat.key, label: cat.label, value: allocation[cat.key] })),
      guideCards,
      presets,
      rows,
    };
  }

  function runBudgetSelectPreset(presetKey) {
    applyBudgetPreset(presetKey);
  }

  function runBudgetAutoBalance() {
    autoBalanceBudget();
  }

  function runBudgetApplyPlan() {
    applyBudgetPlan();
  }

  function runBudgetStep(key, delta) {
    adjustBudget(key, delta);
  }

  function runBudgetSetValue(key, value) {
    setBudgetValue(key, value);
  }

  return createGameCoreBudgetReactApiShape({
    getBudgetViewModel,
    runBudgetSelectPreset,
    runBudgetAutoBalance,
    runBudgetApplyPlan,
    runBudgetStep,
    runBudgetSetValue,
  });
}
