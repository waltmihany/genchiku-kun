from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3/src')
app_shell = root / 'legacy' / 'appShellHtml.js'
game_core = root / 'legacy' / 'gameCore.js'
styles = root / 'styles.css'

app_text = app_shell.read_text()
app_text = app_text.replace(
    '<div id="reportReadingGuide" class="report-reading-guide"></div>\n          <div id="reportList" class="report-list"></div>',
    '<div id="reportReadingGuide" class="report-reading-guide"></div>\n          <div id="reportCausalMap" class="report-causal-map"></div>\n          <div id="reportList" class="report-list"></div>'
)
app_shell.write_text(app_text)

core_text = game_core.read_text()

core_text = core_text.replace(
    '    lastChoiceResult: "",\n    log: ["町の新年度準備を開始。まずは現場の声を読むところからです。"],',
    '    lastChoiceResult: "",\n    currentYearEvents: [],\n    currentYearBudgetDecision: null,\n    lastYearCausalSummary: null,\n    log: ["町の新年度準備を開始。まずは現場の声を読むところからです。"],'
)

helper_block = '''
function summarizeBudgetAllocation(allocation) {
  const list = [];
  const centralInfra = allocation.bridge + allocation.road;
  if (centralInfra >= 34) {
    list.push({ key: "central", label: `中央維持 ${centralInfra}%`, detail: "橋と道路が厚めで、中央の不満を抑えやすい配分です。", tone: "positive" });
  } else {
    list.push({ key: "central", label: `中央維持 ${centralInfra}%`, detail: "中央の幹線維持が薄く、後半の反発が出やすい配分です。", tone: centralInfra >= 31 ? "neutral" : "negative" });
  }
  list.push({
    key: "disaster",
    label: `防災 ${allocation.disaster}%`,
    detail: allocation.disaster >= 15 ? "天候イベントに比較的耐えやすい水準です。" : "天候イベントで安全度が揺れやすい低めの水準です。",
    tone: allocation.disaster >= 15 ? "positive" : "negative",
  });
  list.push({
    key: "deconstruction",
    label: `減築 ${allocation.deconstruction}%`,
    detail: allocation.deconstruction >= 18 ? "将来負担を軽くしやすい配分です。" : "将来負担の整理はやや遅れやすい配分です。",
    tone: allocation.deconstruction >= 18 ? "positive" : allocation.deconstruction >= 15 ? "neutral" : "negative",
  });
  list.push({
    key: "outreach",
    label: `住民対応 ${allocation.outreach}%`,
    detail: allocation.outreach >= 16 ? "説明と火消しを回しやすい水準です。" : "年末の満足度回復が鈍くなりやすい水準です。",
    tone: allocation.outreach >= 16 ? "positive" : "negative",
  });
  list.push({
    key: "reserve",
    label: `予備費 ${allocation.reserve}%`,
    detail: allocation.reserve >= 15 ? "事故や入札不調への保険があります。" : "突発支出に対する余白が薄めです。",
    tone: allocation.reserve >= 15 ? "positive" : "negative",
  });
  return list;
}

function summarizeEffectSignals(effect = {}) {
  const tags = [];
  if ((effect.safety || 0) > 0) tags.push(`安全 ${effect.safety > 0 ? "+" : ""}${Math.round(effect.safety * 10) / 10}`);
  if ((effect.fiscalHealth || 0) !== 0) tags.push(`財政 ${effect.fiscalHealth > 0 ? "+" : ""}${Math.round(effect.fiscalHealth * 10) / 10}`);
  if ((effect.support || 0) !== 0) tags.push(`支持 ${effect.support > 0 ? "+" : ""}${Math.round(effect.support * 10) / 10}`);
  if ((effect.satisfaction || 0) !== 0) tags.push(`満足 ${effect.satisfaction > 0 ? "+" : ""}${Math.round(effect.satisfaction * 10) / 10}`);
  if ((effect.rebellion || 0) !== 0) tags.push(`反乱 ${effect.rebellion > 0 ? "+" : ""}${Math.round(effect.rebellion * 10) / 10}`);
  if ((effect.futureBurden || 0) !== 0) tags.push(`将来負担 ${effect.futureBurden > 0 ? "+" : ""}${Math.round(effect.futureBurden * 10) / 10}`);
  if ((effect.remainingBudget || 0) !== 0) tags.push(`残予算 ${effect.remainingBudget > 0 ? "+" : ""}${Math.round(effect.remainingBudget)}`);
  if ((effect.reserveFund || 0) !== 0) tags.push(`予備費 ${effect.reserveFund > 0 ? "+" : ""}${Math.round(effect.reserveFund)}`);
  if (effect.regionalEffects) {
    Object.entries(effect.regionalEffects).forEach(([areaId, regional]) => {
      const parts = [];
      if (regional.satisfaction) parts.push(`満足 ${regional.satisfaction > 0 ? "+" : ""}${Math.round(regional.satisfaction * 10) / 10}`);
      if (regional.rebellion) parts.push(`反乱 ${regional.rebellion > 0 ? "+" : ""}${Math.round(regional.rebellion * 10) / 10}`);
      if (parts.length) tags.push(`${areaName(areaId)} ${parts.join(" / ")}`);
    });
  }
  return tags.slice(0, 4);
}

function eventImpactScore(effect = {}) {
  let score = 0;
  score += Math.abs(effect.safety || 0) * 1.8;
  score += Math.abs(effect.fiscalHealth || 0) * 1.4;
  score += Math.abs(effect.support || 0) * 1.2;
  score += Math.abs(effect.satisfaction || 0) * 1.1;
  score += Math.abs(effect.rebellion || 0) * 1.6;
  score += Math.abs(effect.futureBurden || 0) * 1.3;
  score += Math.abs(effect.remainingBudget || 0) / 700;
  score += Math.abs(effect.reserveFund || 0) / 900;
  if (effect.regionalEffects) {
    Object.values(effect.regionalEffects).forEach((regional) => {
      score += Math.abs(regional.satisfaction || 0) * 0.8;
      score += Math.abs(regional.rebellion || 0) * 1.0;
    });
  }
  return score;
}

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
'''
if 'function summarizeBudgetAllocation(allocation)' not in core_text:
    core_text = core_text.replace('function getDramaProfile(year) {', helper_block + '\nfunction getDramaProfile(year) {')

