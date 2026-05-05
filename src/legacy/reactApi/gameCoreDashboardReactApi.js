import { AREA_ORDER, MONTHS, REGION_TRAITS } from "../../data/gameStaticData.js";
import { staffData } from "../../data/staffData.js";
import { createGameCoreDashboardReactApiShape } from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreDashboardReactApi(ctx) {
  const {
    gameState,
    getMetricColor,
    areaInfrastructureStats,
    areaName,
    describeDeconstructionProject,
    monthLabel,
    deconstructionStatusLabel,
    getInfrastructureById,
    getDeconstructionProjectByTarget,
    conditionToStatus,
    statusInfo,
    pickStripComment,
    currentDramaProfile,
    getWorstInfrastructure,
    getMostVolatileRegion,
    phaseLabel,
    formatMoney,
    buildSummaryMessage,
    phaseActionText,
    screenTransitions,
    advanceMonth,
    render,
  } = ctx;

  function buildDashboardStatItems() {
    const stats = [
      { label: "住民満足度", key: "satisfaction" },
      { label: "インフラ安全度", key: "safety" },
      { label: "財政健全度", key: "fiscalHealth" },
      { label: "将来負担", key: "futureBurden", inverted: true },
      { label: "支持率", key: "support" },
      { label: "反乱ゲージ", key: "rebellion", inverted: true },
    ];

    return stats.map((stat) => {
      const value = Math.round(gameState.indicators[stat.key]);
      const meterValue = stat.inverted ? 100 - value : value;
      const tone = meterValue >= 65 ? "positive" : meterValue >= 40 ? "neutral" : "negative";
      return {
        ...stat,
        value,
        meterValue,
        tone,
        stateLabel: meterValue >= 65 ? "安定" : meterValue >= 40 ? "注意" : "危険",
        meterColor: getMetricColor(value, stat.inverted),
      };
    });
  }

  function buildDashboardRegions() {
    return AREA_ORDER.map((areaId) => {
      const mood = gameState.regionalMoods[areaId];
      const stats = areaInfrastructureStats(areaId);
      const freeze = areaId === "mountain" && mood.rebellion >= 68;
      const satisfactionState = mood.satisfaction >= 70 ? "安定" : mood.satisfaction >= 45 ? "不安" : "不満";
      const rebellionState = mood.rebellion < 30 ? "静穏" : mood.rebellion < 60 ? "警戒" : "反発";
      const note = freeze
        ? "反発が強く、山間部の減築は一時停止中です。"
        : stats.worst
          ? `いまの火種は ${stats.worst.name} です。`
          : "大きな火種はまだ見えていません。";
      return {
        areaId,
        name: areaName(areaId),
        satisfaction: Math.round(mood.satisfaction),
        rebellion: Math.round(mood.rebellion),
        satisfactionState,
        rebellionState,
        tone: freeze || mood.rebellion >= 60 ? "negative" : mood.satisfaction >= 70 ? "positive" : "neutral",
        freeze,
        note: `${REGION_TRAITS[areaId].worry}。${note}`,
        avgCondition: Math.round(stats.avgCondition),
        avgBurden: Math.round(stats.avgBurden),
        toneLabel: REGION_TRAITS[areaId].tone,
        satisfactionColor: getMetricColor(mood.satisfaction),
        rebellionColor: getMetricColor(mood.rebellion, true),
      };
    });
  }

  function buildDashboardDeconstructionItems() {
    return gameState.deconstructionProjects.map((project) => {
      const progress = project.status === "done" ? 100 : Math.round(project.progress);
      const stateTone = project.status === "done" ? "positive" : project.status === "active" ? "neutral" : project.status === "blocked" ? "negative" : "neutral";
      const detail = describeDeconstructionProject(project);
      const meta = project.status === "done"
        ? `${project.completedYear}年 ${project.completedMonth !== null ? monthLabel(project.completedMonth) : ""} 完了`
        : detail.factLine;
      return {
        id: project.id,
        actionLabel: project.actionLabel,
        meta,
        tone: stateTone,
        statusLabel: deconstructionStatusLabel(project.status),
        progress,
        scoreLine: detail.scoreLine,
        cpuReason: project.cpuReason,
        expectedEffectNote: project.expectedEffectNote,
        riskLine: detail.riskLine,
        lastNote: project.lastNote,
      };
    });
  }

  function buildDashboardStaffItems() {
    const keys = ["bridge", "road", "disaster", "deconstruction", "outreach", "finance"];
    return keys.map((key) => {
      const staff = staffData[key];
      const comment = pickStripComment(key);
      const tone = comment === staff.comments.bad ? "negative" : comment === staff.comments.warning ? "warning" : "positive";
      let warning = "";
      if (key === "bridge") {
        const worstBridge = getWorstInfrastructure(gameState, "bridge");
        if (worstBridge && worstBridge.condition < 55) warning = `${worstBridge.name}（状態 ${Math.round(worstBridge.condition)}）`;
      } else if (key === "road") {
        const worstRoad = getWorstInfrastructure(gameState, "road");
        if (worstRoad && worstRoad.condition < 55) warning = `${worstRoad.name}（状態 ${Math.round(worstRoad.condition)}）`;
      } else if (key === "disaster") {
        if (gameState.indicators.safety < 55) warning = `安全度 ${Math.round(gameState.indicators.safety)}`;
      } else if (key === "deconstruction") {
        if (gameState.indicators.futureBurden > 55) warning = `将来負担 ${Math.round(gameState.indicators.futureBurden)}`;
      } else if (key === "outreach") {
        if (gameState.indicators.rebellion > 35) warning = `反乱 ${Math.round(gameState.indicators.rebellion)}`;
      } else if (key === "finance") {
        if (gameState.indicators.fiscalHealth < 50) warning = `財政健全度 ${Math.round(gameState.indicators.fiscalHealth)}`;
      }
      return {
        key,
        name: staff.name,
        role: staff.role,
        avatar: staff.icon,
        label: `${staff.icon} ${staff.name} / ${staff.role}`,
        comment,
        tone,
        warning,
      };
    });
  }

  function buildDashboardMapViewModel() {
    const visibleInfrastructures = gameState.infrastructures.filter((item) => item.operationStatus !== "removed");
    const rankedTargets = [...visibleInfrastructures]
      .sort((a, b) => (a.condition - b.condition) || (b.importance - a.importance) || (b.burden - a.burden))
      .slice(0, 4);
    const fallbackTargetId = [...visibleInfrastructures].sort((a, b) => a.condition - b.condition)[0]?.id || gameState.infrastructures[0]?.id || "bridgeA";
    const selectedId = getInfrastructureById(gameState.selectedMapTargetId)?.id || fallbackTargetId;
    const selectedInfra = getInfrastructureById(selectedId) || gameState.infrastructures[0] || null;
    const selectedProject = selectedInfra ? getDeconstructionProjectByTarget(selectedInfra.id) : null;
    const selectedAreaMood = selectedInfra ? gameState.regionalMoods[selectedInfra.area] : null;
    const worstBridge = getWorstInfrastructure(gameState, "bridge");
    const worstRoad = getWorstInfrastructure(gameState, "road");
    const activeProject = gameState.deconstructionProjects.find((project) => project.status === "active" || project.status === "blocked");

    const quickActions = [
      worstBridge ? { key: "worst-bridge", label: `橋の火種 → ${worstBridge.name}`, targetId: worstBridge.id, active: selectedId === worstBridge.id } : null,
      worstRoad ? { key: "worst-road", label: `道路の火種 → ${worstRoad.name}`, targetId: worstRoad.id, active: selectedId === worstRoad.id } : null,
      activeProject ? { key: "active-project", label: `減築対象 → ${activeProject.actionLabel}`, targetId: activeProject.targetId, active: selectedId === activeProject.targetId } : null,
      selectedInfra ? { key: "selected", label: `現在注目中 → ${selectedInfra.name}`, targetId: selectedInfra.id, active: true } : null,
    ].filter(Boolean);

    const areaCards = AREA_ORDER.map((areaId) => {
      const mood = gameState.regionalMoods[areaId];
      const stats = areaInfrastructureStats(areaId);
      const focusTargetId = stats.worst?.id || fallbackTargetId;
      const riskTone = mood.rebellion >= 45 || stats.avgCondition < 50
        ? "negative"
        : mood.rebellion >= 30 || stats.avgCondition < 62
          ? "neutral"
          : "positive";
      const riskLabel = riskTone === "negative" ? "火種大" : riskTone === "neutral" ? "見張り" : "安定";
      const issueLine = stats.worst
        ? `最優先: ${stats.worst.name} / 状態 ${Math.round(stats.worst.condition)} / 負担 ${Math.round(stats.worst.burden)}`
        : "現時点で大きな火種は見えていません。";
      return {
        areaId,
        title: areaName(areaId),
        description: REGION_TRAITS[areaId]?.worry || "",
        riskTone,
        riskLabel,
        active: selectedInfra?.area === areaId,
        targetId: focusTargetId,
        chips: [
          `満足 ${Math.round(mood.satisfaction)}`,
          `反乱 ${Math.round(mood.rebellion)}`,
          `平均状態 ${Math.round(stats.avgCondition)}`,
        ],
        issueLine,
      };
    });

    const focusCards = rankedTargets.map((item, index) => {
      const info = statusInfo(item.status || conditionToStatus(item.condition));
      return {
        id: item.id,
        kicker: `危険順 ${index + 1}`,
        title: item.name,
        tone: item.condition < 40 ? "negative" : item.condition < 65 ? "neutral" : "positive",
        statusLabel: info.label,
        subtitle: `${areaName(item.area)} / ${item.kind === "bridge" ? "橋" : "道路"}`,
        active: selectedId === item.id,
        chips: [
          `状態 ${Math.round(item.condition)}`,
          `重要度 ${Math.round(item.importance)}`,
          `負担 ${Math.round(item.burden)}`,
        ],
      };
    });

    const roads = gameState.roads.map((road) => {
      const infra = gameState.infrastructures.find((item) => item.id === road.id);
      const info = statusInfo(infra?.status || "safe");
      const project = getDeconstructionProjectByTarget(road.id);
      const operationClass = infra?.operationStatus === "removed" ? "removed" : infra?.operationStatus === "restricted" ? "restricted" : "";
      const active = selectedId === road.id;
      return {
        id: road.id,
        name: road.name,
        active,
        roadClass: road.type === "old" ? "old-road" : "",
        operationClass,
        color: info.color,
        positionStyle: { left: road.x, top: road.y, width: road.w, height: road.h, background: info.color },
        labelStyle: { left: road.x, top: road.y - 18 },
        badge: project && project.status !== "idle"
          ? {
              text: `${project.mapBadge} ${project.status === "done" ? "済" : `${Math.round(project.progress)}%`}`,
              style: { left: road.x + Math.max(10, road.w / 2 - 30), top: road.y + 14 },
            }
          : null,
      };
    });

    const bridges = gameState.bridges.map((bridge) => {
      const infra = gameState.infrastructures.find((item) => item.id === bridge.id);
      const info = statusInfo(infra?.status || "safe");
      const project = getDeconstructionProjectByTarget(bridge.id);
      const operationClass = infra?.operationStatus === "removed" ? "removed" : infra?.operationStatus === "restricted" ? "restricted" : "";
      const active = selectedId === bridge.id;
      return {
        id: bridge.id,
        name: bridge.name,
        active,
        operationClass,
        color: info.color,
        positionStyle: { left: bridge.x, top: bridge.y, width: bridge.w, height: bridge.h, background: info.color },
        labelStyle: { left: bridge.x, top: bridge.y - 22 },
        badge: project && project.status !== "idle"
          ? {
              text: `${project.mapBadge} ${project.status === "done" ? "済" : `${Math.round(project.progress)}%`}`,
              style: { left: bridge.x + 4, top: bridge.y + bridge.h + 8 },
            }
          : null,
      };
    });

    const facilities = gameState.facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      icon: facility.icon,
      iconStyle: { left: facility.x, top: facility.y },
      labelStyle: { left: facility.x - 4, top: facility.y + 58 },
    }));

    let inspector = null;
    if (selectedInfra) {
      const selectedInfo = statusInfo(selectedInfra.status || conditionToStatus(selectedInfra.condition));
      const localStats = areaInfrastructureStats(selectedInfra.area);
      const recommendation = selectedInfra.condition < 40
        ? "早めの補修か、維持縮小の判断が必要です。"
        : selectedInfra.burden >= 15
          ? "今すぐ壊れなくても、将来負担が重い対象です。"
          : "まだ持ちこたえますが、優先順位の確認を続けたい対象です。";
      inspector = {
        title: selectedInfra.name,
        subtitle: `${areaName(selectedInfra.area)} / ${selectedInfra.kind === "bridge" ? "橋梁" : "道路"} / ${selectedInfo.label}`,
        operationLabel: selectedInfra.operationStatus === "restricted" ? "制限運用中" : selectedInfra.operationStatus === "removed" ? "撤去済み" : "通常運用",
        metrics: [
          { key: "condition", label: "状態", value: Math.round(selectedInfra.condition) },
          { key: "importance", label: "重要度", value: Math.round(selectedInfra.importance) },
          { key: "burden", label: "将来負担", value: Math.round(selectedInfra.burden) },
          { key: "mood", label: "地域空気", value: selectedAreaMood ? `満足 ${Math.round(selectedAreaMood.satisfaction)} / 反乱 ${Math.round(selectedAreaMood.rebellion)}` : "-" },
        ],
        tags: [
          `地区内インフラ ${localStats.list.length}件`,
          `地区平均状態 ${Math.round(localStats.avgCondition)}`,
          `地区平均負担 ${Math.round(localStats.avgBurden)}`,
        ],
        recommendation,
        projectLine: selectedProject
          ? `関連する減築案件: ${selectedProject.actionLabel}（${deconstructionStatusLabel(selectedProject.status)} / ${Math.round(selectedProject.progress)}%）`
          : "現時点では減築案件の直接対象ではありません。",
      };
    }

    return {
      legendItems: ["safe", "warning", "danger", "removal"].map((key) => ({ key, ...statusInfo(key) })),
      legendChips: ["色で危険度を表示", "地区カードや火種カードからジャンプ可"],
      quickActions,
      areaCards,
      focusCards,
      areas: gameState.areas.map((area) => ({
        id: area.id,
        name: area.name,
        areaStyle: { left: area.x, top: area.y, width: area.w, height: area.h },
        labelStyle: { left: area.x + 10, top: area.y + 10 },
      })),
      rivers: gameState.rivers.map((river, index) => ({
        id: `river-${index}`,
        style: { left: river.x, top: river.y, width: river.w, height: river.h },
      })),
      roads,
      bridges,
      facilities,
      inspector,
    };
  }

  function getDashboardViewModel() {
    const drama = currentDramaProfile();
    const worstBridge = getWorstInfrastructure(gameState, "bridge");
    const worstRoad = getWorstInfrastructure(gameState, "road");
    const volatileRegion = getMostVolatileRegion();
    const phaseButtonLabel = gameState.phase === "report"
      ? "年度末レポートを見る"
      : gameState.phase === "budget"
        ? "予算配分を開く"
        : `${MONTHS[gameState.monthIndex]}を進める`;
    const stickyLabel = gameState.phase === "report"
      ? "年度末レポートへ"
      : gameState.phase === "budget"
        ? "予算配分へ"
        : `${MONTHS[gameState.monthIndex]}を進める`;

    return {
      yearLabel: `${gameState.year}年目 / ${gameState.phase === "monthly" ? MONTHS[gameState.monthIndex] : "年度準備"}`,
      subtitle: `${phaseLabel(gameState.phase)} ・ ${drama.subtitle} ・ 年間予算 ${formatMoney(gameState.annualBudget)} ・ 予備費 ${formatMoney(gameState.reserveFund)}`,
      chips: [
        `残予算 ${formatMoney(gameState.remainingBudget)}`,
        `10年クリアまであと ${Math.max(0, 10 - gameState.year)} 年`,
      ],
      stats: buildDashboardStatItems(),
      summaryChips: [
        `要注意地区 ${areaName(volatileRegion.areaId)} / 満足 ${Math.round(volatileRegion.satisfaction)} / 反乱 ${Math.round(volatileRegion.rebellion)}`,
        `橋の火種 ${worstBridge.name}`,
        `道路の火種 ${worstRoad.name}`,
      ],
      summaryMessage: buildSummaryMessage(),
      lastChoiceResult: gameState.lastChoiceResult || "",
      actionText: phaseActionText(),
      primaryActionLabel: phaseButtonLabel,
      stickyActionLabel: stickyLabel,
      stickySubtext: `${phaseLabel(gameState.phase)}を進めます`,
      map: buildDashboardMapViewModel(),
      regions: buildDashboardRegions().map((r) => ({
        id: r.areaId,
        name: r.name,
        satisfaction: r.satisfaction,
        rebellion: r.rebellion,
        note: r.note,
        tone: r.tone,
      })),
      deconstructionItems: buildDashboardDeconstructionItems(),
      staffItems: buildDashboardStaffItems(),
      monthLabel: gameState.phase === "monthly" ? MONTHS[gameState.monthIndex] : gameState.phase === "report" ? "年度末" : "年度準備",
      recentLog: (gameState.log || []).slice(0, 8),
    };
  }

  function runDashboardPrimaryAction() {
    if (gameState?.phase === "report") {
      screenTransitions.showReport();
      return;
    }
    if (gameState?.phase === "budget") {
      screenTransitions.showBudget();
      return;
    }
    if (gameState?.phase === "monthly") {
      advanceMonth();
    }
  }

  function runDashboardSelectMapTarget(targetId) {
    const target = getInfrastructureById(targetId);
    if (!target) return;
    gameState.selectedMapTargetId = target.id;
    render();
  }

  return createGameCoreDashboardReactApiShape({
    getDashboardViewModel,
    runDashboardPrimaryAction,
    runDashboardSelectMapTarget,
  });
}
