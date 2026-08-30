import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import fs from 'fs';
const traverse = _traverse.default || _traverse;

const file = process.argv[2];
const ast = parse(fs.readFileSync(file, 'utf8'), {
  sourceType: 'module',
  plugins: ['jsx', 'classProperties', 'objectRestSpread', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport'],
});

const problems = [];
traverse(ast, {
  ReferencedIdentifier(path) {
    const name = path.node.name;
    if (path.scope.hasBinding(name, true)) return;
    if (typeof globalThis[name] !== 'undefined') return;
    const KNOWN = new Set(['route','window','document','localStorage','sessionStorage','console','navigator','process','React','axios','fetch','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','Intl','structuredClone','ResizeObserver','CustomEvent','FormData','Blob','URL','URLSearchParams','AbortController','performance','crypto','alert','confirm','prompt','Image','File','FileReader','IntersectionObserver','MutationObserver','queueMicrotask','btoa','atob','globalThis']);
    if (KNOWN.has(name)) return;
    problems.push({ name, line: path.node.loc?.start.line });
  },
});

const seen = new Map();
for (const p of problems) if (!seen.has(p.name)) seen.set(p.name, p.line);
if (!seen.size) console.log(`OK  ${file} — no unbound identifiers`);
else {
  console.log(`UNBOUND in ${file}:`);
  for (const [n, l] of seen) console.log(`   ${n}  (first use line ${l})`);
}
