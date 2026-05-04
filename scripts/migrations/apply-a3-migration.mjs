import fs from 'fs';

const filePath = '/home/user/genchiku-kun-v3/src/legacy/gameCore.js';
let source = fs.readFileSync(filePath, 'utf8');

const oldImports = `import { DECONSTRUCTION_CANDIDATES } from "../data/deconstructionCandidates.js";
import { AREA_ORDER, BUDGET_PRESETS, MONTHS, REGION_TRAITS, budgetCategories } from "../data/gameStaticData.js";
import { staffData } from "../data/staffData.js";
`;

const newImports = `import { DECONSTRUCTION_CANDIDATES } from "../data/deconstructionCandidates.js";
import { AREA_ORDER, BUDGET_PRESETS, MONTHS, REGION_TRAITS, budgetCategories } from "../data/gameStaticData.js";
import { createMonthlyEventPool } from "../data/monthlyEventPool.js";
import { buildOpeningReportEntry, REPORT_BIAS_PROFILES } from "../data/reportStaticData.js";
import { staffData } from "../data/staffData.js";
`;

if (!source.includes(oldImports)) {
  throw new Error('Import block not found');
}
source = source.replace(oldImports, newImports);

const monthlyEventRegex = /const monthlyEventPool = \[[\s\S]*?\n\];\n\nlet gameState = null;/;
if (!monthlyEventRegex.test(source)) {
  throw new Error('monthlyEventPool block not found');
}
source = source.replace(monthlyEventRegex, 'const monthlyEventPool = createMonthlyEventPool({ getWorstInfrastructure, getInfrastructureById });\n\nlet gameState = null;');

const biasProfilesRegex = /  const biasProfiles = \{[\s\S]*?\n  \};\n\n/;
if (!biasProfilesRegex.test(source)) {
  throw new Error('biasProfiles block not found');
}
source = source.replace(biasProfilesRegex, '  const biasProfiles = REPORT_BIAS_PROFILES;\n\n');

const openingNoteRegex = /  if \(opening\) \{\n    entries\.unshift\(\{[\s\S]*?\n    \}\);\n  \}/;
if (!openingNoteRegex.test(source)) {
  throw new Error('openingNote block not found');
}
source = source.replace(openingNoteRegex, '  if (opening) {\n    entries.unshift(buildOpeningReportEntry({ areaName, volatileRegion }));\n  }');

fs.writeFileSync(filePath, source);
console.log('A-3 migration applied');
