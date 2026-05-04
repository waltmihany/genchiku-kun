from pathlib import Path

root = Path('/home/user/genchiku-kun-v3')
core_path = root / 'src/legacy/gameCore.js'
react_path = root / 'src/legacy/gameCoreReactApi.js'
report_path = root / 'src/legacy/gameCoreReportApi.js'

core = core_path.read_text()
react = react_path.read_text()


def extract_function(text: str, name: str):
    marker = f'function {name}('
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f'{name} not found')
    brace = 0
    first_brace = text.find('{', start)
    if first_brace == -1:
        raise SystemExit(f'{name} opening brace not found')
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
    return text[start:end], start, end

core_order = [
    'buildYearCausalSummary',
    'generateYearEndReport',
    'resultMetricTone',
    'buildResultReviewData',
]
react_order = [
    'overallReportPriority',
    'buildSelectedReportLinks',
    'getReportViewModel',
    'runReportSelectEntry',
    'runReportOpenBudget',
    'getResultViewModel',
    'runResultRestart',
    'runResultReviewReport',
]

core_blocks = {}
for name in core_order:
    block, _, _ = extract_function(core, name)
    core_blocks[name] = block

react_blocks = {}
for name in react_order:
    block, _, _ = extract_function(react, name)
    react_blocks[name] = block

report_module = '''import { AREA_ORDER, BUDGET_PRESETS, budgetCategories } from "../data/gameStaticData.js";
import { buildOpeningReportEntry, REPORT_BIAS_PROFILES } from "../data/reportStaticData.js";
import { staffData } from "../data/staffData.js";

export function createGameCoreReportApi(ctx) {
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
    clamp,
    formatMoney,
    areaName,
    getWorstInfrastructure,
    currentDramaProfile,
    summarizeBudgetAllocation,
    render,
    setScreen,
    resetGame,
  } = ctx;

'''
for name in core_order:
    report_module += core_blocks[name] + '\n\n'
for name in react_order:
    report_module += react_blocks[name] + '\n\n'
report_module += '''  return {
    buildYearCausalSummary,
    generateYearEndReport,
    buildResultReviewData,
    getReportViewModel,
    runReportSelectEntry,
    runReportOpenBudget,
    getResultViewModel,
    runResultRestart,
    runResultReviewReport,
  };
}
'''
report_path.write_text(report_module)

# Remove extracted functions from core and react
for name in core_order:
    block, _, _ = extract_function(core, name)
    core = core.replace(block + '\n\n', '', 1)
    core = core.replace(block + '\n', '', 1)
    core = core.replace(block, '', 1)

for name in react_order:
    block, _, _ = extract_function(react, name)
    react = react.replace(block + '\n\n', '', 1)
    react = react.replace(block + '\n', '', 1)
    react = react.replace(block, '', 1)

# Update imports in core
core = core.replace('import { buildOpeningReportEntry, REPORT_BIAS_PROFILES } from "../data/reportStaticData.js";\n', '')
if 'import { createGameCoreReportApi } from "./gameCoreReportApi.js";\n' not in core:
    core = core.replace('import { createGameCoreReactApi } from "./gameCoreReactApi.js";\n', 'import { createGameCoreReactApi } from "./gameCoreReactApi.js";\nimport { createGameCoreReportApi } from "./gameCoreReportApi.js";\n')

# Remove report helper deps from react api ctx object in core
core = core.replace('''  setBudgetValue,\n  buildYearCausalSummary,\n  buildResultReviewData,\n  resetGame,\n  render,\n});\n\nexport const getTitleViewModel = (...args) => reactApi.getTitleViewModel(...args);\n''', '''  setBudgetValue,\n  resetGame,\n  render,\n});\n\nconst reportApi = createGameCoreReportApi({\n  getState: () => gameState,\n  clamp,\n  formatMoney,\n  areaName,\n  getWorstInfrastructure,\n  currentDramaProfile,\n  summarizeBudgetAllocation,\n  render,\n  setScreen,\n  resetGame,\n});\n\nconst buildYearCausalSummary = (...args) => reportApi.buildYearCausalSummary(...args);\nconst generateYearEndReport = (...args) => reportApi.generateYearEndReport(...args);\nconst buildResultReviewData = (...args) => reportApi.buildResultReviewData(...args);\n\nexport const getTitleViewModel = (...args) => reactApi.getTitleViewModel(...args);\n''')

