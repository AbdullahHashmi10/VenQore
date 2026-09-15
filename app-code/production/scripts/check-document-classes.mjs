#!/usr/bin/env node
/**
 * check-document-classes — refuses a `vqdoc-*` class the stylesheet has never
 * heard of.
 *
 * The document screens are styled entirely by document-law.css. A class name
 * that does not exist there produces no error, no warning and no visible clue:
 * the element simply renders unstyled, which is how a twelve-column header grid
 * came out as twelve full-width rows and an items table that was supposed to
 * scroll inside its own box grew the whole page instead.
 *
 * That is a mistake worth catching once rather than thirteen times, so:
 *
 *     node scripts/check-document-classes.mjs
 *
 * Exits non-zero and names the file, the line and the class.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CSS = 'resources/js/Documents/document-law.css';
const ROOTS = ['resources/js/Documents', 'resources/js/Pages'];

const walk = (dir, out = []) => {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (name === 'node_modules' || name.startsWith('.')) continue;
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(jsx?|tsx?)$/.test(p)) out.push(p);
    }
    return out;
};

const css = readFileSync(join(ROOT, CSS), 'utf8');
const defined = new Set([...css.matchAll(/\.(vqdoc[\w-]*)/g)].map((m) => m[1]));

/* Class names built at runtime — `vqdoc-opt${stack ? ' x' : ''}` — cannot be
   checked statically and are not a mistake. Only whole literal names are. */
const LITERAL = /^vqdoc-[a-z0-9-]+$/;

const problems = [];
for (const dir of ROOTS) {
    for (const file of walk(join(ROOT, dir))) {
        const src = readFileSync(file, 'utf8');
        const lines = src.split('\n');
        lines.forEach((line, i) => {
            for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
                const raw = `${m[1] || ''} ${m[2] || ''}`;
                for (const token of raw.split(/\s+/)) {
                    if (!token.startsWith('vqdoc')) continue;
                    if (!LITERAL.test(token)) continue;      // interpolated
                    if (defined.has(token)) continue;
                    problems.push({ file: relative(ROOT, file), line: i + 1, token });
                }
            }
        });
    }
}

if (!problems.length) {
    console.log(`document classes OK — every vqdoc-* class is defined in ${CSS}`);
    process.exit(0);
}

console.error(`\n${problems.length} class name${problems.length === 1 ? '' : 's'} not defined in ${CSS}:\n`);
for (const p of problems) {
    console.error(`  ${p.file}:${p.line}  .${p.token}`);
}
console.error('\nEither add the rule to document-law.css or use the name that already exists.\n');
process.exit(1);
