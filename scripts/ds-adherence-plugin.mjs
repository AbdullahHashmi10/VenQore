/**
 * ds-adherence-plugin.mjs — the oxlint rule behind `npm run ds:check`.
 *
 * Reads `resources/js/Components/ds/_adherence.json` (generated from the 26
 * `.d.ts` files by `scripts/ds-adherence.mjs`) and refuses three things grep
 * cannot see, because all three depend on WHICH component an attribute is on:
 *
 *   ds/no-unknown-prop     <Badge className="mt-2">     Badge has no className
 *   ds/enum                <Alert tone="urgent">        info|success|warning|danger
 *   ds/required-prop       <IconButton />               `label` is required
 *
 * ── Why these fail silently today ───────────────────────────────────────────
 *
 * React drops an unknown prop without a word. An out-of-range enum falls
 * through the component's own `switch` to its default branch. So the screen
 * paints, looks approximately right, and is wrong — which costs more than a
 * crash, because nothing points at it.
 *
 * ── Resolving the name before firing ────────────────────────────────────────
 *
 * `SidebarItem`, `StatCard` and `DataTable` each exist TWICE in this codebase —
 * once under `Components/` and once in the design system — with different
 * props. A rule keyed on the bare JSX name would flag every use of the app's
 * own three. So every file's imports are collected first and a check only runs
 * on an identifier that provably resolves to `@/Components/ds`.
 *
 * ── Where it deliberately says nothing ──────────────────────────────────────
 *
 *   <Alert {...props} />          a spread may supply anything; required-prop
 *                                 checks are suppressed for that element
 *   <Alert tone={t} />            not a literal, so not ours to police
 *   <ds.Alert />                  namespace imports are not resolved
 *   `"sm" | number` unions        not a pure string union → no whitelist
 *
 * Each of those is a place where a stricter rule would reject legal code, and a
 * lint rule that cries wolf is a lint rule somebody switches off.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRACT = path.join(ROOT, 'resources', 'js', 'Components', 'ds', '_adherence.json');

if (!fs.existsSync(CONTRACT)) {
    throw new Error(
        `[ds-adherence] ${path.relative(ROOT, CONTRACT)} is missing.\n`
        + '                Run: npm run ds:contract',
    );
}

const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
const UNIVERSAL = new Set(contract.universal ?? []);

/** True for `@/Components/ds` and anything beneath it. */
function isDsModule(source) {
    return contract.modules.includes(source) || source.startsWith(contract.modulePrefix);
}

/** `data-*` and `aria-*` are HTML contracts, not component contracts. */
function isPassThrough(name) {
    return UNIVERSAL.has(name) || name.startsWith('data-') || name.startsWith('aria-');
}

/** The string a JSX attribute value carries, or null when it is not a literal. */
function literalValue(value) {
    if (!value) return null;

    // tone="info"
    if (value.type === 'Literal' || value.type === 'StringLiteral') {
        return typeof value.value === 'string' ? value.value : null;
    }

    // tone={"info"}
    if (value.type === 'JSXExpressionContainer') return literalValue(value.expression);

    return null;
}

/**
 * One pass per file.
 *
 * JSX elements are banked and checked on `Program:exit` rather than inline, so
 * the import map is guaranteed complete first. Imports are conventionally at
 * the top of a module, but "conventionally" is not a thing to key correctness
 * on when deferring costs one array.
 */
function create(context, check) {
    /** local JSX name → design-system component name */
    const imported = new Map();
    const elements = [];

    return {
        ImportDeclaration(node) {
            if (!isDsModule(node.source.value)) return;

            for (const spec of node.specifiers) {
                // `import { Button as Btn }` — Btn is what appears in the JSX.
                if (spec.type === 'ImportSpecifier') {
                    imported.set(spec.local.name, spec.imported.name ?? spec.imported.value);
                }
                // A default import from a single-component path: ds/core/Button.
                if (spec.type === 'ImportDefaultSpecifier') {
                    const base = path.basename(node.source.value);
                    if (contract.components[base]) imported.set(spec.local.name, base);
                }
            }
        },

        JSXOpeningElement(node) {
            if (node.name?.type === 'JSXIdentifier') elements.push(node);
        },

        'Program:exit': function () {
            for (const node of elements) {
                const component = imported.get(node.name.name);
                const shape = component && contract.components[component];
                if (shape) check(context, node, component, shape);
            }
        },
    };
}

