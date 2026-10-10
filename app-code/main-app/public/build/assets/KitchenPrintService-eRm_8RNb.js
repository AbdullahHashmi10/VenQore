import{a as m,p as u,i as x,A as y}from"./AMDStation-DQpJY7T1.js";const g={async printKOT(e,r={}){if(!e||!e.items)return console.warn("[KitchenPrintService] No KOT data to print"),{success:!1,error:"Empty ticket data"};if(!r.forcePrint&&(r.role||e.printer_role)==="none")return{success:!0,method:"screen-only"};const s=r.paperWidth||e.paper_width||"80mm",o=!!(r.isReprint||e.is_reprint),p=!!(r.isCancellation||e.is_cancellation);try{if(x()){const i=this.formatEscPos(e,{paperWidth:s,isReprint:o,isCancellation:p}),n=await y.print(i,{paperWidth:s,copies:r.copies||1,printerName:r.printerName,role:r.role||this.roleFor(e)});if(n&&n.success!==!1)return{success:!0,method:"station"};throw new Error(n?.error||"Station printer failed to answer")}else return await this.printViaIframe(e,{paperWidth:s,isReprint:o,isCancellation:p}),{success:!0,method:"browser"}}catch(i){console.error("[KitchenPrintService] Loud failure:",i);const n={kot:e,options:r,error:i.message||"Thermal printer communication failed",retry:()=>this.printKOT(e,r)};return typeof window<"u"&&window.dispatchEvent(new CustomEvent("kot:print-failed",{detail:n})),{success:!1,error:n.error,retry:n.retry}}},roleFor(e){const r=String(e?.printer_role||"").toLowerCase();if(r==="bar"||r==="receipt")return r;const s=String(e?.order_type_badge||e?.order_type||"").toLowerCase(),o=String(e?.station_name||e?.station||e?.printer_name||"").toLowerCase();return/\bbar\b/.test(o)?"bar":/take\s*-?away|takeout|pickup|pick-up/.test(s)?"takeaway":"kitchen"},formatEscPos(e,{paperWidth:r,isReprint:s,isCancellation:o}){const i=r==="58mm"?32:48,n="-".repeat(i),c="=".repeat(i),t=[];o?(t.push({type:"text",value:"*** CANCELLED ***",style:{fontWeight:"900",textAlign:"center",fontSize:"22px"}}),t.push({type:"text",value:"DO NOT PREPARE VOIDED ITEMS",style:{fontWeight:"700",textAlign:"center",fontSize:"13px"}})):s&&(t.push({type:"text",value:"*** REPRINT ***",style:{fontWeight:"900",textAlign:"center",fontSize:"20px"}}),t.push({type:"text",value:"DUPLICATE TICKET - CHECK IF ALREADY COOKED",style:{fontWeight:"700",textAlign:"center",fontSize:"12px"}}));const a=(e.order_type_badge||e.order_type||"DINE-IN").toUpperCase();t.push({type:"text",value:`[ ${a} ]`,style:{fontWeight:"900",textAlign:"center",fontSize:"24px",margin:"4px 0"}}),e.station&&String(e.station).toLowerCase()!=="kitchen"&&t.push({type:"text",value:String(e.station).toUpperCase(),style:{fontWeight:"900",textAlign:"center",fontSize:"16px"}});const d=e.table_number?`TABLE: ${e.table_number}`:`ORDER: ${e.order_number}`;return t.push({type:"text",value:d,style:{fontWeight:"800",textAlign:"center",fontSize:"20px"}}),e.customer_name&&t.push({type:"text",value:`Guest: ${e.customer_name}`,style:{textAlign:"center",fontSize:"14px"}}),t.push({type:"text",value:c,style:{textAlign:"center"}}),t.push({type:"text",value:`Ticket: ${e.order_number}   Server: ${e.server_name||"Staff"}`,style:{fontSize:"13px"}}),t.push({type:"text",value:`Fired: ${e.fired_at_human||new Date().toLocaleTimeString()}`,style:{fontSize:"13px"}}),t.push({type:"text",value:n,style:{textAlign:"center"}}),(e.items||[]).forEach(l=>{const f=l.qty??1;t.push({type:"text",value:`${f}x  ${l.name}`,style:{fontWeight:"800",fontSize:"18px",margin:"2px 0"}}),Array.isArray(l.modifiers)&&l.modifiers.length>0&&t.push({type:"text",value:`   * ${l.modifiers.join(", ")}`,style:{fontSize:"14px",fontStyle:"italic"}}),l.notes&&t.push({type:"text",value:`   Note: "${l.notes}"`,style:{fontSize:"14px",fontWeight:"700"}})}),t.push({type:"text",value:n,style:{textAlign:"center"}}),t.push({type:"text",value:`End of Ticket · ${new Date().toLocaleTimeString()}`,style:{textAlign:"center",fontSize:"12px",margin:"6px 0 12px 0"}}),t},printViaIframe(e,{paperWidth:r,isReprint:s,isCancellation:o}){e=m(e);const p=r==="58mm"?"48mm":"72mm",i=r==="58mm"?"58mm":"80mm",n=(e.order_type_badge||e.order_type||"DINE-IN").toUpperCase(),c=(e.items||[]).map(a=>`
                    <div style="margin: 6px 0; border-bottom: 1px dashed #bbb; padding-bottom: 4px;">
                        <div style="font-size: 18px; font-weight: 900; line-height: 1.2;">
                            <span style="display: inline-block; min-width: 28px;">${a.qty}x</span>
                            <span>${a.name}</span>
                        </div>
                        ${a.modifiers&&a.modifiers.length>0?`
                            <div style="font-size: 13px; font-style: italic; margin-left: 28px; margin-top: 2px;">
                                * ${a.modifiers.join(", ")}
                            </div>
                        `:""}
                        ${a.notes?`
                            <div style="font-size: 13px; font-weight: 700; margin-left: 28px; margin-top: 2px; color: #111;">
                                Note: "${a.notes}"
                            </div>
                        `:""}
                    </div>
                `).join(""),t=`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>KOT #${e.order_number}</title>
                        <style>
                            @page {
                                size: ${i} auto;
                                margin: 0;
                            }
                            body {
                                width: ${p};
                                margin: 0 auto;
                                padding: 6px 2px;
                                font-family: 'Courier New', Courier, monospace, sans-serif;
                                color: #000;
                                background: #fff;
                                font-size: 13px;
                                line-height: 1.3;
                            }
                            .center { text-align: center; }
                            .bold { font-weight: bold; }
                            .sep { border-top: 1px solid #000; margin: 6px 0; }
                            .dbl-sep { border-top: 2px solid #000; margin: 6px 0; }
                            .banner {
                                font-size: 22px;
                                font-weight: 900;
                                text-align: center;
                                padding: 4px;
                                border: 2px solid #000;
                                margin-bottom: 6px;
                            }
                            .alert-banner {
                                background: #000;
                                color: #fff;
                                padding: 4px;
                                text-align: center;
                                font-size: 18px;
                                font-weight: 900;
                                margin-bottom: 6px;
                            }
                        </style>
                    </head>
                    <body>
                        ${o?`
                            <div class="alert-banner">*** CANCELLED ***</div>
                            <div class="center bold" style="font-size: 12px;">VOIDED ITEMS - DO NOT COOK</div>
                        `:""}
                        ${s?`
                            <div class="alert-banner">*** REPRINT ***</div>
                            <div class="center bold" style="font-size: 12px;">DUPLICATE - CHECK IF PREPARED</div>
                        `:""}

                        <div class="banner">[ ${n} ]</div>
                        ${e.station&&String(e.station).toLowerCase()!=="kitchen"?`<div class="center bold" style="font-size: 16px;">${String(e.station).toUpperCase()}</div>`:""}
                        <div class="center" style="font-size: 20px; font-weight: 900;">
                            ${e.table_number?`TABLE: ${e.table_number}`:`ORDER: ${e.order_number}`}
                        </div>
                        ${e.customer_name?`<div class="center bold">Guest: ${e.customer_name}</div>`:""}

                        <div class="dbl-sep"></div>

                        <div><b>Ticket:</b> ${e.order_number} &nbsp; <b>Server:</b> ${e.server_name||"Staff"}</div>
                        <div><b>Fired:</b> ${e.fired_at_human||new Date().toLocaleTimeString()}</div>

                        <div class="sep"></div>

                        <div class="items">
                            ${c}
                        </div>

                        <div class="sep"></div>
                        <div class="center" style="font-size: 11px; margin-top: 8px;">
                            End of Ticket · ${new Date().toLocaleTimeString()}
                        </div>
                    </body>
                    </html>
                `;return u(t,i)}};export{g as K};
