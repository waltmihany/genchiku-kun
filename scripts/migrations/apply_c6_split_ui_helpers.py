from pathlib import Path

repo = Path('/home/user/genchiku-kun-v3')
core_path = repo / 'src/legacy/gameCore.js'
ui_path = repo / 'src/legacy/gameCoreUiHelpers.js'

core = core_path.read_text()

ui_module = '''import { AREA_ORDER, MONTHS, REGION_TRAITS } from "../data/gameStaticData.js";
import { staffData } from "../data/staffData.js";

const REACT_MANAGED_SCREENS = new Set(["title", "dashboard", "budget", "report", "event", "clear", "gameover"]);

export function createGameCoreUiHelpers(ctx) {
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
    getAppRoot,
    setHasCompletedOnboarding,
    emitGameViewChange,
    getMetricColor,
    areaInfrastructureStats,
    areaName,
    monthLabel,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    deconstructionStatusLabel,
    describeDeconstructionProject,
    conditionToStatus,
    statusInfo,
    getWorstInfrastructure,
    currentDramaProfile,
    getMostVolatileRegion,
    advanceMonth,
  } = ctx;

  function getElement(id) {
    return getAppRoot()?.querySelector(`#${id}`) || null;
  }

  function getReactManagedMountId(screen) {
    if (screen === "title") return "reactScreenHost";
    if (screen === "dashboard") return "mapArea";
    if (screen === "budget") return "budgetStatus";
    if (screen === "report") return "reportList";
    if (screen === "event") return "reactScreenHost";
    return "";
  }

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

  function setScreen(screen) {
    gameState.screen = screen;
    if (getAppRoot()) render();
  }

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

  function render() {
    const appRoot = getAppRoot();
    if (!appRoot) return;
    const container = getElement("screenContainer");
    if (!container) return;

    emitGameViewChange();

    container.innerHTML = "";

    if (REACT_MANAGED_SCREENS.has(gameState.screen)) {
      const mountId = getReactManagedMountId(gameState.screen);
      if (mountId && getElement(mountId)) {
        flushReactManagedScreen();
      } else {
        renderOnboardingOverlay();
      }
      return;
    }

    renderOnboardingOverlay();
  }

  function flushReactManagedScreen() {
    const appRoot = getAppRoot();
    if (!appRoot || !REACT_MANAGED_SCREENS.has(gameState?.screen)) return;
    if (gameState.screen === "dashboard") {
      renderDashboard();
    } else if (gameState.screen === "budget") {
      renderBudget();
    } else if (gameState.screen === "report") {
      renderReport();
    }
    renderOnboardingOverlay();
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

    return `${dramaLine} ${mood} ${regionalLine} いちばん心配なのは橋梁では「${worstBridge.name}」、道路では「${worstRoad.name}」。将来負担は${Math.round(gameState.indicators.futureBurden)}で、${gameState.indicators.futureBurden > 60 ? "減築を後回しにすると次年度が苦しくなりそうです。" : "まだ再編の余地があります。"} ${mountainLine} ${actionLine}`;
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

  function phaseActionText() {
    const drama = currentDramaProfile();
    if (gameState.phase === "report") {
      return `いまは${drama.subtitle}。スタッフの報告は『事実』と『性格バイアス解釈』に分けて読みましょう。${drama.actionHint}`;
    }
    if (gameState.phase === "budget") {
      return `いまは${drama.subtitle}。橋・道路・防災・減築・住民対応・予備費の配分を100%に合わせてください。${drama.actionHint}`;
    }
    return `いまは${drama.subtitle}の月次進行中です。CPUが日々の維持管理を処理します。イベントが起きたら、その場で判断しましょう。現在は ${MONTHS[gameState.monthIndex]}。`;
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

  function renderMap() {
    const legend = getElement("mapLegend");
    const mapArea = getElement("mapArea");
    const mapSummary = getElement("mapSummary");
    const mapInspector = getElement("mapInspector");
    const mapQuickActions = getElement("mapQuickActions");
    const mapAreaSummary = getElement("mapAreaSummary");
    if (!legend || !mapArea || !mapSummary || !mapInspector || !mapQuickActions || !mapAreaSummary) return;

    const visibleInfrastructures = gameState.infrastructures.filter((item) => item.operationStatus !== "removed");
    const rankedTargets = [...visibleInfrastructures]
      .sort((a, b) => (a.condition - b.condition) || (b.importance - a.importance) || (b.burden - a.burden))
      .slice(0, 4);
    const fallbackTargetId = [...visibleInfrastructures].sort((a, b) => a.condition - b.condition)[0]?.id || gameState.infrastructures[0]?.id || "bridgeA";
    const selectedId = getInfrastructureById(gameState.selectedMapTargetId)?.id || fallbackTargetId;
    gameState.selectedMapTargetId = selectedId;
    const selectedInfra = getInfrastructureById(selectedId) || gameState.infrastructures[0];
    const selectedProject = selectedInfra ? getDeconstructionProjectByTarget(selectedInfra.id) : null;
    const selectedAreaMood = selectedInfra ? gameState.regionalMoods[selectedInfra.area] : null;
    const worstBridge = getWorstInfrastructure(gameState, "bridge");
    const worstRoad = getWorstInfrastructure(gameState, "road");
    const activeProject = gameState.deconstructionProjects.find((project) => project.status === "active" || project.status === "blocked");

    legend.innerHTML = ["safe", "warning", "danger", "removal"].map((key) => {
      const info = statusInfo(key);
      return `<span class="legend-item"><span class="legend-dot" style="background:${info.color}"></span>${info.label}</span>`;
    }).join("") + `<span class="inline-chip">色で危険度を表示</span><span class="inline-chip">地区カードや火種カードからジャンプ可</span>`;

    mapQuickActions.innerHTML = [
      worstBridge ? `<button class="map-jump-chip ${selectedId === worstBridge.id ? "active" : ""}" data-map-target="${worstBridge.id}">橋の火種 → ${worstBridge.name}</button>` : "",
      worstRoad ? `<button class="map-jump-chip ${selectedId === worstRoad.id ? "active" : ""}" data-map-target="${worstRoad.id}">道路の火種 → ${worstRoad.name}</button>` : "",
      activeProject ? `<button class="map-jump-chip ${selectedId === activeProject.targetId ? "active" : ""}" data-map-target="${activeProject.targetId}">減築対象 → ${activeProject.actionLabel}</button>` : "",
      selectedInfra ? `<button class="map-jump-chip active" data-map-target="${selectedInfra.id}">現在注目中 → ${selectedInfra.name}</button>` : "",
    ].filter(Boolean).join("");

    mapAreaSummary.innerHTML = AREA_ORDER.map((areaId) => {
      const mood = gameState.regionalMoods[areaId];
      const stats = areaInfrastructureStats(areaId);
      const focusTargetId = stats.worst?.id || fallbackTargetId;
      const riskTone = mood.rebellion >= 45 || stats.avgCondition < 50
        ? "negative"
        : mood.rebellion >= 30 || stats.avgCondition < 62
          ? "neutral"
          : "positive";
      const riskLabel = riskTone === "negative" ? "火種大" : riskTone === "neutral" ? "見張り" : "安定";
      const selectedClass = selectedInfra?.area === areaId ? "active" : "";
      const issueLine = stats.worst
        ? `最優先: ${stats.worst.name} / 状態 ${Math.round(stats.worst.condition)} / 負担 ${Math.round(stats.worst.burden)}`
        : "現時点で大きな火種は見えていません。";
      return `
        <button class="map-area-card ${selectedClass}" data-map-target="${focusTargetId}">
          <div class="map-area-card-head">
            <strong>${areaName(areaId)}</strong>
            <span class="${riskTone}">${riskLabel}</span>
          </div>
          <p>${REGION_TRAITS[areaId]?.worry || ""}</p>
          <div class="map-area-card-meta">
            <span class="inline-chip">満足 ${Math.round(mood.satisfaction)}</span>
            <span class="inline-chip">反乱 ${Math.round(mood.rebellion)}</span>
            <span class="inline-chip">平均状態 ${Math.round(stats.avgCondition)}</span>
          </div>
          <div class="map-area-card-note">${issueLine}</div>
        </button>
      `;
    }).join("");

    mapSummary.innerHTML = rankedTargets.map((item, index) => {
      const info = statusInfo(item.status || conditionToStatus(item.condition));
      return `
        <button class="map-focus-card ${selectedId === item.id ? "active" : ""}" data-map-target="${item.id}">
          <div class="map-focus-kicker">危険順 ${index + 1}</div>
          <div class="map-focus-head">
            <strong>${item.name}</strong>
            <span class="${item.condition < 40 ? "negative" : item.condition < 65 ? "neutral" : "positive"}">${info.label}</span>
          </div>
          <p>${areaName(item.area)} / ${item.kind === "bridge" ? "橋" : "道路"}</p>
          <div class="map-focus-meta">
            <span class="inline-chip">状態 ${Math.round(item.condition)}</span>
            <span class="inline-chip">重要度 ${Math.round(item.importance)}</span>
            <span class="inline-chip">負担 ${Math.round(item.burden)}</span>
          </div>
        </button>
      `;
    }).join("");

    const areaHtml = gameState.areas.map((area) => `
      <div class="map-area" style="left:${area.x}px; top:${area.y}px; width:${area.w}px; height:${area.h}px;"></div>
      <div class="map-label" style="left:${area.x + 10}px; top:${area.y + 10}px;">${area.name}</div>
    `).join("");

    const riverHtml = gameState.rivers.map((river) => `
      <div class="map-river" style="left:${river.x}px; top:${river.y}px; width:${river.w}px; height:${river.h}px;"></div>
    `).join("");

    const roadHtml = gameState.roads.map((road) => {
      const infra = gameState.infrastructures.find((item) => item.id === road.id);
      const info = statusInfo(infra?.status || "safe");
      const project = getDeconstructionProjectByTarget(road.id);
      const opClass = infra?.operationStatus === "removed" ? "removed" : infra?.operationStatus === "restricted" ? "restricted" : "";
      const activeClass = selectedId === road.id ? "active-target" : "";
      const badge = project && project.status !== "idle"
        ? `<div class="area-temp" style="left:${road.x + Math.max(10, road.w / 2 - 30)}px; top:${road.y + 14}px;">${project.mapBadge} ${project.status === "done" ? "済" : `${Math.round(project.progress)}%`}</div>`
        : "";
      return `
        <div class="map-road ${road.type === "old" ? "old-road" : ""} ${opClass} ${activeClass}" data-map-target="${road.id}" title="${road.name}" style="left:${road.x}px; top:${road.y}px; width:${road.w}px; height:${road.h}px; background:${info.color}"></div>
        <div class="map-label ${activeClass}" style="left:${road.x}px; top:${road.y - 18}px;">${road.name}</div>
        ${badge}
      `;
    }).join("");

    const bridgeHtml = gameState.bridges.map((bridge) => {
      const infra = gameState.infrastructures.find((item) => item.id === bridge.id);
      const info = statusInfo(infra?.status || "safe");
      const project = getDeconstructionProjectByTarget(bridge.id);
      const opClass = infra?.operationStatus === "removed" ? "removed" : infra?.operationStatus === "restricted" ? "restricted" : "";
      const activeClass = selectedId === bridge.id ? "active-target" : "";
      const badge = project && project.status !== "idle"
        ? `<div class="area-temp" style="left:${bridge.x + 4}px; top:${bridge.y + bridge.h + 8}px;">${project.mapBadge} ${project.status === "done" ? "済" : `${Math.round(project.progress)}%`}</div>`
        : "";
      return `
        <div class="map-bridge ${opClass} ${activeClass}" data-map-target="${bridge.id}" title="${bridge.name}" style="left:${bridge.x}px; top:${bridge.y}px; width:${bridge.w}px; height:${bridge.h}px; background:${info.color}"></div>
        <div class="map-label ${activeClass}" style="left:${bridge.x}px; top:${bridge.y - 22}px;">${bridge.name}</div>
        ${badge}
      `;
    }).join("");

    const facilityHtml = gameState.facilities.map((facility) => `
      <div class="map-facility" style="left:${facility.x}px; top:${facility.y}px;">${facility.icon}</div>
      <div class="map-label" style="left:${facility.x - 4}px; top:${facility.y + 58}px;">${facility.name}</div>
    `).join("");

    mapArea.innerHTML = `${areaHtml}${riverHtml}${roadHtml}${bridgeHtml}${facilityHtml}`;

    if (selectedInfra) {
      const selectedInfo = statusInfo(selectedInfra.status || conditionToStatus(selectedInfra.condition));
      const localStats = areaInfrastructureStats(selectedInfra.area);
      const recommendation = selectedInfra.condition < 40
        ? "早めの補修か、維持縮小の判断が必要です。"
        : selectedInfra.burden >= 15
          ? "今すぐ壊れなくても、将来負担が重い対象です。"
          : "まだ持ちこたえますが、優先順位の確認を続けたい対象です。";
      mapInspector.innerHTML = `
        <div class="map-inspector-head">
          <div>
            <h4>${selectedInfra.name}</h4>
            <p>${areaName(selectedInfra.area)} / ${selectedInfra.kind === "bridge" ? "橋梁" : "道路"} / ${selectedInfo.label}</p>
          </div>
          <span class="inline-chip">${selectedInfra.operationStatus === "restricted" ? "制限運用中" : selectedInfra.operationStatus === "removed" ? "撤去済み" : "通常運用"}</span>
        </div>
        <div class="map-detail-grid">
          <div class="metric-box"><h4>状態</h4><div class="metric-row"><strong class="metric-value">${Math.round(selectedInfra.condition)}</strong></div></div>
          <div class="metric-box"><h4>重要度</h4><div class="metric-row"><strong class="metric-value">${Math.round(selectedInfra.importance)}</strong></div></div>
          <div class="metric-box"><h4>将来負担</h4><div class="metric-row"><strong class="metric-value">${Math.round(selectedInfra.burden)}</strong></div></div>
          <div class="metric-box"><h4>地域空気</h4><div class="metric-row"><strong>${selectedAreaMood ? `満足 ${Math.round(selectedAreaMood.satisfaction)} / 反乱 ${Math.round(selectedAreaMood.rebellion)}` : "-"}</strong></div></div>
        </div>
        <div class="map-inspector-tags">
          <span class="inline-chip">地区内インフラ ${localStats.list.length}件</span>
          <span class="inline-chip">地区平均状態 ${Math.round(localStats.avgCondition)}</span>
          <span class="inline-chip">地区平均負担 ${Math.round(localStats.avgBurden)}</span>
        </div>
        <div class="callout">
          <strong>判断ヒント</strong>
          <p>${recommendation}</p>
          <p>${selectedProject ? `関連する減築案件: ${selectedProject.actionLabel}（${deconstructionStatusLabel(selectedProject.status)} / ${Math.round(selectedProject.progress)}%）` : "現時点では減築案件の直接対象ではありません。"}</p>
        </div>
      `;
    }

    const bindMapTarget = (targetId) => {
      gameState.selectedMapTargetId = targetId;
      renderMap();
    };
    mapQuickActions.querySelectorAll("[data-map-target]").forEach((button) => {
      button.addEventListener("click", () => bindMapTarget(button.dataset.mapTarget));
    });
    mapAreaSummary.querySelectorAll("[data-map-target]").forEach((button) => {
      button.addEventListener("click", () => bindMapTarget(button.dataset.mapTarget));
    });
    mapSummary.querySelectorAll("[data-map-target]").forEach((button) => {
      button.addEventListener("click", () => bindMapTarget(button.dataset.mapTarget));
    });
    mapArea.querySelectorAll("[data-map-target]").forEach((node) => {
      node.addEventListener("click", () => bindMapTarget(node.dataset.mapTarget));
    });
  }

  function renderStaffStrip(container) {
    const keys = ["bridge", "road", "disaster", "deconstruction", "outreach", "finance"];
    container.innerHTML = keys.map((key) => {
      const staff = staffData[key];
      return `<div class="staff-comment"><strong>${staff.icon} ${staff.name} / ${staff.role}</strong><span>${pickStripComment(key)}</span></div>`;
    }).join("");
  }

  function pickStripComment(key) {
    const staff = staffData[key];
    if (key === "bridge") {
      const worst = getWorstInfrastructure(gameState, "bridge");
      return worst.condition < 45 ? staff.comments.bad : worst.condition < 65 ? staff.comments.warning : staff.comments.good;
    }
    if (key === "road") {
      const worst = getWorstInfrastructure(gameState, "road");
      return worst.condition < 45 ? staff.comments.bad : worst.condition < 65 ? staff.comments.warning : staff.comments.good;
    }
    if (key === "disaster") {
      return gameState.indicators.safety < 45 ? staff.comments.bad : gameState.indicators.safety < 65 ? staff.comments.warning : staff.comments.good;
    }
    if (key === "deconstruction") {
      const active = gameState.deconstructionProjects.find((project) => project.status === "active" || project.status === "blocked");
      if (active && active.area === "mountain" && active.status === "blocked") return staff.comments.bad;
      if (active || gameState.latestDeconstructionAction) return staff.comments.warning;
      return staff.comments.good;
    }
    if (key === "outreach") {
      return gameState.indicators.rebellion > 35 ? staff.comments.bad : gameState.indicators.satisfaction < 65 ? staff.comments.warning : staff.comments.good;
    }
    return gameState.indicators.fiscalHealth < 40 ? staff.comments.bad : gameState.indicators.fiscalHealth < 60 ? staff.comments.warning : staff.comments.good;
  }

  function renderBudget() {
    return;
  }

  function labelEventKind(kind) {
    return {
      weather: "天候",
      resident: "住民対応",
      infrastructure: "インフラ",
      finance: "財政",
      bonus: "チャンス",
    }[kind] || "臨時";
  }

  function renderReport() {
    return;
  }

  return {
    renderRegionGrid,
    setScreen,
    completeOnboarding,
    onboardingProgressCount,
    getOnboardingConfig,
    renderOnboardingOverlay,
    render,
    flushReactManagedScreen,
    renderDashboard,
    phaseLabel,
    buildSummaryMessage,
    buildDashboardActions,
    phaseActionText,
    attachDashboardActionHandlers,
    renderDeconstructionList,
    renderMap,
    renderStaffStrip,
    pickStripComment,
    renderBudget,
    labelEventKind,
    renderReport,
  };
}
'''

