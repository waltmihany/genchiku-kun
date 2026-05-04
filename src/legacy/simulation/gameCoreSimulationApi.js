import { BUDGET_PRESETS, budgetCategories } from "../../data/gameStaticData.js";
import { createGameCoreSimulationApiShape } from "../deps/gameCoreBridgeLeafApiDefinitions.js";

export function createGameCoreSimulationApi(ctx) {
  const {
    getState,
    setState,
    clone,
    buildInitialState,
    generateYearEndReport,
    recommendBudgetPreset,
    applyBudgetPlan,
    applyEventChoice,
    advanceMonth,
    balanceChoiceScore,
  } = ctx;

  function autoPickEventChoiceIndex(event, strategy = "recommended") {
    if (!event?.choices?.length) return 0;
    if (strategy === "risky") {
      return event.choices.length - 1;
    }
    let bestIndex = 0;
    let bestScore = -Infinity;
    event.choices.forEach((choice, index) => {
      let score = balanceChoiceScore(choice);
      if (strategy === "recommended") {
        score += choice.label.includes("説明") ? 0.55 : 0;
        score += choice.label.includes("改善") ? 0.4 : 0;
        score += choice.label.includes("補修") ? 0.35 : 0;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function applyBudgetPresetForSimulation(presetKey) {
    const gameState = getState();
    const preset = BUDGET_PRESETS.find((item) => item.key === presetKey) || BUDGET_PRESETS.find((item) => item.key === "balanced");
    budgetCategories.forEach((cat) => {
      gameState.budgetAllocation[cat.key] = preset.allocation[cat.key];
    });
  }

  function createSeededRandom(seedValue = 1) {
    let seed = seedValue >>> 0;
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function runSingleAutoSimulation({ strategy = "recommended", seed = 1 } = {}) {
    const originalRandom = Math.random;
    Math.random = createSeededRandom(seed);
    try {
      const nextState = buildInitialState();
      setState(nextState);
      const gameState = getState();
      gameState.reportEntries = generateYearEndReport(gameState, true);
      gameState.selectedReportId = gameState.reportEntries[0]?.id || null;
      gameState.screen = "dashboard";

      let guard = 0;
      while (guard < 1000) {
        guard += 1;
        if (gameState.screen === "gameover" || gameState.screen === "clear") break;

        if (gameState.phase === "report") {
          const presetKey = strategy === "balanced" ? "balanced" : recommendBudgetPreset().key;
          applyBudgetPresetForSimulation(presetKey);
          applyBudgetPlan();
          continue;
        }

        if (gameState.screen === "event" && gameState.pendingEvent) {
          const choiceIndex = autoPickEventChoiceIndex(gameState.pendingEvent, strategy);
          applyEventChoice(choiceIndex);
          continue;
        }

        if (gameState.phase === "monthly") {
          advanceMonth();
          continue;
        }

        if (gameState.screen === "dashboard") {
          if (gameState.phase === "monthly") {
            advanceMonth();
            continue;
          }
          if (gameState.phase === "report") {
            continue;
          }
        }

        break;
      }

      return {
        result: gameState.screen === "clear" ? "clear" : gameState.screen === "gameover" ? "gameover" : "stalled",
        finalYear: gameState.year,
        indicators: clone(gameState.indicators),
        remainingBudget: gameState.remainingBudget,
        reserveFund: gameState.reserveFund,
        gameOverReason: gameState.gameOverReason,
        clearMessage: gameState.clearMessage,
      };
    } finally {
      Math.random = originalRandom;
    }
  }

  function runBalanceBatch({ runs = 25, strategy = "recommended", seed = 1 } = {}) {
    const results = Array.from({ length: runs }, (_, index) => runSingleAutoSimulation({ strategy, seed: seed + index * 17 }));
    const clears = results.filter((item) => item.result === "clear");
    const gameovers = results.filter((item) => item.result === "gameover");
    const avgYear = results.reduce((sum, item) => sum + item.finalYear, 0) / results.length;
    const reasonCount = {};
    gameovers.forEach((item) => {
      reasonCount[item.gameOverReason] = (reasonCount[item.gameOverReason] || 0) + 1;
    });
    return {
      runs,
      strategy,
      clearRate: clears.length / results.length,
      gameoverRate: gameovers.length / results.length,
      averageFinalYear: avgYear,
      reasons: reasonCount,
      sample: results.slice(0, 5),
    };
  }

  return createGameCoreSimulationApiShape({
    runSingleAutoSimulation,
    runBalanceBatch,
  });
}
