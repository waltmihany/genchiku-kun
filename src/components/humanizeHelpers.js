/**
 * humanizeHelpers
 *
 * 数値・状態を人間にとって読みやすい言葉と短い意味に変換するためのヘルパー集。
 * v5.2のUX改善で、各タブ・カードから共通利用する。
 */

/* === 数値 → 状態ラベル + 意味 === */

export function describeRebellion(value) {
  if (value >= 60) return { label: "危険", tone: "negative", meaning: "説明会を検討" };
  if (value >= 40) return { label: "注意", tone: "warning", meaning: "不満が広がりつつあります" };
  if (value >= 25) return { label: "やや注意", tone: "warning", meaning: "様子見でOKです" };
  return { label: "落ち着き", tone: "positive", meaning: "今のところ平穏です" };
}

export function describeSatisfaction(value) {
  if (value <= 35) return { label: "危険", tone: "negative", meaning: "信頼が崩れる手前です" };
  if (value <= 50) return { label: "低下中", tone: "warning", meaning: "生活面の不満が出ています" };
  if (value <= 65) return { label: "並", tone: "neutral", meaning: "悪くはないが油断は禁物" };
  return { label: "良好", tone: "positive", meaning: "住民の理解は得られています" };
}

export function describeFiscalHealth(value) {
  if (value >= 70) return { label: "健全", tone: "positive", meaning: "今年は余力があります" };
  if (value >= 55) return { label: "並", tone: "neutral", meaning: "大きな出費は事前に計画したい" };
  if (value >= 35) return { label: "注意", tone: "warning", meaning: "補修には予備費が必要です" };
  return { label: "危険", tone: "negative", meaning: "破綻に近い領域です" };
}

export function describeFutureBurden(value) {
  if (value <= 35) return { label: "軽い", tone: "positive", meaning: "未来へのツケは少なめ" };
  if (value <= 55) return { label: "並", tone: "neutral", meaning: "計画的な維持で十分" };
  if (value <= 70) return { label: "重い", tone: "warning", meaning: "減築を進める余地あり" };
  return { label: "非常に重い", tone: "negative", meaning: "後年の運営が苦しくなります" };
}

export function describeSafety(value) {
  if (value >= 65) return { label: "安全", tone: "positive", meaning: "事故リスクは抑え気味" };
  if (value >= 50) return { label: "並", tone: "neutral", meaning: "天候次第で揺れます" };
  if (value >= 35) return { label: "注意", tone: "warning", meaning: "事故未遂が増える領域" };
  return { label: "危険", tone: "negative", meaning: "重大事故のリスクあり" };
}

export function describeSupport(value) {
  if (value >= 70) return { label: "安定", tone: "positive", meaning: "議会・住民の理解あり" };
  if (value >= 55) return { label: "並", tone: "neutral", meaning: "崩れない範囲です" };
  if (value >= 40) return { label: "薄い", tone: "warning", meaning: "決断が通しにくい段階" };
  return { label: "危険", tone: "negative", meaning: "支持基盤が崩れかけ" };
}

/* === インフラ・地区 === */

export function describeInfraCondition(value) {
  if (value >= 70) return { label: "良好", tone: "positive", meaning: "今すぐの心配は少なめ" };
  if (value >= 55) return { label: "並", tone: "neutral", meaning: "経過観察の段階" };
  if (value >= 40) return { label: "老朽進行", tone: "warning", meaning: "補修の優先度を上げたい" };
  return { label: "危険", tone: "negative", meaning: "事故リスクが高い状態" };
}

export function infraOneLiner(infra, region) {
  if (!infra) return "";
  if (infra.operationStatus === "removed") return "撤去済みのため、この地点の維持費はかかりません。";
  if (infra.operationStatus === "restricted") return "通行制限中。延命と引き換えに利便性は下がっています。";
  const cond = infra.condition || 0;
  const isBridge = infra.kind === "bridge";
  const regionRebel = region?.rebellion || 0;
  if (cond <= 35 && isBridge) return "台風時に事故リスクが高い橋です。";
  if (cond <= 35 && !isBridge) return "舗装と路盤の傷みが大きく、事故と苦情が増えやすい状態です。";
  if (cond <= 55 && isBridge) return "目立つ損傷はないが、点検優先度は上げたい時期です。";
  if (cond <= 55) return "細かな損傷が増えており、ここ数年で補修判断が必要です。";
  if (regionRebel >= 60) return "個別の状態は悪くないが、地区の不満が高まっています。";
  return "今のところ大きな心配はない状態です。";
}