ui_path.write_text(ui_module)

old_imports = '''import { AREA_ORDER, BUDGET_PRESETS, MONTHS, REGION_TRAITS, budgetCategories } from "../data/gameStaticData.js";
import { createMonthlyEventPool } from "../data/monthlyEventPool.js";
import { averageRegionalValue, clone, clamp, formatMoney, getMetricColor, conditionToStatus, statusInfo, getWorstInfrastructure, summarizeBudgetAllocation, summarizeEffectSignals as summarizeEffectSignalsUtil, eventImpactScore } from "./gameCoreUtils.js";
import { buildInitialState as buildInitialGameState, areaName as resolveAreaName, areaInfrastructureStats as resolveAreaInfrastructureStats, monthLabel as monthLabelFromState, getInfrastructureById as getInfrastructureByIdFromState, getDeconstructionProjectByTarget as getDeconstructionProjectByTargetFromState, deconstructionStatusLabel as deconstructionStatusLabelFromState, deconstructionModeLabel as deconstructionModeLabelFromState, describeDeconstructionProject as describeDeconstructionProjectFromState } from "./gameCoreState.js";
import { staffData } from "../data/staffData.js";
import { createGameCoreReactApi } from "./gameCoreReactApi.js";
import { createGameCoreProgressApi } from "./gameCoreProgressApi.js";
import { createGameCoreReportApi } from "./gameCoreReportApi.js";
import { createGameCoreSimulationApi } from "./gameCoreSimulationApi.js";
'''
new_imports = '''import { createMonthlyEventPool } from "../data/monthlyEventPool.js";
import { averageRegionalValue, clone, clamp, formatMoney, getMetricColor, conditionToStatus, statusInfo, getWorstInfrastructure, summarizeBudgetAllocation, summarizeEffectSignals as summarizeEffectSignalsUtil, eventImpactScore } from "./gameCoreUtils.js";
import { buildInitialState as buildInitialGameState, areaName as resolveAreaName, areaInfrastructureStats as resolveAreaInfrastructureStats, monthLabel as monthLabelFromState, getInfrastructureById as getInfrastructureByIdFromState, getDeconstructionProjectByTarget as getDeconstructionProjectByTargetFromState, deconstructionStatusLabel as deconstructionStatusLabelFromState, deconstructionModeLabel as deconstructionModeLabelFromState, describeDeconstructionProject as describeDeconstructionProjectFromState } from "./gameCoreState.js";
import { createGameCoreReactApi } from "./gameCoreReactApi.js";
import { createGameCoreProgressApi } from "./gameCoreProgressApi.js";
import { createGameCoreReportApi } from "./gameCoreReportApi.js";
import { createGameCoreSimulationApi } from "./gameCoreSimulationApi.js";
import { createGameCoreUiHelpers } from "./gameCoreUiHelpers.js";
'''
if old_imports not in core:
    raise SystemExit('import block not found')
