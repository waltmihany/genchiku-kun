import { createGameCoreTitleReactApiShape } from "../deps/gameCoreReactApiAssemblyDefinitions.js";

export function createGameCoreTitleReactApi(ctx) {
  const {
    screenTransitions,
  } = ctx;

  function getTitleViewModel() {
    return {
      eyebrow: "Municipal Infrastructure Budget Simulation",
      title: "数字を読んで、10年を持ちこたえる町政。",
      description: "あなたは人口減少が進む町のインフラ担当です。10年間、橋・道路・防災・減築・住民対応・予備費を配分しながら、町全体の財政と、地域ごとの気持ちを両方見て調整していきます。",
      points: [
        "スタッフの言うことにはそれぞれクセがある",
        "地域ごとに満足と反発の状況が違う",
        "減築対象はCPUが選んで進めていく",
        "序盤の判断が後半に返ってくる",
      ],
      stats: [
        { title: "勝利条件", text: "10年間、町政を崩壊させずに持ちこたえる" },
        { title: "敗北条件", text: "満足度0 / 財政崩壊 / 重大事故 / 支持率0 / 反乱MAX" },
        { title: "v4 React Web版", text: "大きな構造変更よりも、遊べる安定版としての仕上げを優先" },
      ],
      startLabel: "ゲーム開始",
    };
  }

  function runTitleStartGame() {
    screenTransitions.showDashboard();
  }

  function runRestartFromTopbar() {
    screenTransitions.restartToTitle();
  }

  return createGameCoreTitleReactApiShape({
    getTitleViewModel,
    runTitleStartGame,
    runRestartFromTopbar,
  });
}