core_text = core_text.replace(
    '  const drama = currentDramaProfile();\n  const fiscalFactor = 0.78 + gameState.indicators.fiscalHealth / 100 * 0.66;',
    '  const drama = currentDramaProfile();\n  const activePresetKey = detectActiveBudgetPreset();\n  const activePreset = BUDGET_PRESETS.find((preset) => preset.key === activePresetKey);\n  const fiscalFactor = 0.78 + gameState.indicators.fiscalHealth / 100 * 0.66;'
)
core_text = core_text.replace(
    '  gameState.lastChoiceResult = `年度${gameState.year}の配分が決まりました。使える年間予算は${formatMoney(gameState.annualBudget)}です。現在は${drama.subtitle}で、${drama.actionHint}`;\n  gameState.log.unshift(gameState.lastChoiceResult);',
    '  gameState.currentYearBudgetDecision = {\n    year: gameState.year,\n    label: activePreset?.label || "手動配分",\n    summary: activePreset?.summary || "手動で微調整した配分です。",\n    allocation: clone(gameState.budgetAllocation),\n    annualBudget: gameState.annualBudget,\n    focus: summarizeBudgetAllocation(gameState.budgetAllocation),\n  };\n  gameState.lastChoiceResult = `年度${gameState.year}の配分が決まりました。使える年間予算は${formatMoney(gameState.annualBudget)}です。現在は${drama.subtitle}で、${drama.actionHint}`;\n  gameState.log.unshift(gameState.lastChoiceResult);'
)

core_text = core_text.replace(
    '  gameState.lastChoiceResult = choice.result;\n  gameState.log.unshift(`${event.title}: ${choice.label}`);\n  gameState.pendingEvent = null;',
    '  gameState.currentYearEvents.push({\n    year: gameState.year,\n    month: MONTHS[gameState.monthIndex],\n    title: event.title,\n    kind: event.kind,\n    choiceLabel: choice.label,\n    result: choice.result,\n    effect: clone(choice.effect || {}),\n    signals: summarizeEffectSignals(choice.effect || {}),\n    impactScore: eventImpactScore(choice.effect || {}),\n  });\n  gameState.lastChoiceResult = choice.result;\n  gameState.log.unshift(`${event.title}: ${choice.label}`);\n  gameState.pendingEvent = null;'
)