core = core.replace(old_imports, new_imports, 1)

old_top = '''let appRoot = null;
let hasCompletedOnboarding = false;
const REACT_MANAGED_SCREENS = new Set(["title", "dashboard", "budget", "report", "event", "clear", "gameover"]);
const gameViewListeners = new Set();

function getElement(id) {
  return appRoot?.querySelector(`#${id}`) || null;
}

function getReactManagedMountId(screen) {
  if (screen === "title") return "reactScreenHost";
  if (screen === "dashboard") return "mapArea";
  if (screen === "budget") return "budgetStatus";
  if (screen === "report") return "reportList";
  if (screen === "event") return "reactScreenHost";
  return "";
}

function emitGameViewChange() {
'''
new_top = '''let appRoot = null;
let hasCompletedOnboarding = false;
const gameViewListeners = new Set();

function emitGameViewChange() {
'''
if old_top not in core:
    raise SystemExit('top UI block not found')
core = core.replace(old_top, new_top, 1)

marker = 'function resetGame(startImmediately = false) {'
idx = core.find(marker)
if idx == -1:
    raise SystemExit('resetGame marker not found')
pre = core[:idx]
rest = core[idx:]

old_reset = '''function resetGame(startImmediately = false) {
  gameState = buildInitialState();
  gameState.reportEntries = generateYearEndReport(gameState, true);
  gameState.selectedReportId = gameState.reportEntries[0]?.id || null;
  gameState.screen = startImmediately ? "dashboard" : "title";
  render();
}

function renderRegionGrid() {
'''
new_reset = '''let uiApi = null;

function setScreen(...args) {
  return uiApi?.setScreen(...args);
}

function render(...args) {
  return uiApi?.render(...args);
}

function resetGame(startImmediately = false) {
  gameState = buildInitialState();
  gameState.reportEntries = generateYearEndReport(gameState, true);
  gameState.selectedReportId = gameState.reportEntries[0]?.id || null;
  gameState.screen = startImmediately ? "dashboard" : "title";
  render();
}

export function flushReactManagedScreen(...args) {
  return uiApi?.flushReactManagedScreen(...args);
}

const progressApi = createGameCoreProgressApi({
'''
if old_reset not in core:
    raise SystemExit('reset-to-ui block start not found')
