from pathlib import Path
import re

root = Path('/home/user/genchiku-kun-v3')
core_path = root / 'src/legacy/gameCore.js'
api_path = root / 'src/legacy/gameCoreReactApi.js'
text = core_path.read_text()

start_marker = 'export function getTitleViewModel() {'
end_marker = 'export function runResultReviewReport() {'
start = text.find(start_marker)
if start == -1:
    raise SystemExit('start marker not found')
end = text.find(end_marker)
if end == -1:
    raise SystemExit('end marker not found')

brace = 0
end_pos = None
for i in range(end, len(text)):
    ch = text[i]
    if ch == '{':
        brace += 1
    elif ch == '}':
        brace -= 1
        if brace == 0:
            end_pos = i + 1
            break
if end_pos is None:
    raise SystemExit('could not find end of runResultReviewReport')

segment = text[start:end_pos]
segment = re.sub(r'export function\s+', 'function ', segment)

api_text = '''import { AREA_ORDER, BUDGET_PRESETS, MONTHS, REGION_TRAITS, budgetCategories } from "../data/gameStaticData.js";
import { staffData } from "../data/staffData.js";

export function createGameCoreReactApi(ctx) {
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
    buildYearCausalSummary,
    buildResultReviewData,
    resetGame,
    render,
  } = ctx;

'''+segment+'''

  return {
    getTitleViewModel,
    runTitleStartGame,
    runRestartFromTopbar,
    getDashboardViewModel,
    runDashboardPrimaryAction,
    getEventViewModel,
    runEventChooseChoice,
    getBudgetViewModel,
    runBudgetSelectPreset,
    runBudgetAutoBalance,
    runBudgetApplyPlan,
    runBudgetStep,
    runBudgetSetValue,
    getReportViewModel,
    runReportSelectEntry,
    runReportOpenBudget,
    getResultViewModel,
    runResultRestart,
    runResultReviewReport,
  };
}
'''
api_path.write_text(api_text)

new_text = text.replace(segment, '')
import_line = 'import { staffData } from "../data/staffData.js";\n'
if import_line not in new_text:
    raise SystemExit('staffData import line not found')
new_text = new_text.replace(import_line, import_line + 'import { createGameCoreReactApi } from "./gameCoreReactApi.js";\n')

insert_marker = 'export function runBalanceBatch({ runs = 25, strategy = "recommended", seed = 1 } = {}) {'
if insert_marker not in new_text:
    raise SystemExit('runBalanceBatch marker not found')
insert_block = '''const reactApi = createGameCoreReactApi({
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
  buildYearCausalSummary,
  buildResultReviewData,
  resetGame,
  render,
});

export const getTitleViewModel = (...args) => reactApi.getTitleViewModel(...args);
export const runTitleStartGame = (...args) => reactApi.runTitleStartGame(...args);
export const runRestartFromTopbar = (...args) => reactApi.runRestartFromTopbar(...args);
export const getDashboardViewModel = (...args) => reactApi.getDashboardViewModel(...args);
export const runDashboardPrimaryAction = (...args) => reactApi.runDashboardPrimaryAction(...args);
export const getEventViewModel = (...args) => reactApi.getEventViewModel(...args);
export const runEventChooseChoice = (...args) => reactApi.runEventChooseChoice(...args);
export const getBudgetViewModel = (...args) => reactApi.getBudgetViewModel(...args);
export const runBudgetSelectPreset = (...args) => reactApi.runBudgetSelectPreset(...args);
export const runBudgetAutoBalance = (...args) => reactApi.runBudgetAutoBalance(...args);
export const runBudgetApplyPlan = (...args) => reactApi.runBudgetApplyPlan(...args);
export const runBudgetStep = (...args) => reactApi.runBudgetStep(...args);
export const runBudgetSetValue = (...args) => reactApi.runBudgetSetValue(...args);
export const getReportViewModel = (...args) => reactApi.getReportViewModel(...args);
export const runReportSelectEntry = (...args) => reactApi.runReportSelectEntry(...args);
export const runReportOpenBudget = (...args) => reactApi.runReportOpenBudget(...args);
export const getResultViewModel = (...args) => reactApi.getResultViewModel(...args);
export const runResultRestart = (...args) => reactApi.runResultRestart(...args);
export const runResultReviewReport = (...args) => reactApi.runResultReviewReport(...args);

'''
new_text = new_text.replace(insert_marker, insert_block + insert_marker)
core_path.write_text(new_text)
print('C-1 split script applied')
