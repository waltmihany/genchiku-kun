from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3/src')
app_shell = root / 'legacy' / 'appShellHtml.js'
game_core = root / 'legacy' / 'gameCore.js'
styles = root / 'styles.css'

app_text = app_shell.read_text()
old_map_block = '''            <div id="mapSummary" class="map-summary-grid"></div>
            <div id="mapLegend" class="legend"></div>
            <div class="map-scroll-shell">
              <div id="mapArea" class="simple-map"></div>
            </div>
            <div id="mapInspector" class="map-inspector"></div>'''
new_map_block = '''            <div id="mapQuickActions" class="map-quick-actions"></div>
            <div id="mapAreaSummary" class="map-area-summary"></div>
            <div id="mapSummary" class="map-summary-grid"></div>
            <div id="mapLegend" class="legend"></div>
            <div class="map-scroll-shell">
              <div id="mapArea" class="simple-map"></div>
            </div>
            <div id="mapInspector" class="map-inspector"></div>'''
if old_map_block not in app_text:
    raise SystemExit('map block not found in appShellHtml.js')
app_text = app_text.replace(old_map_block, new_map_block)

old_budget_block = '''        <div id="budgetStatus" class="budget-status"></div>
        <div id="budgetOverview" class="budget-overview"></div>
        <div id="budgetPresetRow" class="preset-row"></div>
        <div id="budgetControls" class="budget-controls"></div>'''
new_budget_block = '''        <div id="budgetStatus" class="budget-status"></div>
        <div id="budgetOverview" class="budget-overview"></div>
        <div id="budgetMixBar" class="budget-mix-bar"></div>
        <div id="budgetGuide" class="budget-guide-grid"></div>
        <div id="budgetPresetRow" class="preset-row"></div>
        <div id="budgetControls" class="budget-controls"></div>'''
if old_budget_block not in app_text:
    raise SystemExit('budget block not found in appShellHtml.js')
app_text = app_text.replace(old_budget_block, new_budget_block)
app_shell.write_text(app_text)

core_text = game_core.read_text()

new_render_map = '''function renderMap() {
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
}'''
core_text, count = re.subn(r'function renderMap\(\) \{.*?\n\}\n\nfunction renderStaffStrip', new_render_map + '\n\nfunction renderStaffStrip', core_text, flags=re.S)
if count != 1:
    raise SystemExit(f'renderMap replace failed: {count}')