core_text = core_text.replace(
    '  gameState.reportEntries = generateYearEndReport(gameState, false);',
    '  gameState.lastYearCausalSummary = buildYearCausalSummary(gameState);\n  gameState.reportEntries = generateYearEndReport(gameState, false);'
)
core_text = core_text.replace(
    '  gameState.selectedReportId = gameState.reportEntries[0]?.id || null;\n  gameState.phase = "report";',
    '  gameState.selectedReportId = gameState.reportEntries[0]?.id || null;\n  gameState.currentYearEvents = [];\n  gameState.phase = "report";'
)

budget_insert_anchor = '  const goodPoints = [];\n  if (safetyShare >= 49) goodPoints.push("守り寄りで安全度を維持しやすい構えです。");\n  if (residentShare >= 35) goodPoints.push("生活路線と住民対応が厚く、反発の火消しに向きます。");\n  if (restructureShare >= 18) goodPoints.push("減築を進めやすく、将来負担を軽くしやすい配分です。");\n  if (reserveShare >= 18) goodPoints.push("予備費が厚く、想定外の出費に耐えやすいです。");\n'
if budget_insert_anchor in core_text and 'const carryoverBlock = gameState.lastYearCausalSummary' not in core_text:
    core_text = core_text.replace(
        budget_insert_anchor,
        budget_insert_anchor + '\n  const carryoverBlock = gameState.lastYearCausalSummary\n    ? `\n      <div class="budget-carryover-box">\n        <strong>前年度からの返り</strong>\n        <p>${gameState.lastYearCausalSummary.carryovers[0]}</p>\n        <div class="budget-carryover-chips">\n          ${gameState.lastYearCausalSummary.outcomeSignals.slice(0, 3).map((item) => `<span class="inline-chip ${item.tone}">${item.label}</span>`).join("")}\n        </div>\n      </div>\n    `\n    : "";\n'
    )
    core_text = core_text.replace(
        '    <p class="budget-touch-hint">微調整は <strong>±1</strong>、一気に寄せたいときは <strong>±5</strong>。色付きバーで配分の偏りを見ながら調整できます。</p>\n  `;',
        '    <p class="budget-touch-hint">微調整は <strong>±1</strong>、一気に寄せたいときは <strong>±5</strong>。色付きバーで配分の偏りを見ながら調整できます。</p>\n    ${carryoverBlock}\n  `;'
    )

