import React,{useEffect,useId,useMemo,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {curveMonotoneX,curveLinear,curveStepAfter} from '@visx/curve';
import {AreaChart} from '../src/components/charts/area-chart';
import {Area} from '../src/components/charts/area';
import {LineChart} from '../src/components/charts/line-chart';
import {Line} from '../src/components/charts/line';
import {ComposedChart} from '../src/components/charts/composed-chart';
import {SeriesBar} from '../src/components/charts/series-bar';
import {BarChart} from '../src/components/charts/bar-chart';
import {Bar} from '../src/components/charts/bar';
import {BarXAxis} from '../src/components/charts/bar-x-axis';
import {BarYAxis} from '../src/components/charts/bar-y-axis';
import {Grid} from '../src/components/charts/grid';
import {XAxis} from '../src/components/charts/x-axis';
import {YAxis} from '../src/components/charts/y-axis';
import {ChartTooltip} from '../src/components/charts/tooltip';
import {PatternArea} from '../src/components/charts/pattern-area';
import {PatternLines} from '../src/components/charts/visx-pattern';
import {Gauge} from '../src/components/charts/gauge';
import {RingChart} from '../src/components/charts/ring-chart';
import {Ring} from '../src/components/charts/ring';
import {RingCenter} from '../src/components/charts/ring-center';
import {PieChart} from '../src/components/charts/pie-chart';
import {PieSlice} from '../src/components/charts/pie-slice';
import {PieCenter} from '../src/components/charts/pie-center';
import {FunnelChart} from '../src/components/charts/funnel-chart';
import {RadarChart} from '../src/components/charts/radar-chart';
import {RadarArea} from '../src/components/charts/radar-area';
import {RadarGrid} from '../src/components/charts/radar-grid';
import {RadarAxis} from '../src/components/charts/radar-axis';
import {RadarLabels} from '../src/components/charts/radar-labels';
import {ScatterChart} from '../src/components/charts/scatter-chart';
import {Scatter} from '../src/components/charts/scatter';
import {SunburstChart} from '../src/components/charts/sunburst-chart';
import {SunburstSegment} from '../src/components/charts/sunburst-segment';
import {SunburstCenter} from '../src/components/charts/sunburst-center';
import {SunburstLabels} from '../src/components/charts/sunburst-labels';
import {buildArcs} from '../src/components/charts/sunburst';
import {SankeyChart,SankeyLink,SankeyNode,SankeyTooltip} from '../src/components/charts/sankey';
import {HeatmapChart,HeatmapCells,HeatmapXAxis,HeatmapYAxis,HeatmapTooltip,HeatmapLegend,HeatmapInteractionProvider,HeatmapChartLoading} from '../src/components/charts/heatmap';
import {AreaChartLoading} from '../src/components/charts/area-chart-loading';
import {LineChartLoading} from '../src/components/charts/line-chart-loading';
import {BarChartLoading} from '../src/components/charts/bar-chart-loading';
import {LiveLineChart} from '../src/components/charts/live-line-chart';
import {LiveLine} from '../src/components/charts/live-line';
import {LiveXAxis} from '../src/components/charts/live-x-axis';
import {LiveYAxis} from '../src/components/charts/live-y-axis';
import {history,breakdown,stages,targets,radarMetrics,radarData,flows,hierarchy,heatmap,transactions,salesTotal,money,short,palette} from './model';

export class PlotBoundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return {error}}componentDidUpdate(prev){if(prev.identity!==this.props.identity&&this.state.error)this.setState({error:null})}render(){return this.state.error?<div className="plot-error" role="alert">Preview failed: {this.state.error.message}</div>:this.props.children}}
export function Legend({data,hover,onHover,progress=false}){return <div className="data-legend">{data.map((d,i)=><button key={d.label} onMouseEnter={()=>onHover?.(i)} onMouseLeave={()=>onHover?.(null)} onFocus={()=>onHover?.(i)} onBlur={()=>onHover?.(null)} className={hover!=null&&hover!==i?'dim':''}><span><i style={{background:d.color||palette[i]}}/>{d.label}</span><strong>{money(d.value)}{progress&&<small>{Math.round(d.value/d.maxValue*100)}%</small>}</strong>{progress&&<span className="legend-track"><i style={{width:Math.min(100,d.value/d.maxValue*100)+'%',background:d.color||palette[i]}}/></span>}</button>)}</div>}
function LivePlot({c,height,reduced}){const [running,setRunning]=useState(false);const [points,setPoints]=useState(()=>Array.from({length:30},(_,i)=>({time:Date.now()/1000-29+i,value:600+(i*71)%450})));useEffect(()=>{if(!running||reduced)return;const id=setInterval(()=>setPoints(p=>[...p.slice(-59),{time:Date.now()/1000,value:650+Math.round(Math.sin(p.length+Date.now()/1700)*160+Math.cos(Date.now()/2100)*100)}]),1000);return()=>clearInterval(id)},[running,reduced]);return <><div style={{height}}><LiveLineChart data={points} value={points.at(-1).value} window={60} paused={!running||reduced} margin={{top:20,right:65,bottom:32,left:48}} className="h-full"><Grid/><LiveLine dataKey="value" stroke={c.color} fill={c.variant!=='line-only'} pulse={running&&!reduced} momentumColors={c.variant==='momentum'?{up:'#078578',down:'#bd604a',flat:'#70887c'}:undefined} formatValue={money}/><LiveXAxis/><LiveYAxis/><ChartTooltip rows={p=>[{label:'Sales / minute',value:money(p.value),color:c.color}]}/></LiveLineChart></div><button className="subtle" onClick={()=>setRunning(!running)} disabled={reduced}>{running?'Pause simulation':'Start simulation'}</button><span className="hint"> Synthetic sales per minute{reduced?' · paused for reduced motion':''}</span></>}
function SunburstPlot({size,variant,transition}){const {arcs,rootId}=useMemo(()=>buildArcs(hierarchy),[]);const [focus,setFocus]=useState(rootId);return <><SunburstChart data={hierarchy} size={size} focusId={focus} onFocusChange={setFocus} enterTransition={transition}>{arcs.map(a=><SunburstSegment index={a.arcIndex} key={a.id}/>)}<SunburstCenter/>{variant==='labeled'&&<SunburstLabels/>}</SunburstChart><button className="subtle" onClick={()=>setFocus(rootId)}>Reset to all sales</button><p className="hint">Click a segment to explore its categories.</p></>}
export function LoadingPlot({c,height,reduced}){const kind=c.loading==='auto'?({bar:'bars',composed:'bars',line:'line-pulse',heatmap:'cells',area:'area-pulse'}[c.family]||'skeleton'):c.loading;const shared={className:'h-full',aspectRatio:'auto'};return <div className="loading-plot" style={{height}} role="status" aria-label="Loading sales data">{reduced||kind==='skeleton'?<div className="static-skeleton"><span/><span/><span/><p>Loading sales data…</p></div>:kind==='bars'?<BarChartLoading {...shared}/>:kind==='cells'?<HeatmapChartLoading data={heatmap} className="h-full" label="Loading activity"/>:kind.startsWith('line')?<LineChartLoading {...shared} label="Loading sales" loadingStyle={kind.endsWith('sweep')?'sweep':'pulse'}/>:<AreaChartLoading {...shared} label="Loading sales" loadingStyle={kind.endsWith('sweep')?'sweep':'pulse'}/>}</div>}
export function SalesPlot({c,width,height,state}){
 const cardTargets=targets.map((t,i)=>({...t,maxValue:c.goals?.[i]>0?c.goals[i]:t.maxValue}));
 const reducedPref=useReducedMotion(),reduced=reducedPref||!c.motion;const [hover,setHover]=useState(null);const uid=useId().replace(/:/g,'');
 const transition=reduced?{duration:0}:{duration:.8,ease:[.22,1,.36,1]};
 const plotW=Math.max(160,width-48),small=plotW<340;const size=Math.max(170,Math.min(plotW-12,Math.max(height,280),360));const variant=c.variant,curve=variant==='step'?curveStepAfter:variant==='straight'?curveLinear:curveMonotoneX;
 const common={className:'h-full',aspectRatio:'auto',animationDuration:reduced?0:800,enterTransition:transition,margin:{top:20,left:small?46:58,right:22,bottom:38}};
 if(['forbidden','partial','reconciling'].includes(state))return <div className="state-message" role="status"><strong>{{forbidden:'Access restricted',partial:'Some required data is missing',reconciling:'Reconciling sales data'}[state]}</strong><p>{{forbidden:'No amounts or underlying records are shown. Production must enforce this on the server.',partial:'This fixture has no completeness map. Withhold the aggregate and chart until valid buckets can be identified.',reconciling:'Do not replace an unknown amount with zero or generate a placeholder trend.'}[state]}</p></div>;
 if(state==='loading')return <LoadingPlot c={c} height={height} reduced={reduced}/>;
 if(state==='unavailable')return <div className="state-message"><strong>Sales data is unavailable</strong><p>Keep the value unknown. Retry from the test controls.</p></div>;
 if(state==='empty')return <div className="state-message"><strong>No activity in this period</strong><p>A verified empty result. It is not a loading or reconciliation error.</p></div>;
 if(state==='scalar'&&c.family!=='number'&&c.family!=='gauge')return <div className="state-message"><strong>The total is available; this dataset is not.</strong><p>Show the verified headline without inventing chart points.</p></div>;
 if(state==='scalar'&&c.family==='number'&&c.variant==='comparison')return <p className="number-caption">The total is verified. Previous-period data is unavailable.</p>;
 if(state==='stale'&&c.family==='live')return <div className="state-message"><strong>Live connection interrupted</strong><p>Resume requires a verified event cursor. This fixture does not invent events for the missing interval.</p></div>;
 if(c.family==='number'&&c.dataset==='pipeline')return <p className="number-caption">126 orders from 420 enquiries. Conversion: 30%.</p>;
 if(c.family==='number')return c.variant==='progress'?<><div className="progress-track"><i style={{width:Math.min(100,salesTotal/c.target*100)+'%',background:c.color}}/></div><p className="hint">{Math.round(salesTotal/c.target*100)}% of {money(c.target)}</p></>:<p className="number-caption">{c.variant==='comparison'?'Previous period: Rs 183,600 · Increase: Rs 30,800':'Verified sales total · 1–14 Sep 2026'}</p>;
 if(c.family==='list')return <div className="record-wrap">{variant==='feed'?transactions.map(r=><div className="feed-item" key={r.receipt}><span className="feed-dot"/><div><strong>{r.receipt}</strong><small>{r.customer} · {r.time}</small></div><b>{money(r.amount)}</b></div>):<table><thead><tr><th>Receipt</th>{!small&&<th>Customer</th>}<th>Amount</th><th>Status</th></tr></thead><tbody>{transactions.map(r=><tr key={r.receipt}><td>{r.receipt}<small>{r.time}</small></td>{!small&&<td>{r.customer}</td>}<td>{money(r.amount)}</td><td>{r.status}</td></tr>)}</tbody></table>}</div>;
 if(['area','line','composed'].includes(c.family)){
 const C=c.family==='area'?AreaChart:c.family==='line'?LineChart:ComposedChart;
 const multi=c.family==='composed';const stacked=variant.startsWith('stacked');
 const keys=multi&&variant!=='columns-line'?['store','online','wholesale']:['sales'];if((!multi&&c.compare)||variant==='columns-line')keys.push('previous');
 const seriesColor=k=>({sales:variant==='stacked-line'?palette[3]:c.color,previous:palette[1],store:c.color,online:palette[1],wholesale:palette[2]}[k]);
 const seriesLabel=k=>({sales:'Sales',previous:'Previous period',store:'In store',online:'Online',wholesale:'Wholesale'}[k]);
 return <><div style={{height}}><C {...common} data={history} stacked={stacked} barGap={3}>
 {c.grid&&<Grid horizontal vertical={false} strokeDasharray="3 5"/>}
 {variant==='pattern'&&<PatternLines id={uid} height={7} width={7} stroke={c.color} strokeWidth={1} orientation={['diagonal']}/>}
 {variant==='pattern'&&<PatternArea dataKey="sales" fill={`url(#${uid})`} curve={curve}/>}
 {c.family==='area'&&<Area dataKey="sales" fill={c.color} fillOpacity={variant==='pattern'?0:.32} gradientToOpacity={.02} showLine={variant!=='soft'} fadeEdges={variant==='fade'} showMarkers={variant==='markers'} curve={curve} animate={!reduced}/>}
 {c.family==='line'&&<Line dataKey="sales" stroke={c.color} strokeWidth={2.5} curve={curve} showMarkers={variant==='markers'} dashFromIndex={variant==='dashed-tail'?11:undefined} animate={!reduced}/>}
 {multi&&keys.filter(k=>k!=='previous').map(k=><SeriesBar key={k} dataKey={k} fill={seriesColor(k)} radius={3} animate={!reduced}/>)}
 {keys.includes('previous')&&<Line dataKey="previous" stroke={palette[1]} curve={curve} animate={!reduced}/>}
 {variant==='stacked-line'&&<Line dataKey="sales" stroke={seriesColor('sales')} curve={curve} animate={!reduced}/>}
 <XAxis numTicks={small?3:5}/><YAxis numTicks={4} formatValue={short}/>
 <ChartTooltip dotVariant="ring" rows={p=>[...keys,...(variant==='stacked-line'?['sales']:[])].map(key=>({label:seriesLabel(key),value:money(p[key]),color:seriesColor(key)}))}/>
 </C></div>{c.legend&&<div className="inline-legend">{[...keys,...(variant==='stacked-line'?['sales']:[])].map(k=><span key={k}><i style={{background:seriesColor(k)}}/>{seriesLabel(k)}</span>)}<span>PKR / day</span></div>}{variant==='dashed-tail'&&<p className="hint">Dashed segment illustrates provisional days; production requires completeness metadata.</p>}</>;
 }
 if(c.family==='bar'){const data=(c.dataset==='pipeline'?stages:c.dataset==='targets'?cardTargets:breakdown).map(d=>({...d,name:d.label}));const horizontal=variant==='horizontal';return <div style={{height}}><BarChart {...common} data={data} xDataKey="name" orientation={horizontal?'horizontal':'vertical'} margin={{top:20,right:20,bottom:40,left:horizontal?90:50}}><Grid/><PatternLines id={uid} width={7} height={7} stroke={c.color} strokeWidth={2} orientation={['diagonal']}/><Bar dataKey="value" fill={variant==='pattern'?`url(#${uid})`:c.color} stroke={c.color} lineCap={variant==='square'?'butt':'round'} animate={!reduced}/>{horizontal?<BarYAxis/>:<><BarXAxis/><YAxis numTicks={4} formatValue={short}/></>}<ChartTooltip showDatePill={false} rows={p=>[{label:String(p.name),value:c.dataset==='pipeline'?String(p.value)+' enquiries / orders':money(p.value),color:c.color}]}/></BarChart></div>}
 if(c.family==='gauge'&&!(c.target>0))return <div className="state-message">Enter a positive target to preview progress.</div>;
 if(c.family==='gauge')return <><Gauge orientation={variant==='linear'?'linear':'arc'} value={Math.min(100,salesTotal/c.target*100)} centerValue={Math.round(salesTotal/c.target*100)} suffix="%" defaultLabel="of period target" height={variant==='linear'?110:Math.max(200,Math.min(height,300))} totalNotches={variant==='dense'?100:55} useGradient={variant==='gradient'} activeGradient={[c.color,'#70d2b6']} activeFill={c.color} inactiveFill="#d6e5df" enterTransition={transition}/><p className="hint centered">{money(c.target)} target · {money(Math.abs(c.target-salesTotal))} {c.target>=salesTotal?'remaining':'above target'}</p></>;
 if(c.family==='ring')return <div className="radial-composition"><RingChart data={cardTargets} size={size} strokeWidth={variant==='butt'?16:12} ringGap={7} baseInnerRadius={size*.28} startAngle={-Math.PI/2} endAngle={variant==='half'?Math.PI/2:variant==='three-quarter'?Math.PI:Math.PI*1.5} hoveredIndex={hover} onHoverChange={setHover} enterTransition={transition} enterStaggerScale={reduced?0:1}><Ring index={0} animate={!reduced} lineCap={variant==='butt'?'butt':'round'}/><Ring index={1} animate={!reduced} lineCap={variant==='butt'?'butt':'round'}/><Ring index={2} animate={!reduced} lineCap={variant==='butt'?'butt':'round'}/><RingCenter className="studio-chart-center" valueClassName="studio-center-value" labelClassName="studio-center-label" defaultLabel="Sales / PKR" formatOptions={{notation:'compact',maximumFractionDigits:1}}/></RingChart>{(c.legend||variant==='legend')&&<Legend data={cardTargets} hover={hover} onHover={setHover} progress={variant==='legend'}/>}</div>;
 if(c.family==='pie'){const donut=variant!=='pie';return <div className="radial-composition"><PieChart data={breakdown} size={size} innerRadius={donut?size*.25:0} padAngle={.035} cornerRadius={4} hoveredIndex={hover} onHoverChange={setHover} enterStaggerScale={reduced?0:1} startAngle={-Math.PI/2} endAngle={variant==='half'?Math.PI/2:Math.PI*1.5} enterTransition={transition}>{variant==='pattern'&&<PatternLines id={uid} width={8} height={8} stroke={c.color} strokeWidth={2} orientation={['diagonal']}/>}{breakdown.map((d,i)=><PieSlice key={i} index={i} animate={!reduced} fill={variant==='pattern'&&i===0?`url(#${uid})`:d.color} hoverEffect={variant==='grow'?'grow':'translate'}/>)}{donut&&<PieCenter className="studio-chart-center" valueClassName="studio-center-value" labelClassName="studio-center-label" defaultLabel="Sales / PKR" formatOptions={{notation:'compact',maximumFractionDigits:1}}/>}</PieChart>{(c.legend||variant==='legend')&&<Legend data={breakdown} hover={hover} onHover={setHover}/>}</div>}
 if(c.family==='funnel'){const vertical=variant!=='horizontal';return <><FunnelChart data={variant==='gradient'?stages.map((s,i)=>({...s,gradient:[{offset:'0%',color:palette[i]},{offset:'100%',color:palette[(i+1)%palette.length]}]})):stages} orientation={vertical?'vertical':'horizontal'} style={{height}} edges={variant==='straight'?'straight':'curved'} color={c.color} showLabels={false} showValues={false} showPercentage={false} grid={variant==='straight'} labelLayout={variant==='grouped-labels'?'grouped':'spread'} hoveredIndex={hover} onHoverChange={setHover} enterTransition={transition} staggerDelay={reduced?0:.06}/><div className={'stage-legend '+(variant==='grouped-labels'?'grouped':'')}>{stages.map((s,i)=><button key={s.label} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)} onFocus={()=>setHover(i)} onBlur={()=>setHover(null)}><span>{s.label}</span><strong>{s.value}</strong><small>{Math.round(s.value/stages[0].value*100)}% of enquiries</small></button>)}</div></>}
 if(c.family==='radar')return <div className="radial-composition"><RadarChart data={radarData} metrics={radarMetrics} size={size} margin={50} animate={!reduced} enterTransition={transition}><RadarGrid/><RadarAxis/>{radarData.map((d,i)=><RadarArea key={i} index={i} showPoints={variant==='points'} showGlow={false} color={d.color} className={variant==='outline'?'radar-outline':''}/>)}<RadarLabels offset={17} fontSize={11}/></RadarChart><p className="hint centered">Normalized scores, 0–100. Teal: this period. Blue: previous.</p></div>;
 if(c.family==='scatter')return <div style={{height}}><ScatterChart {...common} data={transactions.map(r=>({date:new Date(`2026-09-14T${r.time}:00`),sales:r.amount})).sort((a,b)=>a.date-b.date)} xDataKey="date"><Grid/><Scatter dataKey="sales" fill={c.color} radius={variant==='rings'?5:4} strokeWidth={variant==='rings'?2:0} ringGap={2} yGradient={variant==='gradient'} animate={!reduced}/><XAxis numTicks={small?3:5}/><YAxis numTicks={4} formatValue={short}/><ChartTooltip rows={p=>[{label:'Sales observation',value:money(p.sales),color:c.color}]}/></ScatterChart></div>;
 if(c.family==='sankey')return <div style={{height}}><SankeyChart {...common} data={flows} margin={{top:20,bottom:20,left:small?20:90,right:small?20:80}} nodeWidth={12} nodePadding={22}><SankeyLink useGradient={variant!=='solid'}/><SankeyNode showLabels={!small&&variant!=='no-labels'} showValueLabels={false}/><SankeyTooltip/></SankeyChart>{small&&<p className="hint">Channel → payment method. Full node names are in View data.</p>}</div>;
 if(c.family==='sunburst')return <div className="radial-composition"><SunburstPlot size={size} variant={variant} transition={transition}/></div>;
 if(c.family==='heatmap')return <HeatmapInteractionProvider><div style={{height:Math.min(height,270)}}><HeatmapChart data={heatmap} layout="fill" className="h-full" gap={variant==='spaced'?7:3} margin={{top:30,bottom:5,left:35,right:10}} animate={!reduced}><HeatmapCells cornerRadius={variant==='square'?0:4}/><HeatmapXAxis/><HeatmapYAxis/><HeatmapTooltip formatLabel={count=>count+' orders'}/></HeatmapChart></div>{c.legend&&<HeatmapLegend/>}<p className="hint">Daily order count · 12 weeks</p></HeatmapInteractionProvider>;
 if(c.family==='live')return <LivePlot c={c} height={height} reduced={reduced}/>;
 return null;
}

