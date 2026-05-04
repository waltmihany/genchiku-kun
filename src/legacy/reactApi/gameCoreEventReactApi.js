import { MONTHS } from "../../data/gameStaticData.js";
import { createGameCoreEventReactApiShape } from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreEventReactApi(ctx) {
  const {
    gameState,
    areaName,
    labelEventKind,
    balanceChoiceScore,
    applyEventChoice,
  } = ctx;

  function getEventViewModel() {
    const event = gameState.pendingEvent;
    if (!event) return null;

    const pressureChips = [];
    if (gameState.indicators.safety < 58) pressureChips.push("安全度が低め");
    if (gameState.indicators.fiscalHealth < 52 || gameState.remainingBudget < 0) pressureChips.push("財政の余裕が少なめ");
    if (gameState.indicators.rebellion > 34 || gameState.indicators.support < 62) pressureChips.push("住民感情が荒れやすい");
    if (gameState.indicators.futureBurden > 58) pressureChips.push("将来負担が重め");
    if (!pressureChips.length) pressureChips.push("全体はとりあえず安定中");

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
      guideTags: ["おすすめは「バランス寄り」として表示", "先に詳細を見て、下のボタンで決定", "色チップは増減の方向を表示"],
      contextCards: [
        {
          title: "まず見るところ",
          text: `今月は「${axisChips[0]}」を优先したい局面です。${pressureChips[0]}ため、まずはこの軸を外さない選択肢から読むのがオススメです。`,
          chips: pressureChips.slice(0, 3),
          focus: true,
        },
        {
          title: "判断の軸",
          text: "安全・財政・住民感情・将来負担のどれを守るかで正解が変わります。今弱くなっている軸を補える案を選ぶと、大きな事故を避けやすくなります。",
          chips: axisChips,
          focus: false,
        },
        {
          title: "操作のコツ",
          text: "カードを開くと「影響」「数字の増減」「選んだ後の結果」を確認できます。決定ボタンは下に集めて、誤タップしにくい位置にしてあります。",
          chips: [],
          focus: false,
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
          recommended: index === recommendedIndex,
          previewText: impact.previewText,
          collapsedPreview: `${riskNote}。${choice.result}`,
          effectChips: buildMetricChips(effect),
          resultText: choice.result,
        };
      }),
    };
  }

  function runEventChooseChoice(choiceIndex) {
    applyEventChoice(choiceIndex);
  }

  return createGameCoreEventReactApiShape({
    getEventViewModel,
    runEventChooseChoice,
  });
}
