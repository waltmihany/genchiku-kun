import { runBalanceBatch } from "../src/legacy/gameCore.js";

const configs = [
  { strategy: "recommended", runs: 200, seed: 11 },
  { strategy: "balanced", runs: 120, seed: 211 },
  { strategy: "risky", runs: 120, seed: 411 },
];

const results = configs.map((config) => ({
  ...config,
  summary: runBalanceBatch(config),
}));

const recommended = results.find((item) => item.strategy === "recommended")?.summary;
const balanced = results.find((item) => item.strategy === "balanced")?.summary;
const risky = results.find((item) => item.strategy === "risky")?.summary;

const checks = [
  {
    ok: !!recommended && recommended.clearRate >= 0.8 && recommended.clearRate <= 0.9,
    message: `recommended clearRate must stay within 0.80-0.90 (actual: ${recommended?.clearRate?.toFixed(3) ?? "n/a"})`,
  },
  {
    ok: !!balanced && balanced.clearRate >= 0.45 && balanced.clearRate <= 0.8,
    message: `balanced clearRate must stay within 0.45-0.80 (actual: ${balanced?.clearRate?.toFixed(3) ?? "n/a"})`,
  },
  {
    ok: !!risky && !!balanced && risky.clearRate < balanced.clearRate,
    message: `risky clearRate must stay below balanced (actual: ${risky?.clearRate?.toFixed(3) ?? "n/a"} vs ${balanced?.clearRate?.toFixed(3) ?? "n/a"})`,
  },
  {
    ok: !!balanced && !!recommended && balanced.clearRate < recommended.clearRate,
    message: `balanced clearRate must stay below recommended (actual: ${balanced?.clearRate?.toFixed(3) ?? "n/a"} vs ${recommended?.clearRate?.toFixed(3) ?? "n/a"})`,
  },
];

console.log(JSON.stringify(results, null, 2));

const failures = checks.filter((check) => !check.ok);
if (failures.length) {
  console.error("Balance check failed:");
  failures.forEach((failure) => console.error(`- ${failure.message}`));
  process.exit(1);
}

console.log("Balance check passed.");
