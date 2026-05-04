import { AREA_ORDER, BUDGET_PRESETS, budgetCategories } from "../../data/gameStaticData.js";
import { buildOpeningReportEntry, REPORT_BIAS_PROFILES } from "../../data/reportStaticData.js";
import { staffData } from "../../data/staffData.js";
import { createGameCoreReportApiShape } from "../deps/gameCoreBridgeLeafApiDefinitions.js";

export function createGameCoreReportApi(ctx) {
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
    clamp,
    formatMoney,
    areaName,
    getWorstInfrastructure,
    currentDramaProfile,
    summarizeBudgetAllocation,
    render,
    screenTransitions,
  } = ctx;

function buildYearCausalSummary(state) {
  const budgetAllocation = state.currentYearBudgetDecision?.allocation || state.budgetAllocation;
  const activePreset = BUDGET_PRESETS.find((preset) => budgetCategories.every((cat) => preset.allocation[cat.key] === budgetAllocation[cat.key]))?.label || "手動配分";
  const budgetFocus = summarizeBudgetAllocation(budgetAllocation);
  const eventHighlights = [...(state.currentYearEvents || [])]
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 4);
  const worstBridge = getWorstInfrastructure(state, "bridge");
  const worstRoad = getWorstInfrastructure(state, "road");
  const volatileRegion = AREA_ORDER.map((areaId) => {
    const mood = state.regionalMoods[areaId];
    return {
      areaId,
      satisfaction: mood.satisfaction,
      rebellion: mood.rebellion,
      score: (100 - mood.satisfaction) + mood.rebellion * 1.15,
    };
  }).sort((a, b) => b.score - a.score)[0];

  const outcomeSignals = [
    {
      key: "safety",
      label: `安全 ${Math.round(state.indicators.safety)}`,
      detail: worstBridge.condition < 55 || worstRoad.condition < 55 ? `老朽火種は ${worstBridge.name} / ${worstRoad.name} に残っています。` : "主要インフラはまだ最低限を維持しています。",
      tone: state.indicators.safety >= 60 ? "positive" : state.indicators.safety >= 45 ? "neutral" : "negative",
    },
    {
      key: "finance",
      label: `財政 ${Math.round(state.indicators.fiscalHealth)}`,
      detail: `残予算 ${formatMoney(state.remainingBudget)} / 予備費 ${formatMoney(state.reserveFund)}。`,
      tone: state.indicators.fiscalHealth >= 60 ? "positive" : state.indicators.fiscalHealth >= 40 ? "neutral" : "negative",
    },
    {
      key: "future",
      label: `将来負担 ${Math.round(state.indicators.futureBurden)}`,
      detail: state.indicators.futureBurden <= 45 ? "将来負担はやや整理が進みました。" : "再編の遅れがまだ残っています。",
      tone: state.indicators.futureBurden <= 45 ? "positive" : state.indicators.futureBurden <= 60 ? "neutral" : "negative",
    },
    {
      key: "mood",
      label: `${areaName(volatileRegion.areaId)} 満足 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}`,
      detail: "年末時点で最も荒れやすい地区です。",
      tone: volatileRegion.rebellion < 35 ? "positive" : volatileRegion.rebellion < 55 ? "neutral" : "negative",
    },
  ];

  const carryovers = [];
  if (budgetAllocation.bridge + budgetAllocation.road < 34) carryovers.push("中央維持が薄く、後年の不満が残りやすい年でした。");
  if (budgetAllocation.disaster < 15) carryovers.push("防災が薄く、天候イベントの影響が年末まで尾を引きました。");
  if (budgetAllocation.outreach < 16) carryovers.push("住民対応が薄く、説明不足が満足度と反発に残りました。");
  if (budgetAllocation.deconstruction >= 18) carryovers.push("減築を進めたぶん、将来負担には軽さが出やすい年でした。");
  if (!carryovers.length) carryovers.push("極端な穴は少なく、配分のクセよりイベント判断の積み重ねが年末へ効いた年でした。");

  return {
    year: state.year,
    budgetLabel: activePreset,
    budgetFocus,
    eventHighlights,
    outcomeSignals,
    carryovers,
  };
}