core = core.replace('''export const getBudgetSetValue = (...args) => reactApi.runBudgetSetValue(...args);''', 'export const getBudgetSetValue = (...args) => reactApi.runBudgetSetValue(...args);')

core = core.replace('''export const getBudgetViewModel = (...args) => reactApi.getBudgetViewModel(...args);\nexport const runBudgetSelectPreset = (...args) => reactApi.runBudgetSelectPreset(...args);\nexport const runBudgetAutoBalance = (...args) => reactApi.runBudgetAutoBalance(...args);\nexport const runBudgetApplyPlan = (...args) => reactApi.runBudgetApplyPlan(...args);\nexport const runBudgetStep = (...args) => reactApi.runBudgetStep(...args);\nexport const runBudgetSetValue = (...args) => reactApi.runBudgetSetValue(...args);\nexport const getReportViewModel = (...args) => reactApi.getReportViewModel(...args);\nexport const runReportSelectEntry = (...args) => reactApi.runReportSelectEntry(...args);\nexport const runReportOpenBudget = (...args) => reactApi.runReportOpenBudget(...args);\nexport const getResultViewModel = (...args) => reactApi.getResultViewModel(...args);\nexport const runResultRestart = (...args) => reactApi.runResultRestart(...args);\nexport const runResultReviewReport = (...args) => reactApi.runResultReviewReport(...args);\n''', '''export const getBudgetViewModel = (...args) => reactApi.getBudgetViewModel(...args);\nexport const runBudgetSelectPreset = (...args) => reactApi.runBudgetSelectPreset(...args);\nexport const runBudgetAutoBalance = (...args) => reactApi.runBudgetAutoBalance(...args);\nexport const runBudgetApplyPlan = (...args) => reactApi.runBudgetApplyPlan(...args);\nexport const runBudgetStep = (...args) => reactApi.runBudgetStep(...args);\nexport const runBudgetSetValue = (...args) => reactApi.runBudgetSetValue(...args);\nexport const getReportViewModel = (...args) => reportApi.getReportViewModel(...args);\nexport const runReportSelectEntry = (...args) => reportApi.runReportSelectEntry(...args);\nexport const runReportOpenBudget = (...args) => reportApi.runReportOpenBudget(...args);\nexport const getResultViewModel = (...args) => reportApi.getResultViewModel(...args);\nexport const runResultRestart = (...args) => reportApi.runResultRestart(...args);\nexport const runResultReviewReport = (...args) => reportApi.runResultReviewReport(...args);\n''')

# Clean up react api return object and ctx destructuring
react = react.replace('''    setBudgetValue,\n    buildYearCausalSummary,\n    buildResultReviewData,\n    resetGame,\n    render,\n  } = ctx;\n''', '''    setBudgetValue,\n    resetGame,\n    render,\n  } = ctx;\n''')

react = react.replace('''    getBudgetViewModel,\n    runBudgetSelectPreset,\n    runBudgetAutoBalance,\n    runBudgetApplyPlan,\n    runBudgetStep,\n    runBudgetSetValue,\n    getReportViewModel,\n    runReportSelectEntry,\n    runReportOpenBudget,\n    getResultViewModel,\n    runResultRestart,\n    runResultReviewReport,\n  };\n''', '''    getBudgetViewModel,\n    runBudgetSelectPreset,\n    runBudgetAutoBalance,\n    runBudgetApplyPlan,\n    runBudgetStep,\n    runBudgetSetValue,\n  };\n''')

core_path.write_text(core)
react_path.write_text(react)
print('C-2 split report/result applied')
