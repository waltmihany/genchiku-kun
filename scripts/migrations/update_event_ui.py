from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3/src')
app_shell = root / 'legacy' / 'appShellHtml.js'
game_core = root / 'legacy' / 'gameCore.js'
styles = root / 'styles.css'

app_text = app_shell.read_text()
new_template = '''  <template id="eventTemplate">
    <section class="screen event-screen">
      <section class="card event-card">
        <div id="eventMeta" class="event-meta"></div>
        <h3 id="eventTitle"></h3>
        <p id="eventBody" class="event-body"></p>
        <div id="eventContextSummary" class="event-context-grid"></div>
        <div id="eventEffectsPreview" class="effects-preview"></div>
        <div id="eventChoices" class="choice-list"></div>
      </section>
    </section>
  </template>'''
app_text, count = re.subn(r'  <template id="eventTemplate">.*?  </template>', new_template, app_text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'event template replace failed: {count}')
app_shell.write_text(app_text)

core_text = game_core.read_text()
new_render_event = '''function renderEvent() {
  const event = gameState.pendingEvent;
  if (!event) return;

  const eventMeta = getElement("eventMeta");
  const eventTitle = getElement("eventTitle");
  const eventBody = getElement("eventBody");
  const eventContextSummary = getElement("eventContextSummary");
  const eventEffectsPreview = getElement("eventEffectsPreview");
  const choices = getElement("eventChoices");
  if (!eventMeta || !eventTitle || !eventBody || !eventContextSummary || !eventEffectsPreview || !choices) return;

  const pressureChips = [];
  if (gameState.indicators.safety < 58) pressureChips.push("安全度が低め");
  if (gameState.indicators.fiscalHealth < 52 || gameState.remainingBudget < 0) pressureChips.push("財政に余裕が少ない");
  if (gameState.indicators.rebellion > 34 || gameState.indicators.support < 62) pressureChips.push("住民感情が荒れやすい");
  if (gameState.indicators.futureBurden > 58) pressureChips.push("将来負担が重め");
  if (!pressureChips.length) pressureChips.push("全体は持ちこたえ中");

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
      return [`<span class="event-effect-chip ${effectTone(key, value)}">${metricDefs[key].label} ${formatDelta(value)}</span>`];
    });
    if (effect.regionalEffects) {
      Object.entries(effect.regionalEffects).forEach(([areaId, regional]) => {
        const parts = [];
        if (regional.satisfaction) parts.push(`満足 ${formatDelta(regional.satisfaction)}`);
        if (regional.rebellion) parts.push(`反乱 ${formatDelta(regional.rebellion)}`);
        if (parts.length) chips.push(`<span class="event-effect-chip neutral">${areaName(areaId)} ${parts.join(" / ")}</span>`);
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

  let bestIndex = 0;
  let bestScore = -Infinity;
  event.choices.forEach((choice, index) => {
    const score = balanceChoiceScore(choice);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  eventMeta.innerHTML = `
    <span class="inline-chip">${gameState.year}年目 ${MONTHS[gameState.monthIndex]}</span>
    <span class="inline-chip">イベント: ${labelEventKind(event.kind)}</span>
    <span class="inline-chip ${urgency.tone}">${urgency.label}</span>
  `;
  eventTitle.textContent = event.title;
  eventBody.textContent = event.body;

  eventContextSummary.innerHTML = `
    <div class="event-context-card">
      <strong>いま気にしたいこと</strong>
      <div class="event-context-chips">
        ${pressureChips.map((item) => `<span class="inline-chip">${item}</span>`).join("")}
      </div>
    </div>
    <div class="event-context-card">
      <strong>判断の見方</strong>
      <p>安全・財政・住民感情・将来負担のどれを優先するかで正解が変わります。数字だけでなく、今の町の空気も見て選びましょう。</p>
    </div>
  `;

  eventEffectsPreview.innerHTML = `
    <span class="tag">今月の判断が次の報告に響きます</span>
    <span class="tag">選択肢を押すと即決定</span>
    <span class="tag">色チップは増減の方向を表示</span>
  `;

  choices.innerHTML = event.choices.map((choice, index) => {
    const effect = choice.effect || {};
    const chips = buildMetricChips(effect);
    const regionalTouched = effect.regionalEffects ? Object.keys(effect.regionalEffects).map((areaId) => areaName(areaId)).join(" / ") : "町全体";
    const labelTags = [
      `<span class="choice-tone-pill">${choiceAngle(choice)}</span>`,
      `<span class="choice-note-pill">${choiceRiskNote(choice)}</span>`,
      index === bestIndex ? `<span class="choice-recommend-pill">バランス寄り</span>` : "",
    ].filter(Boolean).join("");
    return `
      <button class="choice-btn event-choice-card" data-choice="${index}">
        <div class="choice-card-head">
          <div>
            <div class="choice-index">選択肢 ${index + 1}</div>
            <strong>${choice.label}</strong>
          </div>
          <span class="inline-chip">影響: ${regionalTouched}</span>
        </div>
        <div class="choice-tag-row">${labelTags}</div>
        <div class="choice-effects-grid ${chips.length ? "" : "empty"}">
          ${chips.length ? chips.join("") : '<span class="event-effect-chip neutral">数値変化は小さめ</span>'}
        </div>
        <div class="choice-result-preview">選ぶと: ${choice.result}</div>
      </button>
    `;
  }).join("");

  choices.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => applyEventChoice(Number(button.dataset.choice)));
  });
}'''
core_text, count = re.subn(r'function renderEvent\(\) \{.*?\n\}\n\nfunction labelEventKind', new_render_event + '\n\nfunction labelEventKind', core_text, count=1, flags=re.S)
if count != 1:
    raise SystemExit(f'renderEvent replace failed: {count}')
