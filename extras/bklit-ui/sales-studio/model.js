export const palette=['#078578','#5279bd','#ba773e','#9276b6','#499c62'];
export const money=n=>'Rs '+Math.round(n).toLocaleString('en-US');
export const short=n=>new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n);
const values=[8200,10400,9100,14800,11900,16700,14300,12700,18100,15200,19800,17400,22100,23700];
const old=[7100,8800,8300,12200,10600,13100,11800,10900,15100,13800,16000,15800,19400,20700];
export const history=values.map((sales,i)=>({date:new Date(2026,8,i+1),name:String(i+1),sales,previous:old[i],store:sales*.64,online:sales*.25,wholesale:sales*.11}));
export const salesTotal=values.reduce((a,b)=>a+b,0);
export const breakdown=[{label:'In store',value:137216},{label:'Online',value:53600},{label:'Wholesale',value:23584}].map((d,i)=>({...d,name:d.label,color:palette[i]}));
export const stages=[{label:'Enquiries',value:420},{label:'Qualified',value:280},{label:'Quotes',value:185},{label:'Orders',value:126}].map((d,i)=>({...d,color:palette[i]}));
export const targets=breakdown.map((d,i)=>({...d,maxValue:[160000,65000,30000][i]}));
export const radarMetrics=['Revenue','Orders','Basket','Repeat','Margin'].map((label,i)=>({label,key:'m'+i}));
export const radarData=[{label:'This period',color:palette[0],values:{m0:86,m1:72,m2:91,m3:68,m4:79}},{label:'Previous period',color:palette[1],values:{m0:73,m1:66,m2:81,m3:59,m4:76}}];
export const flows={nodes:[{name:'In store'},{name:'Online'},{name:'Wholesale'},{name:'Cash'},{name:'Card'},{name:'Credit'}],links:[{source:0,target:3,value:70000},{source:0,target:4,value:57216},{source:0,target:5,value:10000},{source:1,target:4,value:48600},{source:1,target:5,value:5000},{source:2,target:3,value:8584},{source:2,target:5,value:15000}]};
export const hierarchy={name:'Sales',children:[{name:'In store',color:palette[0],children:[{name:'Food',value:80000},{name:'Home',value:57216}]},{name:'Online',color:palette[1],children:[{name:'Food',value:30000},{name:'Home',value:23600}]},{name:'Wholesale',color:palette[2],children:[{name:'Food',value:16000},{name:'Home',value:7584}]}]};
export const heatmap=Array.from({length:12},(_,w)=>({bin:w,bins:Array.from({length:7},(_,d)=>({bin:d,date:new Date(2026,6,5+w*7+d),count:5+(w*13+d*7)%36}))}));
export const transactions=Array.from({length:12},(_,i)=>({receipt:'SAL-'+(1042-i),time:`${13-Math.floor(i/4)}:${String(55-i%4*12).padStart(2,'0')}`,customer:['Walk-in','Sara Ahmed','Ali Traders'][i%3],amount:[4200,1850,9700,3100][i%4],status:i%4===0?'Credit':'Paid'}));
const f=(label,data,variants,min=320)=>({label,data,variants,min});
export const families={
 number:f('Number only','total',['value','comparison','progress'],150),
 area:f('Area','history',['gradient','step','soft','fade','pattern','markers'],280),
 line:f('Line','history',['smooth','straight','step','markers','dashed-tail'],280),
 bar:f('Bar','breakdown',['vertical','horizontal','square','pattern'],290),
 composed:f('Composed','history',['columns-line','grouped','stacked','stacked-line'],340),
 funnel:f('Funnel','pipeline',['vertical','horizontal','straight','gradient','grouped-labels'],340),
 gauge:f('Gauge','target',['arc','linear','gradient','dense'],240),
 heatmap:f('Heatmap','activity',['rounded','square','spaced'],340),
 live:f('Live line','stream',['filled','line-only','momentum'],320),
 pie:f('Pie / donut','breakdown',['pie','donut','legend','grow','pattern','half'],290),
 radar:f('Radar','scores',['filled','outline','points'],320),
 ring:f('Ring','targets',['full','three-quarter','half','legend','butt'],290),
 scatter:f('Scatter','observations',['dots','rings','gradient'],320),
 sankey:f('Sankey','flow',['gradient','solid','no-labels'],440),
 sunburst:f('Sunburst','hierarchy',['drilldown','labeled'],340),
 list:f('Transactions','records',['table','feed'],290)
};
export const datasets={
 total:{label:'Sales total',note:'One scalar amount; no timeline or categorical detail.',families:['number']},
 history:{label:'Daily sales',note:'Daily sales and previous period, with store / online / wholesale components. 1–14 Sep 2026.',families:['number','area','line','composed']},
 breakdown:{label:'Sales by channel',note:'In store, online and wholesale amounts add up to total sales.',families:['number','bar','pie']},
 pipeline:{label:'Sales pipeline',note:'A separate cohort of 420 enquiries through to 126 orders. Counts, not rupees.',families:['number','funnel','bar']},
 target:{label:'Sales vs target',note:'Sales amount and a user-defined target for this period.',families:['number','gauge']},
 targets:{label:'Channel targets',note:'Each channel has its own target. Ring progress is achievement, not share of sales.',families:['number','ring','bar']},
 activity:{label:'Daily order activity',note:'12 weeks of daily order counts, 5 Jul–26 Sep 2026. Separate illustrative dataset.',families:['heatmap']},
 stream:{label:'Live checkout activity',note:'Simulated sales per minute. Explicitly synthetic; start or pause the stream.',families:['live']},
 scores:{label:'Sales performance scores',note:'Five normalized target scores (0–100), not incomparable raw units.',families:['radar']},
 observations:{label:'Individual sales observations',note:'Order amounts over dated observations. Scatter uses time on X and PKR on Y.',families:['scatter','list']},
 flow:{label:'Channel → payment flow',note:'Conserved sales amounts flowing from channels to cash, card and credit.',families:['sankey']},
 hierarchy:{label:'Channel → category',note:'A two-level sales hierarchy. Leaf amounts add up to the sales total.',families:['sunburst']},
 records:{label:'Recent transactions',note:'Individual receipt records. These are not a time series or a funnel.',families:['list']}
};
export const GRID={unit:64,gutter:24}; // Matches resources/layout-law.json; prototype only.
export const rowPixels=rows=>rows*GRID.unit+(rows-1)*GRID.gutter;
export const sizes={tile:{label:'Tile',span:2,rows:1},strip:{label:'Strip',span:12,rows:1},compact:{label:'Compact',span:3,rows:4},square:{label:'Square',span:4,rows:6},portrait:{label:'Portrait',span:4,rows:8},standard:{label:'Standard',span:6,rows:6},wide:{label:'Wide',span:8,rows:6},full:{label:'Full width',span:12,rows:6},custom:{label:'Custom',span:6,rows:6}};
export const defaults={title:'Sales',dataset:'history',family:'area',variant:'gradient',size:'wide',span:6,rows:6,color:palette[0],compare:true,legend:true,grid:true,target:250000,loading:'auto',motion:true};
export function chooseFamily(c,family){let dataset=c.dataset;if(!datasets[dataset].families.includes(family))dataset=families[family].data;return {...c,family,dataset,variant:families[family].variants[0],size:['tile','strip'].includes(c.size)&&family!=='number'?'standard':c.size};}
export function chooseDataset(c,dataset){const family=datasets[dataset].families.includes(c.family)?c.family:datasets[dataset].families[0];return {...chooseFamily({...c,dataset},family),dataset};}
export function geometry(c,width){const gap=GRID.gutter,pitch=(width+gap)/12;const requested=c.size==='custom'?c.span:sizes[c.size].span;const span=Math.min(12,Math.max(requested,Math.ceil((families[c.family].min+gap)/Math.max(pitch,1))));const requestedRows=c.size==='custom'?c.rows:sizes[c.size].rows;const minRows=c.family==='number'?(c.variant==='value'?1:2):c.family==='funnel'&&c.variant!=='horizontal'?7:['ring','pie','radar','sunburst'].includes(c.family)?6:4;const rows=Math.max(requestedRows,minRows),cardHeight=rowPixels(rows);const legendSpace=['ring','pie'].includes(c.family)&&(c.legend||c.variant==='legend')?145:c.family==='funnel'?140:40;return {span,requested,requestedRows,rows,cardHeight,height:Math.max(150,cardHeight-180-legendSpace),width:Math.max(0,span*pitch-gap)};}

