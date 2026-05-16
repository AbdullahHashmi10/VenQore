import{r as l,b as u,j as e,H as z,i as f,D as C}from"./app-DW4KPSTF.js";import{S as h}from"./shield-Bf5soj9J.js";import{C as I}from"./circle-alert-DPOSz_f5.js";import{A as y}from"./arrow-right-OqOF4NBn.js";import{M as E}from"./mail-BUeJaoJ2.js";import{E as B}from"./eye-off-BS_OwOhC.js";import{E as R}from"./eye-D8CKj7vB.js";import{H as P}from"./hash-k0j2sUS5.js";const q=`
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
    .hq-input::placeholder { color: rgba(148,163,184,0.55); }
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
        height: 58px; border-radius: 14px;
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
        background: transparent; color: rgba(148,163,184,0.5);
        border: 1px solid transparent;
    }
    .mode-tab.inactive:hover { color: rgba(148,163,184,0.8); }
`;function F(){const d=Array.from({length:18},(t,n)=>({id:n,size:Math.random()*3+2,top:Math.random()*100,left:Math.random()*100,duration:Math.random()*8+6,delay:-(Math.random()*8),color:Math.random()>.5?"99,102,241":"139,92,246"}));return e.jsx(e.Fragment,{children:d.map(t=>e.jsx("div",{style:{position:"absolute",width:t.size+"px",height:t.size+"px",borderRadius:"50%",background:`rgba(${t.color},${Math.random()*.4+.15})`,top:t.top+"%",left:t.left+"%",animation:`float-particle ${t.duration}s ease-in-out infinite`,animationDelay:`${t.delay}s`,filter:"blur(0.5px)",pointerEvents:"none"}},t.id))})}function M({value:d,maxLen:t=8,hasError:n}){const i=Math.min(d.length,t);return e.jsx("div",{style:{display:"flex",justifyContent:"center",gap:10,minHeight:20},children:Array.from({length:t},(c,s)=>e.jsx("div",{style:{width:14,height:14,borderRadius:"50%",background:s<i?n?"#ef4444":"#6366f1":"rgba(255,255,255,0.1)",border:s<i?n?"1px solid rgba(239,68,68,0.5)":"1px solid rgba(99,102,241,0.5)":"1px solid rgba(255,255,255,0.15)",transition:"all 0.2s",transform:s<i?"scale(1.15)":"scale(1)",animation:s===i-1&&i>0?"pin-bounce 0.25s ease":"none"}},s))})}function X({status:d,has_pin_enabled:t=!1}){const[n,i]=l.useState(t?"pin":"password"),[c,s]=l.useState(!1),[m,p]=l.useState(null),[x,j]=l.useState(!1),g=l.useRef(null),o=u({email:"",password:"",remember:!0}),r=u({pin:""});l.useEffect(()=>{j(!0),n==="password"&&setTimeout(()=>g.current?.focus(),600)},[]),l.useEffect(()=>{n==="password"&&setTimeout(()=>g.current?.focus(),200)},[n]);const k=a=>{a.preventDefault(),o.post(route("platform.login.store"))},v=()=>{r.data.pin.length<4||r.post(route("platform.login.pin"),{onError:()=>r.setData("pin","")})},b=a=>{if(a==="del")r.setData("pin",r.data.pin.slice(0,-1));else if(r.data.pin.length<8){const S=r.data.pin+a;r.setData("pin",S)}},w=o.errors.email||o.errors.password||r.errors.pin;return e.jsxs("div",{style:{minHeight:"100vh",width:"100%",background:"radial-gradient(ellipse at 20% 50%, rgba(25,15,55,0.95) 0%, #06080f 55%, #020304 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter', system-ui, sans-serif",position:"relative",overflow:"hidden",padding:"20px"},children:[e.jsx(z,{title:"VenQore — Secure Access"}),e.jsx("style",{children:q}),e.jsxs("div",{style:{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"},children:[e.jsx("div",{style:{position:"absolute",top:"-15%",left:"-10%",width:"55%",height:"55%",borderRadius:"50%",background:"radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",filter:"blur(60px)",animation:"float-orb 12s ease-in-out infinite"}}),e.jsx("div",{style:{position:"absolute",bottom:"-15%",right:"-5%",width:"45%",height:"45%",borderRadius:"50%",background:"radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",filter:"blur(80px)",animation:"float-orb 16s ease-in-out infinite",animationDelay:"-5s"}}),e.jsx("div",{style:{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)",backgroundSize:"64px 64px"}}),e.jsx(F,{})]}),e.jsxs("div",{style:{position:"relative",width:"100%",maxWidth:440,opacity:x?1:0,animation:x?"slide-up 0.65s cubic-bezier(0.16,1,0.3,1) forwards":"none"},children:[e.jsx("div",{style:{position:"absolute",inset:-1,borderRadius:28,background:"linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.2), rgba(99,102,241,0.1))",filter:"blur(1px)",animation:"glow-pulse 4s ease-in-out infinite"}}),e.jsxs("div",{style:{position:"relative",background:"rgba(8, 10, 24, 0.88)",backdropFilter:"blur(40px)",WebkitBackdropFilter:"blur(40px)",borderRadius:28,border:"1px solid rgba(99,102,241,0.18)",padding:"44px 40px",boxShadow:"0 40px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)"},children:[e.jsxs("div",{style:{textAlign:"center",marginBottom:32},children:[e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",justifyContent:"center",width:70,height:70,borderRadius:20,marginBottom:20,background:"linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",border:"1px solid rgba(99,102,241,0.35)",boxShadow:"0 0 28px rgba(99,102,241,0.2)"},children:[e.jsx("img",{src:"/images/logo.png",alt:"VenQore",style:{width:42,height:42,objectFit:"contain"},onError:a=>{a.target.style.display="none",a.target.nextSibling.style.display="flex"}}),e.jsx("div",{style:{display:"none",alignItems:"center",justifyContent:"center"},children:e.jsx(h,{size:30,color:"#6366f1"})})]}),e.jsx("div",{style:{fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(99,102,241,0.8)",marginBottom:9},children:"VenQore Platform HQ"}),e.jsx("h1",{style:{fontSize:24,fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.02em",marginBottom:6},children:"Welcome back, Abdullah"}),e.jsx("p",{style:{fontSize:13,color:"rgba(148,163,184,0.65)",lineHeight:1.5},children:"Secure access to your command center"})]}),t&&e.jsxs("div",{style:{display:"flex",gap:6,marginBottom:24,background:"rgba(255,255,255,0.03)",borderRadius:13,padding:4,border:"1px solid rgba(255,255,255,0.06)"},children:[e.jsx("button",{className:`mode-tab ${n==="pin"?"active":"inactive"}`,onClick:()=>i("pin"),type:"button",children:"#  PIN Login"}),e.jsxs("button",{className:`mode-tab ${n==="password"?"active":"inactive"}`,onClick:()=>i("password"),type:"button",children:[e.jsx(f,{style:{display:"inline",width:12,height:12,marginRight:5}}),"Password"]})]}),d&&e.jsx("div",{style:{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:12,padding:"11px 16px",marginBottom:20,fontSize:13,color:"#34d399",display:"flex",alignItems:"center",gap:8},children:d}),w&&e.jsxs("div",{style:{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:12,padding:"11px 16px",marginBottom:20,fontSize:13,color:"#f87171",display:"flex",alignItems:"center",gap:8,animation:"fade-in 0.3s ease"},children:[e.jsx(I,{size:15,style:{flexShrink:0}}),o.errors.email||o.errors.password||r.errors.pin]}),n==="pin"&&e.jsxs("div",{style:{animation:"fade-in 0.3s ease"},children:[e.jsxs("div",{style:{marginBottom:24,textAlign:"center"},children:[e.jsx("p",{style:{fontSize:12,color:"rgba(100,116,139,0.8)",marginBottom:16,letterSpacing:"0.04em",textTransform:"uppercase",fontWeight:700},children:"Enter your PIN"}),e.jsx(M,{value:r.data.pin,hasError:!!r.errors.pin})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14},children:[[1,2,3,4,5,6,7,8,9].map(a=>e.jsx("button",{type:"button",className:"pin-key",onClick:()=>b(String(a)),children:a},a)),e.jsx("button",{type:"button",className:"pin-key del",onClick:()=>b("del"),children:e.jsx(C,{size:20})}),e.jsx("button",{type:"button",className:"pin-key",onClick:()=>b("0"),children:"0"}),e.jsx("button",{type:"button",className:`pin-key submit ${r.data.pin.length>=4,""}`,onClick:v,disabled:r.data.pin.length<4||r.processing,style:{opacity:r.data.pin.length<4?.35:1},children:r.processing?e.jsx("svg",{width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",style:{animation:"spin 0.8s linear infinite"},children:e.jsx("path",{d:"M21 12a9 9 0 11-6.219-8.56"})}):e.jsx(y,{size:20})})]}),!t&&e.jsxs("button",{type:"button",className:"toggle-mode",style:{width:"100%",justifyContent:"center"},onClick:()=>i("password"),children:[e.jsx(f,{size:12})," Use password instead"]})]}),n==="password"&&e.jsxs("form",{onSubmit:k,style:{display:"flex",flexDirection:"column",gap:16,animation:"fade-in 0.3s ease"},children:[e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:11,fontWeight:800,color:"rgba(148,163,184,0.8)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8},children:"Email Address"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{style:{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",color:m==="email"?"#6366f1":"rgba(100,116,139,0.7)",transition:"color 0.2s",pointerEvents:"none"},children:e.jsx(E,{size:17})}),e.jsx("input",{ref:g,type:"email",className:`hq-input ${o.errors.email?"err":""}`,value:o.data.email,onChange:a=>o.setData("email",a.target.value),onFocus:()=>p("email"),onBlur:()=>p(null),placeholder:"your@email.com",autoComplete:"email"})]})]}),e.jsxs("div",{children:[e.jsx("label",{style:{display:"block",fontSize:11,fontWeight:800,color:"rgba(148,163,184,0.8)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8},children:"Password"}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx("div",{style:{position:"absolute",left:15,top:"50%",transform:"translateY(-50%)",color:m==="password"?"#6366f1":"rgba(100,116,139,0.7)",transition:"color 0.2s",pointerEvents:"none"},children:e.jsx(f,{size:17})}),e.jsx("input",{type:c?"text":"password",className:`hq-input pr ${o.errors.password?"err":""}`,value:o.data.password,onChange:a=>o.setData("password",a.target.value),onFocus:()=>p("password"),onBlur:()=>p(null),placeholder:"••••••••••••",autoComplete:"current-password"}),e.jsx("button",{type:"button",onClick:()=>s(a=>!a),style:{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(100,116,139,0.65)",padding:4,display:"flex",alignItems:"center"},tabIndex:-1,children:c?e.jsx(B,{size:16}):e.jsx(R,{size:16})})]})]}),e.jsx("div",{style:{marginTop:4},children:e.jsx("button",{type:"submit",disabled:o.processing,className:"hq-btn",children:o.processing?e.jsxs(e.Fragment,{children:[e.jsx("svg",{width:"17",height:"17",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2.5",style:{animation:"spin 0.8s linear infinite"},children:e.jsx("path",{d:"M21 12a9 9 0 11-6.219-8.56"})}),"Authenticating…"]}):e.jsxs(e.Fragment,{children:["Enter Command Center ",e.jsx(y,{size:17})]})})}),t&&e.jsxs("button",{type:"button",className:"toggle-mode",style:{justifyContent:"center",width:"100%"},onClick:()=>i("pin"),children:[e.jsx(P,{size:12})," Switch to PIN login"]})]}),e.jsxs("div",{style:{marginTop:28,paddingTop:22,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",gap:8},children:[e.jsx(h,{size:12,color:"rgba(100,116,139,0.45)"}),e.jsx("span",{style:{fontSize:11,color:"rgba(100,116,139,0.45)",letterSpacing:"0.02em"},children:"Rate-limited · Session-encrypted · Platform-restricted"})]})]})]})]})}export{X as default};
