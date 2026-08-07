import{r as s,g as w,j as e,H as D,p as u,Q as N}from"./app-C_AK_YSK.js";import{S}from"./shield-bMhuPuop.js";import{C as z}from"./circle-alert-DA-tUJfU.js";import{A as C}from"./arrow-right-BeXTFmAz.js";import{M as P}from"./mail-BUcpzID-.js";import{E as M}from"./eye-off-Bmlp5E5T.js";import{E as q}from"./eye-DAnlOJ_p.js";import{H as F}from"./hash-CBn7FWqg.js";const T=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes float-orb {
        0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
        33% { transform: scale(1.08) translate(20px,-30px); opacity: 1; }
        66% { transform: scale(0.95) translate(-15px,20px); opacity: 0.7; }
    }
    @keyframes float-particle {
        0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        50% { transform: translateY(-28px) translateX(14px) scale(1.15); opacity: 0.7; }
    }
    @keyframes slide-up {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow-pulse {
        0%,100% { opacity: 0.5; }
        50%      { opacity: 1; }
    }
    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-8px); }
        40%     { transform: translateX(8px); }
        60%     { transform: translateX(-5px); }
        80%     { transform: translateX(5px); }
    }
    @keyframes pin-bounce {
        0%  { transform: scale(0.5); opacity: 0; }
        70% { transform: scale(1.2); }
        100%{ transform: scale(1); opacity: 1; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .pin-card {
        padding: 24px 16px;
    }

    .logo-container {
        width: 52px;
        height: 52px;
    }

    .hq-input {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 13px 16px 13px 48px;
        color: #f1f5f9;
        font-size: 15px;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: all 0.25s;
    }
    .hq-input::placeholder { color: rgba(148,163,184,0.75); }
    .hq-input:focus {
        border-color: rgba(99,102,241,0.7);
        background: rgba(99,102,241,0.07);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .hq-input.err { border-color: rgba(239,68,68,0.6); animation: shake 0.4s ease; }
    .hq-input.pr  { padding-right: 48px; }

    .hq-btn {
        width: 100%; padding: 14px;
        border-radius: 14px; border: none;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #7c3aed 100%);
        color: #fff; font-size: 15px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: all 0.25s; letter-spacing: 0.02em;
        box-shadow: 0 6px 28px rgba(99,102,241,0.4);
        position: relative; overflow: hidden;
    }
    .hq-btn:hover:not(:disabled) {
        box-shadow: 0 10px 36px rgba(99,102,241,0.55);
        transform: translateY(-1px);
    }
    .hq-btn:active:not(:disabled) { transform: scale(0.98); }
    .hq-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    .hq-btn::after {
        content: ''; position: absolute;
        top: -50%; left: -60%; width: 50%; height: 200%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        transform: skewX(-20deg); transition: left 0.6s;
    }
    .hq-btn:hover::after { left: 120%; }

    .pin-key {
        height: 48px; border-radius: 14px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        color: #f1f5f9; font-size: 20px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; transition: all 0.15s;
        display: flex; align-items: center; justify-content: center;
    }
    .pin-key:hover {
        background: rgba(99,102,241,0.18);
        border-color: rgba(99,102,241,0.4);
        transform: scale(1.04);
    }
    .pin-key:active { transform: scale(0.95); }
    .pin-key.del {
        background: rgba(239,68,68,0.06);
        border-color: rgba(239,68,68,0.15);
        color: rgba(239,68,68,0.7);
    }
    .pin-key.del:hover {
        background: rgba(239,68,68,0.14);
        border-color: rgba(239,68,68,0.35);
        color: #ef4444;
    }
    .pin-key.submit {
        background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.25));
        border-color: rgba(99,102,241,0.5);
        color: #a5b4fc;
    }
    .pin-key.submit:hover {
        background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4));
        color: #fff;
    }

    .toggle-mode {
        background: none; border: none; cursor: pointer;
        font-family: 'Inter', sans-serif;
        color: rgba(148,163,184,0.6); font-size: 12px; font-weight: 600;
        letter-spacing: 0.04em; transition: color 0.2s;
        display: flex; align-items: center; gap: 6px;
        padding: 6px 0;
    }
    .toggle-mode:hover { color: #a5b4fc; }

    .mode-tab {
        flex: 1; padding: 9px; border-radius: 10px; border: none;
        font-size: 13px; font-weight: 700; cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: all 0.2s;
    }
    .mode-tab.active {
        background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2));
        color: #a5b4fc; border: 1px solid rgba(99,102,241,0.35);
    }
    .mode-tab.inactive {
        background: transparent; color: rgba(148,163,184,0.7);
        border: 1px solid transparent;
    }
    .mode-tab.inactive:hover { color: rgba(148,163,184,0.8); }
