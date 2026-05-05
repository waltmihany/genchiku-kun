import { AREA_ORDER, BUDGET_PRESETS, MONTHS, budgetCategories } from "../../data/gameStaticData.js";
import { createGameCoreProgressApiShape } from "../deps/gameCoreBridgeLeafApiDefinitions.js";

export function createGameCoreProgressApi(ctx) {
  const gameState = new Proxy({}, {
    get(_target, prop) {
      return ctx.getState()?.[prop];
    },
    set(_target, prop, value) {
      const state = ctx.getState();
      if (!state) return false;
      state[prop] = value;
      return true;
    },
  });

  const {
    alertUser,
    clone,
    clamp,
    formatMoney,
    conditionToStatus,
    areaInfrastructureStats,
    getWorstInfrastructure,
    areaName,
    monthLabel,
    averageRegionalValue,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    summarizeBudgetAllocation,
    summarizeEffectSignals,
    eventImpactScore,
    render,
    screenTransitions,
    monthlyEventPool,
    buildYearCausalSummary,
    generateYearEndReport,
  } = ctx;

function getDramaProfile(year) {
  if (year <= 2) {
    return {
      key: "tutorial",
      label: "導入期",
      subtitle: "年1-2: チュートリアル",
      summaryLead: "まだ町は表面上は持っています。今のうちに数字の読み方と火消しの順番を覚える段階です。",
      actionHint: "まずは橋・道路・防災・住民対応の基礎バランスを掴む年です。",
      budgetBaseFactor: 1.01,
      eventChanceBonus: -0.04,
      decayMultiplier: 0.94,
      bridgeDecayExtra: 0.04,
      roadDecayExtra: 0.05,
      deconstructionProgressMultiplier: 0.86,
      deconstructionReliefMultiplier: 0.8,
      satisfactionDrift: 0.15,
      rebellionDrift: -0.05,
      mountainResistanceMultiplier: 1.0,
      yearEndMoodBonus: 0,
      yearEndSupportBonus: 0,
      yearEndFiscalBonus: 0,
      yearEndBurdenShift: -0.5,
    };
  }
  if (year <= 5) {
    return {
      key: "aging",
      label: "老朽化顕在化",
      subtitle: "年3-5: 老いのサイン",
      summaryLead: "小さな劣化が同時多発で見え始めます。『まだ大丈夫』が一番危ない時期です。",
      actionHint: "老朽化の火種が増えるので、守る対象と後回し対象を見切る必要があります。",
      budgetBaseFactor: 0.99,
      eventChanceBonus: 0.05,
      decayMultiplier: 1.08,
      bridgeDecayExtra: 0.14,
      roadDecayExtra: 0.16,
      deconstructionProgressMultiplier: 0.98,
      deconstructionReliefMultiplier: 0.98,
      satisfactionDrift: -0.12,
      rebellionDrift: 0.2,
      mountainResistanceMultiplier: 1.12,
      yearEndMoodBonus: -0.5,
      yearEndSupportBonus: -0.5,
      yearEndFiscalBonus: -0.2,
      yearEndBurdenShift: 1.2,
    };
  }
  if (year <= 8) {
    return {
      key: "reduction_effect",
      label: "減築の効き目と反発",
      subtitle: "年6-8: 減築効果期",
      summaryLead: "減らした判断の効果と副作用が見え始めます。進めた地域では負担が軽くなり、切られた地域では感情が残ります。",
      actionHint: "減築は成果も出るが、説明不足だと反発も増える時期です。",
      budgetBaseFactor: 0.94,
      eventChanceBonus: 0.1,
      decayMultiplier: 1.16,
      bridgeDecayExtra: 0.16,
      roadDecayExtra: 0.13,
      deconstructionProgressMultiplier: 1.1,
      deconstructionReliefMultiplier: 1.1,
      satisfactionDrift: -0.22,
      rebellionDrift: 0.34,
      mountainResistanceMultiplier: 1.36,
      yearEndMoodBonus: -1.7,
      yearEndSupportBonus: -0.6,
      yearEndFiscalBonus: 0.4,
      yearEndBurdenShift: 0.7,
    };
  }
  return {
    key: "consequence",
    label: "帰結期",
    subtitle: "年9-10: 判断の帰結",
    summaryLead: "序盤からの積み残しと、減らした成果の両方が露骨に表に出ます。もう誤魔化しは効きません。",
    actionHint: "ここまでの選択のツケと成果がはっきり出る最終盤です。",
    budgetBaseFactor: 0.88,
    eventChanceBonus: 0.16,
    decayMultiplier: 1.28,
    bridgeDecayExtra: 0.23,
    roadDecayExtra: 0.21,
    deconstructionProgressMultiplier: 1.0,
    deconstructionReliefMultiplier: 1.0,
    satisfactionDrift: -0.4,
    rebellionDrift: 0.52,
    mountainResistanceMultiplier: 1.52,
    yearEndMoodBonus: -2.4,
    yearEndSupportBonus: -1.4,
    yearEndFiscalBonus: -1.2,
    yearEndBurdenShift: 2.7,
  };
}

function currentDramaProfile() {
  return getDramaProfile(gameState.year);
}

function projectSelectionReason(project) {
  const infra = getInfrastructureById(project.targetId);
  const mood = gameState.regionalMoods[project.area] || { satisfaction: 60, rebellion: 20 };
  if (!infra) return "現地データ不足のため選定理由を生成できません。";
  const reasons = [];
  if (infra.importance <= 45) reasons.push("重要度が低め");
  if (infra.condition <= 45) reasons.push("老朽化が進行");
  if (infra.burden >= 14) reasons.push("将来負担が重い");
  if (gameState.indicators.futureBurden >= 58) reasons.push("町全体の将来負担が高い");
  if (project.mode === "restrict") reasons.push("全面撤去より先に延命と安全確保を優先");
  if (mood.rebellion >= 45) reasons.push(`ただし${areaName(project.area)}の反発に注意`);
  return reasons.join(" / ") || "費用対効果が最も高い候補として選定";
}

function projectSelectionScore(project) {
  const infra = getInfrastructureById(project.targetId);
  if (!infra || project.status === "done") return -999;
  const lowImportanceBonus = Math.max(0, 58 - infra.importance) * 1.9;
  const burdenScore = infra.burden * 2.6;
  const conditionScore = Math.max(0, 68 - infra.condition) * 1.35;
  const futureBurdenPush = Math.max(0, gameState.indicators.futureBurden - 45) * 0.75;
  const fiscalPressure = Math.max(0, 58 - gameState.indicators.fiscalHealth) * 0.35;
  const regionalPressure = gameState.regionalMoods[project.area]?.rebellion || 0;
  const areaPenaltyMultiplier = project.area === "mountain" ? 1.55 : project.area === "tourism" ? 1.2 : project.area === "river" ? 0.85 : 0.65;
  const surgePenalty = regionalPressure >= 55 ? 18 : regionalPressure >= 45 ? 8 : 0;
  const localPenalty = regionalPressure * areaPenaltyMultiplier + surgePenalty;
  const modeBonus = project.mode === "restrict" ? 11 : project.mode === "close" ? 8 : 10;
  return lowImportanceBonus + burdenScore + conditionScore + futureBurdenPush + fiscalPressure + modeBonus - localPenalty;
}

function startDeconstructionProject(project, spending) {
  project.status = "active";
  project.startedYear = gameState.year;
  project.startedMonth = gameState.monthIndex;
  project.cpuReason = projectSelectionReason(project);
  project.lastNote = `${project.actionLabel} を開始`;
  gameState.latestDeconstructionAction = project.actionLabel;
  gameState.latestDeconstructionTargetId = project.targetId;
  const message = `CPUが減築対象として「${project.actionLabel}」を選定。理由: ${project.cpuReason}。${monthLabel(gameState.monthIndex)}の減築費 ${formatMoney(spending)} を投入します。`;
  gameState.lastChoiceResult = message;
  gameState.log.unshift(message);
}

function completeDeconstructionProject(project) {
  const infra = getInfrastructureById(project.targetId);
  if (!infra) return;

  project.status = "done";
  project.progress = 100;
  project.completedYear = gameState.year;
  project.completedMonth = gameState.monthIndex;

  if (project.mode === "remove") {
    infra.operationStatus = "removed";
    infra.condition = 0;
    infra.burden = 0;
    infra.status = "removal";
    updateIndicators({
      fiscalHealth: 1,
      futureBurden: -4,
      support: -2,
      regionalEffects: {
        mountain: { satisfaction: -6, rebellion: 9 },
        central: { satisfaction: 1, rebellion: -1 },
      },
    });
  } else if (project.mode === "close") {
    infra.operationStatus = "removed";
    infra.condition = 0;
    infra.burden = 1;
    infra.status = "removal";
    updateIndicators({
      fiscalHealth: 0.5,
      futureBurden: -3.5,
      support: -1,
      regionalEffects: {
        tourism: { satisfaction: -5, rebellion: 7 },
        central: { satisfaction: 1, rebellion: 0 },
      },
    });
  } else if (project.mode === "restrict") {
    infra.operationStatus = "restricted";
    infra.condition = clamp(infra.condition + 10);
    infra.burden = clamp(infra.burden - 5, 0, 30);
    infra.status = conditionToStatus(infra.condition);
    updateIndicators({
      safety: 4,
      futureBurden: -2,
      regionalEffects: {
        river: { satisfaction: -2, rebellion: 3 },
      },
    });
  }

  project.lastNote = `${gameState.year}年 ${monthLabel(gameState.monthIndex)} に完了`;
  const message = `減築処理完了: ${project.actionLabel}。効果: ${project.expectedEffectNote}。マップと年度末報告に反映されます。`;
  gameState.latestDeconstructionAction = project.actionLabel;
  gameState.latestDeconstructionTargetId = project.targetId;
  gameState.deconstructionHistory.unshift({
    year: gameState.year,
    month: monthLabel(gameState.monthIndex),
    message,
    projectId: project.id,
  });
  gameState.lastChoiceResult = message;
  gameState.log.unshift(message);
}

function processDeconstructionProjects(spending, mountainFreeze) {
  const drama = currentDramaProfile();
  const activeProject = gameState.deconstructionProjects.find((project) => project.status === "active");
  if (activeProject) {
    if (mountainFreeze && activeProject.area === "mountain") {
      activeProject.status = "blocked";
      activeProject.lastNote = "山間部反発で停止中";
      return;
    }
    const gain = clamp((spending / 65) * drama.deconstructionProgressMultiplier, 8, 28);
    activeProject.progress = clamp(activeProject.progress + gain, 0, 100);
    activeProject.lastNote = `${monthLabel(gameState.monthIndex)}時点で ${Math.round(activeProject.progress)}%`;
    if (activeProject.progress >= activeProject.requiredProgress) {
      completeDeconstructionProject(activeProject);
    }
    return;
  }

  const blockedProject = gameState.deconstructionProjects.find((project) => project.status === "blocked");
  if (blockedProject && !(mountainFreeze && blockedProject.area === "mountain")) {
    blockedProject.status = "active";
    blockedProject.lastNote = "住民説明を経て再開";
  }

  const candidates = gameState.deconstructionProjects
    .filter((project) => project.status === "idle" && spending >= project.monthlyNeed)
    .filter((project) => !(mountainFreeze && project.area === "mountain"))
    .sort((a, b) => projectSelectionScore(b) - projectSelectionScore(a));

  const picked = candidates[0];
  if (!picked) return;

  startDeconstructionProject(picked, spending);
  const gain = clamp((spending / 70) * drama.deconstructionProgressMultiplier, 8, 26);
  picked.progress = clamp(picked.progress + gain, 0, 100);
  picked.lastNote = `${monthLabel(gameState.monthIndex)}時点で ${Math.round(picked.progress)}%`;
  if (picked.progress >= picked.requiredProgress) {
    completeDeconstructionProject(picked);
  }
}

function syncGlobalMoodIndicators() {
  gameState.indicators.satisfaction = clamp(averageRegionalValue(gameState.regionalMoods, "satisfaction"));
  gameState.indicators.rebellion = clamp(averageRegionalValue(gameState.regionalMoods, "rebellion"), 0, 100);
}

function applyRegionalEffects(regionalEffects = {}) {
  Object.entries(regionalEffects).forEach(([areaId, delta]) => {
    if (!gameState.regionalMoods[areaId]) return;
    if (typeof delta.satisfaction === "number") {
      gameState.regionalMoods[areaId].satisfaction = clamp(gameState.regionalMoods[areaId].satisfaction + delta.satisfaction);
    }
    if (typeof delta.rebellion === "number") {
      gameState.regionalMoods[areaId].rebellion = clamp(gameState.regionalMoods[areaId].rebellion + delta.rebellion, 0, 100);
    }
  });
  syncGlobalMoodIndicators();
}

function getMostVolatileRegion() {
  return AREA_ORDER.map((areaId) => {
    const mood = gameState.regionalMoods[areaId];
    const score = (100 - mood.satisfaction) + mood.rebellion * 1.15;
    return { areaId, score, ...mood };
  }).sort((a, b) => b.score - a.score)[0];
}

function updateIndicators(delta) {
  let needsMoodSync = false;
  Object.entries(delta).forEach(([key, value]) => {
    if (key === "regionalEffects") {
      applyRegionalEffects(value);
      return;
    }
    if (key === "satisfaction" || key === "rebellion") {
      AREA_ORDER.forEach((areaId) => {
        gameState.regionalMoods[areaId][key] = clamp(gameState.regionalMoods[areaId][key] + value, 0, 100);
      });
      needsMoodSync = true;
      return;
    }
    if (key in gameState.indicators) {
      gameState.indicators[key] = clamp(gameState.indicators[key] + value);
    } else if (key === "remainingBudget") {
      gameState.remainingBudget += value;
    } else if (key === "reserveFund") {
      gameState.reserveFund = Math.max(0, gameState.reserveFund + value);
    }
  });

  if (needsMoodSync) {
    syncGlobalMoodIndicators();
  }
}

function applyBudgetPlan() {
  const total = getBudgetTotal();
  if (total !== 100) {
    alertUser(`合計が${total}%です。100%に合わせてください。`);
    return;
  }

  const drama = currentDramaProfile();
  const activePresetKey = detectActiveBudgetPreset();
  const activePreset = BUDGET_PRESETS.find((preset) => preset.key === activePresetKey);
  const fiscalFactor = 0.78 + gameState.indicators.fiscalHealth / 100 * 0.66;
  const supportFactor = 0.88 + gameState.indicators.support / 100 * 0.18;
  const burdenPenalty = Math.max(0.68, 1 - gameState.indicators.futureBurden / 220);
  gameState.annualBudget = Math.round(gameState.annualBudgetBase * drama.budgetBaseFactor * fiscalFactor * supportFactor * burdenPenalty);
  gameState.remainingBudget = gameState.annualBudget;
  gameState.phase = "monthly";
  gameState.monthIndex = 0;
  gameState.pendingEvent = null;
  gameState.currentYearBudgetDecision = {
    year: gameState.year,
    label: activePreset?.label || "手動配分",
    summary: activePreset?.summary || "手動で微調整した配分です。",
    allocation: clone(gameState.budgetAllocation),
    annualBudget: gameState.annualBudget,
    focus: summarizeBudgetAllocation(gameState.budgetAllocation),
  };
  gameState.lastChoiceResult = `年度${gameState.year}の配分が決まりました。使える年間予算は${formatMoney(gameState.annualBudget)}です。現在は${drama.subtitle}で、${drama.actionHint}`;
  gameState.log.unshift(gameState.lastChoiceResult);
  screenTransitions.showDashboard();
}

function getBudgetTotal() {
  return Object.values(gameState.budgetAllocation).reduce((sum, value) => sum + value, 0);
}

function applyBudgetPreset(presetKey) {
  const preset = BUDGET_PRESETS.find((item) => item.key === presetKey);
  if (!preset) return;
  budgetCategories.forEach((cat) => {
    gameState.budgetAllocation[cat.key] = preset.allocation[cat.key];
  });
  render();
}

function detectActiveBudgetPreset() {
  return BUDGET_PRESETS.find((preset) => budgetCategories.every((cat) => preset.allocation[cat.key] === gameState.budgetAllocation[cat.key]))?.key || "";
}

function recommendBudgetPreset() {
  const worstBridge = getWorstInfrastructure(gameState, "bridge");
  const worstRoad = getWorstInfrastructure(gameState, "road");
  const mountainMood = gameState.regionalMoods.mountain;
  const tourismMood = gameState.regionalMoods.tourism;
  const centralMood = gameState.regionalMoods.central;
  const volatileRegion = getMostVolatileRegion();
  const worstCondition = Math.min(worstBridge.condition, worstRoad.condition);

  if (gameState.indicators.safety < 52 || worstCondition < 42) {
    return {
      key: "safetyFirst",
      reason: "足元の安全が不安です。橋・道路・防災を厚くして事故リスクを先に抑える年です。",
    };
  }
  if (gameState.indicators.fiscalHealth < 44 || gameState.remainingBudget < -4500 || gameState.reserveFund < 1800) {
    return {
      key: "fiscalRecovery",
      reason: "財政の耐久力が薄いです。予備費と減築を厚めにして赤字と将来負担の連鎖を止めるのが無難です。",
    };
  }
  if (gameState.indicators.rebellion > 42 || gameState.indicators.support < 58 || centralMood.rebellion > 34 || centralMood.satisfaction < 64 || mountainMood.rebellion > 52 || tourismMood.rebellion > 48 || volatileRegion.rebellion > 50) {
    return {
      key: "residentFocus",
      reason: "地域反発が局地的に強まっています。住民対応と生活路線へ寄せて、まず局地炎上を止めるのが得策です。",
    };
  }
  if (gameState.year >= 5 && gameState.indicators.futureBurden > 60 && gameState.indicators.rebellion < 44 && mountainMood.rebellion < 46 && tourismMood.rebellion < 44) {
    return {
      key: "reductionPush",
      reason: "中盤以降は将来負担の圧縮が効く局面です。反発が落ち着いている今のうちに減築を進める狙い目です。",
    };
  }
  return {
    key: "balanced",
    reason: "状況はまだ一方向に振り切れていません。極端配分より、全体を崩さない均衡型が安定します。",
  };
}

function rebalanceBudgetAllocation(targetKey, requestedValue) {
  const keys = budgetCategories.map((cat) => cat.key);
  const targetValue = clamp(Math.round(requestedValue), 0, 100);
  const otherKeys = keys.filter((key) => key !== targetKey);
  const remaining = 100 - targetValue;

  gameState.budgetAllocation[targetKey] = targetValue;
  if (!otherKeys.length) return;
  if (remaining <= 0) {
    otherKeys.forEach((key) => {
      gameState.budgetAllocation[key] = 0;
    });
    return;
  }

  const currentOtherValues = otherKeys.map((key) => Math.max(0, gameState.budgetAllocation[key]));
  const currentOtherTotal = currentOtherValues.reduce((sum, value) => sum + value, 0);

  if (currentOtherTotal <= 0) {
    const base = Math.floor(remaining / otherKeys.length);
    let leftover = remaining - base * otherKeys.length;
    otherKeys.forEach((key, index) => {
      gameState.budgetAllocation[key] = base + (index < leftover ? 1 : 0);
    });
    return;
  }

  const scaled = otherKeys.map((key, index) => {
    const raw = currentOtherValues[index] / currentOtherTotal * remaining;
    return { key, value: Math.floor(raw), fraction: raw - Math.floor(raw) };
  });
  let assigned = scaled.reduce((sum, item) => sum + item.value, 0);
  let leftover = remaining - assigned;
  scaled.sort((a, b) => b.fraction - a.fraction);
  scaled.forEach((item) => {
    if (leftover > 0) {
      item.value += 1;
      leftover -= 1;
    }
  });
  scaled.forEach((item) => {
    gameState.budgetAllocation[item.key] = item.value;
  });
}

function autoBalanceBudget() {
  applyBudgetPreset("balanced");
}

function adjustBudget(key, delta) {
  rebalanceBudgetAllocation(key, gameState.budgetAllocation[key] + delta);
  render();
}

function setBudgetValue(key, value) {
  rebalanceBudgetAllocation(key, Number(value));
  render();
}

function applyEventChoice(choiceIndex) {
  const event = gameState.pendingEvent;
  const choice = event.choices[choiceIndex];
  updateIndicators(choice.effect || {});

  if (choice.repairTarget) {
    repairInfrastructure(choice.repairTarget, 10);
  }

  gameState.currentYearEvents.push({
    year: gameState.year,
    month: MONTHS[gameState.monthIndex],
    title: event.title,
    kind: event.kind,
    choiceLabel: choice.label,
    result: choice.result,
    effect: clone(choice.effect || {}),
    signals: summarizeEffectSignals(choice.effect || {}),
    impactScore: eventImpactScore(choice.effect || {}),
  });
  gameState.lastChoiceResult = choice.result;
  gameState.log.unshift(`${event.title}: ${choice.label}`);
  gameState.pendingEvent = null;
  finalizeMonth();
}

function repairInfrastructure(kind, amount) {
  const candidates = gameState.infrastructures
    .filter((item) => item.kind === kind)
    .sort((a, b) => a.condition - b.condition)
    .slice(0, 2);

  candidates.forEach((item, index) => {
    item.condition = clamp(item.condition + amount - index * 2);
    item.status = conditionToStatus(item.condition);
  });
}

function processMonthlyMaintenance() {
  const drama = currentDramaProfile();
  const monthlyBudget = gameState.annualBudget / 12;
  const spending = {
    bridge: monthlyBudget * gameState.budgetAllocation.bridge / 100,
    road: monthlyBudget * gameState.budgetAllocation.road / 100,
    disaster: monthlyBudget * gameState.budgetAllocation.disaster / 100,
    deconstruction: monthlyBudget * gameState.budgetAllocation.deconstruction / 100,
    outreach: monthlyBudget * gameState.budgetAllocation.outreach / 100,
    reserve: monthlyBudget * gameState.budgetAllocation.reserve / 100,
  };

  gameState.remainingBudget -= monthlyBudget - spending.reserve * 0.2;
  gameState.reserveFund += spending.reserve * 0.2;
  gameState.regionalAlerts = [];

  const bridgeBoost = spending.bridge / 1080;
  const roadBoost = spending.road / 1140;
  const disasterBoost = spending.disaster / 1230;
  const removeBoost = (spending.deconstruction / 1380) * drama.deconstructionReliefMultiplier;
  const outreachBoost = spending.outreach / 980;
  const mountainFreeze = gameState.regionalMoods.mountain.rebellion >= 64 && spending.deconstruction > 0;

  processDeconstructionProjects(spending.deconstruction, mountainFreeze);

  if (mountainFreeze) {
    const briefingCost = 380;
    gameState.remainingBudget -= briefingCost;
    gameState.indicators.support = clamp(gameState.indicators.support - 2.2 * drama.mountainResistanceMultiplier);
    const note = `山あい集落の反発が強く、減築説明会に${formatMoney(briefingCost)}を投入。山間部の減築は今月停止しました。`;
    gameState.regionalAlerts.push(note);
    gameState.log.unshift(note);
  }

  gameState.infrastructures.forEach((item) => {
    if (item.operationStatus === "removed") {
      item.condition = 0;
      item.burden = 0;
      item.status = "removal";
      return;
    }

    const baseDecay = item.kind === "bridge" ? 1.5 : 1.3;
    const phaseDecay = item.kind === "bridge" ? drama.bridgeDecayExtra : drama.roadDecayExtra;
    const naturalDecay = baseDecay * drama.decayMultiplier + phaseDecay;
    const baseMaintenanceBoost = item.kind === "bridge" ? bridgeBoost : roadBoost;
    const maintenanceBoost = item.operationStatus === "restricted" ? baseMaintenanceBoost * 0.65 : baseMaintenanceBoost;
    const importanceTax = item.importance > 80 ? 0.5 : 0;
    const freezeTarget = mountainFreeze && item.area === "mountain" && item.importance < 55;
    const project = getDeconstructionProjectByTarget(item.id);
    const activeProjectRelief = project && ["active", "blocked"].includes(project.status) ? removeBoost * (project.mode === "restrict" ? 0.35 : 0.7) : 0;
    const deconstructionRelief = item.importance < 45 && !freezeTarget ? removeBoost * 0.9 : item.importance < 55 && !freezeTarget ? removeBoost * 0.45 : 0;
    const burdenRelief = freezeTarget ? 0 : removeBoost * (item.importance < 45 ? 0.8 : item.importance < 55 ? 0.35 : 0);
    item.condition = clamp(item.condition - naturalDecay - importanceTax + maintenanceBoost + deconstructionRelief + activeProjectRelief);
    item.burden = clamp(item.burden + 0.4 + (drama.key === "consequence" ? 0.18 : 0) - burdenRelief - activeProjectRelief * 0.35 - (item.operationStatus === "restricted" ? 0.45 : 0), 0, 30);
    item.status = item.operationStatus === "restricted" && item.condition < 40 ? "warning" : conditionToStatus(item.condition);
  });

  const bridgeAvg = averageCondition("bridge");
  const roadAvg = averageCondition("road");

  gameState.indicators.safety = clamp((bridgeAvg * 0.56 + roadAvg * 0.44) + disasterBoost * 3.3 - (gameState.indicators.futureBurden - 50) * 0.05 - (gameState.reserveFund < 1800 ? 0.9 : 0) - (drama.key === "consequence" ? 2.0 : 0));
  gameState.indicators.futureBurden = clamp(gameState.indicators.futureBurden + 1.95 + drama.yearEndBurdenShift * 0.24 - removeBoost * 3.0 + (roadAvg < 55 ? 1.3 : 0) + (bridgeAvg < 55 ? 1.4 : 0) + (gameState.reserveFund < 1800 ? 0.8 : 0) + (gameState.remainingBudget < 0 ? 0.8 : 0) + (mountainFreeze ? 1.2 : 0));

  AREA_ORDER.forEach((areaId) => {
    const stats = areaInfrastructureStats(areaId);
    const mood = gameState.regionalMoods[areaId];
    const localOutreach = outreachBoost * (areaId === "mountain" ? 1.2 : areaId === "tourism" ? 1.05 : 1);
    let satDelta = localOutreach * 1.38 + (stats.avgCondition - 55) * 0.05 - Math.max(0, stats.avgBurden - 13) * 0.47 + drama.satisfactionDrift;
    let rebDelta = (56 - stats.avgCondition) * 0.07 + Math.max(0, stats.avgBurden - 14) * 0.62 - localOutreach * 0.9 + drama.rebellionDrift;

    if (mood.rebellion >= 55) {
      satDelta -= 1.0;
      rebDelta += 1.2;
    }
    if (mood.satisfaction <= 45) {
      rebDelta += 0.9;
    }
    if (mood.satisfaction >= 80) {
      rebDelta -= 0.5;
    } else if (mood.satisfaction >= 75) {
      rebDelta -= 0.25;
    }

    if (areaId === "central") {
      // 中央地区: 生活道路・通学路・日常不満
      const centralInfraBudget = gameState.budgetAllocation.bridge + gameState.budgetAllocation.road;
      satDelta += spending.bridge / 2200 + spending.road / 2200 + (stats.avgCondition > 60 ? 0.85 : stats.avgCondition > 55 ? 0.4 : 0) - (gameState.remainingBudget < 0 ? 0.7 : 0);
      satDelta += centralInfraBudget >= 39 ? 1.0 : centralInfraBudget >= 35 ? 0.65 : 0.2;
      satDelta += gameState.indicators.support > 72 ? 0.4 : 0;
      if (stats.avgCondition > 62) satDelta += 0.3;
      if (mood.satisfaction <= 55 && centralInfraBudget >= 35) satDelta += 0.7;
      // 反乱側を「生活道路を薄くした時だけ不満」に絞る
      rebDelta += stats.worst?.importance > 80 && stats.worst?.condition < 42 ? 0.95 : stats.worst?.importance > 80 && stats.worst?.condition < 48 ? 0.3 : 0;
      rebDelta -= (spending.bridge + spending.road) / 1310;
      rebDelta -= centralInfraBudget >= 39 ? 2.2 : centralInfraBudget >= 35 ? 1.6 : 0.7;
      rebDelta -= gameState.indicators.support > 72 ? 1.0 : 0;
      rebDelta -= stats.avgCondition > 58 ? 0.85 : 0;
      if (mood.rebellion >= 45 && centralInfraBudget >= 35) rebDelta -= 1.2;
      if (mood.rebellion >= 65 && centralInfraBudget >= 35) rebDelta -= 1.35;
    } else if (areaId === "mountain") {
      // 山あい集落: 減築・撤去・孤立不安
      satDelta -= spending.deconstruction / 2000 * drama.mountainResistanceMultiplier;
      satDelta -= (gameState.budgetAllocation.outreach < 16 ? 0.45 : 0);
      rebDelta += spending.deconstruction / 1500 * drama.mountainResistanceMultiplier + (mountainFreeze ? 3.6 * drama.mountainResistanceMultiplier : 0);
      if (stats.worst?.importance < 45 && stats.worst?.condition < 45) rebDelta += 1.95;
      // 孤立不安: 山間部道路がひどいと、説明不足時に反発を乗せる
      if (stats.worst?.kind === "road" && stats.worst.condition < 45 && gameState.budgetAllocation.outreach < 18) rebDelta += 1.0;
    } else if (areaId === "river") {
      // 川沿いエリア: 水害・橋梁安全
      satDelta += disasterBoost * 1.45 + (stats.worst?.kind === "bridge" && stats.worst.condition < 54 ? -1.6 : 0);
      satDelta -= (gameState.budgetAllocation.disaster < 15 ? 0.55 : 0);
      rebDelta += gameState.indicators.safety < 54 ? 2.7 : 0;
      // 橋梁危険と防災薄さの複合: 川沿い独自の火種
      if (stats.worst?.kind === "bridge" && stats.worst.condition < 50 && gameState.budgetAllocation.disaster < 16) rebDelta += 1.2;
      if (stats.worst?.kind === "bridge" && stats.worst.condition < 45) rebDelta += 0.6;
    } else if (areaId === "tourism") {
      // 観光ゾーン: アクセス・評判悪化
      satDelta += spending.road / 3500 + spending.outreach / 3100;
      satDelta -= (gameState.indicators.satisfaction < 60 && stats.avgCondition < 60 ? 0.35 : 0);
      rebDelta += stats.worst?.kind === "road" && stats.worst.condition < 50 ? 2.05 : 0;
      rebDelta += gameState.monthIndex >= 4 && gameState.monthIndex <= 7 && stats.avgCondition < 58 ? 1.55 : 0;
      // 評判悪化: 反乱上昇中は説明不足でわずかに上乗せ
      if (mood.rebellion >= 40 && gameState.budgetAllocation.outreach < 17) rebDelta += 0.7;
    }

    if (drama.key === "reduction_effect" && gameState.latestDeconstructionAction) {
      satDelta += areaId === "central" ? 0.4 : 0;
      rebDelta += areaId === "mountain" || areaId === "tourism" ? 0.6 : 0;
    }
    if (drama.key === "consequence") {
      satDelta -= 0.35;
      rebDelta += stats.avgCondition < 50 ? 0.8 : 0;
    }

    mood.satisfaction = clamp(mood.satisfaction + satDelta);
    mood.rebellion = clamp(mood.rebellion + rebDelta, 0, 100);
  });

  syncGlobalMoodIndicators();
  gameState.indicators.support = clamp(gameState.indicators.support + outreachBoost * 1.45 - (gameState.indicators.fiscalHealth < 45 ? 2.0 : 0) - (gameState.indicators.satisfaction < 50 ? 1.35 : 0) - (gameState.indicators.rebellion > 50 ? 2.1 : 0) - (gameState.regionalMoods.mountain.rebellion > 68 ? 1.4 : 0) - (gameState.remainingBudget < 0 ? 0.9 : 0) + (drama.key === "tutorial" ? 0.1 : 0) - (drama.key === "consequence" ? 1.3 : 0));
  gameState.indicators.fiscalHealth = clamp(gameState.indicators.fiscalHealth - 1.35 + disasterBoost * 1.1 + removeBoost * 0.45 + (gameState.remainingBudget < 0 ? -3.2 : 0) - (gameState.reserveFund < 2500 ? 1.3 : 0) + (drama.key === "reduction_effect" ? 0.15 : 0) - (drama.key === "consequence" ? 1.2 : 0));
}

function averageCondition(kind) {
  const list = gameState.infrastructures.filter((item) => item.kind === kind && item.operationStatus !== "removed");
  return list.length ? list.reduce((sum, item) => sum + item.condition, 0) / list.length : 60;
}

function maybeUseReserve() {
  if (gameState.remainingBudget < -800 && gameState.reserveFund > 600) {
    const amount = Math.min(gameState.reserveFund, Math.abs(gameState.remainingBudget));
    if (amount <= 0) return;
    gameState.reserveFund -= amount;
    gameState.remainingBudget += amount;
    gameState.indicators.fiscalHealth = clamp(gameState.indicators.fiscalHealth - (amount >= 2400 ? 1.2 : 0.6));
    if (amount >= 2600) {
      gameState.indicators.support = clamp(gameState.indicators.support - 0.4);
    }
    gameState.log.unshift(`残予算の穴埋めとして予備費から${formatMoney(amount)}を充当しました。`);
  }
}

function maybeTriggerMonthlyEvent() {
  const drama = currentDramaProfile();
  const eventCandidates = monthlyEventPool.filter((event) => event.condition(gameState));
  const chance = Math.min(0.94, 0.52 + drama.eventChanceBonus + (gameState.indicators.rebellion > 35 ? 0.12 : 0) + (gameState.indicators.safety < 45 ? 0.1 : 0) + (gameState.year >= 4 ? 0.05 : 0) + (gameState.indicators.support < 55 ? 0.06 : 0) + (gameState.reserveFund < 2000 ? 0.05 : 0));
  if (!eventCandidates.length || Math.random() > chance) return null;

  const ranked = eventCandidates
    .map((event) => ({ event, score: eventPriorityScore(event) + Math.random() * 8 }))
    .sort((a, b) => b.score - a.score);
  const poolSize = Math.min(5, ranked.length);
  const picked = ranked[Math.floor(Math.random() * poolSize)]?.event || ranked[0]?.event || null;
  return picked ? clone(picked) : null;
}

function eventPriorityScore(event) {
  const drama = currentDramaProfile();
  let score = event.basePriority || 60;
  if (event.kind === "resident" && (gameState.indicators.rebellion > 32 || gameState.indicators.satisfaction < 58)) score += 22;
  if (event.kind === "infrastructure" && gameState.indicators.safety < 55) score += 18;
  if (event.kind === "weather" && gameState.budgetAllocation.disaster < 15) score += 14;
  if (event.kind === "finance" && gameState.indicators.fiscalHealth < 50) score += 14;
  if (event.kind === "finance" && gameState.reserveFund < 2500) score += 8;
  if (event.kind === "bonus") score += gameState.indicators.fiscalHealth < 60 ? 8 : 2;
  if (event.id === "mountainPetition" && gameState.regionalMoods.mountain.rebellion > 60) score += 18;
  if (event.id === "touristComplaints" && gameState.regionalMoods.tourism.satisfaction < 65) score += 14;
  if (event.id === "snsBacklash" && gameState.latestDeconstructionAction) score += 12;
  if (event.id === "bridgeMemoryEvent" && gameState.latestDeconstructionAction.includes("橋")) score += 12;
  if (event.id === "disasterRecoveryAssessment" && gameState.reserveFund < 2000) score += 10;
  if (drama.key === "tutorial") {
    if (event.kind === "bonus") score += 8;
    if (event.kind === "infrastructure") score -= 5;
  } else if (drama.key === "aging") {
    if (event.kind === "infrastructure") score += 10;
    if (event.kind === "resident") score += 5;
  } else if (drama.key === "reduction_effect") {
    if (["mountainPetition", "bridgeMemoryEvent", "snsBacklash", "schoolConsolidation"].includes(event.id)) score += 12;
    if (event.kind === "resident") score += 6;
  } else if (drama.key === "consequence") {
    if (event.kind === "finance" || event.kind === "infrastructure") score += 10;
    if (event.kind === "weather") score += 6;
  }
  return score;
}

function advanceMonth() {
  processMonthlyMaintenance();
  maybeUseReserve();
  const event = maybeTriggerMonthlyEvent();
  if (event) {
    gameState.pendingEvent = event;
    screenTransitions.showEvent();
    return;
  }
  finalizeMonth();
}

function buildMonthlyLogLine(monthName) {
  // 人間語で「今月何が起きたか」を短く記録。
  const parts = [];
  // 最も状態が悪いインフラを追跡
  const activeInfra = gameState.infrastructures.filter((item) => item.operationStatus !== "removed");
  const worstNow = activeInfra.length ? activeInfra.reduce((min, item) => item.condition < min.condition ? item : min, activeInfra[0]) : null;
  // 地区反乱の変動を記録
  const moods = gameState.regionalMoods || {};
  const highRebel = AREA_ORDER.find((id) => (moods[id]?.rebellion || 0) >= 60);
  if (highRebel) {
    parts.push(`${areaName(highRebel)}の反発が高まっています`);
  } else if (worstNow && worstNow.condition <= 35) {
    parts.push(`${worstNow.name}が危険域に入りました`);
  } else if (worstNow && worstNow.condition <= 45) {
    parts.push(`${worstNow.name}の状態が落ちています`);
  }
  if (gameState.remainingBudget < 0 && gameState.reserveFund < 1500) {
    parts.push("予備費が薄くなっています");
  }
  const summary = parts.length > 0 ? `: ${parts.slice(0, 2).join("、")}` : "";
  return `${gameState.year}年 ${monthName}${summary}`;
}

function finalizeMonth() {
  const checked = checkGameState();
  if (checked) {
    return;
  }

  const monthName = MONTHS[gameState.monthIndex];
  gameState.log.unshift(buildMonthlyLogLine(monthName));
  gameState.monthIndex += 1;

  if (gameState.monthIndex >= MONTHS.length) {
    finishYear();
    return;
  }

  screenTransitions.showDashboard();
}

function finishYear() {
  const drama = currentDramaProfile();
  const completedCount = gameState.deconstructionProjects.filter((project) => project.status === "done").length;
  const yearEndMoodDelta = (gameState.budgetAllocation.outreach >= 20 ? 1 : gameState.budgetAllocation.outreach >= 16 ? 0 : -2) + drama.yearEndMoodBonus - (gameState.year >= 6 && completedCount === 0 ? 0.5 : 0);
  AREA_ORDER.forEach((areaId) => {
    const centralInfraBudget = gameState.budgetAllocation.bridge + gameState.budgetAllocation.road;
    const extraPenalty = areaId === "mountain" && gameState.regionalMoods[areaId].rebellion > 58 ? -2 : gameState.regionalMoods[areaId].rebellion > 72 ? -1 : 0;
    const endgameStress = drama.key === "consequence" ? -1 : 0;
    const centralRelief = areaId === "central" ? (centralInfraBudget >= 39 ? 0.9 : centralInfraBudget >= 35 ? 0.4 : 0) : 0;
    const rebellionAdjustment = (gameState.budgetAllocation.outreach >= 20 ? -3 : gameState.budgetAllocation.outreach >= 16 ? 0 : 2) + (gameState.year >= 6 && completedCount === 0 ? 1 : 0) + (areaId === "central" && centralInfraBudget >= 35 ? -0.75 : 0);
    gameState.regionalMoods[areaId].satisfaction = clamp(gameState.regionalMoods[areaId].satisfaction + yearEndMoodDelta + extraPenalty + endgameStress + centralRelief);
    gameState.regionalMoods[areaId].rebellion = clamp(gameState.regionalMoods[areaId].rebellion + rebellionAdjustment + (areaId === "mountain" && rebellionAdjustment < 0 ? -1 : 0), 0, 100);
  });
  syncGlobalMoodIndicators();

  gameState.indicators.futureBurden = clamp(gameState.indicators.futureBurden + drama.yearEndBurdenShift - (completedCount >= 2 ? 0.8 : 0) + (gameState.year >= 6 && completedCount === 0 ? 0.8 : 0));
  gameState.indicators.support = clamp(gameState.indicators.support + (gameState.remainingBudget > 12000 ? 0.5 : gameState.remainingBudget > 0 ? -0.5 : -2.5) + drama.yearEndSupportBonus + (completedCount >= 2 ? 0.3 : 0));
  gameState.indicators.fiscalHealth = clamp(gameState.indicators.fiscalHealth + (gameState.remainingBudget > 0 ? 1.0 : -3.8) + drama.yearEndFiscalBonus + (completedCount >= 2 ? 0.8 : 0));

  if (drama.key === "reduction_effect") {
    if (completedCount >= 1) {
      gameState.indicators.futureBurden = clamp(gameState.indicators.futureBurden - 2);
      gameState.regionalAlerts.push("減築の効果が年間指標に表れ、将来負担がやや軽くなりました。");
    } else {
      gameState.indicators.futureBurden = clamp(gameState.indicators.futureBurden + 1.5);
      gameState.regionalAlerts.push("減築の成果が乏しく、再編の遅れが翌年へ持ち越されます。");
    }
  }

  if (drama.key === "consequence") {
    if (completedCount === 0) {
      AREA_ORDER.forEach((areaId) => {
        gameState.regionalMoods[areaId].satisfaction = clamp(gameState.regionalMoods[areaId].satisfaction - 2);
        gameState.regionalMoods[areaId].rebellion = clamp(gameState.regionalMoods[areaId].rebellion + 3, 0, 100);
      });
      syncGlobalMoodIndicators();
      gameState.indicators.support = clamp(gameState.indicators.support - 2.2);
      gameState.regionalAlerts.push("最終盤に入っても具体的な再編成果が乏しく、町全体に『先送り疲れ』が広がりました。");
    } else if (completedCount >= 2) {
      gameState.indicators.fiscalHealth = clamp(gameState.indicators.fiscalHealth + 1.5);
      gameState.indicators.support = clamp(gameState.indicators.support + 1);
      gameState.regionalAlerts.push("過去の減築判断が最終盤で効き、財政と将来負担にわずかな余白が生まれました。");
    }
  }

  if (gameState.indicators.rebellion > 52) {
    gameState.indicators.support = clamp(gameState.indicators.support - 1.1);
    gameState.regionalAlerts.push("年末時点で住民不信が残り、翌年度の支持基盤がやや削られました。");
  }

  gameState.lastYearCausalSummary = buildYearCausalSummary(gameState);
  gameState.reportEntries = generateYearEndReport(gameState, false);
  gameState.selectedReportId = gameState.reportEntries[0]?.id || null;
  gameState.currentYearEvents = [];
  gameState.phase = "report";
  gameState.monthIndex = 0;

  if (gameState.year >= gameState.totalYears) {
    if (!checkGameState(true)) {
      const budgetFactLine = gameState.remainingBudget < 0
        ? gameState.reserveFund > Math.abs(gameState.remainingBudget)
          ? `単年度残予算 ${formatMoney(gameState.remainingBudget)} / 予備費 ${formatMoney(gameState.reserveFund)}（予備費で補填済み）。`
          : `単年度残予算 ${formatMoney(gameState.remainingBudget)} / 予備費 ${formatMoney(gameState.reserveFund)}（予備費も使い切り寸前）。`
        : `残予算 ${formatMoney(gameState.remainingBudget)} / 予備費 ${formatMoney(gameState.reserveFund)}。`;
      const deconLine = `減築完了 ${completedCount}件。`;
      const tightlyClear = gameState.indicators.fiscalHealth < 35 || gameState.reserveFund < 1500 || (gameState.remainingBudget < 0 && gameState.reserveFund < Math.abs(gameState.remainingBudget) * 1.5);
      const headlineLine = tightlyClear
        ? "10年間をギリギリで持ちこたえました。"
        : "10年間を持ちこたえました。";
      gameState.clearMessage = `${headlineLine}${budgetFactLine} ${deconLine}`;
      screenTransitions.showClear();
    }
    return;
  }

  gameState.year += 1;
  const nextDrama = currentDramaProfile();
  gameState.lastChoiceResult = `年度末評価がまとまりました。${gameState.year}年目は${nextDrama.subtitle}です。${nextDrama.actionHint} まずは報告を読みましょう。`;
  screenTransitions.showDashboard();
}

function maybeRegionPreCollapseWarning() {
  // 地区満足がゲームオーバー間近のときに、事前警告を段階的に出す。
  if (!gameState.regionPreCollapseSeen) gameState.regionPreCollapseSeen = {};
  AREA_ORDER.forEach((areaId) => {
    const mood = gameState.regionalMoods[areaId];
    const seen = gameState.regionPreCollapseSeen[areaId] || {};
    // 25以下: 住民運動の兆し
    if (mood.satisfaction <= 25 && !seen.stage1) {
      seen.stage1 = true;
      gameState.regionalAlerts.push(`${areaName(areaId)}で生活不満が蔓延し、住民運動の兆しが見えています。`);
      gameState.log.unshift(`警告: ${areaName(areaId)}で生活不満が蔓延しています。`);
    }
    // 15以下: 議会圧力・支持率低下
    if (mood.satisfaction <= 15 && !seen.stage2) {
      seen.stage2 = true;
      gameState.indicators.support = clamp(gameState.indicators.support - 2.5);
      gameState.regionalAlerts.push(`${areaName(areaId)}の不満が議会圧力となり、支持率が掺さぶられています。`);
      gameState.log.unshift(`重要警告: ${areaName(areaId)}の住民不満が議会を動かし始めました。`);
    }
    // 8以下: 不信任動議・最後警告
    if (mood.satisfaction <= 8 && !seen.stage3) {
      seen.stage3 = true;
      gameState.indicators.support = clamp(gameState.indicators.support - 4);
      gameState.regionalAlerts.push(`最後警告: ${areaName(areaId)}で不信任動議の動きがあります。今年度の判断が取り返したい状況です。`);
      gameState.log.unshift(`最後警告: ${areaName(areaId)}で不信任動議の動きがあります。`);
    }
    // 同様に、反乱がゲージ限界近いとき
    if (mood.rebellion >= 78 && !seen.rebStage1) {
      seen.rebStage1 = true;
      gameState.regionalAlerts.push(`${areaName(areaId)}で反発が高まり、住民集会が頻繁に開かれています。`);
      gameState.log.unshift(`警告: ${areaName(areaId)}で住民集会が頻繁に開かれています。`);
    }
    if (mood.rebellion >= 90 && !seen.rebStage2) {
      seen.rebStage2 = true;
      gameState.indicators.support = clamp(gameState.indicators.support - 2.5);
      gameState.regionalAlerts.push(`${areaName(areaId)}で大規模抗議の兆し。今すぐ手を打たないと町政偬転の危険があります。`);
      gameState.log.unshift(`重要警告: ${areaName(areaId)}で大規模抗議の兆しがあります。`);
    }
    gameState.regionPreCollapseSeen[areaId] = seen;
  });
}

function buildGameOverContext(directReason, areaId) {
  // ゲームオーバー時の「なぜ負けたか」を人間語で記録。
  const ctx = { directReason };
  const areaLabel = areaId ? areaName(areaId) : null;
  const allocation = gameState.budgetAllocation || {};
  const indicators = gameState.indicators || {};
  const reasonsBudget = [];
  if (areaId === "central") {
    if ((allocation.bridge + allocation.road) < 35) reasonsBudget.push("中央の幹線・生活道路保守予算が薄めでした");
    if (allocation.outreach < 16) reasonsBudget.push("住民説明予算が薄めで、不満を火消ししきれませんでした");
  } else if (areaId === "mountain") {
    if (allocation.outreach < 17) reasonsBudget.push("住民対応予算が薄く、山間部の孤立不安を押さえられませんでした");
    if (allocation.deconstruction >= 20) reasonsBudget.push("減築を急いだため、反発を押さえる説明が追いつきませんでした");
  } else if (areaId === "river") {
    if (allocation.disaster < 16) reasonsBudget.push("防災予算が薄く、川沿いの水害リスクを押さえられませんでした");
    if (allocation.bridge < 16) reasonsBudget.push("橋梁予算が薄く、主要橋の口コミが悪化しました");
  } else if (areaId === "tourism") {
    if (allocation.road < 17) reasonsBudget.push("道路予算が薄く、観光アクセス路線の評判が落ちました");
    if (allocation.outreach < 16) reasonsBudget.push("住民対応が薄く、観光ゾーン住民の評判低下を抑えられませんでした");
  }
  if ((indicators.fiscalHealth || 0) < 40 && allocation.reserve < 16) {
    reasonsBudget.push("予備費が薄く、突発出費と財政悪化の連鎖を止められませんでした");
  }
  ctx.areaLabel = areaLabel;
  ctx.causeReasons = reasonsBudget;
  // 次回ヒント
  const hints = [];
  if (areaId === "central") {
    hints.push("橋・道路を合わせて３５％以上にし、住民対応も１６％以上に保つと、中央の不満を押さえやすくなります");
  } else if (areaId === "mountain") {
    hints.push("住民対応を厚めにし、減築はペースを落として説明会を併せると進めやすくなります");
  } else if (areaId === "river") {
    hints.push("防災を１６％以上、橋梁予算も厚めにとると、川沿いの反発を抑えやすくなります");
  } else if (areaId === "tourism") {
    hints.push("道路と住民対応を厚めにとると、観光ゾーンの評判を保ちやすくなります");
  }
  if ((indicators.fiscalHealth || 0) < 50) {
    hints.push("予備費を厚めにキープして、突発出費と財政悪化の連鎖を遮ると反発以外も耐えやすくなります");
  }
  ctx.nextHints = hints;
  return ctx;
}

function setGameOverWithContext(directReason, areaId) {
  gameState.gameOverContext = buildGameOverContext(directReason, areaId);
  return setGameOver(directReason);
}

function checkGameState(allowClearCheck = false) {
  const activeInfrastructure = gameState.infrastructures.filter((item) => item.operationStatus !== "removed");
  const worst = activeInfrastructure.length ? activeInfrastructure.reduce((min, item) => Math.min(min, item.condition), 100) : 100;
  // 事前警告を出しておく
  maybeRegionPreCollapseWarning();
  const brokenRegion = AREA_ORDER.find((areaId) => gameState.regionalMoods[areaId].satisfaction <= 0);
  const explosiveRegion = AREA_ORDER.find((areaId) => gameState.regionalMoods[areaId].rebellion >= 100);
  if (brokenRegion) {
    return setGameOverWithContext(`${areaName(brokenRegion)}の満足度が尽き、地区単位で町政への信用が崩れました。`, brokenRegion);
  }
  if (explosiveRegion) {
    const mood = gameState.regionalMoods[explosiveRegion];
    if (mood.satisfaction <= 42 || gameState.indicators.support < 38) {
      return setGameOverWithContext(`${areaName(explosiveRegion)}の反乱が限界突破。地区反発が全町の運営停止へ波及しました。`, explosiveRegion);
    }
    mood.rebellion = 90;
    mood.satisfaction = clamp(mood.satisfaction - 6);
    gameState.indicators.support = clamp(gameState.indicators.support - 7);
    syncGlobalMoodIndicators();
    gameState.regionalAlerts.push(`${areaName(explosiveRegion)}で大規模抗議が発生しました。緊急対応で全面停止は回避しましたが、支持率と地域信頼が大きく削られています。`);
  }
  if (gameState.indicators.support <= 0) {
    return setGameOverWithContext("支持率がゼロになり、議会も住民もあなたを守ってくれませんでした。", null);
  }
  if (gameState.indicators.rebellion >= 100) {
    return setGameOverWithContext("反乱ゲージが限界突破。住民集会がそのまま町政停止イベントになりました。", null);
  }
  if (gameState.remainingBudget < -18000 || (gameState.remainingBudget < -7000 && gameState.reserveFund < 1600) || (gameState.remainingBudget < -2500 && gameState.reserveFund < 900 && gameState.indicators.fiscalHealth < 24) || gameState.indicators.fiscalHealth <= 0) {
    return setGameOverWithContext("巨大赤字で財政が崩壊。橋より先に帳簿が落ちました。", null);
  }
  if (worst <= 10 || (worst <= 20 && gameState.indicators.safety < 35)) {
    return setGameOverWithContext("重大事故が発生。『そのうち直す』は事故後には効きませんでした。", null);
  }
  if (allowClearCheck) {
    return false;
  }
  return false;
}

function setGameOver(reason) {
  gameState.gameOverReason = reason;
  screenTransitions.showGameOver();
  return true;
}

function balanceChoiceScore(choice) {
  const effect = choice.effect || {};
  let score = 0;
  score += (effect.safety || 0) * 1.9;
  score += (effect.fiscalHealth || 0) * 1.45;
  score += (effect.support || 0) * 1.25;
  score += (effect.satisfaction || 0) * 1.05;
  score -= (effect.futureBurden || 0) * 1.4;
  score -= (effect.rebellion || 0) * 1.7;
  score += (effect.remainingBudget || 0) / 950;
  score += (effect.reserveFund || 0) / 1100;
  if (effect.regionalEffects) {
    Object.values(effect.regionalEffects).forEach((regional) => {
      score += (regional.satisfaction || 0) * 0.8;
      score -= (regional.rebellion || 0) * 1.2;
    });
  }
  return score;
}

  return createGameCoreProgressApiShape({
    currentDramaProfile,
    getMostVolatileRegion,
    applyBudgetPlan,
    getBudgetTotal,
    applyBudgetPreset,
    detectActiveBudgetPreset,
    recommendBudgetPreset,
    autoBalanceBudget,
    adjustBudget,
    setBudgetValue,
    applyEventChoice,
    advanceMonth,
    checkGameState,
    setGameOver,
    balanceChoiceScore,
  });
}
