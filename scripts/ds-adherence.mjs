#!/usr/bin/env node
/**
 * ds-adherence.mjs — turn the design system's own `.d.ts` files into a machine-
 * checkable contract.
 *
 *     node scripts/ds-adherence.mjs           # regenerate the contract
 *     node scripts/ds-adherence.mjs --check   # fail if the contract is stale
 *
 * ── The gap this closes ─────────────────────────────────────────────────────
 *
 * `scripts/design-check.sh` is nine grep patterns. Grep is the right tool for
 * "does the string `font-extrabold` appear" and the wrong tool for everything
 * that depends on WHICH component an attribute belongs to. These all pass
 * design-check and all render wrong:
 *
 *     <Alert tone="urgent">          tone is info | success | warning | danger
 *     <Button variant="large">       that is a `size`, not a `variant`
 *     <Card tone="dark">             surface | accent | ink
 *     <StatCard deltaTone="green">   up | down | flat
 *     <IconButton>                   `label` is REQUIRED — the glyph is not a name
 *     <Badge className="mt-2">       Badge has no className; the class vanishes
 *
 * Every one fails silently. A React component receiving an unknown prop drops
 * it, and one receiving an out-of-range enum falls through its own `switch` to
 * a default — so the screen renders, looks nearly right, and is wrong. That is
 * strictly worse than a crash, because nothing draws your attention to it.
 *
 * ── Why generate rather than hand-write the whitelist ───────────────────────
 *
 * The 26 `.d.ts` files ALREADY state every prop and every union — they are what
 * the editor reads for autocomplete. Copying those unions into a lint config by
 * hand creates a second source of truth for the same fact, and the copy starts
 * rotting the first time somebody adds a variant. So the `.d.ts` files stay the
 * source, this script derives the contract, and `--check` in CI refuses a build
 * where the two have drifted — the same shape as `theme:check`.
 *
 * ── What lands where ────────────────────────────────────────────────────────
 *
 *   resources/js/Components/ds/*.d.ts             source of truth (hand-written)
 *   resources/js/Components/ds/_adherence.json    contract (GENERATED, committed)
 *   scripts/ds-adherence-plugin.mjs               the oxlint rule that reads it
 *   resources/js/Components/ds/_adherence.oxlintrc.json  wiring
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DS = path.join(ROOT, 'resources', 'js', 'Components', 'ds');
const OUT = path.join(DS, '_adherence.json');
const CHECK = process.argv.includes('--check');

/* ------------------------------------------------------------------ *
 * Read the .d.ts files
 * ------------------------------------------------------------------ */

/** Every `.d.ts` under the ds folder, sorted so the output is stable. */
function declarationFiles(dir = DS, prefix = '') {
    const found = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) found.push(...declarationFiles(path.join(dir, entry.name), rel));
        else if (entry.name.endsWith('.d.ts')) found.push(rel);
    }

    return found;
}

/**
 * A string-literal union, or null.
 *
 * `"a" | "b"` yields the whitelist. `string`, `number`, `React.ReactNode` and
 * every other type yields null, which means "this prop exists, its value is not
 * ours to police". A union containing anything that is not a string literal —
 * `"sm" | number` — also yields null, because a partial whitelist would reject
 * legal code, and a lint rule that cries wolf gets switched off.
 */
function literalUnion(annotation) {
    const node = annotation?.typeAnnotation;
    if (node?.type !== 'TSUnionType') return null;

    const values = [];

    for (const member of node.types) {
        if (member.type !== 'TSLiteralType') return null;
        if (member.literal?.type !== 'StringLiteral') return null;
        values.push(member.literal.value);
    }

    return values.length ? values : null;
}

function readFile(rel) {
    const ast = parse(fs.readFileSync(path.join(DS, rel), 'utf8'), {
        sourceType: 'module',
        plugins: ['typescript'],
    });

    /** Interface name → { props, required, enums } */
    const interfaces = {};
    /** Component name → the interface its single `props` parameter names. */
    const components = {};

    for (const statement of ast.program.body) {
        const decl = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
        if (!decl) continue;

        if (decl.type === 'TSInterfaceDeclaration') {
            const shape = { props: [], required: [], enums: {} };

            for (const member of decl.body.body) {
                if (member.type !== 'TSPropertySignature') continue;

                const name = member.key?.name ?? member.key?.value;
                if (!name) continue;

                shape.props.push(name);
                if (!member.optional) shape.required.push(name);

                const values = literalUnion(member.typeAnnotation);
                if (values) shape.enums[name] = values;
            }

            interfaces[decl.id.name] = shape;
            continue;
        }

        // `export declare function Button(props: ButtonProps): JSX.Element;`
        if (decl.type === 'TSDeclareFunction' || decl.type === 'FunctionDeclaration') {
            const propsType = decl.params?.[0]?.typeAnnotation?.typeAnnotation;
            if (propsType?.type !== 'TSTypeReference') continue;

            const ref = propsType.typeName?.name;
            if (ref) components[decl.id.name] = ref;
        }
    }

    return { interfaces, components };
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

const components = {};
const orphans = [];

for (const rel of declarationFiles()) {
    const { interfaces, components: declared } = readFile(rel);

    for (const [name, interfaceName] of Object.entries(declared)) {
        const shape = interfaces[interfaceName];

        // A component whose props interface is imported from elsewhere. Nothing
        // to whitelist, and guessing would be worse than saying so.
        if (!shape) { orphans.push(`${rel}: ${name} → ${interfaceName}`); continue; }

        components[name] = {
            source: rel,
            props: shape.props,
            required: shape.required,
            ...(Object.keys(shape.enums).length ? { enums: shape.enums } : {}),
        };
    }
}

const contract = {
    $generated: 'scripts/ds-adherence.mjs — do not hand-edit. Source: resources/js/Components/ds/**/*.d.ts',

    /**
     * The rule only fires on a JSX name it can PROVE came from here.
     *
     * `SidebarItem`, `StatCard` and `DataTable` all also exist under
     * `Components/` with different props — see the note in ds/index.js. Firing
     * on the bare name would flag every use of the app's own components, so the
     * plugin resolves each JSX identifier back to its import first.
     */
    modules: ['@/Components/ds'],
    modulePrefix: '@/Components/ds/',

    /**
     * Props React itself consumes, on any component.
     *
     * `className` is deliberately NOT here. These components style themselves
     * entirely through `var(--vq-*)` and not one of them declares `className`,
     * so passing classes to a ds component is a no-op that reads like styling —
     * exactly the silent failure this rule exists to surface.
     */
    universal: ['key', 'ref'],

    components,
};

/* ------------------------------------------------------------------ *
 * Write or verify
 * ------------------------------------------------------------------ */

const next = `${JSON.stringify(contract, null, 2)}\n`;
const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;
const names = Object.keys(components);

if (orphans.length) {
    console.warn(`  ! ${orphans.length} component(s) with an unresolved props interface:`);
    for (const o of orphans) console.warn(`      ${o}`);
}

if (CHECK) {
    if (current !== next) {
        console.error('  ✗ resources/js/Components/ds/_adherence.json is stale.');
        console.error('    A .d.ts changed without the contract being regenerated.');
        console.error('    Run: npm run ds:contract');
        process.exit(1);
    }
    console.log(`  ✓ ds contract current — ${names.length} components.`);
} else {
    fs.writeFileSync(OUT, next);
    console.log(`  ${current === next ? 'unchanged' : 'wrote'} resources/js/Components/ds/_adherence.json — ${names.length} components:`);
    console.log(`      ${names.join(', ')}`);
}
