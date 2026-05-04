import { AREA_ORDER, MONTHS, REGION_TRAITS } from "../../data/gameStaticData.js";
import { createGameCoreDashboardUiHelpersShape } from "../deps/gameCoreUiHelpersAssemblyDefinitions.js";

export function createGameCoreDashboardUiHelpers(ctx) {
  const {
    gameState,
    getElement,
    getMetricColor,
    areaInfrastructureStats,
    areaName,
    monthLabel,
    deconstructionStatusLabel,
    describeDeconstructionProject,
    getWorstInfrastructure,
    currentDramaProfile,
    getMostVolatileRegion,
    advanceMonth,
    renderMap,
    setScreen,
  } = ctx;

  function renderRegionGrid() {
    const container = getElement("regionGrid");
    if (!container) return;

    container.innerHTML = AREA_ORDER.map((areaId) => {
      const mood = gameState.regionalMoods[areaId];
      const stats = areaInfrastructureStats(areaId);
      const satisfactionState = mood.satisfaction >= 70 ? "安定" : mood.satisfaction >= 45 ? "不安" : "不満";
      const rebellionState = mood.rebellion < 30 ? "静穏" : mood.rebellion < 60 ? "警戒" : "反発";
      const freeze = areaId === "mountain" && mood.rebellion >= 68;
      const note = freeze
        ? "反発が強く、山間部の減築は一時停止中です。"
        : stats.worst
          ? `いまの火種は ${stats.worst.name} です。`
          : "大きな火種はまだ見えていません。";

      return `
        <div class="region-box">
          <div class="region-head">
            <h4>${areaName(areaId)}</h4>
            <span class="region-score ${freeze || mood.rebellion >= 60 ? "negative" : mood.satisfaction >= 70 ? "positive" : "neutral"}">${freeze ? "凍結" : satisfactionState}</span>
          </div>
          <div class="metric-row">
            <span>満足度</span>
            <strong class="metric-value">${Math.round(mood.satisfaction)}</strong>
          </div>
          <div class="meter"><div class="meter-fill" style="width:${Math.round(mood.satisfaction)}%; background:${getMetricColor(mood.satisfaction)}"></div></div>
          <div class="metric-row" style="margin-top:10px;">
            <span>反乱</span>
            <strong class="metric-value">${Math.round(mood.rebellion)}</strong>
          </div>
          <div class="meter"><div class="meter-fill" style="width:${Math.round(mood.rebellion)}%; background:${getMetricColor(mood.rebellion, true)}"></div></div>
          <p>${REGION_TRAITS[areaId].worry}。${note}</p>
          <div class="region-meta">
            <span class="inline-chip">空気: ${rebellionState}</span>
            <span class="inline-chip">平均状態 ${Math.round(stats.avgCondition)}</span>
            <span class="inline-chip">将来負担 ${Math.round(stats.avgBurden)}</span>
            <span class="inline-chip">姿勢 ${REGION_TRAITS[areaId].tone}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDashboard() {
    renderMap();
  }

  function phaseLabel(phase) {
    return {
      report: "年度末レポート待ち",
      budget: "予算配分フェーズ",
      monthly: "月次進行フェーズ",
    }[phase] || "運営中";
  }

  function buildSummaryMessage() {
    const drama = currentDramaProfile();
    const worstBridge = getWorstInfrastructure(gameState, "bridge");
    const worstRoad = getWorstInfrastructure(gameState, "road");
    const volatileRegion = getMostVolatileRegion();
    const mood = gameState.indicators.rebellion > 40
      ? "住民感情がかなり荒れています。数字だけで押し切ると火がつきます。"
      : gameState.indicators.satisfaction < 55
        ? "町の空気はやや重め。説明と見える改善が必要です。"
        : "町全体はなんとか持ちこたえています。油断するとすぐ壊れますが。";
    const dramaLine = `${drama.subtitle}です。${drama.summaryLead}`;
    const regionalLine = `${areaName(volatileRegion.areaId)}がいちばん不穏で、満足度 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}。`;
    const mountainLine = gameState.regionalMoods.mountain.rebellion >= 68
      ? "山あい集落では減築反発が強く、今月は説明会コスト込みで慎重運転が必要です。"
      : "山あい集落はまだ説得可能ですが、減築を急ぐと一気に反発します。";
    const activeProject = gameState.deconstructionProjects.find((project) => project.status === "active" || project.status === "blocked");
    const actionLine = activeProject
      ? `現在の減築対象は「${activeProject.actionLabel}」で、進捗は ${Math.round(activeProject.progress)}% です。`
      : gameState.latestDeconstructionAction
        ? `直近の減築判断は「${gameState.latestDeconstructionAction}」です。`
        : "まだCPUは具体的な減築対象を選定していません。";

    const firstYearHint = gameState.year === 1
      ? " 初年度は指標と画面の読み方に慎れる年です。今後の序盤で何を見るかを掴むだけで十分です。"
      : "";
    return `${dramaLine} ${mood} ${regionalLine} いちばん心配なのは橋梁では「${worstBridge.name}」、道路では「${worstRoad.name}」。将来負担は${Math.round(gameState.indicators.futureBurden)}で、${gameState.indicators.futureBurden > 60 ? "減築を後回しにすると次年度が苦しくなりそうです。" : "まだ再編の余地があります。"} ${mountainLine} ${actionLine}${firstYearHint}`;
  }

  function phaseActionText() {
    const drama = currentDramaProfile();
    if (gameState.phase === "report") {
      return `いまは${drama.subtitle}です。スタッフの報告は『事実』と『性格バイアスによる解釈』に分けて読むと、次の一手が見えやすくなります。${drama.actionHint}`;
    }
    if (gameState.phase === "budget") {
      return `いまは${drama.subtitle}です。橋・道路・防災・減築・住民対応・予備費の配分を100%に揃えてください。${drama.actionHint}`;
    }
    return `いまは${drama.subtitle}の月次進行中です。日々の維持管理はCPUが処理しますので、イベントが起きたときに判断すれば大丈夫です。現在は ${MONTHS[gameState.monthIndex]}です。`;
  }

  function buildDashboardActions() {
    const parts = [`<div class="callout">${phaseActionText()}</div>`];
    if (gameState.phase === "report") {
      parts.push(`<button id="goReportBtn" class="primary-btn">年度末レポートを見る</button>`);
    }
    if (gameState.phase === "budget") {
      parts.push(`<button id="goBudgetBtn" class="primary-btn">予算配分を開く</button>`);
    }
    if (gameState.phase === "monthly") {
      parts.push(`<button id="advanceMonthBtn" class="primary-btn">${MONTHS[gameState.monthIndex]}を進める</button>`);
    }
    return parts.join("");
  }

  function attachDashboardActionHandlers() {
    const goReport = getElement("goReportBtn");
    const goBudget = getElement("goBudgetBtn");
    const advanceBtn = getElement("advanceMonthBtn");
    const goReportSticky = getElement("goReportStickyBtn");
    const goBudgetSticky = getElement("goBudgetStickyBtn");
    const advanceSticky = getElement("advanceMonthStickyBtn");

    if (goReport) goReport.onclick = () => setScreen("report");
    if (goBudget) goBudget.onclick = () => setScreen("budget");
    if (advanceBtn) advanceBtn.onclick = () => advanceMonth();
    if (goReportSticky) goReportSticky.onclick = () => setScreen("report");
    if (goBudgetSticky) goBudgetSticky.onclick = () => setScreen("budget");
    if (advanceSticky) advanceSticky.onclick = () => advanceMonth();
  }

  function renderDeconstructionList() {
    const container = getElement("deconstructionList");
    if (!container) return;

    container.innerHTML = gameState.deconstructionProjects.map((project) => {
      const progress = project.status === "done" ? 100 : Math.round(project.progress);
      const stateTone = project.status === "done" ? "positive" : project.status === "active" ? "neutral" : project.status === "blocked" ? "negative" : "neutral";
      const detail = describeDeconstructionProject(project);
      const meta = project.status === "done"
        ? `${project.completedYear}年 ${project.completedMonth !== null ? monthLabel(project.completedMonth) : ""} 完了`
        : detail.factLine;
      return `
        <div class="deconstruction-item">
          <h4>${project.actionLabel}</h4>
          <p>${meta}</p>
          <div class="progress-row">
            <span class="${stateTone}">${deconstructionStatusLabel(project.status)}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          <p>${detail.scoreLine}</p>
          <p><strong>CPU選定理由:</strong> ${project.cpuReason}</p>
          <p><strong>効果見込み:</strong> ${project.expectedEffectNote}</p>
          <p><strong>地域リスク:</strong> ${detail.riskLine}</p>
          <p>${project.lastNote}</p>
        </div>
      `;
    }).join("");
  }

  return createGameCoreDashboardUiHelpersShape({
    renderRegionGrid,
    renderDashboard,
    phaseLabel,
    buildSummaryMessage,
    buildDashboardActions,
    phaseActionText,
    attachDashboardActionHandlers,
    renderDeconstructionList,
  });
}
