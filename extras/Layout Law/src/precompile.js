/* Precompile the design-system JSX at BUILD time instead of shipping Babel.
   The v5 "COMPLETE standalone" never rendered: @babel/standalone 7.29 defaults
   preset-react to the AUTOMATIC jsx runtime, which emits
     import { jsx as _jsx } from "react/jsx-runtime"
   into a plain (non-module) <script>, and the browser refuses it with
     "Cannot use import statement outside a module".
   Compiling ahead of time with runtime:"classic" removes Babel from the page
   entirely — the file gets smaller, loads faster, and cannot break this way. */
const fs = require('fs');
const babel = require('@babel/standalone');
const [,, inPath, outPath] = process.argv;
let s = fs.readFileSync(inPath, 'utf8');
const openRe = /<script[^>]*type="text\/babel"[^>]*>/;
const open = s.match(openRe);
if (!open) { console.error('no babel script'); process.exit(1); }
const start = s.indexOf(open[0]) + open[0].length;
const end = s.lastIndexOf('</script>');
const code = s.slice(start, end);
const out = babel.transform(code, {
  presets: [['react', { runtime: 'classic', pragma: 'React.createElement',
                        pragmaFrag: 'React.Fragment' }]],
  compact: false,
}).code;
if (/^\s*import\s/m.test(out)) { console.error('still emitting ESM imports'); process.exit(1); }
s = s.slice(0, s.indexOf(open[0])) + '<script>\n' + out + '\n</script>' + s.slice(end + 9);
s = s.replace(/\s*<script[^>]*\bbabel[^>]*><\/script>/g, '');

/* "COMPLETE standalone" has to mean it. React and ReactDOM were still coming
   from unpkg, so the file rendered nothing on a laptop with no network — on a
   plane, behind a firewall, or from a USB stick. They are inlined now. */
const path = require('path');
const vendor = rel => fs.readFileSync(path.join(__dirname, 'node_modules', rel), 'utf8')
                        .replace(/<\/script/gi, '<\\/script');
const inl = (rx, mod, name) => {
  const m = s.match(rx);
  if (!m) { console.error('missing ' + name + ' script tag'); process.exit(1); }
  // A FUNCTION replacer, not a string: minified React is full of `$&` and
  // `$'`, and String.replace would treat those as substitution patterns and
  // splice the page back into the middle of the library.
  const js = '<script>/* ' + name + ' 18.3.1, inlined */\n' + vendor(mod) + '\n</script>';
  s = s.replace(m[0], () => js);
};
inl(/<script[^>]*\breact@[^>]*><\/script>/,      'react/umd/react.production.min.js',         'react');
inl(/<script[^>]*\breact-dom@[^>]*><\/script>/,  'react-dom/umd/react-dom.production.min.js', 'react-dom');
if (/<script[^>]*src="https?:/.test(s))
  console.warn('  ! a remote <script src> survived');
fs.writeFileSync(outPath, s);
console.log('precompiled:', (out.length/1024).toFixed(0) + 'KB of JS,',
            'babel removed, react inlined,',
            (fs.statSync(outPath).size/1024).toFixed(0) + 'KB total');