/* ------------------------------------------------------------------ *
 * Rules
 * ------------------------------------------------------------------ */

const noUnknownProp = {
    meta: {
        docs: { description: 'Every prop on a design-system component must exist on it.' },
    },
    create: (context) => create(context, (ctx, node, component, shape) => {
        const allowed = new Set(shape.props);

        for (const attr of node.attributes) {
            if (attr.type !== 'JSXAttribute') continue;

            const name = attr.name?.name;
            if (typeof name !== 'string' || isPassThrough(name) || allowed.has(name)) continue;

            const near = closest(name, shape.props);

            ctx.report({
                node: attr,
                message: `<${component}> has no prop "${name}"`
                    + `${near ? ` — did you mean "${near}"?` : '.'}`
                    + ' React drops it silently. See ds/' + shape.source + '.',
            });
        }
    }),
};

const enumRule = {
    meta: {
        docs: { description: 'A design-system enum prop must carry one of its declared values.' },
    },
    create: (context) => create(context, (ctx, node, component, shape) => {
        if (!shape.enums) return;

        for (const attr of node.attributes) {
            if (attr.type !== 'JSXAttribute') continue;

            const name = attr.name?.name;
            const allowed = typeof name === 'string' ? shape.enums[name] : null;
            if (!allowed) continue;

            const value = literalValue(attr.value);

            // Bare `<Button full>` on an enum prop, or a non-literal value.
            if (value === null) {
                if (attr.value === null) {
                    ctx.report({
                        node: attr,
                        message: `<${component} ${name}> is a value prop, not a flag. `
                            + `It takes one of: ${allowed.join(' | ')}.`,
                    });
                }
                continue;
            }

            if (allowed.includes(value)) continue;

            const near = closest(value, allowed);

            ctx.report({
                node: attr,
                message: `<${component} ${name}="${value}"> is not one of `
                    + `${allowed.join(' | ')}`
                    + `${near ? ` — did you mean "${near}"?` : '.'}`
                    + ' The component falls through to its default and the screen looks nearly right.',
            });
        }
    }),
};

const requiredProp = {
    meta: {
        docs: { description: 'A required design-system prop must be passed.' },
    },
    create: (context) => create(context, (ctx, node, component, shape) => {
        if (!shape.required.length) return;

        // A spread may carry anything; claiming a prop is missing would be a guess.
        if (node.attributes.some((a) => a.type === 'JSXSpreadAttribute')) return;

        const given = new Set(
            node.attributes
                .filter((a) => a.type === 'JSXAttribute' && typeof a.name?.name === 'string')
                .map((a) => a.name.name),
        );

        const missing = shape.required.filter((p) => !given.has(p));
        if (!missing.length) return;

        ctx.report({
            node,
            message: `<${component}> is missing required `
                + `${missing.length === 1 ? 'prop' : 'props'} `
                + `${missing.map((p) => `"${p}"`).join(', ')}. See ds/${shape.source}.`,
        });
    }),
};

/* ------------------------------------------------------------------ *
 * "did you mean"
 * ------------------------------------------------------------------ */

/**
 * Nearest candidate within an edit distance of a third of its length.
 *
 * A suggestion is the difference between a developer fixing a typo in four
 * seconds and going to read the `.d.ts`. The threshold scales with length so
 * `tone` → `type` (distance 2 on a 4-letter word) is NOT offered — at short
 * lengths, two edits is a different word rather than a slip.
 */
function closest(word, candidates) {
    let best = null;
    let bestDistance = Infinity;

    for (const candidate of candidates) {
        const d = distance(word.toLowerCase(), candidate.toLowerCase());
        if (d < bestDistance) { bestDistance = d; best = candidate; }
    }

    return bestDistance <= Math.max(1, Math.floor(word.length / 3)) ? best : null;
}

function distance(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 1; i <= a.length; i++) {
        const row = [i];

        for (let j = 1; j <= b.length; j++) {
            row[j] = Math.min(
                prev[j] + 1,
                row[j - 1] + 1,
                prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
            );
        }

        prev = row;
    }

    return prev[b.length];
}

export default {
    meta: { name: 'ds' },
    rules: {
        'no-unknown-prop': noUnknownProp,
        enum: enumRule,
        'required-prop': requiredProp,
    },
};