export function infraReadingHint(infra, region, indicators) {
  if (!infra) return "";
  if (infra.operationStatus === "removed") return "撤去済みなので、追加対策は不要です。";
  if (infra.operationStatus === "restricted") return "全面再開か撤去かは、来年度の重点で再検討できます。";
  const isBridge = infra.kind === "bridge";
  const cond = infra.condition || 0;
  const reserveLow = (indicators?.reserveFund || 0) < 1800;
  if (cond <= 35) {
    if (isBridge) return reserveLow ? "橋梁か予備費を厚めにすると安全側に寄ります。" : "橋梁配分を厚めにすると、事故リスクを抑えやすくなります。";
    return "道路配分か防災を厚めにすると、事故と苦情を抑えやすくなります。";
  }
  if (cond <= 55) return "減築候補にするか、補修して残すかを、地域の反応を見ながら選びたい状態です。";
  if (region && region.rebellion >= 60) return "個別補修より、住民対応を厚くする方が効きやすい局面です。";
  return "現状維持で大きな問題はありません。次は別のヤバい場所に集中して大丈夫です。";
}

/* === 「今日見るべき3つ」 === */

export function buildTodayHighlights({ regions = [], infrastructures = [], indicators = {}, reserveFund, remainingBudget, year }) {
  const items = [];

  // 1. 反乱が高い地区
  const worstRegion = [...regions].sort((a, b) => b.rebellion - a.rebellion)[0];
  if (worstRegion && worstRegion.rebellion >= 50) {
    items.push({
      kind: "region",
      tone: worstRegion.rebellion >= 60 ? "negative" : "warning",
      title: `${worstRegion.name}の反乱が高まっています`,
      detail: "住民対応や説明会で反発を抑えたい局面です。",
    });
  }

  // 2. 危険なインフラ
  const dangerous = [...infrastructures]
    .filter((i) => i.operationStatus !== "removed")
    .sort((a, b) => (a.condition || 0) - (b.condition || 0));
  const worstInfra = dangerous[0];
  if (worstInfra && worstInfra.condition <= 45) {
    const label = worstInfra.kind === "bridge" ? "橋" : "道路";
    items.push({
      kind: "infra",
      tone: worstInfra.condition <= 30 ? "negative" : "warning",
      title: `${worstInfra.name}が${worstInfra.condition <= 30 ? "危険域" : "注意域"}です`,
      detail: `${label}の状態が落ちています。来年度の重点として候補です。`,
    });
  }

  // 3. 財政・予備費
  const fiscal = indicators.fiscalHealth || 0;
  if (typeof reserveFund === "number" && reserveFund < 2000) {
    items.push({
      kind: "fiscal",
      tone: reserveFund < 1200 ? "negative" : "warning",
      title: "予備費が薄くなっています",
      detail: "突発出費・台風対応に不安があります。",
    });
  } else if (fiscal < 45) {
    items.push({
      kind: "fiscal",
      tone: "warning",
      title: "財政の余力が落ちてきています",
      detail: "大きな補修は予備費とセットで考えたい段階です。",
    });
  }

  // 候補が少ない場合は「特に問題なし」枠も
  if (items.length === 0) {
    items.push({
      kind: "ok",
      tone: "positive",
      title: "今のところ大きな火種はありません",
      detail: "余裕があるうちに、次年度の準備を進めるのも手です。",
    });
  }

  // 不足分を二次候補で埋める
  if (items.length < 3) {
    const futureBurden = indicators.futureBurden || 0;
    if (futureBurden >= 60 && !items.some((i) => i.kind === "burden")) {
      items.push({
        kind: "burden",
        tone: futureBurden >= 70 ? "warning" : "neutral",
        title: "将来維持負担が重くなっています",
        detail: "減築を進めて未来のツケを軽くする余地があります。",
      });
    }
  }
  if (items.length < 3) {
    const safety = indicators.safety || 0;
    if (safety < 45 && !items.some((i) => i.kind === "safety")) {
      items.push({
        kind: "safety",
        tone: safety < 35 ? "negative" : "warning",
        title: "町全体の安全度が落ちています",
        detail: "防災と橋梁の配分を見直したい段階です。",
      });
    }
  }
  if (items.length < 3 && (typeof year === "number" && year >= 5)) {
    items.push({
      kind: "midgame",
      tone: "neutral",
      title: "中盤戦に入りました",
      detail: "ここからは判断のツケが少しずつ表に出てきます。",
    });
  }

  return items.slice(0, 3);
}

/* === 「次に何をすべきか」 === */

export function buildNextActionHint({ phase, hasPendingEvent, isRunning, todayItems = [] }) {
  if (hasPendingEvent) {
    return { tone: "negative", text: "イベントが発生しています。イベントタブで判断してください。" };
  }
  if (phase === "report") {
    return { tone: "neutral", text: "年度末です。年度タブからレポートを開いて、来年度の予算に活かしましょう。" };
  }
  if (phase === "budget") {
    return { tone: "neutral", text: "予算配分を決める段階です。年度タブから予算画面を開きましょう。" };
  }
  if (!isRunning && phase === "monthly") {
    return { tone: "neutral", text: "年度進行が止まっています。年度タブの「年度を開始」で進められます。" };
  }
  const top = todayItems[0];
  if (top && (top.tone === "negative" || top.tone === "warning")) {
    return { tone: "neutral", text: `まずマップで「${top.title}」を確認しましょう。` };
  }
  return { tone: "neutral", text: "余裕のある月です。担当者タブのコメントを読んで来年度の方針を温めましょう。" };
}

