export function createMonthlyEventPool({ getWorstInfrastructure, getInfrastructureById }) {
  return [
    {
      id: "rainy",
      title: "長雨シーズン",
      kind: "weather",
      basePriority: 74,
      condition: (state) => [1, 2].includes(state.monthIndex),
      body: "雨が続き、道路脇の法面と排水溝への負荷が増えています。防災費が薄いと、あとで高くつきます。毎回そうです。",
      choices: [
        {
          label: "排水清掃と仮補修を急ぐ（予算を使う）",
          effect: { remainingBudget: -900, safety: 4, fiscalHealth: -2, futureBurden: -3, regionalEffects: { river: { satisfaction: 2, rebellion: -2 }, mountain: { satisfaction: 1, rebellion: -1 } } },
          result: "地味ですが効きました。派手さはないものの、派手な崩れも避けられそうです。",
        },
        {
          label: "様子を見る",
          effect: { safety: -4, satisfaction: -2, rebellion: 2, regionalEffects: { river: { satisfaction: -3, rebellion: 4 } } },
          result: "住民は『その様子見、毎年見てる』という顔です。",
        },
      ],
    },
    {
      id: "typhoon",
      title: "台風接近",
      kind: "weather",
      basePriority: 88,
      condition: (state) => [3, 4, 5].includes(state.monthIndex),
      body: "台風が接近。避難所案内、土のう、事前巡回、どれもゼロ円では出てきません。",
      choices: [
        {
          label: "事前対策を厚めに実施",
          effect: { remainingBudget: -1500, safety: 6, support: 2, fiscalHealth: -2, regionalEffects: { river: { satisfaction: 3, rebellion: -3 }, tourism: { satisfaction: 1, rebellion: -1 } } },
          result: "大きな被害は抑えられました。防災担当が少しだけ笑いました。珍事です。",
        },
        {
          label: "最低限の警戒だけにする",
          effect: { safety: -5, satisfaction: -3, futureBurden: 3, rebellion: 2, regionalEffects: { river: { satisfaction: -5, rebellion: 5 }, tourism: { satisfaction: -2, rebellion: 2 } } },
          result: "一応しのげましたが、町の空気は重めです。",
        },
      ],
    },
    {
      id: "residentMeeting",
      title: "住民説明会の招集",
      kind: "resident",
      basePriority: 82,
      condition: (state) => state.indicators.satisfaction < 65 || state.indicators.rebellion > 28,
      body: "『なぜあの道路は残してこの橋は後回しなのか』。住民説明会の空気がじわじわ熱を帯びています。",
      choices: [
        {
          label: "時間をかけて説明し、代替案も示す",
          effect: { remainingBudget: -700, satisfaction: 5, support: 4, rebellion: -6 },
          result: "和田さんの丁寧な説明が刺さりました。拍手はないですが、怒号も減りました。",
        },
        {
          label: "数字だけ示して短時間で切り上げる",
          effect: { satisfaction: -5, support: -4, rebellion: 7 },
          result: "会議は短く終わりました。問題は長く残りました。",
        },
      ],
    },
    {
      id: "bridgeCrack",
      title: "橋にひび割れ報告",
      kind: "infrastructure",
      basePriority: 92,
      condition: (state) => getWorstInfrastructure(state, "bridge").condition < 58,
      body: "定期点検で橋にひび割れが見つかりました。放置はだめ、でも予算もだめ。町政あるあるです。",
      choices: [
        {
          label: "緊急補修を実施",
          effect: { remainingBudget: -1800, safety: 7, futureBurden: -4, support: 1, regionalEffects: { river: { satisfaction: 3, rebellion: -3 }, central: { satisfaction: 1, rebellion: -1 } } },
          repairTarget: "bridge",
          result: "橋本さんの顔色が少し戻りました。橋も町も、とりあえずつながりました。",
        },
        {
          label: "通行規制だけかける",
          effect: { satisfaction: -4, support: -3, rebellion: 4, futureBurden: 2, regionalEffects: { river: { satisfaction: -4, rebellion: 5 } } },
          result: "事故は避けましたが、不満は遠回りせず届きました。",
        },
      ],
    },
    {
      id: "roadCollapse",
      title: "生活道路の陥没",
      kind: "infrastructure",
      basePriority: 90,
      condition: (state) => getWorstInfrastructure(state, "road").condition < 52,
      body: "生活道路の一部で陥没が発生。小さい穴でも、住民の怒りはわりと大きく育ちます。",
      choices: [
        {
          label: "応急復旧と周辺点検を行う",
          effect: { remainingBudget: -1200, safety: 5, satisfaction: 2, fiscalHealth: -2 },
          repairTarget: "road",
          result: "最低限の信頼は守れました。穴は埋まり、SNSの火種も少しだけ鎮火。",
        },
        {
          label: "片側通行でしのぐ",
          effect: { safety: -3, satisfaction: -5, rebellion: 4, support: -2 },
          result: "通れはします。ですが『通れはする』は評価されにくい言葉です。",
        },
      ],
    },
    {
      id: "legislatorInterference",
      title: "議員からの口出し",
      kind: "resident",
      basePriority: 77,
      condition: (state) => state.year >= 2 && (state.indicators.support < 66 || state.indicators.futureBurden > 58),
      body: "『あの地区だけ削るのは説明がつかない』と議員が介入。方針の一貫性より、地元への顔向けが優先されそうです。",
      choices: [
        {
          label: "資料を整え、公開説明で押し返す",
          effect: { remainingBudget: -650, support: 2, fiscalHealth: -1, regionalEffects: { central: { satisfaction: 1, rebellion: -1 }, mountain: { satisfaction: 1, rebellion: -2 } } },
          result: "資料戦で踏みとどまりました。面倒ですが、筋は通りました。",
        },
        {
          label: "一部要求をのんで先送りする",
          effect: { support: -1, futureBurden: 3, rebellion: 2, regionalEffects: { central: { satisfaction: 2, rebellion: -1 }, mountain: { satisfaction: -2, rebellion: 3 } } },
          result: "その場は収まりましたが、将来の整理はまた難しくなりました。",
        },
      ],
    },
    {
      id: "touristComplaints",
      title: "観光客の苦情が増加",
      kind: "resident",
      basePriority: 76,
      condition: (state) => state.regionalMoods.tourism.satisfaction < 72 || getInfrastructureById("oldRoad2")?.condition < 46,
      body: "観光案内所に『道が分かりにくい』『古い路線が危ない』という苦情が集まり始めました。レビュー欄は町役場より正直です。",
      choices: [
        {
          label: "案内改善と応急整備を入れる",
          effect: { remainingBudget: -850, support: 1, regionalEffects: { tourism: { satisfaction: 5, rebellion: -4 }, central: { satisfaction: 1, rebellion: -1 } } },
          result: "観光の空気が少し持ち直しました。写真より先に苦情を消せたのは大きいです。",
        },
        {
          label: "今期は他案件を優先する",
          effect: { support: -2, regionalEffects: { tourism: { satisfaction: -6, rebellion: 7 } } },
          result: "苦情は静かに積もり、あとで派手に返ってきそうです。",
        },
      ],
    },
    {
      id: "elderlyTransport",
      title: "高齢者の移動路線見直し",
      kind: "resident",
      basePriority: 80,
      condition: (state) => state.year >= 2 && (state.regionalMoods.mountain.satisfaction < 72 || state.regionalMoods.central.satisfaction < 70),
      body: "通院と買い物の足が減るのではないかと、高齢者向け移動路線の見直しに不安が集まっています。数字より生活が先に動きます。",
      choices: [
        {
          label: "代替便と送迎支援を暫定導入",
          effect: { remainingBudget: -900, satisfaction: 2, support: 2, regionalEffects: { mountain: { satisfaction: 4, rebellion: -4 }, central: { satisfaction: 2, rebellion: -1 } } },
          result: "生活路線への不安が和らぎました。小さい便でも、暮らしには大きいようです。",
        },
        {
          label: "広報だけ出して様子を見る",
          effect: { support: -2, rebellion: 2, regionalEffects: { mountain: { satisfaction: -5, rebellion: 6 } } },
          result: "紙の説明だけでは足は増えません。山間部の空気がかなり悪くなりました。",
        },
      ],
    },
    {
      id: "schoolConsolidation",
      title: "学校統合の火種",
      kind: "resident",
      basePriority: 79,
      condition: (state) => state.year >= 4,
      body: "児童数の減少で学校統合の話が再燃。道路・橋の維持と教育拠点の存続が、住民の中では同じ問題として語られ始めています。",
      choices: [
        {
          label: "通学路と送迎のセットで議論する",
          effect: { remainingBudget: -800, support: 2, futureBurden: -1, regionalEffects: { mountain: { satisfaction: 2, rebellion: -3 }, central: { satisfaction: 1, rebellion: -1 } } },
          result: "反対は残りましたが、議論の土俵は整いました。インフラと生活を一緒に語れたのが効きました。",
        },
        {
          label: "教育部門に任せて距離を置く",
          effect: { support: -2, rebellion: 3, regionalEffects: { mountain: { satisfaction: -4, rebellion: 5 }, central: { satisfaction: -1, rebellion: 1 } } },
          result: "担当外では済みませんでした。住民から見れば、町はひとつです。",
        },
      ],
    },
    {
      id: "snowRemovalCost",
      title: "除雪費の急騰",
      kind: "finance",
      basePriority: 81,
      condition: (state) => [9, 10].includes(state.monthIndex),
      body: "強い寒波で除雪出動が増え、委託費が跳ね上がりました。冬は景色がきれいですが、請求書はもっと白いです。",
      choices: [
        {
          label: "予備費を使って幹線優先で除雪",
          effect: { remainingBudget: -1400, safety: 4, fiscalHealth: -3, regionalEffects: { mountain: { satisfaction: 3, rebellion: -3 }, central: { satisfaction: 1, rebellion: -1 } } },
          result: "全部は無理でも、命綱の路線は守れました。山間部の怒りも少し引きました。",
        },
        {
          label: "生活路線は後回しにする",
          effect: { safety: -3, support: -2, rebellion: 3, regionalEffects: { mountain: { satisfaction: -6, rebellion: 8 } } },
          result: "財政は少し守れましたが、山あい集落の信頼は凍りました。",
        },
      ],
    },
    {
      id: "contractorBankruptcy",
      title: "地元建設会社の経営悪化",
      kind: "finance",
      basePriority: 78,
      condition: (state) => state.year >= 3 && state.indicators.fiscalHealth < 62,
      body: "地元建設会社の一社が資金繰り悪化。受け皿が減ると、点検も補修も『やりたくてもできない』に変わります。",
      choices: [
        {
          label: "発注時期を前倒しして仕事をつなぐ",
          effect: { remainingBudget: -1100, safety: 2, fiscalHealth: -2, support: 2 },
          result: "苦しいながらも現場のラインはつながりました。地域経済と維持管理が同時に延命。",
        },
        {
          label: "広域入札に切り替える",
          effect: { futureBurden: 1, fiscalHealth: 1, regionalEffects: { central: { satisfaction: -1, rebellion: 1 }, mountain: { satisfaction: -2, rebellion: 2 } } },
          result: "帳簿上は少し楽ですが、地元との距離は広がりました。",
        },
      ],
    },
    {
      id: "staffShortage",
      title: "職員不足で巡回が回らない",
      kind: "finance",
      basePriority: 73,
      condition: (state) => state.year >= 2,
      body: "退職と異動で現場巡回の人手が足りません。点検を減らすと事故の予兆も一緒に見えなくなります。便利に最悪です。",
      choices: [
        {
          label: "委託と応援で最低限の巡回を確保",
          effect: { remainingBudget: -700, safety: 3, fiscalHealth: -1 },
          result: "完全ではありませんが、目だけは残せました。見ているだけで防げる事故もあります。",
        },
        {
          label: "優先地区だけに絞る",
          effect: { safety: -2, futureBurden: 2, regionalEffects: { tourism: { satisfaction: -2, rebellion: 2 }, mountain: { satisfaction: -2, rebellion: 2 } } },
          result: "効率化ではあります。切られた側から見ると、ただの置き去りですが。",
        },
      ],
    },
    {
      id: "newMinistrySubsidy",
      title: "新省庁補助の新設",
      kind: "bonus",
      basePriority: 75,
      condition: (state) => state.year >= 3,
      body: "新しい省庁メニューで、再編・防災・交通の複合補助が出ました。要件は多いですが、刺さると大きいです。",
      choices: [
        {
          label: "時間を割いて複合申請する",
          effect: { remainingBudget: 2400, fiscalHealth: 5, support: 1, futureBurden: -2 },
          result: "書類は地獄、結果は天国寄りでした。こういう年に限って役所力が試されます。",
        },
        {
          label: "通常業務を優先して見送る",
          effect: { support: -1, futureBurden: 2 },
          result: "正気は保てましたが、将来の選択肢は少し減りました。",
        },
      ],
    },
    {
      id: "snsBacklash",
      title: "SNSで方針炎上",
      kind: "resident",
      basePriority: 84,
      condition: (state) => state.indicators.rebellion > 30 || !!state.latestDeconstructionAction,
      body: "『橋は直さないのにイベントには金を出すのか』。切り抜き投稿が拡散し、方針の説明不足が一気に可視化されました。",
      choices: [
        {
          label: "図解付きで即日説明を出す",
          effect: { remainingBudget: -500, support: 2, rebellion: -3, regionalEffects: { tourism: { satisfaction: 1, rebellion: -1 }, mountain: { satisfaction: 1, rebellion: -1 } } },
          result: "全員は納得しませんが、放置よりはずっとましでした。説明は遅いほど高くつきます。",
        },
        {
          label: "しばらく黙ってやり過ごす",
          effect: { support: -5, rebellion: 7, satisfaction: -4, regionalEffects: { mountain: { satisfaction: -2, rebellion: 3 }, tourism: { satisfaction: -2, rebellion: 2 } } },
          result: "炎上は鎮火せず、別の火種まで呼び込みました。沈黙は万能ではありませんでした。",
        },
      ],
    },
    {
      id: "newspaperCoverage",
      title: "地元紙の特集取材",
      kind: "resident",
      basePriority: 70,
      condition: (state) => state.year >= 2 && (state.indicators.support < 68 || state.indicators.safety < 62),
      body: "地元紙が『縮む町をどう守るか』特集を企画。取材のされ方ひとつで、町の空気はだいぶ変わります。",
      choices: [
        {
          label: "現場とセットで丁寧に説明する",
          effect: { remainingBudget: -300, support: 3, regionalEffects: { central: { satisfaction: 2, rebellion: -2 }, tourism: { satisfaction: 1, rebellion: -1 } } },
          result: "厳しい記事でも、筋の通った扱いになりました。見せ方は中身の一部です。",
        },
        {
          label: "無難なコメントだけで済ませる",
          effect: { support: -2, rebellion: 2, regionalEffects: { central: { satisfaction: -2, rebellion: 2 } } },
          result: "波風は小さく見えて、読後感はあまり良くありません。『何も言っていない』が伝わりました。",
        },
      ],
    },
    {
      id: "disasterRecoveryAssessment",
      title: "災害復旧の事後評価",
      kind: "weather",
      basePriority: 83,
      condition: (state) => state.indicators.safety < 62 || state.reserveFund < 3500,
      body: "前回災害対応の事後評価が入りました。復旧の速さより、次に備えた改善があるかを問われています。耳が痛い話です。",
      choices: [
        {
          label: "改善計画をまとめて予備費も積み直す",
          effect: { remainingBudget: -1000, safety: 4, support: 1, futureBurden: -2 },
          result: "評価は辛口でしたが、次につながる形になりました。痛い出費にも意味がつきました。",
        },
        {
          label: "前回の実績だけ強調する",
          effect: { support: -1, safety: -2, futureBurden: 2 },
          result: "その場はしのげましたが、弱点は残りました。災害は講評を読んでくれません。",
        },
      ],
    },
    {
      id: "bridgeMemoryEvent",
      title: "橋の思い出イベント開催要望",
      kind: "resident",
      basePriority: 72,
      condition: (state) => state.deconstructionHistory.some((item) => item.message.includes("橋")) || state.latestDeconstructionAction.includes("橋"),
      body: "『橋をただ消すのではなく、記録や見送りの場を作ってほしい』と住民から要望が出ました。インフラは構造物ですが、同時に記憶でもあります。",
      choices: [
        {
          label: "記録展示とお別れ会を開く",
          effect: { remainingBudget: -450, support: 2, regionalEffects: { river: { satisfaction: 4, rebellion: -4 }, central: { satisfaction: 1, rebellion: -1 } } },
          result: "感情の出口ができ、反発が少し和らぎました。削る時ほど、言葉が要ります。",
        },
        {
          label: "実務優先で対応しない",
          effect: { support: -2, rebellion: 2, regionalEffects: { river: { satisfaction: -4, rebellion: 5 } } },
          result: "効率は守れましたが、町の記憶に冷たく映りました。あとで別の形で響きそうです。",
        },
      ],
    },
    {
      id: "mountainPetition",
      title: "山間部で減築反対の署名",
      kind: "resident",
      basePriority: 94,
      condition: (state) => state.regionalMoods.mountain.rebellion > 52,
      body: "山あい集落で『減らす前に代替を示せ』という署名活動が始まりました。道路一本の話ではなく、見捨てられる感覚への反応です。",
      choices: [
        {
          label: "代替動線の説明会を追加する",
          effect: { remainingBudget: -780, support: 1, regionalEffects: { mountain: { satisfaction: 4, rebellion: -6 } } },
          result: "反発は残りますが、対話の糸はつながりました。山間部は放置より説明を見ています。",
        },
        {
          label: "方針は変えず押し切る",
          effect: { support: -4, rebellion: 5, regionalEffects: { mountain: { satisfaction: -8, rebellion: 12 }, central: { satisfaction: -1, rebellion: 1 } } },
          result: "数字はぶれませんでしたが、山あい集落の空気はさらに硬くなりました。",
        },
      ],
    },
    {
      id: "bidFailure",
      title: "入札不調",
      kind: "finance",
      basePriority: 68,
      condition: (state) => state.year >= 1,
      body: "人手不足と資材高騰で、予定していた工事の入札が不調に。安くはならず、ただ遅れます。",
      choices: [
        {
          label: "予備費を上乗せして再発注",
          effect: { remainingBudget: -1000, safety: 3, fiscalHealth: -3 },
          result: "痛い出費ですが、工事は動き出しました。金子さんは静かに頭を抱えています。",
        },
        {
          label: "来月へ延期",
          effect: { futureBurden: 5, safety: -2, support: -2, fiscalHealth: -1 },
          result: "数字上は楽ですが、未来の自分が文句を言っています。たぶん正論です。",
        },
      ],
    },
    {
      id: "subsidy",
      title: "国の補助メニュー",
      kind: "bonus",
      basePriority: 66,
      condition: (state) => state.year >= 1,
      body: "国の補助メニューが案内されました。説明資料は厚く、締切は薄いです。",
      choices: [
        {
          label: "急いで申請する",
          effect: { remainingBudget: 1800, fiscalHealth: 4, support: 2 },
          result: "書類地獄の末、補助金が通りました。役所仕事が役所を救う瞬間です。",
        },
        {
          label: "今回は見送る",
          effect: { support: -1, futureBurden: 1 },
          result: "見送りました。たまに正気を守るのも大事ですが、財布は守れませんでした。",
        },
      ],
    },
  ];
}
