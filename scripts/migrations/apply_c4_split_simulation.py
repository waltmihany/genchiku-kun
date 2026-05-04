from pathlib import Path

root = Path('/home/user/genchiku-kun-v3')
core_path = root / 'src/legacy/gameCore.js'
sim_path = root / 'src/legacy/gameCoreSimulationApi.js'

core = core_path.read_text()


def extract_function(text: str, marker: str):
    start = text.find(marker)
    if start == -1:
        raise SystemExit(f'marker not found: {marker}')
    first_brace = text.find('{', start)
    if first_brace == -1:
        raise SystemExit(f'opening brace not found: {marker}')
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
        raise SystemExit(f'end not found: {marker}')
    return text[start:end]


markers = [
    'function autoPickEventChoiceIndex(',
    'function applyBudgetPresetForSimulation(',
    'function createSeededRandom(',
    'function runSingleAutoSimulation(',
    'export function runBalanceBatch(',
]

blocks = [extract_function(core, marker) for marker in markers]
processed_blocks = []
for block in blocks:
    if block.startswith('export function '):
        processed_blocks.append(block.replace('export function ', 'function ', 1))
    else:
        processed_blocks.append(block)

module_text = '''import { BUDGET_PRESETS, budgetCategories } from "../data/gameStaticData.js";

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

'''
for block in processed_blocks:
    module_text += block + '\n\n'
module_text += '''  return {
    runSingleAutoSimulation,
    runBalanceBatch,
  };
}
'''
sim_path.write_text(module_text)

for block in blocks:
    core = core.replace(block + '\n\n', '', 1)
    core = core.replace(block + '\n', '', 1)
    core = core.replace(block, '', 1)

sim_import = 'import { createGameCoreSimulationApi } from "./gameCoreSimulationApi.js";\n'
if sim_import not in core:
    report_import = 'import { createGameCoreReportApi } from "./gameCoreReportApi.js";\n'
    if report_import not in core:
        raise SystemExit('report import line not found')
    core = core.replace(report_import, report_import + sim_import, 1)

insert_marker = 'const buildResultReviewData = (...args) => reportApi.buildResultReviewData(...args);\n'
if insert_marker not in core:
    raise SystemExit('insert marker not found')
insert_block = '''const simulationApi = createGameCoreSimulationApi({
  getState: () => gameState,
  setState: (nextState) => {
    gameState = nextState;
  },
  clone,
  buildInitialState,
  generateYearEndReport,
  recommendBudgetPreset,
  applyBudgetPlan,
  applyEventChoice,
  advanceMonth,
  balanceChoiceScore,
});

export const runBalanceBatch = (...args) => simulationApi.runBalanceBatch(...args);
'''
core = core.replace(insert_marker, insert_marker + insert_block, 1)

core_path.write_text(core)
print('C-4 split simulation applied')
