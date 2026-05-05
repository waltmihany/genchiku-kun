import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { mapData } from "../data/mapData.js";

/**
 * MapView
 *
 * 自治体マップを HTML/CSS で描画するコンポーネント。
 * 将来 Canvas 化する場合は、このコンポーネントを差し替えるだけで済む構造にしている。
 *
 * v5.2:
 *   - 危険上位インフラを強調（!マーク・点滅・太枠）、それ以外は控えめ
 *   - 動くドットを地区状態と連動（満足高で多め、反乱高で減・怒り、危険道路で車減）
 */

const VIEWBOX_W = 540;
const VIEWBOX_H = 360;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function statusToTone(infra) {
  if (!infra) return "neutral";
  if (infra.operationStatus === "removed") return "removed";
  if (infra.operationStatus === "restricted") return "restricted";
  if (infra.condition <= 35) return "danger";
  if (infra.condition <= 55) return "warning";
  return "safe";
}

function regionTone(region) {
  if (!region) return "neutral";
  if (region.rebellion >= 60 || region.satisfaction <= 35) return "negative";
  if (region.rebellion >= 40 || region.satisfaction <= 50) return "warning";
  return "positive";
}

function infraDisplayName(infra) {
  return infra?.name || "";
}

function buildAllMovers() {
  // 全ドット定義。表示時に地区状態でフィルタ・出し分けする。
  return [
    { id: "p-c1", kind: "person", area: "central", from: { x: 195, y: 195 }, to: { x: 320, y: 200 }, dur: 14, weight: 1 },
    { id: "p-c2", kind: "person", area: "central", from: { x: 240, y: 220 }, to: { x: 280, y: 175 }, dur: 11, weight: 2 },
    { id: "p-c3", kind: "car", area: "central", from: { x: 70, y: 212 }, to: { x: 470, y: 212 }, dur: 9, weight: 1, road: "mainRoadA" },
    { id: "p-c4", kind: "car", area: "central", from: { x: 226, y: 80 }, to: { x: 226, y: 330 }, dur: 12, weight: 2, road: "mainRoadB" },
    { id: "p-m1", kind: "person", area: "mountain", from: { x: 70, y: 110 }, to: { x: 130, y: 150 }, dur: 22, weight: 1 },
    { id: "p-r1", kind: "person", area: "river", from: { x: 380, y: 200 }, to: { x: 470, y: 250 }, dur: 18, weight: 1 },
    { id: "p-r2", kind: "car", area: "river", from: { x: 360, y: 240 }, to: { x: 460, y: 235 }, dur: 13, weight: 2 },
    { id: "p-t1", kind: "tourist", area: "tourism", from: { x: 320, y: 70 }, to: { x: 450, y: 110 }, dur: 16, weight: 1 },
    { id: "p-t2", kind: "tourist", area: "tourism", from: { x: 360, y: 100 }, to: { x: 410, y: 60 }, dur: 14, weight: 2 },
  ];
}

function pickMovers(allMovers, regions, infraById) {
  // 地区状態に応じて、出すドットを絞る・増やす
  const regionById = new Map();
  regions.forEach((r) => regionById.set(r.id, r));

  return allMovers.filter((m) => {
    const region = regionById.get(m.area);
    if (!region) return true;
    const sat = region.satisfaction || 0;
    const reb = region.rebellion || 0;

    // 反乱が高い地区: 通行人は半分（weight=1のみ）、観光客は出さない
    if (reb >= 60 && m.kind === "tourist") return false;
    if (reb >= 60 && m.kind === "person" && m.weight >= 2) return false;

    // 観光ゾーンの満足度が低い時: 観光客 weight=2 を抑制
    if (m.kind === "tourist" && sat <= 55 && m.weight >= 2) return false;

    // 走る道路が危険なら車を減らす
    if (m.kind === "car" && m.road) {
      const roadInfra = infraById.get(m.road);
      if (roadInfra && (roadInfra.condition || 0) <= 35) return false;
    }

    return true;
  });
}

