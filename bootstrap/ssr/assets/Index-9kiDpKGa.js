import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import { Sparkles, ShieldAlert, Loader2, ArrowRight, AlertTriangle, HelpCircle, Check, MinusCircle } from "lucide-react";
import { T as Toggle } from "./Toggle-Djmy2ap1.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "./ThinkingOrb-DGYTy5s1.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"];
const SPRING = { type: "spring", stiffness: 400, damping: 34, mass: 0.8 };
function BuilderIndex({ modules = [], groupLabels = {}, highlight = null, businessType = null }) {
  const { store } = usePage().props;
  const still = useReducedMotion();
  const [moduleState, setModuleState] = useState(
    () => Object.fromEntries(modules.map((m) => [m.key, !!m.enabled]))
  );
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pendingDisable, setPendingDisable] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modifyText, setModifyText] = useState("");
  const [modifyBusy, setModifyBusy] = useState(false);
  const [modifyResult, setModifyResult] = useState(null);
  const byKey = useMemo(() => Object.fromEntries(modules.map((m) => [m.key, m])), [modules]);
  const byGroup = useMemo(() => {
    const groups = {};
    modules.forEach((m) => {
      const g = m.group || "G";
      (groups[g] = groups[g] || []).push(m);
    });
    return groups;
  }, [modules]);
  const dirty = useMemo(
    () => modules.some((m) => !!moduleState[m.key] !== !!m.enabled),
    [moduleState, modules]
  );
  const highlightMod = highlight ? byKey[highlight] : null;
  const routeArgs = (extra = {}) => ({ store_slug: store?.slug, ...extra });
  const runPreview = async (nextState) => {
    setBusy(true);
    setError("");
    try {
      const keys = Object.keys(nextState).filter((k) => nextState[k]);
      const { data } = await axios.post(route("store.builder.preview", routeArgs()), { modules: keys });
      if (data.success) {
        setPreview(data);
        const synced = {};
        modules.forEach((m) => {
          synced[m.key] = data.modules.includes(m.key);
        });
        setModuleState(synced);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Couldn't check that change — try again.");
    } finally {
      setBusy(false);
    }
  };
  const handleToggleOn = (mod) => {
    setError("");
    setNotice("");
    const next = { ...moduleState, [mod.key]: true };
    setModuleState(next);
    runPreview(next);
  };
  const startDisable = async (mod) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { data } = await axios.get(
        route("store.builder.data-at-stake", routeArgs({ module: mod.key }))
      );
      if (data.success) {
        setPendingDisable({ module: mod, atStake: data.at_stake || {}, cascade: data.cascade || [mod.key] });
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Couldn't check that module — try again.");
    } finally {
      setBusy(false);
    }
  };
  const confirmDisable = () => {
    if (!pendingDisable) return;
    const next = { ...moduleState };
    pendingDisable.cascade.forEach((k) => {
      next[k] = false;
    });
    setPendingDisable(null);
    setModuleState(next);
    runPreview(next);
  };
  const answerQuestion = (optionKey) => {
    const next = { ...moduleState, [optionKey]: true };
    setModuleState(next);
    runPreview(next);
  };
  const resolveBlockTogether = (blockedKey, dependents) => {
    const next = { ...moduleState };
    next[blockedKey] = false;
    dependents.forEach((k) => {
      next[k] = false;
    });
    setModuleState(next);
    runPreview(next);
  };
  const discardChanges = () => {
    setModuleState(Object.fromEntries(modules.map((m) => [m.key, !!m.enabled])));
    setPreview(null);
    setError("");
    setNotice("");
  };
  const applyChanges = async () => {
    setBusy(true);
    setError("");
    try {
      const keys = Object.keys(moduleState).filter((k) => moduleState[k]);
      const { data } = await axios.post(route("store.builder.apply", routeArgs()), { modules: keys });
      if (data.success) {
        setNotice("Saved — your system is updated.");
        router.reload();
      }
    } catch (e) {
      const resp = e?.response?.data;
      if (resp?.reason === "questions_pending") {
        setPreview((p) => ({ ...p, questions: resp.questions }));
        setError("Answer the question below, then save again.");
      } else if (resp?.reason === "disable_blocked") {
        setError(resp.message);
      } else {
        setError(resp?.message || "Couldn't save changes — try again.");
      }
    } finally {
      setBusy(false);
    }
  };
  const submitModify = async (e) => {
    e.preventDefault();
    if (!modifyText.trim()) return;
    setModifyBusy(true);
    setModifyResult(null);
    try {
      const { data } = await axios.post(route("store.builder.modify", routeArgs()), { text: modifyText });
      setModifyResult(data);
      if (data.success && data.intent !== "ADD_CARD") {
        setModifyText("");
        router.reload();
      }
    } catch (e2) {
      setModifyResult(e2?.response?.data || { success: false, message: "Couldn't process that — try again." });
    } finally {
      setModifyBusy(false);
    }
  };
  const questions = preview?.questions || [];
  const blocks = preview?.blocks || {};
  const hasBlocks = Object.keys(blocks).length > 0;
  const addedEntries = Object.entries(preview?.added || {});
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Builder", activeMenu: "Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Builder" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto py-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-brand-600", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider", children: "Builder" })
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-ink mt-1", children: "Change what your system does" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted mt-1", children: [
          "Turn modules on or off any time, at no extra cost within your plan. Nothing you've entered is ever deleted when a module is switched off — it's just hidden until you turn it back on.",
          businessType && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-ink-muted", children: [
            "Set up as ",
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink-secondary", children: businessType.replace(/_/g, " ") }),
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.onboarding.v2", routeArgs()),
            className: "inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-brand-600 hover:text-brand-700",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
              "Run the guided setup wizard again"
            ]
          }
        )
      ] }),
      highlightMod && !moduleState[highlightMod.key] && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 p-4 rounded-xl border border-brand-500/40 bg-brand-500/10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { size: 20, className: "text-brand-600 shrink-0" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink", children: [
            "You just tried to use ",
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: highlightMod.label }),
            ", but it isn't turned on yet."
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => handleToggleOn(highlightMod),
            className: "shrink-0 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors",
            children: "Turn it on"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-xl border border-line bg-sunken", children: [
        /* @__PURE__ */ jsx(
          "label",
          {
            htmlFor: "vq-builder-modify",
            className: "block text-sm font-bold text-ink-secondary mb-2",
            children: "Or just tell it what you want"
          }
        ),
        /* @__PURE__ */ jsxs("form", { onSubmit: submitModify, className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "vq-builder-modify",
              type: "text",
              value: modifyText,
              onChange: (e) => setModifyText(e.target.value),
              placeholder: 'e.g. "turn on invoicing" or "call customers patients"',
              className: "flex-1 px-4 py-3 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
              maxLength: 200
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: modifyBusy || !modifyText.trim(),
              className: "px-4 py-3 rounded-xl bg-ink text-surface text-sm font-bold disabled:opacity-50 flex items-center gap-2 hover:opacity-90 transition-opacity",
              children: modifyBusy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            }
          )
        ] }),
        modifyResult && /* @__PURE__ */ jsxs(
          "div",
          {
            className: `mt-3 text-sm rounded-lg px-3 py-2 ${modifyResult.success ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" : "bg-red-500/10 text-red-600 border border-red-500/30"}`,
            children: [
              modifyResult.message,
              modifyResult.intent === "ADD_CARD" && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => router.visit(route("store.dashboard", routeArgs())),
                  className: "ml-2 underline font-semibold",
                  children: "Go to dashboard"
                }
              )
            ]
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "shrink-0" }),
        " ",
        error
      ] }),
      questions.map((q) => /* @__PURE__ */ jsx("div", { className: "p-4 rounded-xl border border-amber-500/30 bg-amber-500/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(HelpCircle, { size: 18, className: "text-amber-600 shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink font-medium", children: q.prompt }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: q.options.map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => answerQuestion(opt),
              className: "px-3 py-1.5 rounded-lg bg-surface border border-line text-sm font-semibold hover:border-brand-500 hover:text-brand-600 transition-colors",
              children: byKey[opt]?.label || opt
            },
            opt
          )) })
        ] })
      ] }) }, q.for)),
      hasBlocks && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3", children: Object.entries(blocks).map(([key, verdict]) => /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { size: 16, className: "text-red-600 shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink", children: verdict.message })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => resolveBlockTogether(key, verdict.dependents),
            className: "shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-bold hover:border-red-500 hover:text-red-600 transition-colors",
            children: "Turn these off together"
          }
        )
      ] }, key)) }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "px-5 py-3 border-b border-line bg-sunken", children: /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-ink-secondary uppercase tracking-wide", children: groupLabels[g] || g }) }),
        /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: byGroup[g].map((m, mi) => {
          const enabled = !!moduleState[m.key];
          const isHighlighted = highlight === m.key;
          return /* @__PURE__ */ jsx(
            motion.div,
            {
              initial: still ? false : { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: {
                duration: 0.26,
                delay: Math.min(mi, 10) * 0.02,
                ease: [0.22, 1, 0.36, 1]
              },
              className: `px-5 transition-colors duration-normal ease-standard ${isHighlighted ? "ring-2 ring-inset ring-brand-500 bg-brand-500/5" : enabled ? "bg-accent-quiet/40" : ""}`,
              children: /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled,
                  onChange: (next) => next ? handleToggleOn(m) : startDisable(m),
                  label: m.label,
                  description: m.description,
                  disabled: busy
                }
              )
            },
            m.key
          );
        }) })
      ] }, g)) })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: dirty && /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: still ? { opacity: 0 } : { y: "100%" },
        animate: still ? { opacity: 1 } : { y: 0 },
        exit: still ? { opacity: 0 } : { y: "100%" },
        transition: SPRING,
        className: "fixed bottom-0 left-0 right-0 lg:left-72 z-40 border-t border-line bg-surface/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 shadow-2xl",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "text-sm text-ink-secondary", children: [
            addedEntries.length > 0 && /* @__PURE__ */ jsxs("span", { children: [
              "Also turns on: ",
              addedEntries.map(([k]) => byKey[k]?.label || k).join(", "),
              ".",
              " "
            ] }),
            notice && /* @__PURE__ */ jsx("span", { className: "text-emerald-600 font-semibold", children: notice })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: discardChanges,
                disabled: busy,
                className: "px-4 py-2 rounded-lg border border-line text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors",
                children: "Discard"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: applyChanges,
                disabled: busy || questions.length > 0,
                className: "px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2 transition-colors",
                children: [
                  busy ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Check, { size: 16 }),
                  "Save changes"
                ]
              }
            )
          ] })
        ]
      }
    ) }),
    pendingDisable && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.18 },
        className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim",
        children: /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: still ? false : { opacity: 0, scale: 0.96, y: 8 },
            animate: { opacity: 1, scale: 1, y: 0 },
            transition: SPRING,
            className: "w-full max-w-md rounded-2xl bg-surface border border-line shadow-2xl p-6 space-y-4",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-600", children: [
                /* @__PURE__ */ jsx(MinusCircle, { size: 20 }),
                /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink", children: [
                  "Turn off ",
                  pendingDisable.module.label,
                  "?"
                ] })
              ] }),
              Object.keys(pendingDisable.atStake).length > 0 ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-2", children: "Nothing is deleted — this just gets hidden:" }),
                /* @__PURE__ */ jsx("ul", { className: "text-sm text-ink-secondary space-y-1", children: Object.entries(pendingDisable.atStake).map(([table, count]) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "capitalize", children: table.replace(/_/g, " ") }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold", children: count })
                ] }, table)) })
              ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No data on record for this module yet." }),
              pendingDisable.cascade.length > 1 && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm text-ink", children: [
                "This also turns off:",
                " ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold", children: pendingDisable.cascade.filter((k) => k !== pendingDisable.module.key).map((k) => byKey[k]?.label || k).join(", ") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setPendingDisable(null),
                    className: "px-4 py-2 rounded-lg border border-line text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: confirmDisable,
                    className: "px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors",
                    children: "Turn it off"
                  }
                )
              ] })
            ]
          }
        )
      }
    )
  ] });
}
export {
  BuilderIndex as default
};
