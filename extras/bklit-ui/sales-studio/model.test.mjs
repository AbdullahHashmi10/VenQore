import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GRID,rowPixels} from './model.js';
const law=JSON.parse(readFileSync(new URL('../../../app-code/main-app/resources/layout-law.json',import.meta.url),'utf8'));
assert.equal(GRID.unit,law.grid.unit);assert.equal(GRID.gutter,law.grid.gutter);
for(let rows=1;rows<=16;rows++){
 const g=geometry({...defaults,family:'number',variant:'value',size:'custom',rows},900);
 assert.equal(g.rows,rows);assert.equal(g.cardHeight,rows*64+(rows-1)*24);
}
assert.equal(rowPixels(1),64);assert.equal(rowPixels(2),152);assert.equal(rowPixels(3),240);
import {defaults,datasets,families,sizes,chooseDataset,chooseFamily,chooseSize,sizeAllowed,controls,geometry,validate,breakdown,salesTotal,flows,hierarchy,history} from './model.js';
let cases=0;
for(const key of Object.keys(families)){
 const c=chooseFamily(defaults,key);assert.ok(validate(c));assert.ok(datasets[c.dataset].families.includes(key));
 for(const size of Object.keys(sizes))for(const width of [220,280,360,600,900,1440]){
  const copy={...c,size};const before=JSON.stringify(copy),g=geometry(copy,width);
  assert.ok(g.span>=2&&g.span<=12);assert.ok(g.width<=width+.001);assert.ok(g.height>0);assert.equal(JSON.stringify(copy),before);
  if(size==='full')assert.equal(g.span,12);cases++;
 }
}
for(const dataset of Object.keys(datasets)){const c=chooseDataset({...defaults,family:'ring'},dataset);assert.ok(validate(c));assert.ok(datasets[dataset].families.includes(c.family));cases++;}
assert.equal(validate({...chooseFamily(defaults,'gauge'),target:0}),false);assert.equal(validate({...defaults,target:0}),true);assert.equal(validate({...defaults,title:' '}),false);assert.equal(validate({...defaults,dataset:'records',family:'line'}),false);
assert.equal(breakdown.reduce((s,d)=>s+d.value,0),salesTotal);
assert.equal(history.reduce((s,d)=>s+d.store+d.online+d.wholesale,0),salesTotal);
for(const [i,key] of ['store','online','wholesale'].entries())assert.equal(history.reduce((s,d)=>s+d[key],0),breakdown[i].value);
for(const d of history)assert.equal(d.store+d.online+d.wholesale,d.sales);
for(const dataset of Object.keys(datasets)){
 const c=chooseDataset(defaults,dataset),tile=chooseSize(c,'tile');
 assert.equal(tile.dataset,dataset,'Resizing must preserve the business question');
 assert.equal(tile.family==='number',sizeAllowed(c,'tile'));
 assert.ok(validate(tile));
}
assert.equal(chooseSize(chooseDataset(defaults,'pipeline'),'tile').dataset,'pipeline');
assert.equal(validate({...chooseDataset(defaults,'total'),variant:'comparison'}),false);
assert.equal(validate({...chooseDataset(defaults,'total'),variant:'progress'}),false);
assert.ok(validate({...chooseDataset(defaults,'target'),variant:'progress'}));
for(const invalid of [{size:'tile'},{span:2.5},{rows:0},{rows:1.5},{rows:17},{color:'invalid'},{loading:'invalid'},{motion:'yes'}])assert.equal(validate({...defaults,...invalid}),false);
assert.equal(controls(chooseFamily(defaults,'composed')).compare,false);
assert.equal(controls(chooseFamily(defaults,'radar')).color,false);
assert.equal(flows.links.reduce((s,d)=>s+d.value,0),salesTotal);
assert.equal(hierarchy.children.flatMap(d=>d.children).reduce((s,d)=>s+d.value,0),salesTotal);
console.log(`Passed ${cases} geometry/capability cases plus mock rollup and validation checks.`);
