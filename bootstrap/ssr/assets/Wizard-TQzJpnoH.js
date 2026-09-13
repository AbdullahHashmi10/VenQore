import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { AnimatePresence, motion } from "motion/react";
import { Wand2, LayoutGrid, ArrowRight, Sparkles, Rocket, Check } from "lucide-react";
import { T as ThinkingOrb } from "./ThinkingOrb-DGYTy5s1.js";
import { u as useSessionState, a as useDiscovery, B as BuilderShell, S as StackPill, Q as QuestionStep, R as RecommendedBand, M as ModuleGrid, H as HandoffTips, L as LiveStack } from "./useDiscovery-C7LWdK07.js";
import "./CookieConsent-DgIWvNoO.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./SiteChrome-CBP-bGRL.js";
import "@number-flow/react";
const FALLBACK_MODULES = ["products", "pos", "inventory", "expenses", "reports"];
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
const postJson = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": csrf()
    },
    body: body === void 0 ? void 0 : JSON.stringify(body)
  });
  return res.json();
};
function Wizard({
  storeSlug,
  tenantName,
  presets = {},
  allModules = [],
  discovery = [],
  recommended = {}
}) {
  const STORAGE_KEY = `vq-onboarding-wizard:${storeSlug}`;
  const [rawPhase, setPhase] = useSessionState(`${STORAGE_KEY}:phase`, "welcome");
  const [qIndex, setQIndex] = useSessionState(`${STORAGE_KEY}:qIndex`, 0);
  const [prompt, setPrompt] = useSessionState(`${STORAGE_KEY}:prompt`, "");
  const [presetKey, setPresetKey] = useSessionState(`${STORAGE_KEY}:presetKey`, null);
  const [presetLabel, setPresetLabel] = useSessionState(`${STORAGE_KEY}:presetLabel`, "");
  const [baseModules, setBaseModules] = useSessionState(`${STORAGE_KEY}:baseModules`, FALLBACK_MODULES);
  const [serverHeadline, setServerHeadline] = useSessionState(`${STORAGE_KEY}:serverHeadline`, "");
  const [edited, setEdited] = useSessionState(`${STORAGE_KEY}:edited`, null);
  const [lastAnswer, setLastAnswer] = useState(null);
  const [buildIndex, setBuildIndex] = useState(0);
  const legalKeys = useMemo(() => allModules.map((m) => m.key), [allModules]);
  const {
    questions,
    answers,
    answer,
    commitMulti,
    modules: proposedModules,
    attribution,
    headline,
    forget: forgetAnswers
  } = useDiscovery(discovery, baseModules, legalKeys, STORAGE_KEY, presetKey);
  const activeModules = edited ?? proposedModules;
  const forgetAttempt = () => {
    forgetAnswers();
    [
      "phase",
      "qIndex",
      "prompt",
      "presetKey",
      "presetLabel",
      "baseModules",
      "serverHeadline",
      "edited"
    ].forEach((slot) => {
      try {
        window.sessionStorage.removeItem(`${STORAGE_KEY}:${slot}`);
      } catch (e) {
      }
    });
  };
  const phase = rawPhase === "questions" && questions.length === 0 ? "proposal" : rawPhase;
  const recommendedList = useMemo(
    () => Object.entries(recommended || []).map(([key, meta]) => {
      const mod = allModules.find((m) => m.key === key);
      return mod ? { ...mod, why: meta.why } : null;
    }).filter(Boolean),
    [recommended, allModules]
  );
  const gridCatalogue = useMemo(
    () => allModules.filter((m) => !recommended?.[m.key]),
    [allModules, recommended]
  );
  const catalogueByKey = useMemo(() => {
    const map = {};
    for (const m of allModules) map[m.key] = m;
    return map;
  }, [allModules]);
  const locked = useMemo(() => {
    const out = {};
    for (const key of activeModules) {
      for (const dep of catalogueByKey[key]?.requires || []) {
        if (activeModules.includes(dep)) {
          out[dep] = `Required by ${catalogueByKey[key]?.label || key}`;
        }
      }
    }
    return out;
  }, [activeModules, catalogueByKey]);
  const templateList = useMemo(
    () => Object.entries(presets).filter(([, p]) => !p?.blocked_by).map(([key, p]) => ({ key, ...p })),
    [presets]
  );
  useEffect(() => {
    if (phase !== "building") return;
    const t = window.setInterval(
      () => setBuildIndex((i) => Math.min(i + 1, 2)),
      850
    );
    return () => window.clearInterval(t);
  }, [phase]);
  const runDiscovery = async () => {
    try {
      const data = await postJson(
        route("store.onboarding.v2.ai-discovery", { store_slug: storeSlug }),
        { prompt, answers }
      );
      if (data?.success) {
        setPresetKey(data.preset_key || null);
        setPresetLabel(data.preset?.label || "");
        setBaseModules(data.suggested_modules || FALLBACK_MODULES);
        setServerHeadline(data.headline || "");
      }
    } catch (e) {
    }
  };
  const handleAnswer = (questionKey, optionKey, opts) => {
    answer(questionKey, optionKey, opts);
    setEdited(null);
    const q = questions.find((x) => x.key === questionKey);
    setLastAnswer({
      questionKey,
      optionLabel: q?.options?.[optionKey] || "",
      at: Date.now()
    });
  };
  const advance = () => {
    setQIndex((i) => {
      if (i + 1 >= questions.length) {
        setPhase("proposal");
        return i;
      }
      return i + 1;
    });
  };
  const continueFromMulti = () => {
    const q = questions[qIndex];
    if (q) commitMulti(q.key);
    advance();
  };
  const chooseTemplate = (tpl) => {
    setPresetKey(tpl.key);
    setPresetLabel(tpl.label || "");
    setBaseModules(tpl.modules || FALLBACK_MODULES);
    setEdited(null);
    setPhase("questions");
    setQIndex(0);
  };
  const applyAndBuild = async () => {
    setPhase("building");
    setBuildIndex(0);
    try {
      await postJson(
        route("store.onboarding.v2.apply-preset", { store_slug: storeSlug }),
        { modules: activeModules, preset_key: presetKey }
      );
    } catch (e) {
    }
    setBuildIndex(3);
    try {
      const data = await postJson(
        route("store.onboarding.v2.complete", { store_slug: storeSlug })
      );
      forgetAttempt();
      window.setTimeout(() => {
        window.location.href = data?.redirect || `/s/${storeSlug}/dashboard`;
      }, 620);
    } catch (e) {
      forgetAttempt();
      window.location.href = `/s/${storeSlug}/dashboard`;
    }
  };
  const toggleModule = (key) => {
    setEdited(
      activeModules.includes(key) ? activeModules.filter((k) => k !== key) : [...activeModules, key]
    );
  };
  const totalSteps = questions.length + 2;
  const stepNow = phase === "questions" ? qIndex + 1 : phase === "proposal" ? questions.length + 1 : phase === "building" ? totalSteps : 0;
  const back = () => {
    if (phase === "questions" && qIndex > 0) return () => setQIndex((i) => i - 1);
    if (phase === "questions") return () => setPhase("welcome");
    if (phase === "intent" || phase === "templates") {
      return () => setPhase("welcome");
    }
    if (phase === "proposal" && questions.length) {
      return () => {
        setPhase("questions");
        setQIndex(questions.length - 1);
      };
    }
    return null;
  };
  const orbState = phase === "building" ? "solving" : phase === "reveal" || phase === "proposal" ? "shaping" : phase === "questions" ? "listening" : "breathing";
  const lastAdded = useMemo(() => {
    if (!lastAnswer) return null;
    const mine = activeModules.filter(
      (k) => attribution[k] === lastAnswer.questionKey
    );
    return mine.length ? mine[mine.length - 1] : null;
  }, [lastAnswer, activeModules, attribution]);
  const showStack = phase === "questions" || phase === "proposal";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Set up your workspace" }),
    /* @__PURE__ */ jsx(
      BuilderShell,
      {
        step: stepNow,
        total: phase === "building" ? 0 : totalSteps,
        eyebrow: presetLabel || tenantName,
        orbState,
        onBack: phase === "building" ? null : back(),
        wide: showStack,
        footer: /* @__PURE__ */ jsx("span", { children: "You can change any of this later in Builder." }),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: showStack ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10" : "",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                showStack && /* @__PURE__ */ jsx(
                  StackPill,
                  {
                    modules: activeModules,
                    catalogue: catalogueByKey,
                    justAdded: lastAdded,
                    className: "mb-5 lg:hidden"
                  }
                ),
                /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
                  phase === "welcome" && /* @__PURE__ */ jsxs(Fade, { className: "mx-auto max-w-3xl text-center", children: [
                    /* @__PURE__ */ jsxs("h1", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl", children: [
                      "Let’s shape ",
                      tenantName || "your workspace",
                      "."
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-secondary", children: "Six quick questions and you are running. Nothing here is locked — every module is included on every plan." }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-9 grid gap-4 text-left sm:grid-cols-2", children: [
                      /* @__PURE__ */ jsx(
                        PathCard,
                        {
                          icon: Wand2,
                          title: "Describe your business",
                          body: "A sentence in your own words. We match it to the closest setup, then confirm the details with you.",
                          cta: "Start with a sentence",
                          onClick: () => setPhase("intent")
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        PathCard,
                        {
                          icon: LayoutGrid,
                          title: "Start from a template",
                          body: `Pick from ${templateList.length} ready-made setups — retail, food, services, trade, wholesale and more.`,
                          cta: "Browse templates",
                          onClick: () => setPhase("templates")
                        }
                      )
                    ] })
                  ] }, "welcome"),
                  phase === "intent" && /* @__PURE__ */ jsxs(Fade, { className: "mx-auto max-w-2xl", children: [
                    /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink", children: "What does your business do?" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-ink-secondary", children: "One sentence. This does most of the work." }),
                    /* @__PURE__ */ jsx(
                      "textarea",
                      {
                        rows: 3,
                        value: prompt,
                        onChange: (e) => setPrompt(e.target.value),
                        placeholder: "We…",
                        className: "mt-6 w-full resize-none rounded-lg border border-line bg-surface p-4 text-base text-ink shadow-sm placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          runDiscovery();
                          setPhase("questions");
                          setQIndex(0);
                        },
                        className: "mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        children: [
                          "Continue",
                          /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                        ]
                      }
                    )
                  ] }, "intent"),
                  phase === "templates" && /* @__PURE__ */ jsxs(Fade, { children: [
                    /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink", children: "Closest to what you do?" }),
                    /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-ink-secondary", children: "Pick one to start from. The questions after it will tune it to you." }),
                    /* @__PURE__ */ jsx("div", { className: "mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: templateList.map((tpl, i) => /* @__PURE__ */ jsxs(
                      motion.button,
                      {
                        type: "button",
                        onClick: () => chooseTemplate(tpl),
                        initial: { opacity: 0, y: 12 },
                        animate: { opacity: 1, y: 0 },
                        transition: {
                          duration: 0.3,
                          delay: Math.min(i, 8) * 0.04,
                          ease: [0.22, 1, 0.36, 1]
                        },
                        className: "rounded-lg border border-line bg-surface p-4 text-left shadow-sm transition-colors duration-normal ease-standard hover:border-accent hover:bg-accent-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: tpl.label || tpl.key }),
                          tpl.description && /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs leading-normal text-ink-muted", children: tpl.description }),
                          /* @__PURE__ */ jsxs("span", { className: "mt-3 block text-3xs font-semibold uppercase tracking-widest text-accent-text", children: [
                            (tpl.modules || []).length,
                            " modules"
                          ] })
                        ]
                      },
                      tpl.key
                    )) })
                  ] }, "templates"),
                  phase === "questions" && questions[qIndex] && /* @__PURE__ */ jsx(
                    QuestionStep,
                    {
                      question: questions[qIndex],
                      value: answers[questions[qIndex].key],
                      onAnswer: handleAnswer,
                      onContinue: continueFromMulti,
                      autoAdvance: advance
                    },
                    questions[qIndex].key
                  ),
                  phase === "proposal" && /* @__PURE__ */ jsxs(Fade, { children: [
                    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text", children: [
                      /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
                      presetLabel || "Your setup"
                    ] }),
                    /* @__PURE__ */ jsx("h1", { className: "mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl", children: headline || serverHeadline || "Here is your workspace." }),
                    /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary", children: "Everything below is switched on. Add or remove anything — none of it changes what you pay." }),
                    recommendedList.length > 0 && /* @__PURE__ */ jsx(
                      RecommendedBand,
                      {
                        items: recommendedList,
                        active: activeModules,
                        onToggle: toggleModule
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "mt-7", children: /* @__PURE__ */ jsx(
                      ModuleGrid,
                      {
                        catalogue: gridCatalogue,
                        active: activeModules,
                        locked,
                        onToggle: toggleModule
                      }
                    ) }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: applyAndBuild,
                        className: "mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus sm:w-auto",
                        children: [
                          /* @__PURE__ */ jsx(Rocket, { size: 16 }),
                          "Build my workspace",
                          /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                        ]
                      }
                    )
                  ] }, "proposal"),
                  phase === "building" && /* @__PURE__ */ jsxs(Fade, { className: "mx-auto max-w-md text-center", children: [
                    /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-20 w-20 items-center justify-center", children: /* @__PURE__ */ jsx(
                      ThinkingOrb,
                      {
                        state: "solving",
                        size: 80,
                        "aria-label": "Building your workspace"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("h2", { className: "mt-6 font-display text-2xl font-semibold text-ink", children: "Setting things up" }),
                    /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-2.5 text-left", children: [
                      "Switching on your modules",
                      "Naming things the way you do",
                      "Laying out your dashboard",
                      "Ready"
                    ].map((label, i) => /* @__PURE__ */ jsxs(
                      "li",
                      {
                        className: `flex items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors duration-slow ease-standard ${i <= buildIndex ? "border-accent bg-accent-quiet text-ink" : "border-line bg-surface text-ink-faint"}`,
                        children: [
                          /* @__PURE__ */ jsx(
                            "span",
                            {
                              className: `flex h-5 w-5 items-center justify-center rounded-full ${i <= buildIndex ? "bg-accent-fill text-accent-on" : "bg-sunken"}`,
                              children: i <= buildIndex && /* @__PURE__ */ jsx(Check, { size: 11, strokeWidth: 3 })
                            }
                          ),
                          label
                        ]
                      },
                      label
                    )) }),
                    /* @__PURE__ */ jsx(HandoffTips, { className: "mt-8" })
                  ] }, "building")
                ] })
              ] }),
              showStack && /* @__PURE__ */ jsx(
                LiveStack,
                {
                  modules: activeModules,
                  catalogue: catalogueByKey,
                  attribution,
                  lastAnswer,
                  className: "sticky top-6 hidden max-h-[70vh] lg:flex"
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
function Fade({ children, className = "" }) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      className,
      children
    }
  );
}
function PathCard({ icon: Icon, title, body, cta, onClick }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      className: "group flex h-full flex-col rounded-xl border border-line bg-surface p-6 text-left shadow-sm transition-colors duration-normal ease-standard hover:border-accent hover:bg-accent-quiet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
      children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-11 w-11 items-center justify-center rounded-md bg-sunken text-accent-text transition-colors duration-normal ease-standard group-hover:bg-accent-fill group-hover:text-accent-on", children: /* @__PURE__ */ jsx(Icon, { size: 20, strokeWidth: 1.9 }) }),
        /* @__PURE__ */ jsx("span", { className: "mt-4 block text-lg font-semibold text-ink", children: title }),
        /* @__PURE__ */ jsx("span", { className: "mt-2 block flex-1 text-sm leading-relaxed text-ink-secondary", children: body }),
        /* @__PURE__ */ jsxs("span", { className: "mt-5 flex items-center gap-1.5 text-xs font-semibold text-accent-text", children: [
          cta,
          /* @__PURE__ */ jsx(
            ArrowRight,
            {
              size: 14,
              className: "transition-transform duration-normal ease-standard group-hover:translate-x-1"
            }
          )
        ] })
      ]
    }
  );
}
export {
  Wizard as default
};