new_render_report = '''function renderReport() {
  const reportSummaryBar = getElement("reportSummaryBar");
  const reportReadingGuide = getElement("reportReadingGuide");
  const reportCausalMap = getElement("reportCausalMap");
  const reportList = getElement("reportList");
  const reportDetail = getElement("reportDetail");
  if (!reportSummaryBar || !reportReadingGuide || !reportCausalMap || !reportList || !reportDetail) return;

  const entries = [...gameState.reportEntries];
  const rankedEntries = [...entries].sort((a, b) => ((b.urgency + b.importance) - (a.urgency + a.importance)));
  const selected = entries.find((entry) => entry.id === gameState.selectedReportId) || rankedEntries[0];
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
  const overallPriorityLabel = (entry) => {
    const score = entry.urgency + entry.importance;
    if (score >= 150) return { label: "最優先", tone: "negative" };
    if (score >= 120) return { label: "優先", tone: "neutral" };
    return { label: "確認", tone: "positive" };
  };
  const summaryFocus = selected.recommendation || selected.summary || "次年度配分に向けた論点整理が必要です。";

  reportSummaryBar.innerHTML = `
    <div class="report-summary-card">
      <strong>今年いちばん急ぎ</strong>
      <div class="report-summary-main">${highestUrgency.category} / ${highestUrgency.title}</div>
      <div class="report-summary-sub">緊急度 ${Math.round(highestUrgency.urgency)} ・ まず確認したい論点です</div>
    </div>
    <div class="report-summary-card">
      <strong>今年いちばん重い論点</strong>
      <div class="report-summary-main">${highestImportance.category} / ${highestImportance.impactArea}</div>
      <div class="report-summary-sub">重要度 ${Math.round(highestImportance.importance)} ・ 予算配分に最も響きます</div>
    </div>
    <div class="report-summary-card">
      <strong>空気が荒れやすい地区</strong>
      <div class="report-summary-main">${areaName(volatileRegion.areaId)}</div>
      <div class="report-summary-sub">満足 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}</div>
    </div>
  `;

  reportReadingGuide.innerHTML = `
    <div class="report-guide-card">
      <strong>読み順のコツ</strong>
      <p>まずは <strong>緊急度が高い項目</strong> で事故や炎上の火種を確認し、次に <strong>重要度が高い項目</strong> で来年度配分の軸を決めると迷いにくくなります。</p>
    </div>
    <div class="report-guide-card accent">
      <strong>いま選択中の論点</strong>
      <p>${summaryFocus}</p>
    </div>
  `;

  reportCausalMap.innerHTML = `
    <div class="report-causal-column">
      <div class="report-causal-head">① 今年の配分</div>
      <div class="report-causal-main">${causal.budgetLabel}</div>
      <div class="report-causal-list">
        ${causal.budgetFocus.slice(0, 4).map((item) => `<div class="report-causal-item ${item.tone}"><strong>${item.label}</strong><span>${item.detail}</span></div>`).join("")}
      </div>
    </div>
    <div class="report-causal-column">
      <div class="report-causal-head">② 途中で起きたこと</div>
      <div class="report-causal-main">主な判断 ${causal.eventHighlights.length}件</div>
      <div class="report-causal-list">
        ${causal.eventHighlights.length
          ? causal.eventHighlights.map((item) => `
            <div class="report-causal-item neutral">
              <strong>${item.month} / ${item.title}</strong>
              <span>${item.choiceLabel}</span>
              <div class="report-causal-chip-row">${(item.signals || []).map((tag) => `<span class="inline-chip">${tag}</span>`).join("")}</div>
            </div>
          `).join("")
          : '<div class="report-causal-item neutral"><strong>大きなイベント判断なし</strong><span>配分そのもののクセが年末へ出やすい年でした。</span></div>'}
      </div>
    </div>
    <div class="report-causal-column">
      <div class="report-causal-head">③ 年末に出た結果</div>
      <div class="report-causal-main">今年の返り</div>
      <div class="report-causal-list">
        ${causal.outcomeSignals.map((item) => `<div class="report-causal-item ${item.tone}"><strong>${item.label}</strong><span>${item.detail}</span></div>`).join("")}
      </div>
    </div>
  `;

  reportList.innerHTML = rankedEntries.map((entry, index) => {
    const priority = overallPriorityLabel(entry);
    const selectedClass = selected.id === entry.id ? "active" : "";
    const quickLine = entry.summary || entry.recommendation || entry.factHeadline;
    return `
      <button class="report-item report-item-enhanced ${selectedClass}" data-report-id="${entry.id}">
        <div class="report-item-topline">
          <span class="report-order-badge">読む順 ${index + 1}</span>
          <span class="report-priority-pill ${priority.tone}">${priority.label}</span>
        </div>
        <h4>${staffData[entry.staffKey]?.icon || "📄"} ${entry.category} / ${entry.title}</h4>
        <span>事実: ${entry.factHeadline}</span>
        <div class="report-item-meta-chips">
          <span class="inline-chip">重要度 ${Math.round(entry.importance)}</span>
          <span class="inline-chip">緊急度 ${Math.round(entry.urgency)}</span>
          <span class="inline-chip">影響 ${entry.impactArea}</span>
          <span class="inline-chip">読み方 ${entry.biasLabel}</span>
        </div>
        <p>${quickLine}</p>
      </button>
    `;
  }).join("");

  reportList.querySelectorAll("[data-report-id]").forEach((button) => {
    button.addEventListener("click", () => {
      gameState.selectedReportId = button.dataset.reportId;
      renderReport();
    });
  });

  const priority = overallPriorityLabel(selected);
  const factBullets = (selected.facts || []).map((fact) => `<li>${fact}</li>`).join("");
  const biasBullets = (selected.biasBullets || []).map((fact) => `<li>${fact}</li>`).join("");
  const selectedImpactTone = selected.urgency >= 70 || selected.importance >= 70 ? "negative" : selected.urgency >= 45 || selected.importance >= 45 ? "neutral" : "positive";

  const categorySignals = {
    bridge: ["central", "disaster"],
    road: ["central", "outreach"],
    disaster: ["disaster", "reserve"],
    deconstruction: ["deconstruction", "outreach"],
    outreach: ["outreach", "central"],
    finance: ["reserve", "deconstruction"],
  };
  const selectedBudgetLinks = causal.budgetFocus.filter((item) => (categorySignals[selected.staffKey] || []).includes(item.key)).slice(0, 2);
  const selectedEventLinks = causal.eventHighlights.filter((item) => {
    const text = `${item.title} ${item.choiceLabel} ${(item.signals || []).join(" ")}`;
    if (selected.staffKey === "bridge") return item.kind === "infrastructure" || /橋|安全/.test(text);
    if (selected.staffKey == "road") return item.kind === "resident" || item.kind === "infrastructure" || /道路|生活/.test(text);
    if (selected.staffKey === "disaster") return item.kind === "weather" || /安全|防災/.test(text);
    if (selected.staffKey === "deconstruction") return /減築|撤去|将来負担/.test(text);
    if (selected.staffKey === "outreach") return item.kind === "resident" || /満足|反乱|支持/.test(text);
    if (selected.staffKey === "finance") return item.kind === "finance" || /残予算|予備費|財政/.test(text);
    return true;
  }).slice(0, 2);
  const selectedOutcomeLinks = causal.outcomeSignals.filter((item) => {
    if (selected.staffKey === "bridge") return item.key === "safety";
    if (selected.staffKey === "road") return item.key === "safety" || item.key === "mood";
    if (selected.staffKey === "disaster") return item.key === "safety";
    if (selected.staffKey === "deconstruction") return item.key === "future";
    if (selected.staffKey === "outreach") return item.key === "mood";
    if (selected.staffKey === "finance") return item.key === "finance" || item.key === "future";
    return true;
  }).slice(0, 2);

  reportDetail.classList.remove("empty-detail");
  reportDetail.innerHTML = `
    <div class="report-detail-hero">
      <div>
        <div class="report-detail-kicker">${staff.icon} ${selected.category}レポート</div>
        <h3>${selected.title}</h3>
        <p><strong>${staff.name}</strong>（${staff.role}）: ${staff.tone}</p>
      </div>
      <div class="report-detail-pill-stack">
        <span class="report-priority-pill ${priority.tone}">${priority.label}</span>
        <span class="inline-chip">影響: ${selected.impactArea}</span>
      </div>
    </div>

    <div class="report-highlight-grid">
      <div class="report-highlight-card emphasis">
        <strong>ひとことで言うと</strong>
        <p>${selected.summary || selected.factHeadline}</p>
      </div>
      <div class="report-highlight-card">
        <strong>来年度で迷ったら</strong>
        <p>${selected.recommendation}</p>
      </div>
    </div>

    <div class="report-meta-grid">
      <div class="metric-box">
        <h4>重要度</h4>
        <div class="metric-row"><strong class="metric-value">${Math.round(selected.importance)}</strong><span class="${selected.importance >= 70 ? "negative" : selected.importance >= 45 ? "neutral" : "positive"}">${selected.importance >= 70 ? "高" : selected.importance >= 45 ? "中" : "低"}</span></div>
      </div>
      <div class="metric-box">
        <h4>緊急度</h4>
        <div class="metric-row"><strong class="metric-value">${Math.round(selected.urgency)}</strong><span class="${selected.urgency >= 70 ? "negative" : selected.urgency >= 45 ? "neutral" : "positive"}">${selected.urgency >= 70 ? "高" : selected.urgency >= 45 ? "中" : "低"}</span></div>
      </div>
      <div class="metric-box">
        <h4>影響エリア</h4>
        <div class="metric-row"><strong>${selected.impactArea}</strong><span class="${selectedImpactTone}">${selectedImpactTone === "negative" ? "要注意" : selectedImpactTone === "neutral" ? "観察" : "安定"}</span></div>
      </div>
      <div class="metric-box">
        <h4>読み方</h4>
        <div class="metric-row"><span class="inline-chip">${selected.biasLabel}</span></div>
      </div>
    </div>

    <div class="report-cause-trace">
      <div class="report-cause-card">
        <strong>このレポートにつながった配分</strong>
        ${selectedBudgetLinks.length ? selectedBudgetLinks.map((item) => `<div class="report-cause-line"><span class="inline-chip ${item.tone}">${item.label}</span><p>${item.detail}</p></div>`).join("") : '<p>大きな偏りより、年内のイベント判断が主に効いたレポートです。</p>'}
      </div>
      <div class="report-cause-card">
        <strong>途中で効いた判断</strong>
        ${selectedEventLinks.length ? selectedEventLinks.map((item) => `<div class="report-cause-line"><span class="inline-chip">${item.month} / ${item.title}</span><p>${item.choiceLabel} → ${item.result}</p></div>`).join("") : '<p>この論点では、大きなイベントより日常の積み重ねが効いています。</p>'}
      </div>
      <div class="report-cause-card">
        <strong>年末に残った返り</strong>
        ${selectedOutcomeLinks.map((item) => `<div class="report-cause-line"><span class="inline-chip ${item.tone}">${item.label}</span><p>${item.detail}</p></div>`).join("")}
      </div>
    </div>

    <div class="report-quick-summary">
      <div class="report-quick-card">
        <strong>事実の核</strong>
        <p>${selected.factHeadline}</p>
      </div>
      <div class="report-quick-card">
        <strong>バイアス注意</strong>
        <p>${selected.biasSummary}</p>
      </div>
      <div class="report-quick-card">
        <strong>読み解きメモ</strong>
        <p>${selected.readingTip}</p>
      </div>
    </div>

    <div class="callout report-section fact-section">
      <strong>観測された事実</strong>
      <p>この担当が見ている数字と現場状況です。まずはここを基準に判断します。</p>
      <ul>${factBullets}</ul>
    </div>
    <div class="callout report-section bias-section">
      <strong>担当者の見え方</strong>
      <p>${selected.biasSummary}</p>
      <ul>${biasBullets}</ul>
      <p><strong>読み解きメモ:</strong> ${selected.readingTip}</p>
    </div>
    <div class="callout report-section action-section">
      <strong>来年度予算への落とし込み</strong>
      <p>${selected.recommendation}</p>
    </div>
  `;

  const openBudget = () => {
    gameState.phase = "budget";
    setScreen("budget");
  };
  getElement("openBudgetBtn").onclick = openBudget;
  const reportStickyFooter = getElement("reportStickyFooter");
  if (reportStickyFooter) {
    reportStickyFooter.innerHTML = `
      <div class="sticky-action-inner">
        <div>
          <strong>レポート確認後の操作</strong>
          <div class="sticky-subtext">来年度予算の調整へ進みます</div>
        </div>
        <button id="openBudgetStickyBtn" class="primary-btn">来年度予算を決める</button>
      </div>
    `;
    getElement("openBudgetStickyBtn").onclick = openBudget;
  }
}'''
core_text, count = re.subn(r'function renderReport\(\) \{.*?\n\}\n\nfunction renderResult', new_render_report + '\n\nfunction renderResult', core_text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'renderReport replace failed: {count}')

