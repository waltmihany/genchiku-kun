from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3/src')
app_shell = root / 'legacy' / 'appShellHtml.js'
game_core = root / 'legacy' / 'gameCore.js'
styles = root / 'styles.css'

app_text = app_shell.read_text()
new_template = '''  <template id="reportTemplate">
    <section class="screen report-screen">
      <div class="report-grid">
        <section class="card report-list-card">
          <div class="section-head">
            <h3>年度末レポート</h3>
            <span class="hint">担当の性格込みで読み解く</span>
          </div>
          <div id="reportSummaryBar" class="report-summary-bar"></div>
          <div id="reportReadingGuide" class="report-reading-guide"></div>
          <div id="reportList" class="report-list"></div>
          <div class="report-footer">
            <button id="openBudgetBtn" class="primary-btn">来年度予算を決める</button>
          </div>
        </section>

        <section class="card report-detail-card">
          <div id="reportDetail" class="report-detail empty-detail">
            左の報告を選ぶと、観測事実と担当者の主張が表示されます。
          </div>
        </section>
      </div>
      <div id="reportStickyFooter" class="mobile-sticky-action-bar screen-only-mobile"></div>
    </section>
  </template>'''
app_text, count = re.subn(r'  <template id="reportTemplate">.*?  </template>', new_template, app_text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'report template replace failed: {count}')
app_shell.write_text(app_text)

core_text = game_core.read_text()
new_render_report = '''function renderReport() {
  const reportSummaryBar = getElement("reportSummaryBar");
  const reportReadingGuide = getElement("reportReadingGuide");
  const reportList = getElement("reportList");
  const reportDetail = getElement("reportDetail");
  if (!reportSummaryBar || !reportReadingGuide || !reportList || !reportDetail) return;

  const entries = [...gameState.reportEntries];
  const rankedEntries = [...entries].sort((a, b) => ((b.urgency + b.importance) - (a.urgency + a.importance)));
  const selected = entries.find((entry) => entry.id === gameState.selectedReportId) || rankedEntries[0];
  const staff = staffData[selected.staffKey];
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

.report-summary-bar,
.report-reading-guide,
.report-highlight-grid,
.report-quick-summary {
  display: grid;
  gap: 10px;
}

.report-summary-bar {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
}

.report-summary-card,
.report-guide-card,
.report-highlight-card,
.report-quick-card {
  background: linear-gradient(180deg, #fff9f4 0%, #fffdfb 100%);
  border: 1px solid #efdfcf;
  border-radius: 16px;
  padding: 14px;
}

.report-summary-card strong,
.report-guide-card strong,
.report-highlight-card strong,
.report-quick-card strong,
.report-section strong {
  display: block;
  margin-bottom: 8px;
}

.report-summary-main {
  font-size: 1rem;
  font-weight: 800;
  color: #4f463f;
}

.report-summary-sub,
.report-guide-card p,
.report-highlight-card p,
.report-quick-card p,
.report-item-meta-chips + p,
.report-section p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.report-reading-guide,
.report-highlight-grid,
.report-quick-summary {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 12px;
}

.report-guide-card.accent,
.report-highlight-card.emphasis {
  background: linear-gradient(180deg, #fff2ec 0%, #fffaf6 100%);
  border-color: #f0d9cc;
}

.report-item-enhanced {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
}

.report-item-topline,
.report-item-meta-chips,
.report-detail-hero,
.report-detail-pill-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  align-items: flex-start;
}

.report-item-meta-chips {
  justify-content: flex-start;
}

.report-order-badge,
.report-priority-pill {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.report-order-badge {
  background: #f6efe6;
  color: #715947;
}

.report-priority-pill {
  background: #eef5f1;
  color: #49645b;
}

.report-priority-pill.negative {
  background: #fff1f1;
  color: #9a4f4f;
}

.report-priority-pill.neutral {
  background: #fff7ec;
  color: #8a6430;
}

.report-priority-pill.positive {
  background: #eef9f1;
  color: #2c6a42;
}

.report-detail-hero {
  margin-bottom: 12px;
}

.report-detail-kicker {
  font-size: 0.82rem;
  font-weight: 700;
  color: #8a6b51;
  margin-bottom: 6px;
}

.report-detail-hero h3 {
  margin: 0 0 8px;
}

.report-detail-pill-stack {
  justify-content: flex-end;
}

.report-section.fact-section {
  background: #fffdf9;
}

.report-section.bias-section {
  background: #fcf8ff;
  border-color: #e8def6;
}

.report-section.action-section {
  background: #f5fff8;
  border-color: #d9efe1;
}

.report-section + .report-section {
  margin-top: 12px;
}

@media (max-width: 1120px) {
  .report-summary-bar,
  .report-reading-guide,
  .report-highlight-grid,
  .report-quick-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .report-item-topline,
  .report-detail-hero {
    flex-direction: column;
  }

  .report-detail-pill-stack {
    justify-content: flex-start;
  }
}
'''
if 'report-summary-bar' not in styles_text:
    styles.write_text(styles_text + extra_css)

print('Report UI updates applied successfully')
