#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Semantic sweep — infer intent from the JSX, not from the string          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *     node scripts/v6-semantic.mjs            # dry run + report
 *     node scripts/v6-semantic.mjs --apply
 *
 * ── Why this needs an AST ───────────────────────────────────────────────────
 *
 * `bg-neutral-100` records a PIGMENT. It does not record why. Four different V6
 * tokens are all light grey in light mode — a well, a hover state, the page, a
 * disabled control — and they diverge hard in dark mode, so a wrong guess is
 * invisible today and obvious the first time someone flips the theme.
 *
 * The earlier regex passes could only read the class and its own line. That was
 * enough for pairs (`bg-white dark:bg-neutral-800` can only mean card) and for
 * variant prefixes (`hover:` can only mean hover). It is not enough for a bare
 * background, because the thing that says what a bare background IS sits in the
 * ELEMENT and its ANCESTORS: a `<th>`, a wrapper with `min-h-screen`, a
 * `role="dialog"`.
 *
 * So this parses, walks the tree, and classifies with the ancestor chain in hand.
 *
 * ── Why it splices rather than regenerates ──────────────────────────────────
 *
 * `@babel/generator` would reformat every file it touches, burying eight real
 * changes in a four-thousand-line diff. Each replacement is written back by
 * character offset instead, so the file is byte-identical except for the classes
 * that actually moved.
 *
 * ── The class names ─────────────────────────────────────────────────────────
 *
 * These are the names THIS config exposes, which are not the generic ones:
 *
 *     bg-surface        not bg-card
 *     border-line       not border-subtle        (named `line` so it reads
 *     text-ink          not text-primary          `border-line-strong`, not
 *     text-ink-muted    not text-secondary        `border-border-strong`)
 *     text-ink-faint    not text-disabled
 *
 * A class that does not exist compiles to nothing and the element silently
 * inherits — which is exactly how 73 dead `neutral-750`-style classes shipped
 * here for months. Every name below is verified against the built CSS.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default ?? _traverse;
const APPLY = process.argv.includes('--apply');
const ROOT = 'resources/js';

/* ------------------------------------------------------------------ *
 * Classification
 * ------------------------------------------------------------------ */

const NEUTRAL = String.raw`(?:neutral|slate|zinc|gray|stone)`;
const TOKEN_RE = new RegExp(
    String.raw`(?<variant>(?:[a-z-]+:)*)(?<prop>bg|text|border|divide|ring|from|to|via)-${NEUTRAL}-(?<stop>\d{2,3})(?<alpha>/\[?[\d.]+\]?)?`,
    'g',
);

/** Ancestor-derived facts about where a className sits. */
function contextOf(pathNode) {
    const ctx = {
        tag: null, tags: [], attrs: new Set(), roles: new Set(),
        isHeading: false, isTableHeader: false, isDialog: false,
        isPageRoot: false, isDisabled: false, isControl: false,
    };

    let el = pathNode.findParent((p) => p.isJSXElement());
    let depth = 0;

    while (el && depth < 8) {
        const open = el.node.openingElement;
        const name = open.name?.name
            ?? (open.name?.property?.name ? `${open.name.object?.name}.${open.name.property.name}` : null);

        if (name) {
            ctx.tags.push(name);
            if (depth === 0) ctx.tag = name;

            if (/^h[1-4]$/.test(name)) ctx.isHeading = true;
            if (name === 'th' || name === 'thead') ctx.isTableHeader = true;
            if (/^(input|textarea|select|button|option)$/.test(name)) ctx.isControl = true;
            if (/(Modal|Dialog|Popover|Dropdown|Sheet|Flyout|Menu)/.test(name)) ctx.isDialog = true;
        }

        for (const a of open.attributes) {
            if (a.type !== 'JSXAttribute' || !a.name?.name) continue;
            const an = a.name.name;
            ctx.attrs.add(an);

            const v = a.value?.type === 'StringLiteral' ? a.value.value : null;
            // Only the element ITSELF. `disabled` is not inherited: a label
            // inside a disabled button is still a label, and treating it as
            // disabled text was turning 700 perfectly ordinary strings faint.
            if (an === 'disabled' && depth === 0) ctx.isDisabled = true;
            if (an === 'role' && v) {
                ctx.roles.add(v);
                if (v === 'dialog' || v === 'menu' || v === 'listbox') ctx.isDialog = true;
                if (v === 'columnheader') ctx.isTableHeader = true;
            }
            // A wrapper that owns the viewport is the page, not a card.
            if (an === 'className' && v && /\bmin-h-screen\b/.test(v) && depth <= 1) {
                ctx.isPageRoot = true;
            }
            if (an === 'className' && v && /\bplaceholder[-:]/.test(v)) {
                ctx.attrs.add('placeholderish');
            }
        }

        el = el.parentPath?.findParent((p) => p.isJSXElement());
        depth++;
    }

    return ctx;
}

