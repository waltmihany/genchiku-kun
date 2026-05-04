from pathlib import Path

root = Path('/home/user/genchiku-kun-v3')
core_path = root / 'src/legacy/gameCore.js'
progress_path = root / 'src/legacy/gameCoreProgressApi.js'

core = core_path.read_text()


def extract_function(text: str, name: str):
    marker = f'function {name}('
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f'{name} not found')
    first_brace = text.find('{', start)
    if first_brace == -1:
        raise SystemExit(f'{name} opening brace not found')
    brace = 0
    end = None
    for i in range(first_brace, len(text)):
        ch = text[i]
        if ch == '{':
            brace += 1
        elif ch == '}':
            brace -= 1
            if brace == 0:
                end = i + 1
                break
    if end is None:
        raise SystemExit(f'{name} end not found')
    return text[start:end]


order = [
    'getDramaProfile',
    'currentDramaProfile',
    'projectSelectionReason',
    'projectSelectionScore',
    'startDeconstructionProject',
    'completeDeconstructionProject',
    'processDeconstructionProjects',
    'syncGlobalMoodIndicators',
    'applyRegionalEffects',
    'getMostVolatileRegion',
    'updateIndicators',
    'applyBudgetPlan',
    'getBudgetTotal',
    'applyBudgetPreset',
    'detectActiveBudgetPreset',
    'recommendBudgetPreset',
    'rebalanceBudgetAllocation',
    'autoBalanceBudget',
    'adjustBudget',
    'setBudgetValue',
    'applyEventChoice',
    'repairInfrastructure',
    'processMonthlyMaintenance',
    'averageCondition',
    'maybeUseReserve',
    'maybeTriggerMonthlyEvent',
    'eventPriorityScore',
    'advanceMonth',
    'finalizeMonth',
    'finishYear',
    'checkGameState',
    'setGameOver',
    'balanceChoiceScore',
]

blocks = {name: extract_function(core, name) for name in order}

module_text = '''import { AREA_ORDER, BUDGET_PRESETS, MONTHS, budgetCategories } from "../data/gameStaticData.js";

export function createGameCoreProgressApi(ctx) {
  const gameState = new Proxy({}, {
    get(_target, prop) {
      return ctx.getState()?.[prop];
    },
    set(_target, prop, value) {
      const state = ctx.getState();
      if (!state) return false;
      state[prop] = value;
      return true;
    },
  });

  const {
    alertUser,
    clone,
    clamp,
    formatMoney,
    conditionToStatus,
    areaInfrastructureStats,
    getWorstInfrastructure,
    areaName,
    monthLabel,
    getDeconstructionProjectByTarget,
    summarizeBudgetAllocation,
    summarizeEffectSignals,
    eventImpactScore,
    setScreen,
    render,
    monthlyEventPool,
    buildYearCausalSummary,
    generateYearEndReport,
  } = ctx;

'''
for name in order:
    module_text += blocks[name] + '\n\n'
module_text += '''  return {
    currentDramaProfile,
    getMostVolatileRegion,
    applyBudgetPlan,
    getBudgetTotal,
    applyBudgetPreset,
    detectActiveBudgetPreset,
    recommendBudgetPreset,
    autoBalanceBudget,
    adjustBudget,
    setBudgetValue,
    applyEventChoice,
    advanceMonth,
    checkGameState,
    setGameOver,
    balanceChoiceScore,
  };
}
'''
progress_path.write_text(module_text)

for name in order:
    block = blocks[name]
    core = core.replace(block + '\n\n', '', 1)
    core = core.replace(block + '\n', '', 1)
    core = core.replace(block, '', 1)

progress_import = 'import { createGameCoreProgressApi } from "./gameCoreProgressApi.js";\n'
if progress_import not in core:
    react_import = 'import { createGameCoreReactApi } from "./gameCoreReactApi.js";\n'
    if react_import not in core:
        raise SystemExit('react import line not found')
    core = core.replace(react_import, react_import + progress_import)