`;function A(){const p=Array.from({length:18},(n,d)=>({id:d,size:Math.random()*3+2,top:Math.random()*100,left:Math.random()*100,duration:Math.random()*8+6,delay:-(Math.random()*8),color:Math.random()>.5?"99,102,241":"139,92,246"}));return e.jsx(e.Fragment,{children:p.map(n=>e.jsx("div",{style:{position:"absolute",width:n.size+"px",height:n.size+"px",borderRadius:"50%",background:`rgba(${n.color},${Math.random()*.4+.15})`,top:n.top+"%",left:n.left+"%",animation:`float-particle ${n.duration}s ease-in-out infinite`,animationDelay:`${n.delay}s`,filter:"blur(0.5px)",pointerEvents:"none"}},n.id))})}function W({value:p,maxLen:n=8,hasError:d}){const a=Math.min(p.length,n);return e.jsx("div",{style:{display:"flex",justifyContent:"center",gap:10,minHeight:20},children:Array.from({length:n},(c,l)=>e.jsx("div",{style:{width:14,height:14,borderRadius:"50%",background:l<a?d?"#ef4444":"#6366f1":"rgba(255,255,255,0.1)",border:l<a?d?"1px solid rgba(239,68,68,0.5)":"1px solid rgba(99,102,241,0.5)":"1px solid rgba(255,255,255,0.15)",transition:"all 0.2s",transform:l<a?"scale(1.15)":"scale(1)",animation:l===a-1&&a>0?"pin-bounce 0.25s ease":"none"}},l))})}function O({status:p,has_pin_enabled:n=!1,flash:d}){const[a,c]=s.useState(n?"pin":"password"),[l,E]=s.useState(!1),[x,g]=s.useState(null),[h,R]=s.useState(!1),f=s.useRef(null),y=s.useRef(null),j=s.useRef(null),v=s.useRef(""),o=w({email:"",password:"",remember:!0}),t=w({pin:""});s.useEffect(()=>{R(!0),a==="password"&&setTimeout(()=>f.current?.focus(),600)},[]),s.useEffect(()=>{a==="password"&&setTimeout(()=>f.current?.focus(),200)},[a]),s.useEffect(()=>{if(a!=="pin")return;setTimeout(()=>y.current?.focus(),150);const r=i=>{const b=v.current;i.key>="0"&&i.key<="9"?(i.preventDefault(),b.length<8&&t.setData("pin",b+i.key)):i.key==="Backspace"?(i.preventDefault(),t.setData("pin",b.slice(0,-1))):i.key==="Enter"&&(i.preventDefault(),j.current?.())};return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[a]);const I=r=>{r.preventDefault(),o.post("/VenQore-login",{preserveState:!0,preserveScroll:!0})},k=()=>{t.data.pin.length<4||t.post("/VenQore-login/pin",{preserveState:!0,preserveScroll:!0,onError:()=>t.setData("pin","")})};s.useEffect(()=>{j.current=k,v.current=t.data.pin});const m=r=>{if(r==="del")t.setData("pin",t.data.pin.slice(0,-1));else if(t.data.pin.length<8){const i=t.data.pin+r;t.setData("pin",i)}},B=o.errors.email||o.errors.password||t.errors.pin;return e.jsxs("div",{style:{minHeight:"100vh",width:"100%",background:"radial-gradient(ellipse at 20% 50%, rgba(25,15,55,0.95) 0%, #06080f 55%, #020304 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter', system-ui, sans-serif",position:"relative",overflow:"hidden",padding:"20px"},children:[e.jsx(D,{title:"VenQore — Secure Access"}),e.jsx("style",{children:T}),e.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"},children:[e.jsx("div",{style:{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",borderRadius:"50%",background:"radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",filter:"blur(60px)",animation:"float-orb 12s ease-in-out infinite"}}),e.jsx("div",{style:{position:"absolute",bottom:"-15%",right:"-5%",width:"45%",height:"45%",borderRadius:"50%",background:"radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",filter:"blur(80px)",animation:"float-orb 16s ease-in-out infinite",animationDelay:"-5s"}}),e.jsx("div",{style:{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)",backgroundSize:"64px 64px"}}),e.jsx(A,{})]}),e.jsxs("div",{style:{position:"relative",width:"100%",maxWidth:440,opacity:h?1:0,animation:h?"slide-up 0.65s cubic-bezier(0.16,1,0.3,1) forwards":"none"},children:[e.jsx("div",{style:{position:"absolute",inset:-1,borderRadius:28,background:"linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.2), rgba(99,102,241,0.1))",filter:"blur(1px)",animation:"glow-pulse 4s ease-in-out infinite"}}),e.jsxs("div",{className:"pin-card",style:{position:"relative",background:"rgba(8, 10, 24, 0.88)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",borderRadius:28,border:"1px solid rgba(99,102,241,0.18)",boxShadow:"0 40px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)"},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:32},children:[e.jsxs("div",{className:"logo-container",style:{display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:20,marginBottom:20,background:"linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",border:"1px solid rgba(99,102,241,0.35)",boxShadow:"0 0 28px rgba(99,102,241,0.2)"},children:[e.jsx("img",{src:"/images/logo.png",alt:"VenQore",style:{width:32,height:32,objectFit:"contain"},onError:r=>{r.target.style.display="none",r.target.nextSibling.style.display="flex"}}),e.jsx("div",{style:{display:"none",alignItems:"center",justifyContent:"center"},children:e.jsx(S,{size:22,color:"#6366f1"})})]}),e.jsx("div",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(99,102,241,0.8)",marginBottom:9},children:"VenQore Platform HQ"}),e.jsx("h1",{style:{fontSize:24,fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.02em",marginBottom:6},children:"Welcome back, Abdullah"}),e.jsx("p",{style:{fontSize:13,color:"rgba(148,163,184,0.65)",lineHeight:1.5},children:"Secure access to your command center"})]}),n&&e.jsxs("div",{style:{display:"flex",gap:6,marginBottom:24,background:"rgba(255,255,255,0.03)",borderRadius:13,padding:4,border:"1px solid rgba(255,255,255,0.06)"},children:[e.jsx("button",{className:`mode-tab ${a==="pin"?"active":"inactive"}`,onClick:()=>c("pin"),type:"button",children:"#  PIN Login"}),e.jsxs("button",{className:`mode-tab ${a==="password"?"active":"inactive"}`,onClick:()=>c("password"),type:"button",children:[e.jsx(u,{style:{display:"inline",width:12,height:12,marginRight:5}}),"Password"]})]}),p&&e.jsx("div",{style:{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:12,padding:"11px 16px",marginBottom:20,fontSize:13,color:"#34d399",display:"flex",alignItems:"center",gap:8},children:p}),d?.error&&e.jsxs("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:12,padding:"11px 16px",marginBottom:20,fontSize:13,color:"#f87171",display:"flex",alignItems:"center",gap:8,animation:"fade-in 0.3s ease"},children:[e.jsx(z,{size:15,style:{flexShrink:0}}),d.error]}),B&&e.jsxs("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:12,padding:"11px 16px",marginBottom:20,fontSize:13,color:"#f87171",display:"flex",alignItems:"center",gap:8,animation:"fade-in 0.3s ease"},children:[e.jsx(z,{size:15,style:{flexShrink:0}}),o.errors.email||o.errors.password||t.errors.pin]}),a==="pin"&&e.jsxs("div",{style:{animation:"fade-in 0.3s ease"},children:[e.jsxs("div",{style:{marginBottom:24,textAlign:"center"},children:[e.jsx("p",{style:{fontSize:12,color:"#94a3b8",marginBottom:16,letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:700},children:"Enter your PIN"}),e.jsx(W,{value:t.data.pin,hasError:!!t.errors.pin}),e.jsx("input",{ref:y,type:"text",inputMode:"numeric",autoComplete:"one-time-code","aria-label":"Enter your PIN",value:t.data.pin,onChange:r=>{const i=r.target.value.replace(/\D/g,"").slice(0,8);t.setData("pin",i)},style:{position:"absolute",width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0,0,0,0)",border:0,opacity:0}})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14},children:[[1,2,3,4,5,6,7,8,9].map(r=>e.jsx("button",{type:"button",className:"pin-key",onClick:()=>m(String(r)),children:r},r)),e.jsx("button",{type:"button",className:"pin-key del",onClick:()=>m("del"),children:e.jsx(N,{size:20})}),e.jsx("button",{type:"button",className:"pin-key",onClick:()=>m("0"),children:"0"}),e.jsx("button",{type:"button",className:`pin-key submit ${t.data.pin.length>=4,""}`,onClick:k,disabled:t.data.pin.length<4||t.processing,style:{opacity:t.data.pin.length<4?.35:1},children:t.processing?e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",style:{animation:"spin 0.8s linear infinite"},children:e.jsx("path",{d:"M21 12a9 9 0 11-6.219-8.56"})}):e.jsx(C,{size:20})})]}),!n&&e.jsxs("button",{type:"button",className:"toggle-mode",style:{width:"100%",justifyContent:"center"},onClick:()=>c("password"),children:[e.jsx(u,{size:12})," Use password instead"]})]}),a==="password"&&e.jsxs("form",{onSubmit:I,style:{display:"flex",flexDirection:"column",gap:16,animation:"fade-in 0.3s ease"},children:[e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:11,fontWeight:800,color:"rgba(148,163,184,0.8)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8},children:"Email Address"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{style:{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",color:x==="email"?"#6366f1":"rgba(100,116,139,0.7)",transition:"color 0.2s",pointerEvents:"none"},children:e.jsx(P,{size:17})}),e.jsx("input",{ref:f,type:"email",className:`hq-input ${o.errors.email?"err":""}`,value:o.data.email,onChange:r=>o.setData("email",r.target.value),onFocus:()=>g("email"),onBlur:()=>g(null),placeholder:"your@email.com",autoComplete:"email"})]})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:11,fontWeight:800,color:"rgba(148,163,184,0.8)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8},children:"Password"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{style:{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",color:x==="password"?"#6366f1":"rgba(100,116,139,0.7)",transition:"color 0.2s",pointerEvents:"none"},children:e.jsx(u,{size:17})}),e.jsx("input",{type:l?"text":"password",className:`hq-input pr ${o.errors.password?"err":""}`,value:o.data.password,onChange:r=>o.setData("password",r.target.value),onFocus:()=>g("password"),onBlur:()=>g(null),placeholder:"••••••••••••",autoComplete:"current-password"}),e.jsx("button",{type:"button",onClick:()=>E(r=>!r),style:{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(100,116,139,0.65)",padding:4,display:"flex",alignItems:"center"},tabIndex:-1,children:l?e.jsx(M,{size:16}):e.jsx(q,{size:16})})]})]}),e.jsx("div",{style:{marginTop:4},children:e.jsx("button",{type:"submit",disabled:o.processing,className:"hq-btn",children:o.processing?e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",style:{animation:"spin 0.8s linear infinite"},children:e.jsx("path",{d:"M21 12a9 9 0 11-6.219-8.56"})}),"Authenticating…"]}):e.jsxs(e.Fragment,{children:["Enter Command Center ",e.jsx(C,{size:17})]})})}),n&&e.jsxs("button",{type:"button",className:"toggle-mode",style:{justifyContent:"center",width:"100%"},onClick:()=>c("pin"),children:[e.jsx(F,{size:12})," Switch to PIN login"]})]}),e.jsxs("div",{style:{marginTop:28,paddingTop:22,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:[e.jsx(S,{size:12,color:"#64748b"}),e.jsx("span",{style:{fontSize:11,color:"#64748b",letterSpacing:"0.02em"},children:"Rate-limited · Session-encrypted · Platform-restricted"})]})]})]})]})}export{O as default};