function generateYearEndReport(state, opening = false) {
  const worstBridge = getWorstInfrastructure(state, "bridge");
  const worstRoad = getWorstInfrastructure(state, "road");
  const { indicators } = state;
  const volatileRegion = AREA_ORDER.map((areaId) => {
    const mood = state.regionalMoods[areaId];
    return {
      areaId,
      satisfaction: mood.satisfaction,
      rebellion: mood.rebellion,
      score: (100 - mood.satisfaction) + mood.rebellion * 1.15,
    };
  }).sort((a, b) => b.score - a.score)[0];
  const activeProject = state.deconstructionProjects.find((project) => project.status === "active" || project.status === "blocked");
  const finishedProject = state.deconstructionProjects.find((project) => project.status === "done");
  const latestProject = activeProject || finishedProject || null;

  const biasProfiles = REPORT_BIAS_PROFILES;

  const entries = [
    {
      id: "bridgeReport",
      staffKey: "bridge",
      category: "橋梁",
      title: `${worstBridge.name}の橋梁評価`,
      importance: worstBridge.importance,
      urgency: clamp(100 - worstBridge.condition),
      impactArea: areaName(worstBridge.area),
      factHeadline: `${worstBridge.name}の状態は ${Math.round(worstBridge.condition)}`,
      facts: [
        `最も状態が悪い橋は ${worstBridge.name}（状態 ${Math.round(worstBridge.condition)} / 重要度 ${Math.round(worstBridge.importance)} / 将来負担 ${Math.round(worstBridge.burden)}）。`,
        `${areaName(worstBridge.area)}の地域感情は 満足度 ${Math.round(state.regionalMoods[worstBridge.area].satisfaction)} / 反乱 ${Math.round(state.regionalMoods[worstBridge.area].rebellion)}。`,
        `${worstBridge.operationStatus === "restricted" ? "現在は制限運用中" : "現在は通常運用"}。緊急度は ${Math.round(clamp(100 - worstBridge.condition))}。`,
      ],
      biasLabel: biasProfiles.bridge.label,
      biasSummary: worstBridge.condition < 50
        ? "橋梁担当は『今すぐ危ない』寄りに強く読む傾向があります。危険感の表現は実数値より一段重めです。"
        : "橋梁担当は軽微な異変でも警戒を先に出します。今期は慎重寄りだが、空騒ぎではありません。",
      biasBullets: [
        `橋本は劣化サインを見つけると、将来の破断リスクまで先回りして話します。`,
        `不安寄りの言い方ですが、橋の見落としは致命傷になりやすいため、危険側バイアスには意味があります。`,
      ],
      readingTip: biasProfiles.bridge.readingTip,
      summary: worstBridge.condition >= 60 ? staffData.bridge.comments.good : worstBridge.condition >= 40 ? staffData.bridge.comments.warning : staffData.bridge.comments.bad,
      recommendation: worstBridge.condition >= 40 ? "重点点検を厚くするか、他案件を削って橋へ寄せるか比較" : "緊急補修・制限運用・先送りの損失を見比べる段階",
    },
    {
      id: "roadReport",
      staffKey: "road",
      category: "道路",
      title: `${worstRoad.name}の道路評価`,
      importance: worstRoad.importance,
      urgency: clamp(100 - worstRoad.condition + 6),
      impactArea: areaName(worstRoad.area),
      factHeadline: `${worstRoad.name}の状態は ${Math.round(worstRoad.condition)}`,
      facts: [
        `最も状態が悪い道路は ${worstRoad.name}（状態 ${Math.round(worstRoad.condition)} / 重要度 ${Math.round(worstRoad.importance)} / 将来負担 ${Math.round(worstRoad.burden)}）。`,
        `${areaName(worstRoad.area)}の地域感情は 満足度 ${Math.round(state.regionalMoods[worstRoad.area].satisfaction)} / 反乱 ${Math.round(state.regionalMoods[worstRoad.area].rebellion)}。`,
        `${worstRoad.importance < 45 ? "低利用路線として整理対象になりやすい状態です。" : "生活動線として残す圧力が強い路線です。"}`,
      ],
      biasLabel: biasProfiles.road.label,
      biasSummary: worstRoad.importance < 45
        ? "道路担当は『通れるか』『苦情が出るか』を中心に評価します。維持より整理の現実味も比較的冷静に見ています。"
        : "道路担当は生活への支障を重く見るため、日常利用が多い路線では守る側に傾きやすいです。",
      biasBullets: [
        `道野は見た目の悪さより、通勤・通学・買い物に支障が出るかで優先順位を上げます。`,
        `舗装劣化の報告は、住民苦情の増え方を織り込んだ実務目線です。`,
      ],
      readingTip: biasProfiles.road.readingTip,
      summary: worstRoad.condition >= 60 ? staffData.road.comments.good : worstRoad.condition >= 40 ? staffData.road.comments.warning : staffData.road.comments.bad,
      recommendation: worstRoad.importance < 45 ? "維持・縮小・代替動線の三択を比較" : "生活路線維持の重みと補修費の重さを見比べる",
    },
    {
      id: "disasterReport",
      staffKey: "disaster",
      category: "防災",
      title: indicators.safety >= 65 ? "防災余力の評価" : "風水害リスクの評価",
      importance: clamp(55 + (100 - indicators.safety) / 2),
      urgency: clamp(40 + (100 - indicators.safety) / 1.4),
      impactArea: "全域",
      factHeadline: `安全度は ${Math.round(indicators.safety)}`,
      facts: [
        `町全体の安全度は ${Math.round(indicators.safety)}。防災指標としては ${indicators.safety >= 65 ? "最低限を維持" : indicators.safety >= 45 ? "余裕が薄い" : "かなり危険"}。`,
        `川沿いエリアの感情は 満足度 ${Math.round(state.regionalMoods.river.satisfaction)} / 反乱 ${Math.round(state.regionalMoods.river.rebellion)}。`,
        `橋梁・道路の弱点は ${worstBridge.name} と ${worstRoad.name}。豪雨時は複合的に効いてきます。`,
      ],
      biasLabel: biasProfiles.disaster.label,
      biasSummary: indicators.safety < 55
        ? "防災担当は『もし最悪が来たら』で話すため、平時でも危機感が強く出ます。"
        : "防災担当は今が静かでも次の災害を前提に話します。安全側の誇張として読むのが適切です。",
      biasBullets: [
        `守風は被害が起きた後の説明責任を先に想像しており、常に最悪ケース寄りです。`,
        `実際の数値より警告が強く見えても、備え不足の見落とし防止には役立ちます。`,
      ],
      readingTip: biasProfiles.disaster.readingTip,
      summary: indicators.safety >= 65 ? staffData.disaster.comments.good : indicators.safety >= 45 ? staffData.disaster.comments.warning : staffData.disaster.comments.bad,
      recommendation: indicators.safety >= 55 ? "防災を平準配分で維持するか、次の火種へ先回りするか再確認" : "弱点地区へ寄せるか、全域薄く守るかの判断が必要",
    },
    {
      id: "deconstructionReport",
      staffKey: "deconstruction",
      category: "減築",
      title: indicators.futureBurden <= 45 ? "将来負担の整理状況" : "将来負担の重さ",
      importance: clamp(45 + indicators.futureBurden / 2),
      urgency: clamp(30 + indicators.futureBurden / 1.5),
      impactArea: latestProject ? areaName(latestProject.area) : worstRoad.importance < 45 ? areaName(worstRoad.area) : "旧インフラ全般",
      factHeadline: `将来負担は ${Math.round(indicators.futureBurden)}`,
      facts: [
        `将来負担指標は ${Math.round(indicators.futureBurden)}。${indicators.futureBurden > 55 ? "再編を遅らせると次年度以降が重くなります。" : "まだ制御可能な水準です。"}`,
        `${latestProject ? `具体対象は ${latestProject.actionLabel}（${latestProject.status === "done" ? "完了" : latestProject.status === "blocked" ? "保留" : "進行中"} / 進捗 ${Math.round(latestProject.progress)}%）。` : "今期は具体的な減築対象がまだ走っていません。"}`,
        `最も不穏な地域は ${areaName(volatileRegion.areaId)}（満足度 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}）。`,
      ],
      biasLabel: biasProfiles.deconstruction.label,
      biasSummary: latestProject
        ? "減築担当は『今の反発』より『未来の固定費削減』を重く見ます。対象選定は合理的でも、地域感情を過小評価しがちです。"
        : "減築担当は具体対象がなくても、未整理資産のコストを大きく意識します。将来負担への危機感が強めに出ます。",
      biasBullets: [
        `削田は残す理由が弱い資産を見ると、思い出や慣習より更新費の重さを優先します。`,
        `将来負担を減らす判断には強いが、地域の心理コストは別途補正して読む必要があります。`,
      ],
      readingTip: biasProfiles.deconstruction.readingTip,
      summary: `${indicators.futureBurden <= 45 ? staffData.deconstruction.comments.good : indicators.futureBurden <= 65 ? staffData.deconstruction.comments.warning : staffData.deconstruction.comments.bad}${state.latestDeconstructionAction ? ` 現場では『${state.latestDeconstructionAction}』まで進みました。${state.latestDeconstructionTargetId ? ` 対象は ${state.infrastructures.find((item) => item.id === state.latestDeconstructionTargetId)?.name || state.latestDeconstructionAction} です。` : ""}` : " まだ具体対象の処理は走っていません。"}`,
      recommendation: indicators.futureBurden > 55 ? "反発コスト込みで具体対象を動かすか再評価" : "今のうちに小さく削るか、維持して後年へ回すかの見極め",
    },
    {
      id: "outreachReport",
      staffKey: "outreach",
      category: "住民対応",
      title: indicators.satisfaction >= 65 ? "住民感情の評価" : indicators.rebellion < 35 ? "不安増加の評価" : "反発拡大の評価",
      importance: clamp(40 + (100 - indicators.satisfaction) / 2 + indicators.rebellion / 3),
      urgency: clamp(30 + (100 - indicators.satisfaction) / 1.4 + indicators.rebellion / 2),
      impactArea: areaName(volatileRegion.areaId),
      factHeadline: `全体満足度 ${Math.round(indicators.satisfaction)} / 反乱 ${Math.round(indicators.rebellion)}`,
      facts: [
        `町全体の満足度は ${Math.round(indicators.satisfaction)}、反乱は ${Math.round(indicators.rebellion)}。`,
        `最も不穏なのは ${areaName(volatileRegion.areaId)}（満足度 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}）。`,
        `${state.regionalMoods.mountain.rebellion >= 68 ? "山間部では減築反発が強く、説明コストが追加で必要です。" : "現時点では説明で抑え込める余地があります。"}`,
      ],
      biasLabel: biasProfiles.outreach.label,
      biasSummary: indicators.rebellion >= 35
        ? "住民対応担当は空気の悪化に敏感なタイプです。炎上予防には向く一方、数字より感情を重く見る傾向があります。"
        : "住民対応担当は小さな不満の芽も拾うタイプです。早期把握には強い一方、危機感は少し先回り気味に見える傾向があります。",
      biasBullets: [
        `和田は会議室の沈黙やSNSのざわつきもリスクとして数えます。`,
        `住民感情の悪化速度を読むには有効ですが、実害の大きさとは分けて見る必要があります。`,
      ],
      readingTip: biasProfiles.outreach.readingTip,
      summary: indicators.satisfaction >= 65 ? staffData.outreach.comments.good : indicators.rebellion < 35 ? staffData.outreach.comments.warning : staffData.outreach.comments.bad,
      recommendation: indicators.rebellion > 32 ? "説明を増やして火消しするか、他分野優先で耐えるかを選びたい位置です。" : "広報で満足度を拾うか、別の数字を優先するかを見直したい位置です。",
    },
    {
      id: "financeReport",
      staffKey: "finance",
      category: "財政",
      title: indicators.fiscalHealth >= 60 ? "財政持続性の評価" : "財政余力の警告",
      importance: clamp(55 + (100 - indicators.fiscalHealth) / 1.7),
      urgency: clamp(45 + (100 - indicators.fiscalHealth) / 1.2),
      impactArea: "財政全体",
      factHeadline: `財政健全度は ${Math.round(indicators.fiscalHealth)}`,
      facts: [
        `財政健全度は ${Math.round(indicators.fiscalHealth)}。年度予算 ${formatMoney(state.annualBudget)} / 残額 ${formatMoney(state.remainingBudget)} / 予備費 ${formatMoney(state.reserveFund)}。`,
        `支持率は ${Math.round(indicators.support)}、将来負担は ${Math.round(indicators.futureBurden)}。翌年度予算にも影響します。`,
        `${state.remainingBudget < 0 ? "現時点で赤字気味の運営です。" : "現時点では単年度収支は持ちこたえています。"}`,
      ],
      biasLabel: biasProfiles.finance.label,
      biasSummary: indicators.fiscalHealth < 55
        ? "財政担当は住民感情や思い出より、まず資金繰りで切ります。冷たく見えても、継続不能ラインの見張り役です。"
        : "財政担当は余裕があっても楽観しません。将来の固定費を織り込むため、常に厳しめの言い方になります。",
      biasBullets: [
        `金子は『払えるか』を最優先に評価します。必要性が高くても、持続不能なら反対に回ります。`,
        `感情面の納得は別担当で補い、財政報告は下限ラインの確認として読むのが有効です。`,
      ],
      readingTip: biasProfiles.finance.readingTip,
      summary: indicators.fiscalHealth >= 60 ? staffData.finance.comments.good : indicators.fiscalHealth >= 40 ? staffData.finance.comments.warning : staffData.finance.comments.bad,
      recommendation: indicators.fiscalHealth > 50 ? "予備費温存と重点投資のどちらを厚く取るか要確認" : "守る対象をさらに絞るか、赤字覚悟で延命するかの局面",
    },
  ];

  if (opening) {
    entries.unshift(buildOpeningReportEntry({ areaName, volatileRegion }));
  }

  return entries;
}