core = core.replace(old_reset, new_reset, 1)

old_ui_tail = '''function renderReport() {
  return;
}

const progressApi = createGameCoreProgressApi({
'''
if old_ui_tail not in core:
    raise SystemExit('ui tail block not found')
core = core.replace(old_ui_tail, '', 1)

old_balance = '''const balanceChoiceScore = (...args) => progressApi.balanceChoiceScore(...args);

const reactApi = createGameCoreReactApi({
'''
new_balance = '''const balanceChoiceScore = (...args) => progressApi.balanceChoiceScore(...args);

uiApi = createGameCoreUiHelpers({
  getState: () => gameState,
  getAppRoot: () => appRoot,
  setHasCompletedOnboarding: (value) => {
    hasCompletedOnboarding = value;
  },
  emitGameViewChange,
  getMetricColor,
  areaInfrastructureStats,
  areaName,
  monthLabel,
  getInfrastructureById,
  getDeconstructionProjectByTarget,
  deconstructionStatusLabel,
  describeDeconstructionProject,
  conditionToStatus,
  statusInfo,
  getWorstInfrastructure,
  currentDramaProfile,
  getMostVolatileRegion,
  advanceMonth,
});

const phaseLabel = (...args) => uiApi.phaseLabel(...args);
const buildSummaryMessage = (...args) => uiApi.buildSummaryMessage(...args);
const phaseActionText = (...args) => uiApi.phaseActionText(...args);
const pickStripComment = (...args) => uiApi.pickStripComment(...args);
const labelEventKind = (...args) => uiApi.labelEventKind(...args);

const reactApi = createGameCoreReactApi({
'''
if old_balance not in core:
    raise SystemExit('balance insertion point not found')
core = core.replace(old_balance, new_balance, 1)

core_path.write_text(core)
print('C-6 split UI helpers applied')
