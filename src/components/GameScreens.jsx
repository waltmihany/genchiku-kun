import { useEffect, useState } from "react";

function Meter({ value, color }) {
  return (
    <div className="meter">
      <div className="meter-fill" style={{ width: `${value}%`, background: color }}></div>
    </div>
  );
}

function handleMapTargetKeyDown(event, targetId, onSelectMapTarget) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onSelectMapTarget?.(targetId);
}

export function OnboardingOverlay({ viewModel, onPrimaryAction, onSkip }) {
  if (!viewModel) return null;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle">
      <div className="onboarding-card card">
        <div className="onboarding-progress">初回ガイド {viewModel.progress}/{viewModel.totalSteps}</div>
        <h3 id="onboardingTitle">{viewModel.title}</h3>
        <p className="onboarding-lead">{viewModel.lead}</p>
        <div className="onboarding-bullets">
          {viewModel.bullets.map((item) => (
            <div key={item} className="onboarding-bullet">
              <span>•</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
        <div className="onboarding-tip-row">
          {viewModel.tips.map((tip) => (
            <span key={tip} className="inline-chip">{tip}</span>
          ))}
        </div>
        <div className="onboarding-actions">
          <button type="button" className="ghost-btn" onClick={onSkip}>{viewModel.secondaryLabel}</button>
          <button type="button" className="primary-btn" onClick={onPrimaryAction}>{viewModel.primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}

function DashboardMapSection({ map, onSelectMapTarget }) {
  if (!map) return null;

  return (
    <section className="card map-card">
      <div className="section-head">
        <h3>町のマップ</h3>
        <span className="hint">火種をタップすると、状態と影響を下で確認できます</span>
      </div>

      <div className="map-quick-actions">
        {map.quickActions.map((action) => (
          <button
            key={action.key}
            type="button"
            className={`map-jump-chip ${action.active ? "active" : ""}`}
            onClick={() => onSelectMapTarget?.(action.targetId)}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="map-area-summary">
        {map.areaCards.map((area) => (
          <button
            key={area.areaId}
            type="button"
            className={`map-area-card ${area.active ? "active" : ""}`}
            onClick={() => onSelectMapTarget?.(area.targetId)}
          >
            <div className="map-area-card-head">
              <strong>{area.title}</strong>
              <span className={area.riskTone}>{area.riskLabel}</span>
            </div>
            <p>{area.description}</p>
            <div className="map-area-card-meta">
              {area.chips.map((chip) => (
                <span key={chip} className="inline-chip">{chip}</span>
              ))}
            </div>
            <div className="map-area-card-note">{area.issueLine}</div>
          </button>
        ))}
      </div>

      <div className="map-summary-grid">
        {map.focusCards.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`map-focus-card ${item.active ? "active" : ""}`}
            onClick={() => onSelectMapTarget?.(item.id)}
          >
            <div className="map-focus-kicker">{item.kicker}</div>
            <div className="map-focus-head">
              <strong>{item.title}</strong>
              <span className={item.tone}>{item.statusLabel}</span>
            </div>
            <p>{item.subtitle}</p>
            <div className="map-focus-meta">
              {item.chips.map((chip) => (
                <span key={chip} className="inline-chip">{chip}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="legend">
        {map.legendItems.map((item) => (
          <span key={item.key} className="legend-item">
            <span className="legend-dot" style={{ background: item.color }}></span>
            {item.label}
          </span>
        ))}
        {map.legendChips.map((chip) => (
          <span key={chip} className="inline-chip">{chip}</span>
        ))}
      </div>

      <div className="map-scroll-shell">
        <div className="simple-map">
          {map.areas.map((area) => (
            <div key={`${area.id}-area`} className="map-area" style={area.areaStyle}></div>
          ))}
          {map.areas.map((area) => (
            <div key={`${area.id}-label`} className="map-label" style={area.labelStyle}>{area.name}</div>
          ))}
          {map.rivers.map((river) => (
            <div key={river.id} className="map-river" style={river.style}></div>
          ))}
          {map.roads.flatMap((road) => {
            const activeClass = road.active ? "active-target" : "";
            return [
              <div
                key={`${road.id}-body`}
                role="button"
                tabIndex={0}
                aria-label={`${road.name} を選択`}
                className={`map-road ${road.roadClass} ${road.operationClass} ${activeClass}`.trim()}
                title={road.name}
                style={road.positionStyle}
                onClick={() => onSelectMapTarget?.(road.id)}
                onKeyDown={(event) => handleMapTargetKeyDown(event, road.id, onSelectMapTarget)}
              ></div>,
              <div key={`${road.id}-label`} className={`map-label ${activeClass}`.trim()} style={road.labelStyle}>{road.name}</div>,
              road.badge ? <div key={`${road.id}-badge`} className="area-temp" style={road.badge.style}>{road.badge.text}</div> : null,
            ];
          })}
          {map.bridges.flatMap((bridge) => {
            const activeClass = bridge.active ? "active-target" : "";
            return [
              <div
                key={`${bridge.id}-body`}
                role="button"
                tabIndex={0}
                aria-label={`${bridge.name} を選択`}
                className={`map-bridge ${bridge.operationClass} ${activeClass}`.trim()}
                title={bridge.name}
                style={bridge.positionStyle}
                onClick={() => onSelectMapTarget?.(bridge.id)}
                onKeyDown={(event) => handleMapTargetKeyDown(event, bridge.id, onSelectMapTarget)}
              ></div>,
              <div key={`${bridge.id}-label`} className={`map-label ${activeClass}`.trim()} style={bridge.labelStyle}>{bridge.name}</div>,
              bridge.badge ? <div key={`${bridge.id}-badge`} className="area-temp" style={bridge.badge.style}>{bridge.badge.text}</div> : null,
            ];
          })}
          {map.facilities.flatMap((facility) => [
            <div key={`${facility.id}-icon`} className="map-facility" style={facility.iconStyle}>{facility.icon}</div>,
            <div key={`${facility.id}-label`} className="map-label" style={facility.labelStyle}>{facility.name}</div>,
          ])}
        </div>
      </div>

      {map.inspector ? (
        <div className="map-inspector">
          <div className="map-inspector-head">
            <div>
              <h4>{map.inspector.title}</h4>
              <p>{map.inspector.subtitle}</p>
            </div>
            <span className="inline-chip">{map.inspector.operationLabel}</span>
          </div>
          <div className="map-detail-grid">
            {map.inspector.metrics.map((metric) => (
              <div key={metric.key} className="metric-box">
                <h4>{metric.label}</h4>
                <div className="metric-row">
                  <strong className="metric-value">{metric.value}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="map-inspector-tags">
            {map.inspector.tags.map((tag) => (
              <span key={tag} className="inline-chip">{tag}</span>
            ))}
          </div>
          <div className="callout">
            <strong>判断ヒント</strong>
            <p>{map.inspector.recommendation}</p>
            <p>{map.inspector.projectLine}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DashboardScreenShell({ viewModel, onPrimaryAction, onSelectMapTarget }) {
  return (
    <section className="screen dashboard-screen">
      <div className="dashboard-grid">
        <div className="left-column">
          <section className="card status-card">
            <div className="status-header">
              <div className="status-title">
                <h2>{viewModel.yearLabel}</h2>
                <p>{viewModel.subtitle}</p>
              </div>
              <div className="title-points">
                {viewModel.chips.map((chip) => (
                  <span key={chip}>{chip}</span>
                ))}
              </div>
            </div>
            <div className="stat-grid">
              {viewModel.stats.map((stat) => (
                <div key={stat.key} className="stat-box">
                  <h4>{stat.label}</h4>
                  <div className="stat-value-row">
                    <span className="stat-value">{stat.value}</span>
                    <span className={stat.tone}>{stat.stateLabel}</span>
                  </div>
                  <Meter value={stat.meterValue} color={stat.meterColor} />
                </div>
              ))}
            </div>
          </section>

          <section className="card region-card">
            <div className="section-head">
              <h3>地域の空気</h3>
              <span className="hint">町全体は持っていても、地区だけキレることがあります</span>
            </div>
            <div className="region-grid">
              {viewModel.regions.map((region) => (
                <div key={region.areaId} className="region-box">
                  <div className="region-head">
                    <h4>{region.name}</h4>
                    <span className={`region-score ${region.tone}`}>{region.freeze ? "凍結" : region.satisfactionState}</span>
                  </div>
                  <div className="metric-row">
                    <span>満足度</span>
                    <strong className="metric-value">{region.satisfaction}</strong>
                  </div>
                  <Meter value={region.satisfaction} color={region.satisfactionColor} />
                  <div className="metric-row" style={{ marginTop: 10 }}>
                    <span>反乱</span>
                    <strong className="metric-value">{region.rebellion}</strong>
                  </div>
                  <Meter value={region.rebellion} color={region.rebellionColor} />
                  <p>{region.note}</p>
                  <div className="region-meta">
                    <span className="inline-chip">空気: {region.rebellionState}</span>
                    <span className="inline-chip">平均状態 {region.avgCondition}</span>
                    <span className="inline-chip">将来負担 {region.avgBurden}</span>
                    <span className="inline-chip">姿勢 {region.toneLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <DashboardMapSection map={viewModel.map} onSelectMapTarget={onSelectMapTarget} />
        </div>

        <div className="right-column">
          <section className="card message-card">
            <div className="section-head">
              <h3>運営メモ</h3>
              <span className="hint">状況の要約</span>
            </div>
            <div className="summary-message">
              <div className="summary-chips">
                {viewModel.summaryChips.map((chip) => (
                  <span key={chip} className="inline-chip">{chip}</span>
                ))}
              </div>
              <p>{viewModel.summaryMessage}</p>
              {viewModel.lastChoiceResult ? <div className="toast">{viewModel.lastChoiceResult}</div> : null}
            </div>
          </section>

          <section className="card next-step-card">
            <div className="section-head">
              <h3>つぎの行動</h3>
              <span className="hint">モバイルでは下部の固定ボタンからも進めます</span>
            </div>
            <div className="action-stack">
              <div className="callout">{viewModel.actionText}</div>
              <button className="primary-btn" onClick={onPrimaryAction}>{viewModel.primaryActionLabel}</button>
            </div>
          </section>

          <section className="card deconstruction-card">
            <div className="section-head">
              <h3>減築・撤去の進捗</h3>
              <span className="hint">CPUが対象を選んで進めます</span>
            </div>
            <div className="deconstruction-list">
              {viewModel.deconstructionItems.map((item) => (
                <div key={item.id} className="deconstruction-item">
                  <h4>{item.actionLabel}</h4>
                  <p>{item.meta}</p>
                  <div className="progress-row">
                    <span className={item.tone}>{item.statusLabel}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progress}%` }}></div></div>
                  <p>{item.scoreLine}</p>
                  <p><strong>CPU選定理由:</strong> {item.cpuReason}</p>
                  <p><strong>効果見込み:</strong> {item.expectedEffectNote}</p>
                  <p><strong>地域リスク:</strong> {item.riskLine}</p>
                  <p>{item.lastNote}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card staff-strip-card">
            <div className="section-head">
              <h3>スタッフひとこと</h3>
            </div>
            <div className="staff-strip">
              {viewModel.staffItems.map((item) => (
                <div key={item.key} className="staff-comment">
                  <strong>{item.label}</strong>
                  <span>{item.comment}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="mobile-sticky-action-bar screen-only-mobile">
        <div className="sticky-action-inner">
          <div>
            <strong>次の操作</strong>
            <div className="sticky-subtext">{viewModel.stickySubtext}</div>
          </div>
          <button className="primary-btn" onClick={onPrimaryAction}>{viewModel.stickyActionLabel}</button>
        </div>
      </div>
    </section>
  );
}

export function BudgetScreenShell({ viewModel, onSelectPreset, onAutoBalance, onApplyPlan, onStep, onSetValue }) {
  const [showCarryover, setShowCarryover] = useState(Boolean(viewModel.carryover));
  const [showNotes, setShowNotes] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [expandedRow, setExpandedRow] = useState(viewModel.rows[0]?.key || null);
  const leadingNote = viewModel.noteItems?.[0] || "バランス型を土台に、気になる項目だけ少し動かすと崩れにくいです。";

  return (
    <section className="screen budget-screen">
      <section className="card">
        <div className="section-head">
          <h3>来年度予算配分</h3>
          <span className="hint">合計は自動で100%に調整されます</span>
        </div>

        <div className="budget-status">
          <div className="budget-status-top">
            <strong>現在の合計: {viewModel.total}%</strong>
            <span className={`inline-chip ${viewModel.total === 100 ? "positive" : "negative"}`}>
              {viewModel.total === 100 ? "そのまま進めます" : "100%に整えてから進行"}
            </span>
          </div>
          <p className="budget-status-lead">
            年度 {viewModel.year} は <strong>{viewModel.recommendedPresetLabel}</strong> を土台に、気になる項目だけ微調整するのが基本です。
          </p>
          <div className="budget-chip-row">
            <span className="inline-chip">{viewModel.dramaSubtitle}</span>
            <span className="inline-chip">{viewModel.activePresetLabel ? `選択中: ${viewModel.activePresetLabel}` : "手動配分"}</span>
            <span className="inline-chip">おすすめ: {viewModel.recommendedPresetLabel}</span>
            <span className="inline-chip">いまの型: {viewModel.activePresetVoice}</span>
          </div>
          <div className="budget-priority-card">
            <strong>まずやること</strong>
            <p className="budget-recommend">CPUの見立て: {viewModel.recommendedReason}</p>
            <p>{viewModel.presetSummary}</p>
          </div>
          <p className="budget-touch-hint">迷ったら <strong>おすすめプリセット</strong> → <strong>±1 / ±5</strong> で1〜2項目だけ動かす → <strong>この配分で進む</strong> の順で十分です。</p>
          {viewModel.carryover ? (
            <div className="budget-collapsible-card">
              <div className="budget-section-head compact">
                <strong>前年度からの返り</strong>
                <button className="ghost-btn budget-toggle-btn" onClick={() => setShowCarryover((value) => !value)}>
                  {showCarryover ? "たたむ" : "開く"}
                </button>
              </div>
              {showCarryover ? (
                <div className="budget-carryover-box">
                  <p>{viewModel.carryover.text}</p>
                  <div className="budget-carryover-chips">
                    {viewModel.carryover.signals.map((item) => (
                      <span key={item.key} className={`inline-chip ${item.tone}`}>{item.label}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="budget-collapsed-preview">前年度の反省点と持ち越しだけを確認できます。</div>
              )}
            </div>
          ) : null}
        </div>

        <div className="budget-overview">
          <div className="budget-overview-grid">
            {viewModel.overviewCards.map((item) => (
              <div key={item.key} className="metric-box">
                <h4>{item.label}</h4>
                <div className="metric-row">
                  <strong className="metric-value">{item.value}</strong>
                  <span className={item.tone}>{item.state}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="budget-overview-notes">
            <div className="budget-section-head">
              <strong>{viewModel.warningMode ? "この配分の注意点" : "この配分の良いところ"}</strong>
              <button className="ghost-btn budget-toggle-btn" onClick={() => setShowNotes((value) => !value)}>
                {showNotes ? "一覧を閉じる" : "一覧を見る"}
              </button>
            </div>
            {showNotes ? (
              <div className={`callout ${viewModel.warningMode ? "warning-box budget-warning-box" : "budget-good-box"}`}>
                <ul className="budget-note-list">
                  {viewModel.noteItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="budget-collapsed-preview">{leadingNote}</div>
            )}
          </div>
        </div>

        <div className="budget-mix-bar">
          <div className="budget-mix-track">
            {viewModel.mixSegments.map((segment) => (
              <div key={segment.key} className={`budget-mix-segment budget-accent-${segment.key}`} style={{ width: `${segment.value}%` }}>
                <span>{segment.label} {segment.value}%</span>
              </div>
            ))}
          </div>
          <div className="budget-mix-legend">
            {viewModel.mixSegments.map((segment) => (
              <span key={segment.key} className={`inline-chip budget-accent-chip budget-accent-${segment.key}`}>
                {segment.label} {segment.value}%
              </span>
            ))}
          </div>
        </div>

        <div className="budget-guide-section">
          <div className="budget-section-head">
            <strong>配分の見方</strong>
            <button className="ghost-btn budget-toggle-btn" onClick={() => setShowGuide((value) => !value)}>
              {showGuide ? "ガイドを閉じる" : "ガイドを見る"}
            </button>
          </div>
          {showGuide ? (
            <div className="budget-guide-grid">
              {viewModel.guideCards.map((item) => (
                <div key={item.key} className="budget-guide-card">
                  <div className="budget-guide-head">
                    <strong>{item.label}</strong>
                    <span className={item.tone}>{item.value}</span>
                  </div>
                  <p>{item.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="budget-guide-preview">
              {viewModel.guideCards.slice(0, 3).map((item) => (
                <span key={item.key} className={`inline-chip ${item.tone}`}>{item.label} {item.value}</span>
              ))}
            </div>
          )}
        </div>

        <div className="preset-row">
          {viewModel.presets.map((preset) => (
            <button
              key={preset.key}
              className={`preset-btn ${preset.active ? "active" : ""} ${preset.recommended ? "recommended" : ""}`}
              onClick={() => onSelectPreset(preset.key)}
            >
              <div className="preset-head">
                <strong>{preset.label}</strong>
                {preset.recommended ? <span className="tag">おすすめ</span> : null}
              </div>
              <span className="preset-tone">{preset.voice}</span>
              <span>{preset.summary}</span>
            </button>
          ))}
        </div>

        <div className="budget-controls">
          {viewModel.rows.map((row) => {
            const isExpanded = expandedRow === row.key;
            return (
              <div key={row.key} className={`budget-row budget-row-${row.key} ${isExpanded ? "expanded" : "collapsed"}`}>
                <div className="budget-main">
                  <div className="budget-row-topline">
                    <div className="budget-row-head">
                      <div className="budget-label">
                        <strong>{row.label}</strong>
                        {isExpanded ? <span>{row.description}</span> : null}
                      </div>
                      <div className="budget-percent"><strong>{row.value}%</strong><span>{row.amountLabel}</span></div>
                    </div>
                    <button
                      className="ghost-btn budget-detail-toggle"
                      onClick={() => setExpandedRow(isExpanded ? null : row.key)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "詳細を閉じる" : "詳細を見る"}
                    </button>
                  </div>
                  <div className="budget-row-summary">
                    <span className="inline-chip">{row.roleLabel}</span>
                    <span className={`inline-chip ${row.deltaTone}`}>バランス型比 {row.deltaText}</span>
                  </div>
                  {isExpanded ? (
                    <>
                      <div className="budget-row-meta">
                        <span className="inline-chip">{row.roleLabel}</span>
                        <span className="inline-chip">年額 {row.amountLabel}</span>
                        <span className={`inline-chip ${row.deltaTone}`}>バランス型比 {row.deltaText}</span>
                      </div>
                      <div className="budget-row-hint">{row.hint}</div>
                    </>
                  ) : (
                    <div className="budget-row-collapsed-hint">{row.hint}</div>
                  )}
                  <div className="budget-row-bar"><div className={`budget-row-fill budget-accent-${row.key}`} style={{ width: `${row.value}%` }}></div></div>
                </div>
                <div className="budget-buttons">
                  <button className="small-step subtle-step" onClick={() => onStep(row.key, -5)}>-5</button>
                  <button className="small-step" onClick={() => onStep(row.key, -1)}>-1</button>
                  <input className="budget-slider" type="range" min="0" max="100" step="1" value={row.value} onChange={(event) => onSetValue(row.key, event.target.value)} />
                  <button className="small-step" onClick={() => onStep(row.key, 1)}>+1</button>
                  <button className="small-step subtle-step" onClick={() => onStep(row.key, 5)}>+5</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="budget-footer">
          <button className="ghost-btn" onClick={onAutoBalance}>バランス型に戻す</button>
          <button className="primary-btn" onClick={onApplyPlan}>この配分で進む</button>
        </div>
      </section>
      <div className="mobile-sticky-action-bar screen-only-mobile">
        <div className="sticky-action-inner double-action">
          <button className="ghost-btn" onClick={onAutoBalance}>バランス型に戻す</button>
          <button className="primary-btn" onClick={onApplyPlan}>この配分で進む</button>
        </div>
      </div>
    </section>
  );
}

export function ReportScreenShell({ viewModel, onSelectEntry, onOpenBudget }) {
  const [showSummary, setShowSummary] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showCausal, setShowCausal] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [showFacts, setShowFacts] = useState(true);
  const [showBias, setShowBias] = useState(false);

  if (!viewModel.selected) {
    return (
      <section className="screen report-screen">
        <div className="report-grid">
          <section className="card report-list-card">
            <div className="section-head">
              <h3>年度末レポート</h3>
              <span className="hint">担当の性格込みで読み解く</span>
            </div>
            <div className="empty-detail">レポートがまだありません。</div>
          </section>
          <section className="card report-detail-card">
            <div className="report-detail empty-detail">左の報告を選ぶと、観測事実と担当者の主張が表示されます。</div>
          </section>
        </div>
      </section>
    );
  }

  const selected = viewModel.selected;
  const firstQuickCard = selected.quickSummary?.[0] || null;

  return (
    <section className="screen report-screen">
      <div className="report-grid">
        <section className="card report-list-card">
          <div className="section-head">
            <h3>年度末レポート</h3>
            <span className="hint">担当の性格込みで読み解く</span>
          </div>

          <div className="report-mobile-focus-card">
            <strong>まず見る結論</strong>
            <p>{selected.recommendation}</p>
            <div className="report-mobile-focus-chips">
              <span className={`report-priority-pill ${selected.priority.tone}`}>{selected.priority.label}</span>
              <span className="inline-chip">影響: {selected.impactArea}</span>
              {firstQuickCard ? <span className="inline-chip">要点: {firstQuickCard.title}</span> : null}
            </div>
          </div>

          <div className="report-section-head">
            <strong>全体サマリー</strong>
            <button className="ghost-btn report-toggle-btn" onClick={() => setShowSummary((value) => !value)}>
              {showSummary ? "閉じる" : "開く"}
            </button>
          </div>
          {showSummary ? (
            <div className="report-summary-bar">
              {viewModel.summaries.map((item) => (
                <div key={item.key} className="report-summary-card">
                  <strong>{item.title}</strong>
                  <div className="report-summary-main">{item.main}</div>
                  <div className="report-summary-sub">{item.sub}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="report-collapsed-preview">今年の最優先項目・重要項目・不穏な地区をまとめて確認できます。</div>
          )}

          <div className="report-section-head compact-top">
            <strong>読み方ガイド</strong>
            <button className="ghost-btn report-toggle-btn" onClick={() => setShowGuide((value) => !value)}>
              {showGuide ? "閉じる" : "開く"}
            </button>
          </div>
          {showGuide ? (
            <div className="report-reading-guide">
              {viewModel.guides.map((item) => (
                <div key={item.key} className={`report-guide-card ${item.accent ? "accent" : ""}`}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="report-collapsed-preview">読む順と、この年のレポートの見方だけを短く確認できます。</div>
          )}

          <div className="report-section-head compact-top">
            <strong>今年の因果</strong>
            <button className="ghost-btn report-toggle-btn" onClick={() => setShowCausal((value) => !value)}>
              {showCausal ? "閉じる" : "開く"}
            </button>
          </div>
          {showCausal ? (
            <div className="report-causal-map">
              {viewModel.causalColumns.map((column) => (
                <div key={column.key} className="report-causal-column">
                  <div className="report-causal-head">{column.head}</div>
                  <div className="report-causal-main">{column.main}</div>
                  <div className="report-causal-list">
                    {column.items.map((item, index) => (
                      <div key={`${column.key}-${index}`} className={`report-causal-item ${item.tone}`}>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                        {item.chips?.length ? (
                          <div className="report-causal-chip-row">
                            {item.chips.map((chip) => (
                              <span key={chip} className="inline-chip">{chip}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="report-collapsed-preview">配分 → 起きたこと → 年末の結果、の流れを必要なときだけ展開できます。</div>
          )}

          <div className="report-section-head compact-top">
            <strong>個別レポート一覧</strong>
            <span className="hint">気になる項目を選ぶと右側が切り替わります</span>
          </div>
          <div className="report-list">
            {viewModel.entries.map((entry) => (
              <button
                key={entry.id}
                className={`report-item report-item-enhanced ${entry.active ? "active" : ""}`}
                onClick={() => onSelectEntry(entry.id)}
              >
                <div className="report-item-topline">
                  <span className="report-order-badge">読む順 {entry.order}</span>
                  <span className={`report-priority-pill ${entry.priority.tone}`}>{entry.priority.label}</span>
                </div>
                <h4>{entry.icon} {entry.category} / {entry.title}</h4>
                <span>事実: {entry.factHeadline}</span>
                <div className="report-item-meta-chips">
                  <span className="inline-chip">重要度 {entry.importance}</span>
                  <span className="inline-chip">緊急度 {entry.urgency}</span>
                  <span className="inline-chip">影響 {entry.impactArea}</span>
                  <span className="inline-chip">読み方 {entry.biasLabel}</span>
                </div>
                <p>{entry.quickLine}</p>
              </button>
            ))}
          </div>

          <div className="report-footer">
            <button className="primary-btn" onClick={onOpenBudget}>来年度予算を決める</button>
          </div>
        </section>

        <section className="card report-detail-card">
          <div className="report-detail">
            <div className="report-action-hero">
              <strong>来年度で迷ったら</strong>
              <p>{selected.recommendation}</p>
              <div className="report-mobile-focus-chips">
                <span className={`report-priority-pill ${selected.priority.tone}`}>{selected.priority.label}</span>
                <span className="inline-chip">影響: {selected.impactArea}</span>
                <span className="inline-chip">担当: {selected.staffName}</span>
              </div>
            </div>

            <div className="report-detail-hero">
              <div>
                <div className="report-detail-kicker">{selected.icon} {selected.category}レポート</div>
                <h3>{selected.title}</h3>
                <p><strong>{selected.staffName}</strong>（{selected.staffRole}）: {selected.staffTone}</p>
              </div>
              <div className="report-detail-pill-stack">
                <span className={`report-priority-pill ${selected.priority.tone}`}>{selected.priority.label}</span>
                <span className="inline-chip">影響: {selected.impactArea}</span>
              </div>
            </div>

            <div className="report-highlight-grid">
              <div className="report-highlight-card emphasis">
                <strong>ひとことで言うと</strong>
                <p>{selected.summary}</p>
              </div>
              <div className="report-highlight-card">
                <strong>今の読み筋</strong>
                <p>{selected.quickLine}</p>
              </div>
            </div>

            <div className="report-meta-grid">
              {selected.metaCards.map((card) => (
                <div key={card.key} className="metric-box">
                  <h4>{card.label}</h4>
                  <div className="metric-row">
                    {card.key === "bias" ? <span className="inline-chip">{card.value}</span> : <strong className="metric-value">{card.value}</strong>}
                    {card.state ? <span className={card.tone}>{card.state}</span> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="report-detail-section">
              <div className="report-section-head compact-top">
                <strong>配分から結果までの流れ</strong>
                <button className="ghost-btn report-toggle-btn" onClick={() => setShowTrace((value) => !value)}>
                  {showTrace ? "閉じる" : "開く"}
                </button>
              </div>
              {showTrace ? (
                <div className="report-cause-trace">
                  <div className="report-cause-card">
                    <strong>このレポートにつながった配分</strong>
                    {selected.causeTrace.budget.map((item, index) => (
                      <div key={`budget-${index}`} className="report-cause-line">
                        <span className={`inline-chip ${item.tone}`}>{item.badge}</span>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="report-cause-card">
                    <strong>途中で効いた判断</strong>
                    {selected.causeTrace.events.map((item, index) => (
                      <div key={`events-${index}`} className="report-cause-line">
                        <span className={`inline-chip ${item.tone}`}>{item.badge}</span>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="report-cause-card">
                    <strong>年末に残った返り</strong>
                    {selected.causeTrace.outcomes.map((item, index) => (
                      <div key={`outcomes-${index}`} className="report-cause-line">
                        <span className={`inline-chip ${item.tone}`}>{item.badge}</span>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="report-collapsed-preview">配分・判断・年末の返りを、必要になったときだけ開いて確認できます。</div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-head compact-top">
                <strong>補足メモ</strong>
                <button className="ghost-btn report-toggle-btn" onClick={() => setShowQuickSummary((value) => !value)}>
                  {showQuickSummary ? "閉じる" : "開く"}
                </button>
              </div>
              {showQuickSummary ? (
                <div className="report-quick-summary">
                  {selected.quickSummary.map((item) => (
                    <div key={item.key} className="report-quick-card">
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="report-collapsed-preview">観測事実・読み方・次の注意点を短いカードで確認できます。</div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-head compact-top">
                <strong>観測された事実</strong>
                <button className="ghost-btn report-toggle-btn" onClick={() => setShowFacts((value) => !value)}>
                  {showFacts ? "閉じる" : "開く"}
                </button>
              </div>
              {showFacts ? (
                <div className="callout report-section fact-section">
                  <p>この担当が見ている数字と現場状況です。まずはここを基準に判断します。</p>
                  <ul>{selected.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
                </div>
              ) : (
                <div className="report-collapsed-preview">事実ベースの数字と現場状況だけを確認できます。</div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-head compact-top">
                <strong>担当者の見え方</strong>
                <button className="ghost-btn report-toggle-btn" onClick={() => setShowBias((value) => !value)}>
                  {showBias ? "閉じる" : "開く"}
                </button>
              </div>
              {showBias ? (
                <div className="callout report-section bias-section">
                  <p>{selected.biasSummary}</p>
                  <ul>{selected.biasBullets.map((fact) => <li key={fact}>{fact}</li>)}</ul>
                  <p><strong>読み解きメモ:</strong> {selected.readingTip}</p>
                </div>
              ) : (
                <div className="report-collapsed-preview">この担当がどの数字を重く見がちか、必要なときだけ開いて読めます。</div>
              )}
            </div>

            <div className="callout report-section action-section">
              <strong>来年度予算への落とし込み</strong>
              <p>{selected.recommendation}</p>
            </div>
          </div>
        </section>
      </div>
      <div className="mobile-sticky-action-bar screen-only-mobile">
        <div className="sticky-action-inner">
          <div>
            <strong>レポート確認後の操作</strong>
            <div className="sticky-subtext">来年度予算の調整へ進みます</div>
          </div>
          <button className="primary-btn" onClick={onOpenBudget}>来年度予算を決める</button>
        </div>
      </div>
    </section>
  );
}

export function ResultScreenShell({ viewModel, onRestart, onReviewReport }) {
  const [showFlow, setShowFlow] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  return (
    <section className="screen result-screen card">
      <div className="result-body">
        <div className={`result-shell ${viewModel.toneClass}`}>
          <section className={`result-hero ${viewModel.toneClass}`}>
            <span className="result-badge">{viewModel.badge}</span>
            <h2>{viewModel.headline}</h2>
            <p className="result-lead">{viewModel.lead}</p>
            <p className="result-closing">{viewModel.closing}</p>
          </section>

          <section className={`result-mobile-focus-card ${viewModel.toneClass}`}>
            <strong>結論を先に</strong>
            <p>{viewModel.focusSummary}</p>
            <div className="result-focus-chips">
              {viewModel.focusChips.map((item) => (
                <span key={item} className="inline-chip">{item}</span>
              ))}
            </div>
          </section>

          <section className={`result-action-hero ${viewModel.toneClass}`}>
            <strong>{viewModel.isClear ? "次に伸ばす一手" : "次にやる一手"}</strong>
            <p>{viewModel.actionLead}</p>
            <div className="result-next-step-list">
              {viewModel.nextSteps.map((item, index) => (
                <div key={`${item.title}-${index}`} className={`result-next-step-item ${item.tone || "neutral"}`}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="result-metrics">
            {viewModel.metricCards.map((item) => (
              <article key={item.key} className={`result-metric-card ${item.tone}`}>
                <p className="eyebrow">{item.label}</p>
                <strong>{item.value}{item.suffix}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </section>

          <section className="result-section-grid">
            <article className="result-section-card">
              <div className="section-heading">
                <h3>{viewModel.sectionTitle}</h3>
                <span className={`inline-chip ${viewModel.isClear ? "positive" : "negative"}`}>{viewModel.budgetLabel}</span>
              </div>
              <div className="result-review-list">
                {viewModel.mainFactors.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`result-review-item ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="result-section-card">
              <div className="section-heading">
                <h3>{viewModel.secondaryTitle}</h3>
                <span className="inline-chip neutral">次回の見どころ</span>
              </div>
              <div className="result-review-list">
                {viewModel.subFactors.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={`result-review-item ${item.tone}`}>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className={`result-collapsible-card ${showFlow ? "expanded" : "collapsed"}`} data-result-section="flow">
            <div className="result-section-head">
              <div>
                <h3>最後の年の因果フロー</h3>
                <p className="result-section-subtext">配分 → 判断 → 年末結果</p>
              </div>
              <button type="button" className="ghost-btn result-toggle-btn" aria-expanded={showFlow} onClick={() => setShowFlow((value) => !value)}>
                {showFlow ? "閉じる" : "詳細を見る"}
              </button>
            </div>
            <div className="result-collapsed-preview">{viewModel.flowPreview}</div>
            <div className="result-collapsible-body">
              <div className="result-flow-grid">
                <article className="result-flow-step">
                  <p className="eyebrow">配分のクセ</p>
                  <ul>
                    {viewModel.budgetFocusItems.map((item, index) => (
                      <li key={`${item.label}-${index}`}>
                        <span className={`inline-chip ${item.tone}`}>{item.label}</span>
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </article>
                <article className="result-flow-step">
                  <p className="eyebrow">強く効いた出来事</p>
                  <ul>
                    {viewModel.eventHighlights.length ? viewModel.eventHighlights.map((item, index) => (
                      <li key={`${item.title}-${index}`}>
                        <strong>{item.month} / {item.title}</strong>
                        <p>{item.choiceLabel}</p>
                        <div className="event-effect-row">
                          {(item.signals || []).slice(0, 3).map((signal) => (
                            <span key={signal} className="inline-chip neutral">{signal}</span>
                          ))}
                        </div>
                      </li>
                    )) : <li><p>大きなイベントより、毎月の維持と説明の積み重ねが中心でした。</p></li>}
                  </ul>
                </article>
                <article className="result-flow-step">
                  <p className="eyebrow">年末に残った数字</p>
                  <ul>
                    {viewModel.outcomeSignals.map((item, index) => (
                      <li key={`${item.label}-${index}`}>
                        <span className={`inline-chip ${item.tone}`}>{item.label}</span>
                        <p>{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>

          <section className={`result-collapsible-card ${showDiagnosis ? "expanded" : "collapsed"}`} data-result-section="diagnosis">
            <div className="result-section-head">
              <div>
                <h3>地区とインフラの診断</h3>
                <p className="result-section-subtext">次回の監視対象をまとめて確認</p>
              </div>
              <button type="button" className="ghost-btn result-toggle-btn" aria-expanded={showDiagnosis} onClick={() => setShowDiagnosis((value) => !value)}>
                {showDiagnosis ? "閉じる" : "詳細を見る"}
              </button>
            </div>
            <div className="result-collapsed-preview">{viewModel.diagnosisPreview}</div>
            <div className="result-collapsible-body">
              <div className="result-section-grid spotlight">
                <article className="result-section-card">
                  <div className="section-heading">
                    <h3>地区の温度差</h3>
                    <span className="inline-chip neutral">満足 / 反発</span>
                  </div>
                  <div className="result-region-list">
                    {viewModel.regions.map((region) => (
                      <div key={region.areaId} className={`result-region-item ${region.rebellion >= 55 ? "negative" : region.rebellion >= 35 ? "neutral" : "positive"}`}>
                        <strong>{region.name}</strong>
                        <span>満足 {region.satisfaction}</span>
                        <span>反発 {region.rebellion}</span>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="result-section-card">
                  <div className="section-heading">
                    <h3>傷みが残ったインフラ</h3>
                    <span className="inline-chip neutral">要監視トップ3</span>
                  </div>
                  <div className="result-infra-list">
                    {viewModel.weakestInfra.length ? viewModel.weakestInfra.map((item) => (
                      <div key={item.id} className={`result-infra-item ${item.condition <= 25 ? "negative" : item.condition <= 45 ? "neutral" : "positive"}`}>
                        <strong>{item.name}</strong>
                        <p>{item.area} / {item.kind}</p>
                        <span>状態 {item.condition} ・ 維持負担 {item.burden}</span>
                      </div>
                    )) : <p className="empty-detail">大きく傷んだインフラはありません。</p>}
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="result-actions">
        {viewModel.hasReport ? <button id="reviewResultBtn" className="ghost-btn" onClick={onReviewReport}>最後の年度末レポートを見る</button> : <div />}
        <button id="restartResultBtn" className="primary-btn" onClick={onRestart}>もう一度遊ぶ</button>
      </div>
    </section>
  );
}

export function EventScreenShell({ viewModel, onChoose }) {
  const [expandedIndex, setExpandedIndex] = useState(viewModel?.recommendedIndex ?? 0);

  useEffect(() => {
    setExpandedIndex(viewModel?.recommendedIndex ?? 0);
  }, [viewModel?.eventKey, viewModel?.recommendedIndex]);

  if (!viewModel) {
    return (
      <section className="screen event-screen">
        <section className="card event-card">
          <div className="empty-detail">イベントは発生していません。</div>
        </section>
      </section>
    );
  }

  return (
    <section className="screen event-screen">
      <section className="card event-card">
        <div className="event-meta">
          {viewModel.metaChips.map((chip) => (
            <span key={chip.label} className={`inline-chip ${chip.tone || ""}`.trim()}>{chip.label}</span>
          ))}
        </div>
        <h3>{viewModel.title}</h3>
        <p className="event-body">{viewModel.body}</p>

        <div className="event-context-grid">
          {viewModel.contextCards.map((card) => (
            <div key={card.title} className={`event-context-card ${card.focus ? "event-mobile-focus-card" : ""}`.trim()}>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
              {card.chips?.length ? (
                <div className="event-context-chips" style={{ marginTop: 10 }}>
                  {card.chips.map((chip) => (
                    <span key={`${card.title}-${chip}`} className="inline-chip">{chip}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="effects-preview">
          <div className="event-inline-guide">
            {viewModel.guideTags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="choice-list">
          {viewModel.choices.map((choice) => {
            const isExpanded = expandedIndex === choice.index;
            return (
              <article key={choice.index} className={`choice-btn event-choice-card ${isExpanded ? "expanded" : "collapsed"} ${choice.recommended ? "recommended" : ""}`.trim()}>
                <button
                  type="button"
                  className="event-choice-toggle"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedIndex(isExpanded ? -1 : choice.index)}
                >
                  <div className="choice-card-head">
                    <div>
                      <div className="choice-index">選択肢 {choice.index + 1}</div>
                      <strong>{choice.label}</strong>
                    </div>
                    <div className="choice-head-side">
                      <span className="inline-chip">影響: {choice.regionalTouched}</span>
                      <span className={`inline-chip ${choice.impactTone}`}>{choice.impactLabel}</span>
                    </div>
                  </div>
                  <div className="choice-tag-row">
                    <span className="choice-tone-pill">{choice.angleLabel}</span>
                    <span className="choice-note-pill">{choice.riskLabel}</span>
                    {choice.recommended ? <span className="choice-recommend-pill">バランス寄り</span> : null}
                  </div>
                  <div className="choice-summary-row">
                    <span className="choice-summary-pill">要点</span>
                    <span className="choice-summary-text">{choice.previewText}</span>
                    <span className="event-choice-toggle-icon">{isExpanded ? "閉じる" : "詳細を見る"}</span>
                  </div>
                  <div className="choice-collapsed-preview">{choice.collapsedPreview}</div>
                </button>
                <div className="event-choice-detail">
                  <div className={`choice-effects-grid ${choice.effectChips.length ? "" : "empty"}`.trim()}>
                    {choice.effectChips.length ? choice.effectChips.map((chip) => (
                      <span key={chip.label} className={`event-effect-chip ${chip.tone}`}>{chip.label}</span>
                    )) : <span className="event-effect-chip neutral">数値変化は小さめ</span>}
                  </div>
                  <div className="choice-result-preview">選ぶと: {choice.resultText}</div>
                  <div className="event-choice-actions">
                    <button type="button" className="ghost-btn" onClick={() => setExpandedIndex(-1)}>閉じる</button>
                    <button type="button" className="primary-btn" onClick={() => onChoose(choice.index)}>この案にする</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export function TitleScreenShell({ viewModel, onStart }) {
  return (
    <section className="screen title-screen card">
      <div className="hero-grid">
        <div>
          <p className="eyebrow">{viewModel.eyebrow}</p>
          <h2>{viewModel.title}</h2>
          <p>{viewModel.description}</p>
          <div className="title-points">
            {viewModel.points.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
          <button id="startGameBtn" className="primary-btn large" onClick={onStart}>{viewModel.startLabel}</button>
        </div>
        <div className="mini-board">
          {viewModel.stats.map((item) => (
            <div key={item.title} className="mini-stat">
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

