import esbuild from 'esbuild';
import path from 'path';
const r = await esbuild.build({
  entryPoints: ['resources/js/Pages/Pos.jsx'],
  bundle: true, write: false, format: 'esm', logLevel: 'silent',
  loader: {'.js':'jsx','.jsx':'jsx','.css':'css','.svg':'text','.png':'dataurl','.jpg':'dataurl'},
  alias: { '@': path.resolve(process.cwd(), 'resources/js') },
  external: ['react','react-dom','react-dom/*','@inertiajs/react','axios','lucide-react','recharts','dexie','ziggy-js','laravel-vite-plugin/*','@/ziggy'],
}).catch(e => e);
const errs = (r.errors||[]);
console.log(errs.length ? 'ERRORS ' + errs.length : 'BUNDLE OK');
for (const e of errs.slice(0,20)) console.log('-', e.location ? `${e.location.file}:${e.location.line}` : '', e.text);
