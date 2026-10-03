import {build} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const base=decodeURIComponent(root);
const result=await build({configFile:false,define:{"process.env.NODE_ENV":JSON.stringify("production")},root:base,plugins:[react()],resolve:{alias:{'@':path.join(base,'src')}},css:{postcss:{plugins:[tailwind({content:[path.join(base,'sales-workshop.jsx'),path.join(base,'src/components/**/*.{ts,tsx}')],theme:{extend:{}},plugins:[]}),autoprefixer()]}},build:{write:false,minify:true,lib:{entry:path.join(base,'sales-workshop.jsx'),name:'SalesWorkshop',formats:['iife']}}});
const output=(Array.isArray(result)?result[0]:result).output;
const js=output.filter(o=>o.type==='chunk').map(o=>o.code).join('\n');
const css=output.filter(o=>o.type==='asset'&&o.fileName.endsWith('.css')).map(o=>o.source).join('\n');
const dest=path.resolve(base,'../mockups/sales-card-system.html');
let html=fs.readFileSync(path.join(base,'sales-workshop-template.html'),'utf8');
// Keep the written explanation; replace the illustrative SVG lab with the real React/BKLIT lab.
html=html.replace(/<div class="lab">[\s\S]*?<section>/,'<div id="workshop-root"></div>\n<section>');
html=html.replace(/<script>[\s\S]*?<\/script>/g,'');
html=html.replace('12 combinations. Not 12 separate cards.','15 combinations. One reusable Sales definition.').replace('3 sizes × 4 presentations = 12 selectable combinations','3 sizes × 5 presentations = 15 selectable combinations').replace('Line and area share one plotting function. Bars and target progress are shared renderers too.','Line, area, columns, and columns with a comparison line share the BKLIT composed-chart container. Target progress uses BKLIT’s Gauge.').replace('The production implementation should use the vendored BKLIT charts.','This demo uses the actual downloaded BKLIT charts.').replace('line, area, bars</th>','line, area, columns, composed</th>');
html=html.replace(/<footer>[\s\S]*?<\/footer>/,'<footer>Actual downloaded BKLIT charts, React and motion bundled into this single offline HTML file. Fictional sample data. Save stores only this demo’s preferences in your browser. Production dashboard files and data remain untouched.</footer>');
html=html.replace('<style>',()=>'<style>'+css+'</style><style>');
// Additional application styles must follow the base explanation styles.
html=html.replace('</head>','<style>'+fs.readFileSync(path.join(base,'sales-workshop.css'),'utf8').replace(/@tailwind[^;]+;/g,'')+'</style></head>');
html=html.replace('</body>',()=>'<script>'+js.replace(/<\/script/gi,'<\\/script')+'</script></body>');
fs.writeFileSync(dest,html);console.log('Built standalone HTML:',dest,'bytes:',Buffer.byteLength(html));