function resultMetricTone(metricKey, value) {
  if (metricKey === "futureBurden" || metricKey === "rebellion") {
    return value <= 45 ? "positive" : value <= 60 ? "neutral" : "negative";
  }
  if (metricKey === "remainingBudget") {
    return value >= 0 ? "positive" : value >= -12000 ? "neutral" : "negative";
  }
  if (metricKey === "reserveFund") {
    return value >= 4000 ? "positive" : value >= 1800 ? "neutral" : "negative";
  }
  return value >= 60 ? "positive" : value >= 45 ? "neutral" : "negative";
}

function buildResultReviewData() {
  const causal = gameState.lastYearCausalSummary || buildYearCausalSummary(gameState);
  const regions = AREA_ORDER.map((areaId) => {
    const mood = gameState.regionalMoods[areaId];
    return {
      areaId,
      name: areaName(areaId),
      satisfaction: Math.round(mood.satisfaction),
      rebellion: Math.round(mood.rebellion),
      risk: (100 - mood.satisfaction) + mood.rebellion * 1.2,
    };
  }).sort((a, b) => b.risk - a.risk);
  const calmRegions = [...regions].sort((a, b) => a.risk - b.risk);
  const activeInfra = gameState.infrastructures.filter((item) => item.operationStatus !== "removed");
  const weakestInfra = [...activeInfra]
    .sort((a, b) => a.condition - b.condition)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind === "bridge" ? "橋" : item.kind === "road" ? "道路" : item.kind,
      area: areaName(item.areaId),
      condition: Math.round(item.condition),
      burden: Math.round(item.burden || 0),
    }));
  const positiveBudget = (causal.budgetFocus || []).filter((item) => item.tone === "positive");
  const negativeBudget = (causal.budgetFocus || []).filter((item) => item.tone === "negative");
  const neutralBudget = (causal.budgetFocus || []).filter((item) => item.tone === "neutral");
  const eventHighlights = (causal.eventHighlights || []).slice(0, 3);
  const metricCards = [
    { key: "safety", label: "安全", value: Math.round(gameState.indicators.safety), suffix: "点", detail: weakestInfra[0] ? `最弱 ${weakestInfra[0].name} ${weakestInfra[0].condition}` : "主要インフラは維持中" },
    { key: "fiscalHealth", label: "財政", value: Math.round(gameState.indicators.fiscalHealth), suffix: "点", detail: `残予算 ${formatMoney(gameState.remainingBudget)}` },
    { key: "futureBurden", label: "将来負担", value: Math.round(gameState.indicators.futureBurden), suffix: "点", detail: `予備費 ${formatMoney(gameState.reserveFund)}` },
    { key: "support", label: "支持", value: Math.round(gameState.indicators.support), suffix: "点", detail: `平均満足 ${Math.round(gameState.indicators.satisfaction)}` },
    { key: "rebellion", label: "反乱", value: Math.round(gameState.indicators.rebellion), suffix: "点", detail: `${regions[0].name} 反発 ${regions[0].rebellion}` },
    { key: "reserveFund", label: "予備費", value: Math.round(gameState.reserveFund), suffix: "万円", detail: currentDramaProfile().label },
  ].map((item) => ({ ...item, tone: resultMetricTone(item.key, item.value) }));

  const isClear = gameState.screen === "clear";
  const mainFactors = isClear
    ? [
        {
          title: "持ちこたえた軸",
          tone: positiveBudget[0]?.tone || "positive",
          detail: positiveBudget[0]?.detail || causal.carryovers?.[0] || "極端な穴を作らず、配分のバランスを保てました。",
        },
        {
          title: "効いた判断",
          tone: eventHighlights[0]?.impactScore >= 8 ? "positive" : "neutral",
          detail: eventHighlights[0]
            ? `${eventHighlights[0].month}の「${eventHighlights[0].title}」で「${eventHighlights[0].choiceLabel}」を選び、${eventHighlights[0].signals?.[0] || "局面を大きく動かしました"}。`
            : "単発の妙手より、毎月の小さな判断の積み重ねが効きました。",
        },
        {
          title: "最後まで安定した地区",
          tone: calmRegions[0].rebellion < 35 ? "positive" : "neutral",
          detail: `${calmRegions[0].name}は満足${calmRegions[0].satisfaction} / 反発${calmRegions[0].rebellion}で踏ん張りました。`,
        },
      ]
    : [
        {
          title: "崩れた引き金",
          tone: "negative",
          detail: gameState.gameOverReason,
        },
        {
          title: "詰まっていた地区",
          tone: regions[0].rebellion >= 60 ? "negative" : "neutral",
          detail: `${regions[0].name}は満足${regions[0].satisfaction} / 反発${regions[0].rebellion}。一番先に火が回った地区です。`,
        },
        {
          title: "積み残した火種",
          tone: weakestInfra[0] && weakestInfra[0].condition <= 25 ? "negative" : "neutral",
          detail: weakestInfra[0]
            ? `${weakestInfra[0].area}の${weakestInfra[0].name}は状態${weakestInfra[0].condition}。後回しのしわ寄せが出ています。`
            : (negativeBudget[0]?.detail || causal.carryovers?.[0] || "年内の小さな無理が最後にまとまって噴き出しました。"),
        },
      ];

  const subFactors = isClear
    ? [
        {
          title: "残る火種",
          tone: negativeBudget[0]?.tone || "neutral",
          detail: negativeBudget[0]?.detail || neutralBudget[0]?.detail || `${regions[0].name}はまだ反発${regions[0].rebellion}で、油断すると崩れやすいです。`,
        },
        {
          title: "危うい地区",
          tone: regions[0].rebellion >= 55 ? "negative" : "neutral",
          detail: `${regions[0].name}は満足${regions[0].satisfaction} / 反発${regions[0].rebellion}。次回も優先監視候補です。`,
        },
        {
          title: "要注意インフラ",
          tone: weakestInfra[0] && weakestInfra[0].condition < 45 ? "negative" : "neutral",
          detail: weakestInfra[0]
            ? `${weakestInfra[0].area}の${weakestInfra[0].name}は状態${weakestInfra[0].condition}。完走後も余裕は薄いままです。`
            : "大きな穴はありませんが、余裕のある年ではありません。",
        },
      ]
    : [
        {
          title: "次回の予算修正",
          tone: "positive",
          detail: negativeBudget[0]?.key === "central"
            ? "中央維持を34%以上に戻すと、中央地区の不満連鎖を抑えやすくなります。"
            : negativeBudget[0]?.key === "outreach"
              ? "住民対応を16%以上にすると、年末の満足と反発が立て直しやすくなります。"
              : negativeBudget[0]?.key === "disaster"
                ? "防災を15%以上に戻すと、事故と天候イベントの被弾を減らせます。"
                : "極端な穴を作らない配分に戻すと、終盤の連鎖崩れを防ぎやすいです。",
        },
        {
          title: "イベント判断の見直し",
          tone: "positive",
          detail: eventHighlights[0]
            ? `影響が大きかったのは${eventHighlights[0].month}の「${eventHighlights[0].title}」。次回は${eventHighlights[0].choiceLabel}以外も比較候補です。`
            : "大事件より、複数の小さな選択の積み重ねが効いていました。",
        },
        {
          title: "先に守る対象",
          tone: "positive",
          detail: weakestInfra[0]
            ? `${weakestInfra[0].area}の${weakestInfra[0].kind}「${weakestInfra[0].name}」と、${regions[0].name}の住民感情を最優先で見直すのが近道です。`
            : `${regions[0].name}の住民感情を先に立て直すと、連鎖崩れを止めやすくなります。`,
        },
      ];

  return {
    causal,
    regions,
    weakestInfra,
    metricCards,
    mainFactors,
    subFactors,
  };
}