old_bridge = '''const reactApi = createGameCoreReactApi({
  getState: () => gameState,
  getMetricColor,
  areaInfrastructureStats,
  areaName,
  describeDeconstructionProject,
  monthLabel,
  deconstructionStatusLabel,
  pickStripComment,
  currentDramaProfile,
  getWorstInfrastructure,
  getMostVolatileRegion,
  phaseLabel,
  formatMoney,
  buildSummaryMessage,
  phaseActionText,
  setScreen,
  advanceMonth,
  labelEventKind,
  balanceChoiceScore,
  applyEventChoice,
  getBudgetTotal,
  detectActiveBudgetPreset,
  recommendBudgetPreset,
  applyBudgetPreset,
  autoBalanceBudget,
  applyBudgetPlan,
  adjustBudget,
  setBudgetValue,
  resetGame,
  render,
});

'''

new_bridge = '''const progressApi = createGameCoreProgressApi({
  getState: () => gameState,
  alertUser: (message) => alert(message),
  clone,
  clamp,
  formatMoney,
  conditionToStatus,
  areaInfrastructureStats,
  getWorstInfrastructure,
  areaName,
  monthLabel,
  getDeconstructionProjectByTarget,
  summarizeBudgetAllocation,
  summarizeEffectSignals,
  eventImpactScore,
  setScreen,
  render,
  monthlyEventPool,
  buildYearCausalSummary: (...args) => reportApi.buildYearCausalSummary(...args),
  generateYearEndReport: (...args) => reportApi.generateYearEndReport(...args),
});

const currentDramaProfile = (...args) => progressApi.currentDramaProfile(...args);
const getMostVolatileRegion = (...args) => progressApi.getMostVolatileRegion(...args);
const applyBudgetPlan = (...args) => progressApi.applyBudgetPlan(...args);
const getBudgetTotal = (...args) => progressApi.getBudgetTotal(...args);
const applyBudgetPreset = (...args) => progressApi.applyBudgetPreset(...args);
const detectActiveBudgetPreset = (...args) => progressApi.detectActiveBudgetPreset(...args);
const recommendBudgetPreset = (...args) => progressApi.recommendBudgetPreset(...args);
const autoBalanceBudget = (...args) => progressApi.autoBalanceBudget(...args);
const adjustBudget = (...args) => progressApi.adjustBudget(...args);
const setBudgetValue = (...args) => progressApi.setBudgetValue(...args);
const applyEventChoice = (...args) => progressApi.applyEventChoice(...args);
const advanceMonth = (...args) => progressApi.advanceMonth(...args);
const checkGameState = (...args) => progressApi.checkGameState(...args);
const setGameOver = (...args) => progressApi.setGameOver(...args);
const balanceChoiceScore = (...args) => progressApi.balanceChoiceScore(...args);

const reactApi = createGameCoreReactApi({
  getState: () => gameState,
  getMetricColor,
  areaInfrastructureStats,
  areaName,
  describeDeconstructionProject,
  monthLabel,
  deconstructionStatusLabel,
  pickStripComment,
  currentDramaProfile,
  getWorstInfrastructure,
  getMostVolatileRegion,
  phaseLabel,
  formatMoney,
  buildSummaryMessage,
  phaseActionText,
  setScreen,
  advanceMonth,
  labelEventKind,
  balanceChoiceScore,
  applyEventChoice,
  getBudgetTotal,
  detectActiveBudgetPreset,
  recommendBudgetPreset,
  applyBudgetPreset,
  autoBalanceBudget,
  applyBudgetPlan,
  adjustBudget,
  setBudgetValue,
  resetGame,
  render,
});

'''
if old_bridge not in core:
    raise SystemExit('react bridge block not found')
core = core.replace(old_bridge, new_bridge, 1)

core = core.replace('''const reportApi = createGameCoreReportApi({
  getState: () => gameState,
  clamp,
  formatMoney,
  areaName,
  getWorstInfrastructure,
  currentDramaProfile,
  summarizeBudgetAllocation,
  render,
  setScreen,
  resetGame,
});
''', '''const reportApi = createGameCoreReportApi({
  getState: () => gameState,
  clamp,
  formatMoney,
  areaName,
  getWorstInfrastructure,
  currentDramaProfile: (...args) => progressApi.currentDramaProfile(...args),
  summarizeBudgetAllocation,
  render,
  setScreen,
  resetGame,
});
''', 1)

core_path.write_text(core)
print('C-3 split progress applied')
