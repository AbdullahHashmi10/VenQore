import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const measuresPath = path.resolve(__dirname, '../resources/data/reckoner/measures.json');
const measures = JSON.parse(fs.readFileSync(measuresPath, 'utf8'));

console.log('Total measures:', Object.keys(measures).length);
