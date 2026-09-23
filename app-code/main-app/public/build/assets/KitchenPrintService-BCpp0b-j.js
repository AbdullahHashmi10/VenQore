import{i as x,A as y}from"./AMDStation-BkoXmp_t.js";const g={async printKOT(e,r={}){if(!e||!e.items)return console.warn("[KitchenPrintService] No KOT data to print"),{success:!1,error:"Empty ticket data"};const l=r.paperWidth||e.paper_width||"80mm",p=!!(r.isReprint||e.is_reprint),d=!!(r.isCancellation||e.is_cancellation);try{if(x()){const s=this.formatEscPos(e,{paperWidth:l,isReprint:p,isCancellation:d}),n=await y.print(s,{paperWidth:l,copies:r.copies||1,printerName:r.printerName});if(n&&n.success!==!1)return{success:!0,method:"station"};throw new Error(n?.error||"Station printer failed to answer")}else return await this.printViaIframe(e,{paperWidth:l,isReprint:p,isCancellation:d}),{success:!0,method:"browser"}}catch(s){console.error("[KitchenPrintService] Loud failure:",s);const n={kot:e,options:r,error:s.message||"Thermal printer communication failed",retry:()=>this.printKOT(e,r)};return typeof window<"u"&&window.dispatchEvent(new CustomEvent("kot:print-failed",{detail:n})),{success:!1,error:n.error,retry:n.retry}}},formatEscPos(e,{paperWidth:r,isReprint:l,isCancellation:p}){const s=r==="58mm"?32:48,n="-".repeat(s),c="=".repeat(s),t=[];p?(t.push({type:"text",value:"*** CANCELLED ***",style:{fontWeight:"900",textAlign:"center",fontSize:"22px"}}),t.push({type:"text",value:"DO NOT PREPARE VOIDED ITEMS",style:{fontWeight:"700",textAlign:"center",fontSize:"13px"}})):l&&(t.push({type:"text",value:"*** REPRINT ***",style:{fontWeight:"900",textAlign:"center",fontSize:"20px"}}),t.push({type:"text",value:"DUPLICATE TICKET - CHECK IF ALREADY COOKED",style:{fontWeight:"700",textAlign:"center",fontSize:"12px"}}));const i=(e.order_type_badge||e.order_type||"DINE-IN").toUpperCase();t.push({type:"text",value:`[ ${i} ]`,style:{fontWeight:"900",textAlign:"center",fontSize:"24px",margin:"4px 0"}});const m=e.table_number?`TABLE: ${e.table_number}`:`ORDER: ${e.order_number}`;return t.push({type:"text",value:m,style:{fontWeight:"800",textAlign:"center",fontSize:"20px"}}),e.customer_name&&t.push({type:"text",value:`Guest: ${e.customer_name}`,style:{textAlign:"center",fontSize:"14px"}}),t.push({type:"text",value:c,style:{textAlign:"center"}}),t.push({type:"text",value:`Ticket: ${e.order_number}   Server: ${e.server_name||"Staff"}`,style:{fontSize:"13px"}}),t.push({type:"text",value:`Fired: ${e.fired_at_human||new Date().toLocaleTimeString()}`,style:{fontSize:"13px"}}),t.push({type:"text",value:n,style:{textAlign:"center"}}),(e.items||[]).forEach(o=>{const f=o.qty||1;t.push({type:"text",value:`${f}x  ${o.name}`,style:{fontWeight:"800",fontSize:"18px",margin:"2px 0"}}),Array.isArray(o.modifiers)&&o.modifiers.length>0&&t.push({type:"text",value:`   * ${o.modifiers.join(", ")}`,style:{fontSize:"14px",fontStyle:"italic"}}),o.notes&&t.push({type:"text",value:`   Note: "${o.notes}"`,style:{fontSize:"14px",fontWeight:"700"}})}),t.push({type:"text",value:n,style:{textAlign:"center"}}),t.push({type:"text",value:`End of Ticket · ${new Date().toLocaleTimeString()}`,style:{textAlign:"center",fontSize:"12px",margin:"6px 0 12px 0"}}),t},printViaIframe(e,{paperWidth:r,isReprint:l,isCancellation:p}){return new Promise((d,s)=>{try{const n=r==="58mm"?"48mm":"72mm",c=r==="58mm"?"58mm":"80mm",t="kot-silent-print-frame";let i=document.getElementById(t);i&&i.remove(),i=document.createElement("iframe"),i.id=t,i.style.position="fixed",i.style.right="0",i.style.bottom="0",i.style.width="0",i.style.height="0",i.style.border="none",i.style.visibility="hidden",document.body.appendChild(i);const m=(e.order_type_badge||e.order_type||"DINE-IN").toUpperCase(),o=(e.items||[]).map(a=>`
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
                `).join(""),f=`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8" />
                        <title>KOT #${e.order_number}</title>
                        <style>
                            @page {
                                size: ${c} auto;
                                margin: 0;
                            }
                            body {
                                width: ${n};
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
                        ${p?`
                            <div class="alert-banner">*** CANCELLED ***</div>
                            <div class="center bold" style="font-size: 12px;">VOIDED ITEMS - DO NOT COOK</div>
                        `:""}
                        ${l?`
                            <div class="alert-banner">*** REPRINT ***</div>
                            <div class="center bold" style="font-size: 12px;">DUPLICATE - CHECK IF PREPARED</div>
                        `:""}

                        <div class="banner">[ ${m} ]</div>
                        <div class="center" style="font-size: 20px; font-weight: 900;">
                            ${e.table_number?`TABLE: ${e.table_number}`:`ORDER: ${e.order_number}`}
                        </div>
                        ${e.customer_name?`<div class="center bold">Guest: ${e.customer_name}</div>`:""}

                        <div class="dbl-sep"></div>

                        <div><b>Ticket:</b> ${e.order_number} &nbsp; <b>Server:</b> ${e.server_name||"Staff"}</div>
                        <div><b>Fired:</b> ${e.fired_at_human||new Date().toLocaleTimeString()}</div>

                        <div class="sep"></div>

                        <div class="items">
                            ${o}
                        </div>

                        <div class="sep"></div>
                        <div class="center" style="font-size: 11px; margin-top: 8px;">
                            End of Ticket · ${new Date().toLocaleTimeString()}
                        </div>
                    </body>
                    </html>
                `,u=i.contentWindow.document;u.open(),u.write(f),u.close(),setTimeout(()=>{try{i.contentWindow.focus(),i.contentWindow.print(),d(!0)}catch(a){s(a)}},250)}catch(n){s(n)}})}};export{g as K};