game_core.write_text(core_text)

styles_text = styles.read_text()
extra_css = '''

.event-screen {
  display: grid;
  gap: 18px;
}

.event-card {
  display: grid;
  gap: 14px;
}

.event-card h3 {
  margin: 0;
  font-size: 1.5rem;
}

.event-context-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 12px;
}

.event-context-card {
  background: linear-gradient(180deg, #fff9f4 0%, #fffdfb 100%);
  border: 1px solid #efdfcf;
  border-radius: 16px;
  padding: 14px;
}

.event-context-card strong {
  display: block;
  margin-bottom: 8px;
}

.event-context-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.event-context-chips,
.choice-tag-row,
.choice-effects-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.effects-preview {
  margin-top: -2px;
}

.event-choice-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
}

.choice-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.choice-card-head strong {
  display: block;
  font-size: 1.02rem;
}

.choice-index {
  font-size: 0.8rem;
  font-weight: 700;
  color: #8a6b51;
  margin-bottom: 6px;
}

.choice-tone-pill,
.choice-note-pill,
.choice-recommend-pill,
.event-effect-chip {
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 0.85rem;
  font-weight: 700;
}

.choice-tone-pill {
  background: #f8efe5;
  color: #725946;
}

.choice-note-pill {
  background: #f4f2ef;
  color: #6c665f;
}

.choice-recommend-pill {
  background: #e7f5f1;
  color: #2d6d62;
}

.event-effect-chip.positive {
  background: #eef9f1;
  color: #2c6a42;
}

.event-effect-chip.negative {
  background: #fff1f1;
  color: #9a4f4f;
}

.event-effect-chip.neutral {
  background: #f3efe9;
  color: #6e665d;
}

.choice-result-preview {
  line-height: 1.7;
  color: #5a534d;
  background: #fffdf9;
  border: 1px solid #f1e5d8;
  border-radius: 14px;
  padding: 12px 14px;
}

@media (max-width: 1120px) {
  .event-context-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .event-screen {
    padding-bottom: 24px;
  }

  .choice-card-head {
    flex-direction: column;
  }
}
'''
if 'event-context-grid' not in styles_text:
    styles.write_text(styles_text + extra_css)

print('Event UI updates applied successfully')