/* === 担当者の優先度 === */

export function buildStaffPriority({ staffItems = [], regions = [], infrastructures = [], indicators = {} }) {
  const worstBridge = infrastructures
    .filter((i) => i.kind === "bridge" && i.operationStatus !== "removed")
    .sort((a, b) => a.condition - b.condition)[0];
  const worstRoad = infrastructures
    .filter((i) => i.kind === "road" && i.operationStatus !== "removed")
    .sort((a, b) => a.condition - b.condition)[0];
  const highRebelRegion = [...regions].sort((a, b) => b.rebellion - a.rebellion)[0];

  return staffItems.map((item) => {
    let priority = "low";
    let reason = "今は特に大きな動きはありません。";

    if (item.key === "bridge") {
      if (worstBridge && worstBridge.condition <= 45) {
        priority = "high";
        reason = `${worstBridge.name}の状態が落ちています。`;
      } else if (worstBridge && worstBridge.condition <= 60) {
        priority = "mid";
        reason = "橋の経過観察が必要な時期です。";
      }
    } else if (item.key === "road") {
      if (worstRoad && worstRoad.condition <= 45) {
        priority = "high";
        reason = `${worstRoad.name}が悪化しています。`;
      } else if (worstRoad && worstRoad.condition <= 60) {
        priority = "mid";
        reason = "生活道路の状態を見ておきたい時期です。";
      }
    } else if (item.key === "disaster") {
      if ((indicators.safety || 0) < 50) {
        priority = "high";
        reason = "町の安全度が落ちています。";
      } else if ((indicators.safety || 0) < 65) {
        priority = "mid";
        reason = "次の天候イベントに備えたい段階です。";
      }
    } else if (item.key === "deconstruction") {
      if ((indicators.futureBurden || 0) >= 65) {
        priority = "high";
        reason = "将来負担が重くなっています。";
      } else if ((indicators.futureBurden || 0) >= 50) {
        priority = "mid";
        reason = "減築を進める余地があります。";
      }
    } else if (item.key === "outreach") {
      if (highRebelRegion && highRebelRegion.rebellion >= 55) {
        priority = "high";
        reason = `${highRebelRegion.name}の反乱が高まっています。`;
      } else if ((indicators.rebellion || 0) >= 35) {
        priority = "mid";
        reason = "全体の不満を抑えたい段階です。";
      }
    } else if (item.key === "finance") {
      if ((indicators.fiscalHealth || 0) < 45) {
        priority = "high";
        reason = "財政の体力が落ちています。";
      } else if ((indicators.fiscalHealth || 0) < 60) {
        priority = "mid";
        reason = "支出計画を見直したい段階です。";
      }
    }

    return {
      ...item,
      priority,
      priorityLabel: priority === "high" ? "優先度 高" : priority === "mid" ? "優先度 中" : "優先度 低",
      priorityReason: reason,
    };
  }).sort((a, b) => {
    const order = { high: 0, mid: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

/* === 財政診断 === */

export function buildFiscalDiagnosis({ indicators = {}, reserveFund, remainingBudget }) {
  const fiscal = indicators.fiscalHealth || 0;
  const burden = indicators.futureBurden || 0;
  const lines = [];

  if (fiscal >= 65) {
    lines.push("今年はまだ余力があります。");
  } else if (fiscal >= 50) {
    lines.push("余力は減りつつありますが、まだ持ちこたえています。");
  } else if (fiscal >= 35) {
    lines.push("財政が薄くなっています。大きな補修は慎重に。");
  } else {
    lines.push("財政が破綻に近い領域です。守る対象を絞る局面です。");
  }

  if (typeof reserveFund === "number") {
    if (reserveFund < 1500) {
      lines.push("予備費がかなり薄く、台風対応に不安があります。");
    } else if (reserveFund < 2500) {
      lines.push("予備費が減ってきました。次の災害イベントに備えたい段階です。");
    } else {
      lines.push("予備費は災害対応に十分残っています。");
    }
  }

  if (burden >= 70) {
    lines.push("将来維持負担は非常に重く、減築を進める余地が大きい状態です。");
  } else if (burden >= 55) {
    lines.push("将来維持負担は重め。減築判断のタイミングです。");
  } else if (burden >= 40) {
    lines.push("将来維持負担は並程度です。");
  } else {
    lines.push("将来維持負担は軽めで、未来へのツケは少なめです。");
  }

  if (typeof remainingBudget === "number" && remainingBudget < 0) {
    lines.push("単年度残予算は赤字です。予備費からの補填が発生しています。");
  }

  return lines;
}
