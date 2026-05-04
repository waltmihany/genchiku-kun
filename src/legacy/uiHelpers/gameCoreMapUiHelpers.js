import { AREA_ORDER, REGION_TRAITS } from "../../data/gameStaticData.js";
import { staffData } from "../../data/staffData.js";
import { createGameCoreMapUiHelpersShape } from "../deps/gameCoreUiHelpersAssemblyDefinitions.js";

export function createGameCoreMapUiHelpers(ctx) {
  const {
    gameState,
    getElement,
    areaInfrastructureStats,
    areaName,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    deconstructionStatusLabel,
    conditionToStatus,
    statusInfo,
    getWorstInfrastructure,
  } = ctx;

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

  function renderStaffStrip(container) {
    const keys = ["bridge", "road", "disaster", "deconstruction", "outreach", "finance"];
    container.innerHTML = keys.map((key) => {
      const staff = staffData[key];
      return `<div class="staff-comment"><strong>${staff.icon} ${staff.name} / ${staff.role}</strong><span>${pickStripComment(key)}</span></div>`;
    }).join("");
  }

  return createGameCoreMapUiHelpersShape({
    renderMap,
    renderStaffStrip,
    pickStripComment,
  });
}
