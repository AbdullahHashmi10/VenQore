import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useReducedMotion} from 'motion/react';
import {curveMonotoneX,curveLinear,curveStepAfter} from '@visx/curve';
import {ComposedChart} from './src/components/charts/composed-chart';
import {Area} from './src/components/charts/area';
import {Line} from './src/components/charts/line';
import {SeriesBar} from './src/components/charts/series-bar';
import {Grid} from './src/components/charts/grid';
import {XAxis} from './src/components/charts/x-axis';
import {YAxis} from './src/components/charts/y-axis';
import {ChartTooltip} from './src/components/charts/tooltip';
import {Gauge} from './src/components/charts/gauge';
import './sales-workshop.css';

const amounts=[8200,10400,9100,14800,11900,16700,14300,12700,18100,15200,19800,17400,22100,23700];
const prior=[7100,8800,8300,12200,10600,13100,11800,10900,15100,13800,16000,15800,19400,20700];
const base={title:'Sales',size:'wide',view:'area',period:14,comparison:true,curve:'smooth',color:'#087e70',target:250000,hasTarget:true,grid:true,markers:false};
const views={area:'Area',line:'Line',bars:'Columns',composed:'Columns + comparison line',gauge:'Target gauge'};
const money=n=>'Rs '+Math.round(n).toLocaleString('en-US');
const total=a=>a.reduce((x,y)=>x+y,0);
function load(){try{const s=JSON.parse(localStorage.getItem('venqore-sales-workshop'));return s&&['compact','standard','wide'].includes(s.size)&&views[s.view]&&[7,14].includes(s.period)?{...base,...s}:base}catch{return base}}
function App(){
 const [saved,setSaved]=useState(load),[draft,setDraft]=useState(saved),[editing,setEditing]=useState(true),[scenario,setScenario]=useState('ready'),[notice,setNotice]=useState(''),[replay,setReplay]=useState(0);
 const reduced=useReducedMotion(),c=editing?draft:saved;
 const change=(key,value)=>setDraft(d=>({...d,[key]:value}));
 const rows=amounts.slice(0,c.period).map((sales,i)=>({date:new Date(2026,8,i+1),sales,previous:prior[i]}));
 const sales=total(rows.map(r=>r.sales)),previous=total(rows.map(r=>r.previous)),pct=sales/c.target*100;
 const compact=c.size==='compact',ready=scenario==='ready',available=['ready','scalar','empty'].includes(scenario),valid=c.title.trim().length>0&&(!c.hasTarget||Number(c.target)>0);
 const comparison=c.view==='composed'||c.comparison;
 const curve={smooth:curveMonotoneX,linear:curveLinear,step:curveStepAfter}[c.curve];
 const save=()=>{if(!valid)return;setSaved({...draft,title:draft.title.trim()});setEditing(false);try{localStorage.setItem('venqore-sales-workshop',JSON.stringify({...draft,title:draft.title.trim()}));setNotice('Saved in this browser. Your customer view is below.')}catch{setNotice('Applied for this session. Browser storage is unavailable.')}};
 const chart=()=>{
  if(scenario==='loading')return <div className="state-box" role="status">Loading sales…<p>Waiting for a verified total and history.</p></div>;
  if(scenario==='error')return <div className="state-box" role="status">Sales data is unavailable.<p>An unavailable value is not zero.</p><button onClick={()=>setScenario('ready')}>Retry demo</button></div>;
  if(scenario==='empty')return <div className="state-box">No sales recorded for this period.<p>The total is confirmed as zero.</p></div>;
  if(c.view==='gauge')return <div className="gauge-wrap"><Gauge key={replay} value={Math.min(100,pct)} centerValue={Math.round(pct)} suffix="%" defaultLabel="of sales target" orientation={compact?'linear':'arc'} height={compact?85:230} totalNotches={compact?35:60} activeFill={c.color} inactiveFill="#d6e5df" useGradient={false} enterTransition={reduced?{duration:0}:{type:'spring',stiffness:180,damping:23}}/><p className="target-caption">{money(sales)} of {money(c.target)} · {pct>100?money(sales-c.target)+' above target':money(c.target-sales)+' remaining'}</p></div>;
  if(scenario==='scalar')return <div className="state-box">Daily history is unavailable.<p>The verified total stays visible. No artificial trend is drawn.</p></div>;
  return <><div className="real-chart" style={{height:compact?120:c.size==='wide'?310:235}}><ComposedChart key={`${c.view}-${c.size}-${replay}`} data={rows} aspectRatio="auto" className="h-full" margin={compact?{top:12,right:10,bottom:8,left:10}:{top:22,right:22,bottom:35,left:45}} animationDuration={reduced?0:850} enterTransition={reduced?{duration:0}:{duration:.85,ease:[.22,1,.36,1]}}>
   {c.grid&&!compact&&<Grid horizontal vertical={false} strokeDasharray="3 5"/>}
   {c.view==='area'&&<Area dataKey="sales" fill={c.color} stroke={c.color} fillOpacity={.35} gradientToOpacity={.015} strokeWidth={2.5} curve={curve} showMarkers={c.markers} animate={!reduced}/>}
   {c.view==='line'&&<Line dataKey="sales" stroke={c.color} strokeWidth={2.5} curve={curve} showMarkers={c.markers} animate={!reduced}/>}
   {['bars','composed'].includes(c.view)&&<SeriesBar dataKey="sales" fill={c.color} radius={4} animate={!reduced}/>}
   {comparison&&(c.view==='bars'?<SeriesBar dataKey="previous" fill="#8199c7" radius={4} animate={!reduced}/>:<Line dataKey="previous" stroke="#6e87b6" strokeWidth={2} curve={curve} animate={!reduced}/>)}
   {!compact&&<XAxis numTicks={4}/>}{!compact&&<YAxis numTicks={4} formatValue={n=>(n/1000).toFixed(0)+'k'}/>}
   <ChartTooltip dotVariant="ring" matchCrosshair rows={point=>[{color:c.color,label:'Sales',value:money(point.sales)},...(comparison?[{color:'#6e87b6',label:'Previous period',value:money(point.previous)}]:[])]}/>
  </ComposedChart></div><div className="legend"><span><i style={{background:c.color}}/>Sales</span>{comparison&&<span><i className="previous"/>Previous {c.period} days</span>}<span>PKR · daily totals</span></div></>;
 };
 return <><div className="workshop-toolbar"><span><b>Actual BKLIT components</b> · Fictional sample data</span><button onClick={()=>{setDraft(saved);setEditing(!editing);setNotice('')}}>{editing?'Close editor without saving':'Edit card'}</button></div><div className={'lab actual-lab '+(!editing?'customer-mode':'')}>
 {editing&&<aside className="controls editor"><div className="editor-heading"><h3>Edit Sales card</h3><span>Live preview</span></div><label className="label" htmlFor="title">Card title</label><input id="title" maxLength={50} value={draft.title} onChange={e=>change('title',e.target.value)}/>
 <fieldset><legend>Size</legend><div className="choices">{['compact','standard','wide'].map(s=><button key={s} aria-pressed={draft.size===s} onClick={()=>change('size',s)}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div></fieldset>
 <label className="label" htmlFor="view">Show sales as</label><select id="view" value={draft.view} onChange={e=>change('view',e.target.value)}>{Object.entries(views).map(([k,v])=><option key={k} value={k} disabled={k==='gauge'&&!draft.hasTarget}>{v}</option>)}</select>
 <label className="label" htmlFor="period">Sample period</label><select id="period" value={draft.period} onChange={e=>change('period',+e.target.value)}><option value={7}>1–7 September</option><option value={14}>1–14 September</option></select>
 {draft.view!=='gauge'&&<><label className="check"><input type="checkbox" checked={comparison} disabled={draft.view==='composed'} onChange={e=>change('comparison',e.target.checked)}/>Compare previous period</label>{draft.view==='composed'&&<p className="note">Columns show sales; the line shows the previous period.</p>}
 {!['bars'].includes(draft.view)&&<><label className="label" htmlFor="curve">Line treatment</label><select id="curve" value={draft.curve} onChange={e=>change('curve',e.target.value)}><option value="smooth">Smooth</option><option value="linear">Straight</option><option value="step">Step</option></select></>}
 <label className="check"><input type="checkbox" checked={draft.grid} disabled={compact} onChange={e=>change('grid',e.target.checked)}/>Show grid</label>{['line','area'].includes(draft.view)&&<label className="check"><input type="checkbox" checked={draft.markers} onChange={e=>change('markers',e.target.checked)}/>Show data points</label>}</>}
 <label className="label" htmlFor="color">Chart color</label><select id="color" value={draft.color} onChange={e=>change('color',e.target.value)}><option value="#087e70">VenQore teal</option><option value="#4268bb">Ocean blue</option><option value="#985c35">Copper</option></select>
 <label className="check"><input type="checkbox" checked={draft.hasTarget} onChange={e=>setDraft(d=>({...d,hasTarget:e.target.checked,view:!e.target.checked&&d.view==='gauge'?'area':d.view}))}/>Set a sales target</label>{draft.hasTarget&&<><label className="label" htmlFor="target">Target for selected period (Rs)</label><input id="target" type="number" min="1" step="1000" value={draft.target} onChange={e=>change('target',e.target.value===''?'':Number(e.target.value))}/></>}
 {!valid&&<p className="validation" role="alert">Enter a title and a positive target amount.</p>}
 <div className="editor-actions"><button className="primary" disabled={!valid} onClick={save}>Save card</button><button onClick={()=>{setDraft(saved);setEditing(false);setNotice('Changes discarded.')}}>Cancel</button></div><button className="reset" onClick={()=>{setDraft({...base});setNotice('Default settings restored in preview. Save to keep them.')}}>Reset preview</button>
 </aside>}
 <div className="stage"><div className="stage-label"><span>{editing?'Live preview':'Customer view'} · {c.size}</span><button onClick={()=>setReplay(n=>n+1)}>Replay animation</button></div><article className={'card '+c.size} style={{'--chart-line-primary':c.color}}><div className="card-head"><span className="card-title">{c.title||'Sales'}</span><span className="period">1–{c.period} Sep 2026</span></div><div className="value">{available?<><span>Rs</span> {(scenario==='empty'?0:sales).toLocaleString('en-US')}</>:'—'}</div>{ready&&<div className="comparison"><b>↑ {((sales/previous-1)*100).toFixed(1)}%</b>vs previous {c.period} days</div>}
 {c.view==='gauge'&&!valid?<div className="state-box">Enter a positive target to preview progress.</div>:chart()}
 {ready&&c.size==='wide'&&<div className="card-foot"><span>Daily average <strong>{money(sales/c.period)}</strong></span><span>Best day <strong>{money(Math.max(...rows.map(r=>r.sales)))}</strong></span></div>}
 {ready&&<details className="accessible-data"><summary>View chart data</summary><table><thead><tr><th>Date</th><th>Sales</th><th>Previous period</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{i+1} Sep</td><td>{money(r.sales)}</td><td>{money(r.previous)}</td></tr>)}</tbody></table></details>}
 </article><p className="explain">{compact?'Compact preserves the value and a small supporting chart. A target gauge becomes a linear notch gauge.':c.size==='standard'?'Standard adds readable axes, hover details and a larger plot.':'Wide gives comparison series and supporting detail room to breathe.'} Same Sales definition, same shared components.</p>
 <div className="demo-controls"><label htmlFor="scenario">Test a data state</label><select id="scenario" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="ready">Populated history</option><option value="scalar">Total only</option><option value="empty">Confirmed zero sales</option><option value="loading">Loading</option><option value="error">Unavailable</option></select><p>Demonstration controls; these would not appear in a customer’s dashboard.</p></div>
 </div></div><p className="save-status" role="status">{notice}</p></>;
}
createRoot(document.getElementById('workshop-root')).render(<App/>);