/** The whole className string, for local clues the ancestors do not carry. */
function looksLikeCard(raw) {
    return /\brounded-(md|lg|xl|2xl)\b/.test(raw)
        && (/\bborder\b/.test(raw) || /\bshadow-/.test(raw));
}

/** Stops Tailwind does not have. These compile to nothing and always did. */
const DEAD_STOPS = new Set([155, 255, 355, 455, 555, 655, 755, 855]);

const INK_BY_STOP = (s) =>
    s >= 800 ? 'text-ink'
        : s >= 600 ? 'text-ink-secondary'
            : s >= 400 ? 'text-ink-muted'
                : 'text-ink-faint';

/**
 * Decide what one token becomes. Returns null to leave it alone — which is a
 * real answer, not a failure. A deliberately dark panel written as
 * `bg-neutral-900` already renders V6 ink in both modes, and forcing a
 * mode-aware token onto it would turn it pale in light mode.
 */
function classify({ variant, prop, stop, alpha }, ctx, raw) {
    const s = Number(stop);
    const v = variant || '';
    const isHover = /(^|:)(hover|group-hover)-?:?$/.test(v) || /\b(hover|group-hover):$/.test(v);
    const isFocus = /\b(focus|focus-within|active|focus-visible):$/.test(v);
    const isDark = /\bdark:$/.test(v);
    const isPlaceholder = /\bplaceholder:$/.test(v);
    const keep = (cls) => `${v}${cls}${alpha ?? ''}`;

    /*
     * A high stop at LOW alpha is not a dark element — it is near-black ink at
     * 10% on a light surface, which is a hairline. `border-neutral-900/10` and
     * `bg-neutral-900/[0.02]` are the two commonest hairline-and-wash idioms in
     * this codebase, and reading them as "dark panel" gets them exactly
     * backwards. The token already carries the right alpha, so the modifier
     * comes off with the pigment.
     */
    const alphaValue = alpha
        ? Number(String(alpha).replace(/^\/\[?|\]?$/g, '')) || null
        : null;
    const isWash = alphaValue !== null && (alphaValue <= 0.2 || alphaValue <= 20);
    const washed = (cls) => `${v}${cls}`;

    if (prop === 'border' || prop === 'divide' || prop === 'ring') {
        if (isFocus) return keep(`${prop}-focus`);
        // A dark-mode stop is high because dark borders are LIGHTER, not
        // because the border is emphasised. `-line` is mode-aware and already
        // holds the right value on both sides, so the dark half is the default
        // hairline no matter what number it was written as.
        if (isDark) return keep(`${prop}-line`);
        if (isWash) return washed(`${prop}-line`);
        // A BARE stop at 600+ is a border on a deliberately dark surface — the
        // Platform shell, a hero, the terminal. It already renders V6 ink in
        // both modes. `border-line-strong` is ink-300 in light, so "upgrading"
        // it would visibly lighten every one of those borders.
        if (s >= 600) return null;
        return keep(s >= 400 ? `${prop}-line-strong` : `${prop}-line`);
    }

    if (prop === 'text') {
        if (isPlaceholder || ctx.attrs.has('placeholderish')) return keep('text-ink-faint');
        if (ctx.isDisabled) return keep('text-ink-faint');
        if (isDark) {
            // A dark-only text colour is inverted relative to its stop: what is
            // pale on dark is the LOUDEST ink, not the quietest.
            return keep(s <= 200 ? 'text-ink' : s <= 400 ? 'text-ink-secondary' : 'text-ink-muted');
        }
        if (ctx.isHeading && s >= 600) return keep('text-ink');
        // Same argument as the borders, mirrored. A BARE stop at 300 or below
        // is pale text, which only makes sense on a dark surface. `text-ink-faint`
        // is ink-400 in light — mid grey — so mapping it would darken every
        // caption sitting on a dark panel.
        if (s <= 300) return null;
        return keep(INK_BY_STOP(s));
    }

    if (prop === 'bg') {
        if (isHover) return keep('bg-interactive-hover');
        if (isFocus) return keep('bg-interactive-selected');
        if (ctx.isDisabled) return keep('bg-sunken');
        if (ctx.isTableHeader) return keep('bg-sunken');
        if (isDark) {
            return keep(s >= 900 ? 'bg-app' : s >= 800 ? 'bg-surface' : 'bg-raised');
        }
        if (isWash && s >= 600) return washed('bg-sunken');
        if (ctx.isPageRoot && s <= 200) return keep('bg-app');
        if (ctx.isDialog && s <= 200) return keep('bg-overlay');
        if (looksLikeCard(raw) && s <= 100) return keep('bg-surface');
        if (s <= 300) return keep('bg-sunken');
        // 400+ with no dark: prefix is a DELIBERATELY dark panel — the Platform
        // shell, a hero, the terminal. It already renders V6 ink in both modes.
        return null;
    }

    // Gradient stops carry no intent of their own; they follow their siblings.
    return null;
}