new_render_budget = '''function renderBudget() {
  const drama = currentDramaProfile();
  const budgetStatus = getElement("budgetStatus");
  const budgetOverview = getElement("budgetOverview");
  const budgetMixBar = getElement("budgetMixBar");
  const budgetGuide = getElement("budgetGuide");
  const budgetPresetRow = getElement("budgetPresetRow");
  const budgetControls = getElement("budgetControls");
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
  if (centralInfraShare < 34) warnings.push("中央の幹線維持が薄く、後半の不満が出やすい配分です。");
  if (allocation.disaster < 15) warnings.push("防災が薄く、天候イベントで安全度が揺れやすくなります。");
  if (allocation.outreach < 16) warnings.push("説明不足が起きやすく、年末の満足度回復も鈍くなります。");
  if (allocation.deconstruction < 16) warnings.push("将来負担が残りやすく、終盤で息切れしやすくなります。");
  if (allocation.reserve < 15) warnings.push("事故・入札不調の保険が薄く、突発イベントへの耐久が落ちます。");
  const goodPoints = [];
  if (safetyShare >= 49) goodPoints.push("守り寄りで安全度を維持しやすい構えです。");
  if (residentShare >= 35) goodPoints.push("生活路線と住民対応が厚く、反発の火消しに向きます。");
  if (restructureShare >= 18) goodPoints.push("減築を進めやすく、将来負担を軽くしやすい配分です。");
  if (reserveShare >= 18) goodPoints.push("予備費が厚く、想定外の出費に耐えやすいです。");

  budgetStatus.innerHTML = `
    <strong>現在の合計: ${total}%</strong>
    <p>年度 ${gameState.year} の重点を決めます。橋と道路を守るほど安全は上がり、減築を進めるほど将来負担は軽くなります。住民対応は短期的な不満の抑制に効き、予備費は事故や入札不調への保険になります。</p>
    <p><span class="inline-chip">${drama.subtitle}</span> <span class="inline-chip">${activePreset ? `選択中: ${BUDGET_PRESETS.find((preset) => preset.key === activePreset)?.label}` : "手動配分"}</span> <span class="inline-chip">おすすめ: ${BUDGET_PRESETS.find((preset) => preset.key === recommendedPreset.key)?.label}</span> <span class="inline-chip">いまの型: ${presetVoices[activePreset] || "手動調整中"}</span></p>
    <p>${presetSummary}</p>
    <p class="budget-recommend">CPUの見立て: ${recommendedPreset.reason}</p>
    <p class="budget-touch-hint">微調整は <strong>±1</strong>、一気に寄せたいときは <strong>±5</strong>。色付きバーで配分の偏りを見ながら調整できます。</p>
  `;

  budgetOverview.innerHTML = `
    <div class="budget-overview-grid">
      <div class="metric-box"><h4>安全寄り</h4><div class="metric-row"><strong class="metric-value">${safetyShare}%</strong><span class="${safetyShare >= 49 ? "positive" : safetyShare >= 45 ? "neutral" : "negative"}">${safetyShare >= 49 ? "厚め" : safetyShare >= 45 ? "並" : "薄め"}</span></div></div>
      <div class="metric-box"><h4>火消し寄り</h4><div class="metric-row"><strong class="metric-value">${residentShare}%</strong><span class="${residentShare >= 35 ? "positive" : residentShare >= 31 ? "neutral" : "negative"}">${residentShare >= 35 ? "強い" : residentShare >= 31 ? "並" : "弱い"}</span></div></div>
      <div class="metric-box"><h4>将来整理</h4><div class="metric-row"><strong class="metric-value">${restructureShare}%</strong><span class="${restructureShare >= 18 ? "positive" : restructureShare >= 15 ? "neutral" : "negative"}">${restructureShare >= 18 ? "進む" : restructureShare >= 15 ? "並" : "遅い"}</span></div></div>
      <div class="metric-box"><h4>突発耐久</h4><div class="metric-row"><strong class="metric-value">${reserveShare}%</strong><span class="${reserveShare >= 18 ? "positive" : reserveShare >= 15 ? "neutral" : "negative"}">${reserveShare >= 18 ? "厚い" : reserveShare >= 15 ? "並" : "薄い"}</span></div></div>
    </div>
    <div class="budget-overview-notes">
      <div class="callout ${warnings.length ? "warning-box budget-warning-box" : "budget-good-box"}">
        <strong>${warnings.length ? "この配分の注意点" : "この配分の良いところ"}</strong>
        <ul class="budget-note-list">
          ${(warnings.length ? warnings : goodPoints.length ? goodPoints : ["大きな穴は少ないですが、何を伸ばしたいかを決めるともっと強くなります。"]).map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  budgetMixBar.innerHTML = `
    <div class="budget-mix-track">
      ${budgetCategories.map((cat) => `
        <div class="budget-mix-segment budget-accent-${cat.key}" style="width:${allocation[cat.key]}%">
          <span>${cat.label} ${allocation[cat.key]}%</span>
        </div>
      `).join("")}
    </div>
    <div class="budget-mix-legend">
      ${budgetCategories.map((cat) => `<span class="inline-chip budget-accent-chip budget-accent-${cat.key}">${cat.label} ${allocation[cat.key]}%</span>`).join("")}
    </div>
  `;

  budgetGuide.innerHTML = [
    {
      label: "中央の安定",
      value: `${centralInfraShare}%`,
      tone: centralInfraShare >= 34 ? "positive" : centralInfraShare >= 31 ? "neutral" : "negative",
      note: centralInfraShare >= 34 ? "中央の反発を抑えやすい配分です。" : "中央の不満が溜まりやすい境目です。",
    },
    {
      label: "イベント耐久",
      value: `${eventShieldShare}%`,
      tone: eventShieldShare >= 31 ? "positive" : eventShieldShare >= 28 ? "neutral" : "negative",
      note: eventShieldShare >= 31 ? "台風・豪雨や突発出費に比較的強めです。" : "天候イベントと臨時出費にやや弱めです。",
    },
    {
      label: "住民火消し",
      value: `${residentShare}%`,
      tone: residentShare >= 35 ? "positive" : residentShare >= 31 ? "neutral" : "negative",
      note: residentShare >= 35 ? "局地炎上の鎮火に向いた年です。" : "説明不足が起きると反発が残りやすい年です。",
    },
    {
      label: "終盤の軽さ",
      value: `${restructureShare}%`,
      tone: restructureShare >= 18 ? "positive" : restructureShare >= 15 ? "neutral" : "negative",
      note: restructureShare >= 18 ? "将来負担を軽くしやすい配分です。" : "後半の息切れ対策としては控えめです。",
    },
  ].map((item) => `
    <div class="budget-guide-card">
      <div class="budget-guide-head">
        <strong>${item.label}</strong>
        <span class="${item.tone}">${item.value}</span>
      </div>
      <p>${item.note}</p>
    </div>
  `).join("");

  budgetPresetRow.innerHTML = BUDGET_PRESETS.map((preset) => `
    <button class="preset-btn ${activePreset === preset.key ? "active" : ""} ${recommendedPreset.key === preset.key ? "recommended" : ""}" data-preset-key="${preset.key}">
      <div class="preset-head">
        <strong>${preset.label}</strong>
        ${recommendedPreset.key === preset.key ? '<span class="tag">おすすめ</span>' : ""}
      </div>
      <span class="preset-tone">${presetVoices[preset.key] || ""}</span>
      <span>${preset.summary}</span>
    </button>
  `).join("");

  budgetControls.innerHTML = budgetCategories.map((cat) => {
    const amount = annualBudget * allocation[cat.key] / 100;
    const delta = allocation[cat.key] - (balanceReference[cat.key] || 0);
    const deltaTone = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
    const deltaText = delta === 0 ? "基準どおり" : `${delta > 0 ? "+" : ""}${delta}%`;
    return `
      <div class="budget-row budget-row-${cat.key}">
        <div class="budget-main">
          <div class="budget-row-head">
            <div class="budget-label">
              <strong>${cat.label}</strong>
              <span>${cat.description}</span>
            </div>
            <div class="budget-percent"><strong>${allocation[cat.key]}%</strong><span>${formatMoney(amount)}</span></div>
          </div>
          <div class="budget-row-meta">
            <span class="inline-chip">${rowRoles[cat.key]}</span>
            <span class="inline-chip">年額 ${formatMoney(amount)}</span>
            <span class="inline-chip ${deltaTone}">バランス型比 ${deltaText}</span>
          </div>
          <div class="budget-row-hint">${rowHints[cat.key]}</div>
          <div class="budget-row-bar"><div class="budget-row-fill budget-accent-${cat.key}" style="width:${allocation[cat.key]}%"></div></div>
        </div>
        <div class="budget-buttons">
          <button class="small-step subtle-step" data-act="step" data-step="-5" data-key="${cat.key}">-5</button>
          <button class="small-step" data-act="step" data-step="-1" data-key="${cat.key}">-1</button>
          <input class="budget-slider" type="range" min="0" max="100" step="1" value="${allocation[cat.key]}" data-act="range" data-key="${cat.key}" />
          <button class="small-step" data-act="step" data-step="1" data-key="${cat.key}">+1</button>
          <button class="small-step subtle-step" data-act="step" data-step="5" data-key="${cat.key}">+5</button>
        </div>
      </div>
    `;
  }).join("");

  budgetPresetRow.querySelectorAll("[data-preset-key]").forEach((el) => {
    el.addEventListener("click", () => applyBudgetPreset(el.dataset.presetKey));
  });

  budgetControls.querySelectorAll("[data-act]").forEach((el) => {
    const key = el.dataset.key;
    const act = el.dataset.act;
    if (act === "range") {
      el.addEventListener("input", (event) => setBudgetValue(key, event.target.value));
    } else {
      el.addEventListener("click", () => adjustBudget(key, Number(el.dataset.step || 0)));
    }
  });

  getElement("applyBudgetBtn").onclick = () => applyBudgetPlan();
  getElement("autoBalanceBtn").onclick = () => autoBalanceBudget();

  const budgetStickyFooter = getElement("budgetStickyFooter");
  if (budgetStickyFooter) {
    budgetStickyFooter.innerHTML = `
      <div class="sticky-action-inner double-action">
        <button id="autoBalanceStickyBtn" class="ghost-btn">バランス型に戻す</button>
        <button id="applyBudgetStickyBtn" class="primary-btn">この配分で進む</button>
      </div>
    `;
    getElement("applyBudgetStickyBtn").onclick = () => applyBudgetPlan();
    getElement("autoBalanceStickyBtn").onclick = () => autoBalanceBudget();
  }
}'''
core_text, count = re.subn(r'function renderBudget\(\) \{.*?\n\}\n\nfunction renderEvent', new_render_budget + '\n\nfunction renderEvent', core_text, flags=re.S)
if count != 1:
    raise SystemExit(f'renderBudget replace failed: {count}')