function overallReportPriority(entry) {
  const score = entry.urgency + entry.importance;
  if (score >= 150) return { label: "最優先", tone: "negative" };
  if (score >= 120) return { label: "優先", tone: "neutral" };
  return { label: "確認", tone: "positive" };
}

function buildSelectedReportLinks(selected, causal) {
  const categorySignals = {
    bridge: ["central", "disaster"],
    road: ["central", "outreach"],
    disaster: ["disaster", "reserve"],
    deconstruction: ["deconstruction", "outreach"],
    outreach: ["outreach", "central"],
    finance: ["reserve", "deconstruction"],
  };
  const budgetLinks = causal.budgetFocus.filter((item) => (categorySignals[selected.staffKey] || []).includes(item.key)).slice(0, 2);
  const eventLinks = causal.eventHighlights.filter((item) => {
    const text = `${item.title} ${item.choiceLabel} ${(item.signals || []).join(" ")}`;
    if (selected.staffKey === "bridge") return item.kind === "infrastructure" || /橋|安全/.test(text);
    if (selected.staffKey === "road") return item.kind === "resident" || item.kind === "infrastructure" || /道路|生活/.test(text);
    if (selected.staffKey === "disaster") return item.kind === "weather" || /安全|防災/.test(text);
    if (selected.staffKey === "deconstruction") return /減築|撤去|将来負担/.test(text);
    if (selected.staffKey === "outreach") return item.kind === "resident" || /満足|反乱|支持/.test(text);
    if (selected.staffKey === "finance") return item.kind === "finance" || /残予算|予備費|財政/.test(text);
    return true;
  }).slice(0, 2);
  const outcomeLinks = causal.outcomeSignals.filter((item) => {
    if (selected.staffKey === "bridge") return item.key === "safety";
    if (selected.staffKey === "road") return item.key === "safety" || item.key === "mood";
    if (selected.staffKey === "disaster") return item.key === "safety";
    if (selected.staffKey === "deconstruction") return item.key === "future";
    if (selected.staffKey === "outreach") return item.key === "mood";
    if (selected.staffKey === "finance") return item.key === "finance" || item.key === "future";
    return true;
  }).slice(0, 2);
  return { budgetLinks, eventLinks, outcomeLinks };
}

