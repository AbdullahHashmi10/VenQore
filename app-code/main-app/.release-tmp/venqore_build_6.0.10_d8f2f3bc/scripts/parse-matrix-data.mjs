import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const matrixPath = path.resolve(__dirname, '../../../extras/reckoner/RECKONER_CARD_CONTRACT_MATRIX.md');
const outDir = path.resolve(__dirname, '../resources/data/reckoner');

export function parseMatrixData() {
  const content = fs.readFileSync(matrixPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const matrixRows = {};
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const secMatch = trimmed.match(/^##\s+([a-z0-9_]+)\s*\(\d+\)/);
    if (secMatch) {
      currentSection = secMatch[1];
      continue;
    }
    if (!trimmed.startsWith('|')) continue;
    const cols = trimmed.split('|').map(s => s.trim());
    if (cols.length < 10) continue;
    const num = parseInt(cols[1], 10);
    if (isNaN(num)) continue;

    const keyShapeMatch = cols[2].match(/`([^`]+)`\s*·\s*([a-z_]+)/i);
    if (!keyShapeMatch) continue;

    const key = keyShapeMatch[1];
    const shape = keyShapeMatch[2];
    const today = cols[3];
    const unitCol = cols[4];
    const target = cols[5];
    const tier = cols[6];
    const status = cols[7];
    const streams = cols[8];
    const check = cols[9];

    // Determine corrected unit
    let unit = null;
    if (unitCol.includes('→') || unitCol.includes('->')) {
      const parts = unitCol.split(/→|->/);
      unit = parts[parts.length - 1].replace(/\*/g, '').trim();
    }

    matrixRows[key] = {
      num,
      section: currentSection,
      key,
      shape,
      today,
      unitCol,
      correctedUnit: unit,
      target,
      tier,
      status,
      streams: streams.split(',').map(s => s.trim()),
      streamsRaw: streams,
      check: check === '—' ? null : check,
    };
  }

  return matrixRows;
}