/* ------------------------------------------------------------------ *
 * Walk
 * ------------------------------------------------------------------ */

const stats = new Map();
const left = new Map();
const rawTables = [];
let filesTouched = 0;
let totalChanges = 0;

const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.jsx')) processFile(full);
    }
}

function processFile(file) {
    const src = fs.readFileSync(file, 'utf8');
    if (!new RegExp(`-${NEUTRAL}-\\d`).test(src)) return;

    let ast;
    try {
        ast = parse(src, {
            sourceType: 'module',
            plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'dynamicImport'],
            errorRecovery: true,
        });
    } catch (e) {
        bump(stats, `PARSE FAILED — ${file}`);
        return;
    }

    // Collected as {start, end, text} then applied back-to-front, so earlier
    // offsets stay valid while we splice.
    const edits = [];
    let tableCount = 0;

    traverse(ast, {
        JSXOpeningElement(p) {
            if (p.node.name?.name === 'table') tableCount++;
        },
        JSXAttribute(p) {
            if (p.node.name?.name !== 'className') return;

            const strings = [];
            const val = p.node.value;
            if (val?.type === 'StringLiteral') {
                strings.push(val);
            } else if (val?.type === 'JSXExpressionContainer') {
                // Braces, not a concise arrow: a Babel visitor that RETURNS a
                // value throws, and `Array.push` returns the new length.
                p.traverse({
                    StringLiteral(q) { strings.push(q.node); },
                    TemplateElement(q) { strings.push(q.node); },
                });
                if (val.expression?.type === 'TemplateLiteral') {
                    for (const q of val.expression.quasis) if (!strings.includes(q)) strings.push(q);
                }
            }
            if (!strings.length) return;

            const ctx = contextOf(p);

            for (const node of strings) {
                const isQuasi = node.type === 'TemplateElement';
                const text = isQuasi ? node.value.raw : node.value;
                if (!text || !new RegExp(`-${NEUTRAL}-\\d`).test(text)) continue;

                let changed = false;
                const next = text.replace(TOKEN_RE, (whole, ...args) => {
                    const g = args[args.length - 1];
                    const out = classify(g, ctx, text);
                    if (!out) {
                        bump(left, whole);
                        return whole;
                    }
                    changed = true;
                    bump(stats, out.replace(/^(?:[a-z-]+:)*/, '').replace(/\/.*$/, ''));
                    totalChanges++;
                    return out;
                });

                if (!changed) continue;
                // Offsets: a StringLiteral's own quotes must be preserved, so
                // splice inside them. A TemplateElement has no quotes.
                const start = isQuasi ? node.start : node.start + 1;
                const end = isQuasi ? node.end : node.end - 1;
                edits.push({ start, end, text: next });
            }
        },
    });

    if (tableCount) rawTables.push({ file, tableCount });
    if (!edits.length) return;

    edits.sort((a, b) => b.start - a.start);
    let out = src;
    for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

    filesTouched++;
    if (APPLY) fs.writeFileSync(file, out, 'utf8');
}

walk(ROOT);

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const sorted = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);

console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'} — ${filesTouched} files, ${totalChanges} classes\n`);
console.log('  mapped to');
for (const [k, v] of sorted(stats)) console.log(`    ${String(v).padStart(5)}  ${k}`);

const leftTotal = [...left.values()].reduce((a, b) => a + b, 0);
if (leftTotal) {
    console.log(`\n  left alone — ${leftTotal}`);
    console.log('  A bare bg at stop 400+ is a DELIBERATELY dark panel. It already renders');
    console.log('  V6 ink in both modes; a mode-aware token would turn it pale in light.');
    for (const [k, v] of sorted(left).slice(0, 8)) console.log(`    ${String(v).padStart(5)}  ${k}`);
}

const biggest = rawTables.sort((a, b) => b.tableCount - a.tableCount).slice(0, 10);
if (biggest.length) {
    console.log(`\n  hand-rolled <table> — ${rawTables.length} files, candidates for the vendored DataTable:`);
    for (const t of biggest) console.log(`    ${String(t.tableCount).padStart(3)}  ${t.file.replace('resources/js/', '')}`);
}
