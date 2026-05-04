import fs from 'fs';

const filePath = '/home/user/genchiku-kun-v3/src/legacy/gameCore.js';
let source = fs.readFileSync(filePath, 'utf8');

const oldImport = 'import { createMonthlyEventPool } from "../data/monthlyEventPool.js";\n';
const newImport = 'import { mapData } from "../data/mapData.js";\nimport { createMonthlyEventPool } from "../data/monthlyEventPool.js";\n';
if (!source.includes(oldImport)) throw new Error('base import not found');
source = source.replace(oldImport, newImport);

const mapBlockRegex = /const mapData = \{[\s\S]*?\n\};\n\nconst monthlyEventPool = createMonthlyEventPool\(\{ getWorstInfrastructure, getInfrastructureById \}\);/;
if (!mapBlockRegex.test(source)) throw new Error('mapData block not found');
source = source.replace(mapBlockRegex, 'const monthlyEventPool = createMonthlyEventPool({ getWorstInfrastructure, getInfrastructureById });');

fs.writeFileSync(filePath, source);
console.log('A-4 mapData migration applied');
