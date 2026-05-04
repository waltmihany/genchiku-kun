import { runBalanceBatch } from "../src/legacy/gameCore.js";

// 3 different seeds, each runs 1 simulation, like a first-time playthrough
const configs = [
  { seed: 11, strategy: "recommended", note: "seed=11 / 推奨戦略でまず1本" },
  { seed: 211, strategy: "balanced", note: "seed=211 / バランス型でもう1本" },
  { seed: 411, strategy: "recommended", note: "seed=411 / 別シードで推奨をもう1本" },
];

configs.forEach((config, index) => {
  const summary = runBalanceBatch({ runs: 1, strategy: config.strategy, seed: config.seed });
  const sample = summary.sample[0];
  console.log("=".repeat(60));
  console.log(`SIM ${index + 1} | ${config.note}`);
  console.log("=".repeat(60));
  console.log(`result      : ${sample.result}`);
  console.log(`finalYear   : ${sample.finalYear}`);
  console.log(`indicators  : ${JSON.stringify(sample.indicators)}`);
  console.log(`remainingBudget : ${sample.remainingBudget}`);
  console.log(`reserveFund     : ${sample.reserveFund}`);
  if (sample.gameOverReason) console.log(`gameOverReason  : ${sample.gameOverReason}`);
  if (sample.clearMessage) console.log(`clearMessage    : ${sample.clearMessage}`);
  console.log("");
});