export function variantAllowed(c,variant){return c.family!=='number'||variant==='value'||(variant==='comparison'&&c.dataset==='history')||(variant==='progress'&&c.dataset==='target');}
export function sizeAllowed(c,size){return !['tile','strip'].includes(size)||datasets[c.dataset]?.families.includes('number');}
export function chooseSize(c,size){if(!sizeAllowed(c,size))return c;return ['tile','strip'].includes(size)?{...c,size,family:'number',variant:'value'}:{...c,size};}
export function controls(c){return {color:['area','line','bar','composed','gauge','scatter','live'].includes(c.family)||(c.family==='number'&&c.variant==='progress'),compare:['area','line'].includes(c.family),legend:['area','line','composed','heatmap','pie','ring'].includes(c.family)&&c.variant!=='legend'};}
export function validate(c){return !!(c&&typeof c.title==='string'&&c.title.trim()&&c.title.length<=60&&datasets[c.dataset]?.families.includes(c.family)&&families[c.family]?.variants.includes(c.variant)&&variantAllowed(c,c.variant)&&sizes[c.size]&&(!['tile','strip'].includes(c.size)||c.family==='number')&&Number.isFinite(c.target)&&(c.dataset!=='target'||c.target>0)&&Number.isInteger(c.span)&&c.span>=2&&c.span<=12&&Number.isInteger(c.rows)&&c.rows>=1&&c.rows<=16&&palette.slice(0,3).includes(c.color)&&['auto','area-pulse','area-sweep','line-pulse','line-sweep','bars','cells','skeleton'].includes(c.loading)&&['motion','legend','grid','compare'].every(k=>typeof c[k]==='boolean'));}
export function readSaved(){try{const c=JSON.parse(localStorage.getItem('venqore-sales-studio-v2'));if(c&&!Number.isInteger(c.rows)&&Number.isFinite(c.height))c.rows=Math.min(16,Math.max(1,Math.ceil((c.height+180+24)/88)));return validate(c)?{...defaults,...c}:defaults}catch{return defaults}}
