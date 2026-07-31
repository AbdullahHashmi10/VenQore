import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import MarketingLayout, { RevealOnScroll } from "./MarketingLayout-CMiC1Bik.js";
import { Sparkles, Activity, Package, CheckCircle2, Database, Layers, Fingerprint, ArrowRight, Cpu, Lock, Hexagon, Rocket, ExternalLink } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function DigitalProducts({ products, stats }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const activeProducts = products.filter((p) => p.status === "active");
  const devProducts = products.filter((p) => p.status === "dev");
  const soonProducts = products.filter((p) => p.status === "soon");
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "VenQore Digital Products catalog",
      description: "Explore our premium collection of offline POS modules, standalone platforms, and custom accounting extensions.",
      children: [
        /* @__PURE__ */ jsx(Head, { title: "Digital Products & Registry Catalog" }),
        /* @__PURE__ */ jsxs("div", { className: "relative min-h-screen bg-[#020010] text-white overflow-hidden pb-40", children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "fixed inset-0 z-0 pointer-events-none transition-transform duration-1000 ease-out",
              style: { transform: `translate(${(mousePosition.x - window.innerWidth / 2) * -0.02}px, ${(mousePosition.y - window.innerHeight / 2) * -0.02}px)` },
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[180px]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-700/10 rounded-full blur-[150px]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("section", { className: "relative pt-32 md:pt-48 pb-20 px-4 md:px-6 z-10 text-center max-w-4xl mx-auto space-y-8 flex flex-col items-center", children: [
            /* @__PURE__ */ jsxs(RevealOnScroll, { children: [
              /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md mb-6", children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-indigo-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-slate-300", children: "VenQore Ecosystem" })
              ] }),
              /* @__PURE__ */ jsxs("h1", { className: "text-[2.75rem] xs:text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase font-display text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-2xl", children: [
                "Digital ",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600", children: "Registry" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-8 text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-light", children: "The definitive suite of double-entry ledger systems, point-of-sale registers, and analytics overlays. Built for zero-latency, offline-first operational dominance." })
            ] }),
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-2 md:gap-4 mt-8 p-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl shadow-indigo-500/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center px-6 py-4", children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2", children: "Total Modules" }),
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-white", children: stats.total })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" }),
              /* @__PURE__ */ jsxs("div", { className: "text-center px-6 py-4", children: [
                /* @__PURE__ */ jsxs("span", { className: "block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" }),
                  "Live & Active"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-emerald-400", children: stats.done })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" }),
              /* @__PURE__ */ jsxs("div", { className: "text-center px-6 py-4", children: [
                /* @__PURE__ */ jsxs("span", { className: "block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center", children: [
                  /* @__PURE__ */ jsx(Activity, { className: "w-3 h-3" }),
                  "In Pipeline"
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-indigo-400", children: stats.pending })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "max-w-[85rem] mx-auto px-4 md:px-8 space-y-32 md:space-y-48 relative z-10 mt-10", children: [
            /* @__PURE__ */ jsxs("section", { className: "space-y-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-indigo-500/20 pb-6 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-indigo-500 to-transparent" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-black tracking-[0.25em] text-emerald-400 uppercase flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute opacity-75" }),
                    /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 relative" }),
                    "Core Flagship Modules"
                  ] }),
                  /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-5xl font-black tracking-tighter text-white uppercase font-display", children: "Fully Operational" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 max-w-md md:text-right leading-relaxed border-l border-white/10 pl-4 md:border-none md:pl-0", children: "Tested, deployed, and production-ready accounting systems with fully operational double-entry ledger registers." })
              ] }),
              activeProducts.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 rounded-[3rem] bg-slate-900/20 border border-white/5 backdrop-blur-sm text-center text-slate-500", children: [
                /* @__PURE__ */ jsx(Package, { className: "w-12 h-12 mx-auto mb-4 opacity-20" }),
                /* @__PURE__ */ jsx("p", { children: "No active flagship modules configured." })
              ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-16", children: activeProducts.map((product, i) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "relative rounded-[3rem] bg-slate-900/40 backdrop-blur-xl border border-white/10 overflow-hidden group transition-all duration-700 hover:border-indigo-500/50 hover:shadow-[0_0_80px_-20px_rgba(99,102,241,0.3)] flex flex-col xl:flex-row",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20 group-hover:opacity-40 transition-opacity duration-700" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20 -z-10" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 p-8 md:p-14 lg:p-20 relative z-10 flex flex-col justify-center", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 mb-8", children: [
                        /* @__PURE__ */ jsxs("div", { className: "px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
                          " Validated Core"
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono", children: [
                          "Build ",
                          product.version || "v1.0.0"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("h3", { className: "text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]", children: product.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-lg md:text-xl leading-relaxed font-light max-w-3xl mb-12", children: product.description }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mt-auto", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Database, { className: "w-5 h-5 text-indigo-400" }) }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white mb-1", children: "Ledger Integrity" }),
                            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: "Cryptographically secure double-entry transaction routing." })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-purple-400" }) }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white mb-1", children: "Component Expansion" }),
                            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-relaxed", children: "Hot-swappable UI layouts without touching core logic." })
                          ] })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "w-full xl:w-[450px] bg-slate-950/80 backdrop-blur-2xl border-l border-white/10 p-8 md:p-12 relative z-10 flex flex-col justify-center border-t xl:border-t-0 border-white/5", children: [
                      /* @__PURE__ */ jsxs("div", { className: "mb-8 space-y-2", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Fingerprint, { className: "w-6 h-6 text-indigo-400" }) }),
                        /* @__PURE__ */ jsx("h4", { className: "text-xl font-bold text-white", children: "Acquisition Portals" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Select an authorized merchant provider to license this module." })
                      ] }),
                      !product.platforms || product.platforms.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 rounded-2xl bg-white/5 border border-white/10 text-center border-dashed", children: /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "No external checkout gateways configured yet." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: product.platforms.map((platform, idx) => /* @__PURE__ */ jsxs(
                        "a",
                        {
                          href: platform.link,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          className: "group/btn relative w-full p-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.8)] overflow-hidden",
                          children: [
                            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" }),
                            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-4", children: [
                              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md", children: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-white" }) }),
                              /* @__PURE__ */ jsxs("div", { children: [
                                /* @__PURE__ */ jsx("span", { className: "block text-xs text-indigo-100 font-medium mb-0.5", children: "Secure Checkout" }),
                                /* @__PURE__ */ jsx("span", { className: "block text-sm font-black text-white uppercase tracking-wider", children: platform.label || platform.name })
                              ] })
                            ] }),
                            /* @__PURE__ */ jsx("div", { className: "relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-indigo-600 text-white transition-colors", children: /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 group-hover/btn:-rotate-45 transition-transform" }) })
                          ]
                        },
                        idx
                      )) })
                    ] })
                  ]
                },
                product.id
              )) })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "space-y-12", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-black tracking-[0.25em] text-indigo-400 uppercase flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 animate-pulse" }),
                    "Active Pipeline"
                  ] }),
                  /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-black tracking-tighter text-white uppercase font-display", children: "Under Construction" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 max-w-sm md:text-right leading-relaxed", children: "High-priority modules currently in the engineering bay. Architecture defined, coding in progress." })
              ] }),
              devProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-3xl bg-white/5 border border-white/5 text-center text-slate-500", children: "No pipeline modules in active assembly." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: devProducts.map((product) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => setSelectedProduct(product),
                  className: "group cursor-pointer p-8 rounded-[2.5rem] bg-slate-900/30 border border-white/10 hover:bg-slate-800/40 hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden backdrop-blur-sm",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500" }),
                    /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col h-full justify-between space-y-8", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-6", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Cpu, { className: "w-6 h-6 text-indigo-400 group-hover:animate-pulse" }) }),
                          /* @__PURE__ */ jsx("div", { className: "px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest", children: "Engineering Bay" })
                        ] }),
                        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors", children: product.name }),
                        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm leading-relaxed line-clamp-3 font-light", children: product.description })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-6 border-t border-white/5", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-indigo-500 animate-pulse" }),
                          /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 font-mono", children: [
                            "Build ",
                            product.version || "Beta Dev"
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-indigo-400 text-sm font-bold group-hover:translate-x-2 transition-transform duration-300", children: [
                          "Preview Links ",
                          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
                        ] })
                      ] })
                    ] })
                  ]
                },
                product.id
              )) })
            ] }),
            /* @__PURE__ */ jsxs("section", { className: "space-y-10 opacity-70 hover:opacity-100 transition-opacity duration-500", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(Lock, { className: "w-3 h-3" }),
                    "Future Add-ons"
                  ] }),
                  /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight text-slate-400 uppercase font-display", children: "Conceptual Roadmap" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 max-w-xs md:text-right", children: "Blueprints generated. Engineering blocked until current pipeline clears." })
              ] }),
              soonProducts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-2xl bg-white/[0.02] border border-white/[0.02] text-center text-slate-600 text-sm", children: "No roadmap items cataloged." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: soonProducts.map((product) => /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "p-6 bg-slate-900/20 border border-white/5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-[220px]",
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/80 z-0" }),
                    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 opacity-50", children: [
                        /* @__PURE__ */ jsx(Hexagon, { className: "w-6 h-6 text-slate-500" }),
                        /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-slate-600" })
                      ] }),
                      /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-slate-300 mb-2 leading-tight", children: product.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[10px] leading-relaxed line-clamp-3", children: product.description })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "relative z-10 pt-4 mt-4 border-t border-white/5", children: /* @__PURE__ */ jsx("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-widest", children: "Pending Core" }) })
                  ]
                },
                product.id
              )) })
            ] })
          ] }),
          selectedProduct && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute inset-0 z-0",
                onClick: () => setSelectedProduct(null)
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "max-w-xl w-full bg-slate-900/90 border border-indigo-500/30 p-8 md:p-12 rounded-[3rem] shadow-[0_0_100px_-20px_rgba(99,102,241,0.4)] relative z-10 transform scale-100 animate-in zoom-in-95 duration-200", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setSelectedProduct(null),
                  className: "absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white",
                  children: "✕"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center flex flex-col items-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Rocket, { className: "w-8 h-8 text-indigo-400" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 block", children: "Early Access Preview" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white mb-4", children: selectedProduct.name }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm leading-relaxed max-w-sm", children: selectedProduct.description })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-2", children: "Pre-order / Testing Portals" }),
                !selectedProduct.platforms || selectedProduct.platforms.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-6 rounded-3xl bg-white/5 border border-white/5 text-center border-dashed", children: /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "Testing portals are currently closed." }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2", children: selectedProduct.platforms.map((platform, idx) => /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: platform.link,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "w-full p-5 bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-2xl flex items-center justify-between hover:bg-indigo-500/10 transition-all group",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors", children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 text-slate-400 group-hover:text-indigo-400" }) }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("span", { className: "block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5", children: "Platform" }),
                          /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-white", children: platform.label || platform.name })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "px-4 py-1.5 rounded-full bg-white/5 text-xs text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-colors", children: "Access" })
                    ]
                  },
                  idx
                )) })
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
export {
  DigitalProducts as default
};