game_core.write_text(core_text)

styles_text = styles.read_text()
extra_css = '''

.budget-carryover-box {
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid #eadacd;
  background: linear-gradient(180deg, #fff8f2 0%, #fffdfb 100%);
}

.budget-carryover-box p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.budget-carryover-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.report-causal-map,
.report-cause-trace {
  display: grid;
  gap: 12px;
}

.report-causal-map {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
}

.report-causal-column,
.report-cause-card {
  background: linear-gradient(180deg, #fff9f4 0%, #fffdfb 100%);
  border: 1px solid #efdfcf;
  border-radius: 16px;
  padding: 14px;
}

.report-causal-head {
  font-size: 0.82rem;
  font-weight: 700;
  color: #8a6b51;
  margin-bottom: 8px;
}

.report-causal-main {
  font-size: 1rem;
  font-weight: 800;
  color: #514841;
  margin-bottom: 10px;
}

.report-causal-list {
  display: grid;
  gap: 10px;
}

.report-causal-item,
.report-cause-line {
  border-radius: 14px;
  padding: 10px 12px;
  background: #fffdf9;
  border: 1px solid #f1e5d8;
}

.report-causal-item strong,
.report-cause-line strong {
  display: block;
  margin-bottom: 6px;
}

.report-causal-item span,
.report-cause-line p {
  color: var(--muted);
  line-height: 1.65;
}

.report-causal-item.negative {
  background: #fff5f5;
  border-color: #f1dada;
}

.report-causal-item.neutral {
  background: #fffaf2;
  border-color: #eee3d3;
}

.report-causal-item.positive {
  background: #f5fff8;
  border-color: #d7efdf;
}

.report-causal-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.report-cause-trace {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
}

.report-cause-card strong {
  display: block;
  margin-bottom: 10px;
}

.report-cause-line + .report-cause-line {
  margin-top: 8px;
}

.report-cause-line p {
  margin: 8px 0 0;
}

@media (max-width: 1120px) {
  .report-causal-map,
  .report-cause-trace {
    grid-template-columns: 1fr;
  }
}
'''
if 'report-causal-map' not in styles_text:
    styles_text += extra_css
styles.write_text(styles_text)

print('Causality UI updates applied successfully')