function getReportViewModel() {
  const entries = [...gameState.reportEntries];
  const rankedEntries = [...entries].sort((a, b) => ((b.urgency + b.importance) - (a.urgency + a.importance)));
  const selected = entries.find((entry) => entry.id === gameState.selectedReportId) || rankedEntries[0];
  if (!selected) {
    return {
      summaries: [],
      guides: [],
      causalColumns: [],
      entries: [],
      selected: null,
    };
  }
  const staff = staffData[selected.staffKey];
  const causal = gameState.lastYearCausalSummary || buildYearCausalSummary(gameState);
  gameState.selectedReportId = selected?.id || null;

  const volatileRegion = AREA_ORDER.map((areaId) => {
    const mood = gameState.regionalMoods[areaId];
    return {
      areaId,
      satisfaction: mood.satisfaction,
      rebellion: mood.rebellion,
      score: (100 - mood.satisfaction) + mood.rebellion * 1.15,
    };
  }).sort((a, b) => b.score - a.score)[0];

  const highestUrgency = rankedEntries[0];
  const highestImportance = [...entries].sort((a, b) => b.importance - a.importance)[0];
  const summaryFocus = selected.recommendation || selected.summary || "次年度配分に向けた論点整理が必要です。";
  const priority = overallReportPriority(selected);
  const selectedImpactTone = selected.urgency >= 70 || selected.importance >= 70 ? "negative" : selected.urgency >= 45 || selected.importance >= 45 ? "neutral" : "positive";
  const links = buildSelectedReportLinks(selected, causal);

  return {
    summaries: [
      {
        key: "urgency",
        title: "今年いちばん急ぎ",
        main: `${highestUrgency.category} / ${highestUrgency.title}`,
        sub: `緊急度 ${Math.round(highestUrgency.urgency)} ・ まず確認したい論点です`,
      },
      {
        key: "importance",
        title: "今年いちばん重い論点",
        main: `${highestImportance.category} / ${highestImportance.impactArea}`,
        sub: `重要度 ${Math.round(highestImportance.importance)} ・ 予算配分に最も響きます`,
      },
      {
        key: "region",
        title: "空気が荒れやすい地区",
        main: areaName(volatileRegion.areaId),
        sub: `満足 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}`,
      },
    ],
    guides: [
      {
        key: "order",
        title: "読み順のコツ",
        text: "まずは 緊急度が高い項目 で事故や炎上の火種を確認し、次に 重要度が高い項目 で来年度配分の軸を決めると迷いにくくなります。",
        accent: false,
      },
      {
        key: "focus",
        title: "いま選択中の論点",
        text: summaryFocus,
        accent: true,
      },
    ],
    causalColumns: [
      {
        key: "budget",
        head: "① 今年の配分",
        main: causal.budgetLabel,
        items: causal.budgetFocus.slice(0, 4).map((item) => ({
          title: item.label,
          text: item.detail,
          tone: item.tone,
          chips: [],
        })),
      },
      {
        key: "events",
        head: "② 途中で起きたこと",
        main: `主な判断 ${causal.eventHighlights.length}件`,
        items: causal.eventHighlights.length
          ? causal.eventHighlights.map((item) => ({
              title: `${item.month} / ${item.title}`,
              text: item.choiceLabel,
              tone: "neutral",
              chips: item.signals || [],
            }))
          : [{ title: "大きなイベント判断なし", text: "配分そのもののクセが年末へ出やすい年でした。", tone: "neutral", chips: [] }],
      },
      {
        key: "outcomes",
        head: "③ 年末に出た結果",
        main: "今年の返り",
        items: causal.outcomeSignals.map((item) => ({
          title: item.label,
          text: item.detail,
          tone: item.tone,
          chips: [],
        })),
      },
    ],
    entries: rankedEntries.map((entry, index) => ({
      id: entry.id,
      active: selected.id === entry.id,
      order: index + 1,
      priority: overallReportPriority(entry),
      icon: staffData[entry.staffKey]?.icon || "📄",
      category: entry.category,
      title: entry.title,
      factHeadline: entry.factHeadline,
      importance: Math.round(entry.importance),
      urgency: Math.round(entry.urgency),
      impactArea: entry.impactArea,
      biasLabel: entry.biasLabel,
      quickLine: entry.summary || entry.recommendation || entry.factHeadline,
    })),
    selected: {
      id: selected.id,
      icon: staff.icon,
      category: selected.category,
      title: selected.title,
      staffName: staff.name,
      staffRole: staff.role,
      staffTone: staff.tone,
      priority,
      impactArea: selected.impactArea,
      summary: selected.summary || selected.factHeadline,
      recommendation: selected.recommendation,
      metaCards: [
        {
          key: "importance",
          label: "重要度",
          value: Math.round(selected.importance),
          tone: selected.importance >= 70 ? "negative" : selected.importance >= 45 ? "neutral" : "positive",
          state: selected.importance >= 70 ? "高" : selected.importance >= 45 ? "中" : "低",
        },
        {
          key: "urgency",
          label: "緊急度",
          value: Math.round(selected.urgency),
          tone: selected.urgency >= 70 ? "negative" : selected.urgency >= 45 ? "neutral" : "positive",
          state: selected.urgency >= 70 ? "高" : selected.urgency >= 45 ? "中" : "低",
        },
        {
          key: "impact",
          label: "影響エリア",
          value: selected.impactArea,
          tone: selectedImpactTone,
          state: selectedImpactTone === "negative" ? "要注意" : selectedImpactTone === "neutral" ? "観察" : "安定",
        },
        {
          key: "bias",
          label: "読み方",
          value: selected.biasLabel,
          tone: "neutral",
          state: "",
        },
      ],
      causeTrace: {
        budget: links.budgetLinks.length
          ? links.budgetLinks.map((item) => ({ badge: item.label, tone: item.tone, text: item.detail }))
          : [{ badge: "配分メモ", tone: "neutral", text: "大きな偏りより、年内のイベント判断が主に効いたレポートです。" }],
        events: links.eventLinks.length
          ? links.eventLinks.map((item) => ({ badge: `${item.month} / ${item.title}`, tone: "neutral", text: `${item.choiceLabel} → ${item.result}` }))
          : [{ badge: "イベントなし", tone: "neutral", text: "この論点では、大きなイベントより日常の積み重ねが効いています。" }],
        outcomes: links.outcomeLinks.map((item) => ({ badge: item.label, tone: item.tone, text: item.detail })),
      },
      quickSummary: [
        { key: "fact", title: "事実の核", text: selected.factHeadline },
        { key: "bias", title: "バイアス注意", text: selected.biasSummary },
        { key: "tip", title: "読み解きメモ", text: selected.readingTip },
      ],
      facts: selected.facts || [],
      biasSummary: selected.biasSummary,
      biasBullets: selected.biasBullets || [],
      readingTip: selected.readingTip,
    },
  };
}

