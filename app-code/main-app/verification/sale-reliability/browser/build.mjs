// Bundles the harness pages with esbuild (already a dependency through Vite).
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '../../../resources/js');

export async function buildHarness(outdir) {
    const common = {
        bundle: true, format: 'iife', platform: 'browser', target: 'chrome110', outdir, logLevel: 'silent',
        jsx: 'automatic', loader: { '.js': 'jsx' },
        define: { 'process.env.NODE_ENV': '"production"' },
        alias: { '@inertiajs/react': path.join(here, 'inertia-stub.js') },
        plugins: [{
            name: 'at-alias',
            setup(b) {
                b.onResolve({ filter: /^@\// }, async (args) => b.resolve('./' + args.path.slice(2), { resolveDir: app, kind: args.kind }));
            },
        }],
    };
    await build({ ...common, entryPoints: { harness: path.join(here, 'harness.jsx'), old: path.join(here, 'old-build.js') } });
}
