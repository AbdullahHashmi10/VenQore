import React,{useLayoutEffect,useRef,useState} from 'react';
import {rowPixels} from './model';

// Measure content, then snap the whole card upward to complete 64px rows.
export default function AutoCard({g,children,className='',style={},...props}){
 const ref=useRef(null),[needed,setNeeded]=useState(1);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;const measure=()=>{const card=el.parentElement,css=getComputedStyle(card);const height=el.getBoundingClientRect().height+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+2;setNeeded(Math.max(1,Math.ceil((height+24)/88)));};const observer=new ResizeObserver(measure);observer.observe(el);measure();return()=>observer.disconnect();},[]);
 const rows=Math.max(g.rows,needed);
 return <article {...props} className={'sales-card '+className} style={{...style,gridColumn:`span ${g.span}`,gridRow:`span ${rows}`,height:rowPixels(rows)}} data-rendered-rows={rows}><div ref={ref} className="card-content">{children}</div></article>;
}