function runReportSelectEntry(reportId) {
  gameState.selectedReportId = reportId;
  render();
}

function runReportOpenBudget() {
  screenTransitions.showBudget();
}

function getResultViewModel() {
  const review = buildResultReviewData();
  const isClear = gameState.screen === "clear";
  const headline = isClear ? "10年クリア！" : "ゲームオーバー";
  const badge = isClear ? "完走の振り返り" : "敗因の振り返り";
  const sectionTitle = isClear ? "持ちこたえた理由" : "崩れた理由";
  const secondaryTitle = isClear ? "次に崩れやすい火種" : "次回の立て直し方";
  const topRiskRegion = review.regions[0] || { name: "町全体", satisfaction: 0, rebellion: 0 };
  const calmRegion = review.regions[review.regions.length - 1] || topRiskRegion;
  const topInfra = review.weakestInfra[0] || null;
  const leadBudget = review.causal.budgetFocus?.[0] || null;
  const leadEvent = review.causal.eventHighlights?.[0] || null;
  const leadOutcome = review.causal.outcomeSignals?.[0] || null;
  const factSnapshot = isClear
    ? (gameState.clearMessage || "").trim()
    : (gameState.gameOverReason || "").trim();
  const moneyLeftDespiteCollapse = !isClear && gameState.remainingBudget >= 0 && gameState.reserveFund >= 1500;
  const readingHook = isClear
    ? `今回は${calmRegion.name}を薄くとも守り切れたことが取っかかりでした。`
    : moneyLeftDespiteCollapse
      ? `財政は黒字のまま、${topRiskRegion.name}の反発が先に限界を越えたのが崩れの入り口でした。住民感情は残予算とは別に読む必要があります。`
      : `${topRiskRegion.name}の反発と積み残しが同じ頂点に集まったのが崩れの入り口でした。`;
  const lead = [factSnapshot, readingHook].filter(Boolean).join(" ");
  const closing = isClear
    ? "全部は救えなくても、守る順番を見切って町をつないだ一年でした。次はもう少し余裕を残した完走も狙える位置です。"
    : "数字と地区感情の崩れ方を読み直すと、同じ局面でもかなり粘りやすくなります。最後の年の因果は下で確認できます。";
  const focusSummary = isClear
    ? `${calmRegion.name}を最後まで安定圏に残せたことが完走の芯でした。`
    : `${topRiskRegion.name}の反発と積み残しが最後に重なって崩れました。`;
  const actionLead = isClear
    ? `${topRiskRegion.name}と${topInfra ? topInfra.name : "主要インフラ"}を次回の先行監視にすると、もっと余裕を持って完走しやすくなります。`
    : `${review.subFactors[0]?.detail || "次回は予算の穴を先に埋めるところから立て直すと、同じ局面でも粘りやすくなります。"}`;
  const focusChips = [
    review.causal.budgetLabel || "手動配分",
    `${topRiskRegion.name} 反発 ${topRiskRegion.rebellion}`,
    topInfra ? `${topInfra.name} 状態 ${topInfra.condition}` : null,
    gameState.reportEntries?.length ? "年度末レポートあり" : null,
  ].filter(Boolean);
  const nextSteps = isClear
    ? [
        review.subFactors[0] || { title: "残る火種", detail: actionLead },
        review.subFactors[1] || { title: "危うい地区", detail: `${topRiskRegion.name}は次回も先行監視したい地区です。` },
        review.subFactors[2] || { title: "要注意インフラ", detail: topInfra ? `${topInfra.name}を優先監視に回したい位置です。` : "大きな損傷は見たらず、余裕のある状態です。" },
      ]
    : [
        review.subFactors[0] || { title: "次回の予算修正", detail: actionLead },
        review.subFactors[1] || { title: "イベント判断の見直し", detail: leadEvent ? `${leadEvent.month}の判断を改めて見直すと、同じ局面でも探りやすくなります。` : "イベント選択を複数比較して読むと、重要度が見えやすくなります。" },
        review.subFactors[2] || { title: "先に守る対象", detail: topInfra ? `${topInfra.name}と${topRiskRegion.name}を先に守りたい位置です。` : `${topRiskRegion.name}を先に立て直したい位置です。` },
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

function runResultRestart() {
  screenTransitions.restartToDashboard();
}

function runResultReviewReport() {
  if (!gameState?.reportEntries?.length) return;
  screenTransitions.showReport();
}

  return createGameCoreReportApiShape({
    buildYearCausalSummary,
    generateYearEndReport,
    buildResultReviewData,
    getReportViewModel,
    runReportSelectEntry,
    runReportOpenBudget,
    getResultViewModel,
    runResultRestart,
    runResultReviewReport,
  });
}