game_core.write_text(core_text)

styles_text = styles.read_text()
extra_css = '''

.map-quick-actions,
.map-area-summary {
  display: grid;
  gap: 10px;
  margin-bottom: 14px;
}

.map-quick-actions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.map-jump-chip {
  text-align: left;
  background: #fff7f1;
  border: 1px solid #f0dfd1;
  border-radius: 14px;
  padding: 12px 14px;
  font-weight: 700;
  color: #5c5148;
}

.map-jump-chip.active {
  background: #eef8f5;
  border-color: var(--secondary-dark);
  color: #264e47;
}

.map-area-summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.map-area-card {
  text-align: left;
  background: linear-gradient(180deg, #fffaf5 0%, #fffdfb 100%);
  border: 1px solid #efdfcf;
  border-radius: 16px;
  padding: 14px;
}

.map-area-card.active {
  border-color: var(--secondary-dark);
  background: #eef8f5;
}

.map-area-card-head,
.budget-row-head,
.budget-guide-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.map-area-card p,
.budget-guide-card p,
.budget-row-hint {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.65;
}

.map-area-card-meta,
.map-inspector-tags,
.budget-mix-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.map-area-card-note {
  margin-top: 10px;
  font-size: 0.9rem;
  color: #5f564d;
}

.map-focus-kicker {
  font-size: 0.78rem;
  font-weight: 700;
  color: #8a6b51;
  margin-bottom: 8px;
}

.budget-mix-bar {
  margin-bottom: 14px;
}

.budget-mix-track {
  display: flex;
  min-height: 58px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #ead9c8;
  background: #f7efe6;
}

.budget-mix-segment {
  position: relative;
  min-width: 56px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 10px;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
}

.budget-mix-segment span {
  text-shadow: 0 1px 2px rgba(0,0,0,0.18);
}

.budget-guide-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.budget-guide-card {
  background: linear-gradient(180deg, #fff9f4 0%, #fffdfb 100%);
  border: 1px solid #efdfcf;
  border-radius: 16px;
  padding: 14px;
}

.preset-tone {
  display: block;
  margin-top: 6px;
  color: #8a6b51;
  font-size: 0.82rem;
  font-weight: 700;
}

.budget-row {
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: center;
}

.budget-main {
  display: grid;
  gap: 10px;
}

.budget-row-bar {
  height: 10px;
  border-radius: 999px;
  background: #ece4da;
  overflow: hidden;
}

.budget-row-fill {
  height: 100%;
  border-radius: 999px;
}

.budget-buttons {
  display: grid;
  grid-template-columns: 56px 56px minmax(0, 1fr) 56px 56px;
  align-items: center;
  gap: 8px;
}

.small-step.subtle-step {
  background: #f7efe5;
  color: #6e5f54;
}

.budget-percent {
  text-align: right;
  min-width: 86px;
}

.budget-accent-bridge {
  background: linear-gradient(90deg, #6ea4d9 0%, #457ab0 100%);
}

.budget-accent-road {
  background: linear-gradient(90deg, #90b17c 0%, #65874e 100%);
}

.budget-accent-disaster {
  background: linear-gradient(90deg, #e0a866 0%, #c27a2a 100%);
}

.budget-accent-deconstruction {
  background: linear-gradient(90deg, #c987b4 0%, #9b5e86 100%);
}

.budget-accent-outreach {
  background: linear-gradient(90deg, #71c3b5 0%, #3b9385 100%);
}

.budget-accent-reserve {
  background: linear-gradient(90deg, #a8a0dd 0%, #756cb6 100%);
}

.budget-accent-chip {
  color: #fff;
  border-color: transparent;
}

@media (max-width: 1120px) {
  .map-quick-actions,
  .map-area-summary,
  .budget-guide-grid {
    grid-template-columns: 1fr 1fr;
  }

  .budget-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .map-quick-actions {
    display: flex;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .map-jump-chip {
    min-width: 220px;
    flex: 0 0 220px;
  }

  .map-area-summary,
  .budget-guide-grid {
    grid-template-columns: 1fr;
  }

  .budget-mix-track {
    min-height: 74px;
  }

  .budget-mix-segment {
    min-width: 42px;
    padding: 8px;
    font-size: 0.72rem;
  }

  .budget-row {
    grid-template-columns: 1fr !important;
  }

  .budget-buttons {
    grid-template-columns: 52px 52px minmax(0, 1fr) 52px 52px;
  }

  .budget-percent {
    text-align: left;
    min-width: 0;
  }
}
'''
if extra_css.strip() in styles_text:
    raise SystemExit('extra css already present')
styles.write_text(styles_text + extra_css)

print('UI updates applied successfully')