export function MapView({
  regions = [],
  infrastructures = [],
  selectedId,
  onSelect,
  warnedIds = [],
  reducedMotion = false,
  pulseIds = [],
  topDangerIds = [],
  enablePan = false,
  onEmptyTap,
}) {
  const warnSet = useMemo(() => new Set(warnedIds), [warnedIds]);
  const pulseSet = useMemo(() => new Set(pulseIds), [pulseIds]);
  const topSet = useMemo(() => new Set(topDangerIds), [topDangerIds]);

  // パン用 state / ref
  const stageRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
    moved: 0,
    decided: null, // "pan" | "swipe" | null
  });
  // タップとパンを区別するため、移動量がこれ以上なら click を抑制
  const TAP_THRESHOLD_PX = 6;

  const onPointerDown = useCallback((e) => {
    if (!enablePan) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    panState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: pan.x,
      baseY: pan.y,
      moved: 0,
      decided: null,
    };
  }, [enablePan, pan.x, pan.y]);

  const onPointerMove = useCallback((e) => {
    if (!enablePan) return;
    const s = panState.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    s.moved = Math.max(s.moved, Math.max(adx, ady));

    // 初期方向判定：横で、下層スワイプより明確に横優位ならタブスワイプに譲る
    if (s.decided === null && (adx > 8 || ady > 8)) {
      // マップ内では「縦、または横でもやや控えめ」ときは pan、「わかりやすく横」のときはswipeに譲る
      if (adx > ady * 1.4 && adx > 24) {
        s.decided = "swipe";
        s.active = false; // タブ側に任せる
        return;
      }
      s.decided = "pan";
    }
    if (s.decided !== "pan") return;

    e.preventDefault?.();
    const nx = clamp(s.baseX + dx, -120, 120);
    const ny = clamp(s.baseY + dy, -80, 80);
    setPan({ x: nx, y: ny });
  }, [enablePan]);

  const onPointerUp = useCallback((e) => {
    if (!enablePan) return;
    const s = panState.current;
    if (!s.active && s.decided !== "pan") {
      s.active = false;
      s.decided = null;
      return;
    }
    s.active = false;
  }, [enablePan]);

  // 空タップ・背景タップで選択解除
  const onStageClick = useCallback((e) => {
    if (!onEmptyTap) return;
    // 移動量が大きいとタップとみなさない
    if (panState.current.moved > TAP_THRESHOLD_PX) return;
    // ボタン要素上のクリックは除外
    const tag = e.target?.tagName?.toLowerCase?.();
    const isInteractive = e.target?.closest?.("button, .mv-facility, .mv-detail-popup");
    if (isInteractive) return;
    onEmptyTap();
  }, [onEmptyTap]);

  const infraById = useMemo(() => {
    const m = new Map();
    infrastructures.forEach((i) => m.set(i.id, i));
    return m;
  }, [infrastructures]);
  const regionById = useMemo(() => {
    const m = new Map();
    regions.forEach((r) => m.set(r.id, r));
    return m;
  }, [regions]);

  const movers = useMemo(() => pickMovers(buildAllMovers(), regions, infraById), [regions, infraById]);

  // 怒りアイコンを出す地区
  const angryAreas = useMemo(() => {
    return mapData.areas
      .map((area) => {
        const region = regionById.get(area.id);
        if (region && region.rebellion >= 60) return { area, region };
        return null;
      })
      .filter(Boolean);
  }, [regionById]);

  const aspect = `${VIEWBOX_W}/${VIEWBOX_H}`;

  return (
    <div
      className={`map-view ${enablePan ? "is-pannable" : ""}`}
      style={{ aspectRatio: aspect }}
      role="img"
      aria-label="自治体マップ"
      ref={stageRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onStageClick}
    >
      <div
        className="map-view-inner"
        style={{
          width: VIEWBOX_W,
          height: VIEWBOX_H,
          transform: enablePan ? `translate(${pan.x}px, ${pan.y}px)` : undefined,
        }}
      >
        {/* 地区 */}
        {mapData.areas.map((area) => {
          const region = regionById.get(area.id);
          const tone = regionTone(region);
          return (
            <div
              key={`area-${area.id}`}
              className={`mv-area mv-area-${tone}`}
              style={{ left: area.x, top: area.y, width: area.w, height: area.h }}
              aria-hidden="true"
            >
              <span className="mv-area-name">{area.name}</span>
              {region && (
                <span className="mv-area-mood">
                  満{region.satisfaction} / 反{region.rebellion}
                </span>
              )}
            </div>
          );
        })}

        {/* 怒りアイコン（反乱が高い地区） */}
        {angryAreas.map(({ area }) => (
          <span
            key={`angry-${area.id}`}
            className="mv-angry-icon"
            style={{ left: area.x + area.w - 22, top: area.y + 4 }}
            aria-hidden="true"
            title="住民の不満が高まっています"
          >
            😡
          </span>
        ))}

        {/* 川 */}
        {mapData.rivers.map((river) => (
          <div
            key={`river-${river.id}`}
            className="mv-river"
            style={{ left: river.x, top: river.y, width: river.w, height: river.h }}
            aria-hidden="true"
          />
        ))}

        {/* 道路 */}
        {mapData.roads.map((road) => {
          const infra = infraById.get(road.id);
          const tone = statusToTone(infra);
          const isOld = road.type === "old";
          const active = selectedId === road.id;
          const warned = warnSet.has(road.id) || topSet.has(road.id);
          const isTop = topSet.has(road.id);
          const pulse = pulseSet.has(road.id);
          const dim = !isTop && !active && (tone === "safe" || tone === "removed");
          return (
            <button
              type="button"
              key={`road-${road.id}`}
              className={`mv-road mv-tone-${tone} ${isOld ? "is-old" : ""} ${active ? "is-active" : ""} ${warned ? "is-warned" : ""} ${isTop ? "is-top-danger" : ""} ${pulse ? "is-changed" : ""} ${dim ? "is-dim" : ""}`}
              style={{ left: road.x, top: road.y, width: road.w, height: road.h }}
              onClick={() => onSelect?.(road.id)}
              aria-label={`${road.name}（${tone}）`}
            >
              <span className="mv-road-label">{road.name}</span>
              {warned && <span className="mv-warn-badge" aria-hidden="true">!</span>}
            </button>
          );
        })}

        {/* 橋 */}
        {mapData.bridges.map((bridge) => {
          const infra = infraById.get(bridge.id);
          const tone = statusToTone(infra);
          const active = selectedId === bridge.id;
          const warned = warnSet.has(bridge.id) || topSet.has(bridge.id);
          const isTop = topSet.has(bridge.id);
          const pulse = pulseSet.has(bridge.id);
          const dim = !isTop && !active && (tone === "safe" || tone === "removed");
          return (
            <button
              type="button"
              key={`bridge-${bridge.id}`}
              className={`mv-bridge mv-tone-${tone} ${active ? "is-active" : ""} ${warned ? "is-warned" : ""} ${isTop ? "is-top-danger" : ""} ${pulse ? "is-changed" : ""} ${dim ? "is-dim" : ""}`}
              style={{ left: bridge.x, top: bridge.y, width: bridge.w, height: bridge.h }}
              onClick={() => onSelect?.(bridge.id)}
              aria-label={`${bridge.name}（${tone}）`}
            >
              <span className="mv-bridge-label">{bridge.name}</span>
              {warned && <span className="mv-warn-badge" aria-hidden="true">!</span>}
            </button>
          );
        })}

        {/* 施設 */}
        {mapData.facilities.map((facility) => (
          <div
            key={`fac-${facility.id}`}
            className="mv-facility"
            style={{ left: facility.x - 14, top: facility.y - 14 }}
            aria-label={facility.name}
            title={facility.name}
          >
            <span className="mv-facility-icon" aria-hidden="true">{facility.icon}</span>
            <span className="mv-facility-label">{facility.name}</span>
          </div>
        ))}

        {/* 動くドット（人・車・観光客） */}
        {!reducedMotion && movers.map((m) => (
          <span
            key={m.id}
            className={`mv-mover mv-mover-${m.kind}`}
            style={{
              "--from-x": `${m.from.x}px`,
              "--from-y": `${m.from.y}px`,
              "--to-x": `${m.to.x}px`,
              "--to-y": `${m.to.y}px`,
              "--dur": `${m.dur}s`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export function getMapInfraDetail(infra, regions, deconstructionProjects, staffComments) {
  if (!infra) return null;
  const region = regions.find((r) => r.id === infra.area);
  const project = (deconstructionProjects || []).find((p) => p.targetId === infra.id);
  return {
    id: infra.id,
    name: infraDisplayName(infra),
    kind: infra.kind === "bridge" ? "橋梁" : infra.kind === "road" ? "道路" : infra.kind || "施設",
    kindKey: infra.kind,
    areaName: region?.name || infra.area,
    condition: Math.round(infra.condition || 0),
    importance: Math.round(infra.importance || 0),
    burden: Math.round(infra.burden || 0),
    operationStatus: infra.operationStatus,
    statusLabel: infra.operationStatus === "removed"
      ? "撤去済み"
      : infra.operationStatus === "restricted"
        ? "通行制限中"
        : infra.condition <= 35
          ? "危険"
          : infra.condition <= 55
            ? "注意"
            : "安全",
    project: project || null,
    staffComment: staffComments?.[infra.kind === "bridge" ? "bridge" : "road"] || "",
    region,
  };
}

/* 危険上位インフラID（最大3件）を返す */
export function pickTopDangerIds(infrastructures, max = 3) {
  return [...infrastructures]
    .filter((i) => i.operationStatus !== "removed")
    .filter((i) => (i.condition || 100) <= 55)
    .sort((a, b) => (a.condition || 0) - (b.condition || 0))
    .slice(0, max)
    .map((i) => i.id);
}
