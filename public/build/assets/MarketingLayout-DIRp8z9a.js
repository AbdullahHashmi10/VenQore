import{j as e,u as v,r as c,H as w,L as l,X as j}from"./app-CD1sn1Ox.js";import{M as y}from"./menu-CndA8ivw.js";import{M as k}from"./message-circle-Cjfk26ZO.js";import{A as N}from"./arrow-right-Dt9Lqrqw.js";function b(a={}){const s=c.useRef(null),[i,o]=c.useState(!1);return c.useEffect(()=>{const r=s.current;if(!r)return;const n=new IntersectionObserver(([d])=>{d.isIntersecting&&(o(!0),n.unobserve(r))},{threshold:a.threshold||.15,rootMargin:a.rootMargin||"0px 0px -60px 0px"});return n.observe(r),()=>n.disconnect()},[]),[s,i]}const C=({children:a,delay:s=0,direction:i="up",className:o="",as:r="div"})=>{const[n,d]=b(),h={up:"translateY(40px)",down:"translateY(-40px)",left:"translateX(40px)",right:"translateX(-40px)",scale:"scale(0.95)",none:"none"};return e.jsx(r,{ref:n,className:o,style:{opacity:d?1:0,transform:d?"none":h[i],transition:`opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${s}s, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${s}s`,willChange:"opacity, transform"},children:a})},$=({end:a,suffix:s="",prefix:i="",duration:o=2e3})=>{const[r,n]=c.useState(0),[d,h]=b(),x=c.useRef(!1);return c.useEffect(()=>{if(!h||x.current)return;x.current=!0;const m=performance.now(),p=t=>{const u=t-m,g=Math.min(u/o,1),f=1-Math.pow(1-g,4);n(Math.round(f*a)),g<1&&requestAnimationFrame(p)};requestAnimationFrame(p)},[h,a,o]),e.jsxs("span",{ref:d,children:[i,r,s]})},X=({children:a,href:s,className:i="",variant:o="primary",...r})=>{const n=c.useRef(null),d=c.useCallback(p=>{const t=n.current;if(!t)return;const u=t.getBoundingClientRect(),g=p.clientX-u.left-u.width/2,f=p.clientY-u.top-u.height/2;t.style.transform=`translate(${g*.15}px, ${f*.15}px) scale(1.02)`},[]),h=c.useCallback(()=>{n.current&&(n.current.style.transform="")},[]),x=o==="primary"?"px-10 py-4 bg-white text-[#020010] font-black text-sm uppercase tracking-[0.15em] rounded-full hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.35)] transition-shadow duration-500":o==="ghost"?"px-10 py-4 bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-[0.15em] rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-500 backdrop-blur-sm":"px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.15em] rounded-full shadow-xl shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all duration-500",m=s?l:"button";return e.jsx(m,{ref:n,href:s,className:`${x} ${i} inline-flex items-center gap-3 cursor-pointer`,onMouseMove:d,onMouseLeave:h,style:{transition:"transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease, background 0.3s ease"},...r,children:a})},L=({children:a,icon:s})=>e.jsxs("div",{className:"inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.3em] uppercase mb-8",children:[s&&e.jsx(s,{size:13}),a]}),_=({children:a,className:s="",hover:i=!0,padding:o="p-8"})=>e.jsx("div",{className:`
        relative ${o} rounded-[2rem] bg-white/[0.03] border border-white/[0.06]
        backdrop-blur-sm
        ${i?"hover:bg-white/[0.06] hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-900/10 hover:-translate-y-1":""}
        transition-all duration-500 group
        ${s}
    `,children:a});function R({children:a,title:s,description:i}){const{props:o}=v(),r=o.settings||{},[n,d]=c.useState(!1),[h,x]=c.useState(!1);c.useEffect(()=>{const t=()=>d(window.scrollY>40);return window.addEventListener("scroll",t,{passive:!0}),()=>window.removeEventListener("scroll",t)},[]);const m=[{label:"Features",href:"/features"},{label:"Pricing",href:"/pricing"},{label:"Blog",href:"/blog"},{label:"About",href:"/about"},{label:"Contact",href:"/contact"}],p=typeof window<"u"?window.location.pathname:"";return e.jsxs("div",{className:"min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40 overflow-x-hidden",children:[e.jsxs(w,{children:[e.jsx("title",{children:s||`${r.app_name||"VenQore"}`}),i&&e.jsx("meta",{name:"description",content:i}),e.jsx("link",{rel:"preconnect",href:"https://fonts.googleapis.com"}),e.jsx("link",{rel:"preconnect",href:"https://fonts.gstatic.com",crossOrigin:""}),e.jsx("link",{href:"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap",rel:"stylesheet"})]}),e.jsxs("div",{className:"fixed inset-0 pointer-events-none z-0",children:[e.jsx("div",{className:"absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/15 rounded-full blur-[160px] vq-pulse-slow"}),e.jsx("div",{className:"absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/10 rounded-full blur-[140px] vq-pulse-slow-delay"}),e.jsx("div",{className:"absolute top-[40%] left-[50%] w-[40vw] h-[40vw] bg-purple-900/5 rounded-full blur-[200px] vq-pulse-slow"})]}),e.jsxs("nav",{className:`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${n?"bg-[#020010]/80 backdrop-blur-2xl border-b border-white/5 py-3":"py-5"}`,children:[e.jsxs("div",{className:"max-w-7xl mx-auto px-6 flex items-center justify-between",children:[e.jsxs(l,{href:"/",className:"flex items-center gap-3 group",children:[e.jsx("img",{src:r.logo_url||"/images/logo.png",alt:"Logo",className:"h-9 w-auto group-hover:scale-105 transition-transform duration-300"}),e.jsx("span",{className:"font-black text-white text-lg uppercase tracking-tighter",children:r.app_name||"VenQore"})]}),e.jsx("div",{className:"hidden lg:flex items-center gap-1",children:m.map(t=>e.jsx(l,{href:t.href,className:`relative px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 rounded-full
                                    ${p===t.href?"text-white bg-white/[0.06]":"text-slate-500 hover:text-white hover:bg-white/[0.03]"}
                                `,children:t.label},t.href))}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(l,{href:"/login",className:"hidden sm:block px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors",children:"Sign In"}),e.jsx(l,{href:"/register",className:"px-7 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25",children:"Start Free"}),e.jsx("button",{onClick:()=>x(!h),className:"lg:hidden p-2 text-slate-400 hover:text-white transition-colors",children:h?e.jsx(j,{size:22}):e.jsx(y,{size:22})})]})]}),e.jsx("div",{className:`lg:hidden overflow-hidden transition-all duration-500 ${h?"max-h-[400px] opacity-100":"max-h-0 opacity-0"}`,children:e.jsx("div",{className:"px-6 py-6 space-y-1 bg-[#020010]/95 backdrop-blur-2xl border-t border-white/5",children:m.map(t=>e.jsx(l,{href:t.href,className:`block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors
                                    ${p===t.href?"text-white bg-white/5":"text-slate-500 hover:text-white hover:bg-white/[0.03]"}
                                `,onClick:()=>x(!1),children:t.label},t.href))})})]}),e.jsx("main",{className:"relative z-10",children:a}),e.jsxs("footer",{className:"border-t border-white/5 pt-24 pb-12 px-6 relative z-10 bg-[#020010]",children:[e.jsxs("div",{className:"max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-20",children:[e.jsxs("div",{className:"md:col-span-5",children:[e.jsxs(l,{href:"/",className:"flex items-center gap-3 mb-8",children:[e.jsx("img",{src:r.logo_url||"/images/logo.png",alt:"Logo",className:"h-10 w-auto"}),e.jsx("span",{className:"font-black text-white text-xl uppercase tracking-tighter",children:r.app_name||"VenQore"})]}),e.jsx("p",{className:"text-slate-600 max-w-sm leading-relaxed text-sm mb-8",children:"The operations platform built on financial truth. Every sale, purchase, and transfer writes a correct journal entry — automatically."}),e.jsx("div",{className:"flex gap-3",children:e.jsx("a",{href:"https://wa.me/92XXXXXXXXXX",className:"p-3 rounded-xl bg-white/5 border border-white/5 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-300",children:e.jsx(k,{size:18})})})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("h4",{className:"text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6",children:"Platform"}),e.jsx("ul",{className:"space-y-3",children:["Features","Pricing","Blog","About"].map(t=>e.jsx("li",{children:e.jsx(l,{href:`/${t.toLowerCase()}`,className:"text-sm text-slate-600 hover:text-white transition-colors font-medium",children:t})},t))})]}),e.jsxs("div",{className:"md:col-span-2",children:[e.jsx("h4",{className:"text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6",children:"Resources"}),e.jsx("ul",{className:"space-y-3",children:[{label:"Contact",href:"/contact"},{label:"Live Demo",href:"/demo"},{label:"Terms",href:"/terms"},{label:"Privacy",href:"/privacy"}].map(t=>e.jsx("li",{children:e.jsx(l,{href:t.href,className:"text-sm text-slate-600 hover:text-white transition-colors font-medium",children:t.label})},t.href))})]}),e.jsxs("div",{className:"md:col-span-3",children:[e.jsx("h4",{className:"text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6",children:"Start Today"}),e.jsx("p",{className:"text-slate-600 text-sm mb-6 leading-relaxed",children:"14-day free trial. Full access. No credit card required."}),e.jsxs(l,{href:"/register",className:"inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all hover:scale-105 shadow-lg shadow-indigo-600/25",children:["Get Started ",e.jsx(N,{size:14})]})]})]}),e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5",children:[e.jsxs("span",{className:"text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]",children:["© 2026 ",r.app_name||"VenQore",". All rights reserved."]}),e.jsxs("div",{className:"flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700",children:[e.jsx(l,{href:"/terms",className:"hover:text-slate-400 transition-colors",children:"Terms"}),e.jsx(l,{href:"/privacy",className:"hover:text-slate-400 transition-colors",children:"Privacy"})]})]})]}),e.jsx("style",{children:`
                * { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }
                h1, h2, h3, h4, h5, h6, .font-display { font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif; }

                @keyframes vq-pulse-slow {
                    0%, 100% { opacity: 0.15; transform: scale(1); }
                    50% { opacity: 0.25; transform: scale(1.05); }
                }
                .vq-pulse-slow { animation: vq-pulse-slow 12s ease-in-out infinite; }
                .vq-pulse-slow-delay { animation: vq-pulse-slow 14s ease-in-out infinite 3s; }

                @keyframes vq-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .vq-float { animation: vq-float 6s ease-in-out infinite; }
                .vq-float-delay { animation: vq-float 6s ease-in-out infinite 2s; }

                @keyframes vq-shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .vq-shimmer { background-size: 200% auto; animation: vq-shimmer 4s linear infinite; }

                @keyframes vq-border-glow {
                    0%, 100% { border-color: rgba(99,102,241,0.1); }
                    50% { border-color: rgba(99,102,241,0.3); }
                }
                .vq-border-glow { animation: vq-border-glow 4s ease-in-out infinite; }

                @keyframes vq-gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .vq-gradient-shift { background-size: 200% 200%; animation: vq-gradient-shift 8s ease infinite; }

                .vq-text-glow { text-shadow: 0 0 80px rgba(99, 102, 241, 0.4); }
                .vq-text-glow-strong { text-shadow: 0 0 120px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99,102,241,0.2); }

                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Smooth scroll for the whole page */
                html { scroll-behavior: smooth; }

                /* Custom grid pattern */
                .vq-grid-pattern {
                    background-image:
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 60px 60px;
                }

                /* Dot pattern */
                .vq-dot-pattern {
                    background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
                    background-size: 30px 30px;
                }
            `})]})}export{$ as AnimatedCounter,_ as GlassCard,X as MagneticButton,C as RevealOnScroll,L as SectionLabel,R as default,b as useScrollReveal};
