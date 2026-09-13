import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Head } from "@inertiajs/react";
import { useReducedMotion, AnimatePresence, motion } from "motion/react";
import { ChevronDown, RotateCcw, AlertTriangle, Info, Check, ArrowRight, SkipForward, Sliders, Search, X, Sparkles, FastForward, MessageSquareText, Compass, Send, Rocket, ShieldCheck, Building2, Phone, Mail, Lock } from "lucide-react";
import { T as ThinkingOrb } from "./ThinkingOrb-DGYTy5s1.js";
import { u as useTurnstile } from "./useTurnstile-4WiJ80s8.js";
import { u as useSessionState, P as PromptTextarea, a as useDiscovery, B as BuilderShell, S as StackPill, Q as QuestionStep, M as ModuleGrid, R as RecommendedBand, H as HandoffTips, L as LiveStack } from "./useDiscovery-C7LWdK07.js";
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
const MAX_CHARS = 600;
const DEFAULT_REFUSAL = "I can only help set up your VenQore workspace — tell me about your business and I will take it from there.";
const csrfToken = () => typeof document !== "undefined" && document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
const MOCK_MODE = null;
async function postJson$1(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": csrfToken()
    },
    body: JSON.stringify(body)
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  if (!data) throw new Error(`HTTP ${res.status}`);
  return data;
}
function refusalFrom(data) {
  const msg = (data?.assistant_message || "").trim();
  const q = (data?.question || "").trim();
  if (!msg) return DEFAULT_REFUSAL;
  const parts = msg.split(/\n\s*\n/);
  if (parts.length > 1) return parts.slice(0, -1).join(" ").trim() || DEFAULT_REFUSAL;
  return msg === q ? DEFAULT_REFUSAL : msg;
}
const shorten = (s, n = 72) => {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
const canAutoFocus = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const THINKING_START = ["Reading your description", "Finding businesses like yours", "Picking a first question"];
const THINKING_STEP = ["Reading your answer", "Updating your setup", "Choosing the next question"];
const THINKING_DONE = ["Putting your workspace together"];
const EMPTY = { prompt: null, sessionId: null, history: [], current: null };
function ConversationalDiscovery({
  initialPrompt,
  initialPreset,
  onComplete,
  onFallbackToManual,
  onStateUpdate,
  onProgress,
  onEditPrompt,
  storageKey = "vq-converse"
}) {
  const getTurnstileToken = useTurnstile();
  const startingPrompt = (initialPrompt || "").trim() || "I want to set up a new workspace for my business.";
  const [convo, setConvo] = useSessionState(storageKey, EMPTY);
  const [phase, setPhase] = useState("idle");
  const [thinkingSet, setThinkingSet] = useState(THINKING_START);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [ticked, setTicked] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef(null);
  const headingRef = useRef(null);
  const alive = useRef(true);
  const still = useReducedMotion();
  const cbs = useRef({ onComplete, onStateUpdate, onProgress });
  useEffect(() => {
    cbs.current = { onComplete, onStateUpdate, onProgress };
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const apply = useCallback(
    (data, { prev } = {}) => {
      if (!data || typeof data !== "object") return false;
      if (data.confirmed_caps) cbs.current.onStateUpdate?.(data.confirmed_caps, data.detected_facts);
      if (typeof data.progress === "number") cbs.current.onProgress?.(data.progress);
      if ((data.is_complete || data.fallback) && data.proposal) {
        setPhase("done");
        setThinkingSet(THINKING_DONE);
        setError(null);
        const sessionId = data.session_id || null;
        const turns = typeof data.turn === "number" ? data.turn : null;
        window.setTimeout(() => {
          if (alive.current) {
            cbs.current.onComplete?.(data.proposal, data.modules, data.preset, { sessionId, turns });
          }
        }, 600);
        return true;
      }
      if (data.fallback) {
        setPhase("idle");
        setConvo((c) => ({ ...c, current: prev || c.current }));
        setError({
          tone: "warning",
          text: data.message || "This conversation timed out. Start over — it only takes a minute.",
          restart: true
        });
        return true;
      }
      const question = (data.question || "").trim() || (data.assistant_message || "").trim();
      if (data.ok && question) {
        setConvo((c) => ({
          ...c,
          sessionId: data.session_id || null,
          current: {
            question,
            hint: data.question_hint || null,
            options: Array.isArray(data.quick_options) ? data.quick_options.slice(0, 5) : [],
            notice: data.out_of_scope ? refusalFrom(data) : null,
            opener: !data.session_id,
            /* A tick list settles everything on it at once, so it is
               answered with a Continue rather than by picking one. */
            multi: !!data.is_multi
          }
        }));
        setError(null);
        setPhase("idle");
        return true;
      }
      if (data.success === false && data.message) {
        setPhase("idle");
        setError({ tone: "warning", text: data.message, restart: !prev });
        return true;
      }
      return false;
    },
    [setConvo]
  );
  const startRef = useRef(null);
  const start = useCallback(
    async (text, preset, { keepHistory = true } = {}) => {
      setPhase("thinking");
      setThinkingSet(THINKING_START);
      setError(null);
      setConvo((c) => ({
        prompt: startingPrompt,
        sessionId: null,
        history: keepHistory ? c.history || [] : [],
        current: null
      }));
      try {
        const turnstileToken = MOCK_MODE ? null : await getTurnstileToken();
        const data = await postJson$1("/workspace/converse/start", {
          prompt: text.slice(0, MAX_CHARS),
          preset: preset || null,
          ...turnstileToken ? { "cf-turnstile-response": turnstileToken } : {}
        });
        if (!alive.current) return;
        if (!apply(data)) throw new Error("Unexpected response");
      } catch (e) {
        if (!alive.current) return;
        setPhase("idle");
        setError({
          tone: "warning",
          text: "We could not reach the setup assistant just now.",
          retry: () => startRef.current?.(text, preset, { keepHistory })
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apply, startingPrompt, getTurnstileToken]
  );
  useEffect(() => {
    startRef.current = start;
  });
  useEffect(() => {
    const resumable = convo && convo.prompt === startingPrompt && convo.current && convo.current.question;
    if (resumable) return;
    start(startingPrompt, initialPreset || null, { keepHistory: false });
  }, []);
  const current = convo.current;
  const busy = phase !== "idle";
  const answer = async (rawText, optionKey = null) => {
    const text = (rawText || "").trim().slice(0, MAX_CHARS);
    if (!text || busy || !current) return;
    const prev = current;
    const typed = optionKey === null;
    setDraft("");
    setError(null);
    if (prev.opener || !convo.sessionId) {
      setConvo((c) => ({ ...c, history: [...c.history || [], { id: Date.now(), q: prev.question, a: text }] }));
      if (optionKey && optionKey.startsWith("preset:")) {
        start(text, optionKey.slice("preset:".length));
      } else {
        start(text, null);
      }
      return;
    }
    const entry = { id: Date.now(), q: prev.question, a: text };
    setConvo((c) => ({ ...c, history: [...c.history || [], entry], current: null }));
    setThinkingSet(THINKING_STEP);
    setPhase("thinking");
    try {
      const data = await postJson$1("/workspace/converse/step", {
        session_id: convo.sessionId,
        response: text,
        selected_option_key: optionKey
      });
      if (!alive.current) return;
      if (data && data.out_of_scope && !data.is_complete) {
        setConvo((c) => ({ ...c, history: (c.history || []).filter((h) => h.id !== entry.id) }));
      }
      if (!apply(data, { prev })) throw new Error("Unexpected response");
    } catch (e) {
      if (!alive.current) return;
      setConvo((c) => ({
        ...c,
        history: (c.history || []).filter((h) => h.id !== entry.id),
        current: prev
      }));
      if (typed) setDraft(text);
      setPhase("idle");
      setError({
        tone: "warning",
        text: "That answer did not go through — nothing was lost.",
        retry: () => answer(text, optionKey)
      });
    }
  };
  const answerList = async () => {
    if (busy || !current || !convo.sessionId) return;
    const prev = current;
    const chosen = prev.options.filter((o) => ticked.includes(o.key));
    const label = chosen.length ? chosen.map((o) => o.label).join(", ") : "None of these";
    const entry = { id: Date.now(), q: prev.question, a: label };
    setTicked([]);
    setError(null);
    setConvo((c) => ({ ...c, history: [...c.history || [], entry], current: null }));
    setThinkingSet(THINKING_STEP);
    setPhase("thinking");
    try {
      const data = await postJson$1("/workspace/converse/step", {
        session_id: convo.sessionId,
        response: label,
        selected_option_keys: chosen.map((o) => o.key)
      });
      if (!alive.current) return;
      if (!apply(data, { prev })) throw new Error("Unexpected response");
    } catch (e) {
      if (!alive.current) return;
      setConvo((c) => ({
        ...c,
        history: (c.history || []).filter((h) => h.id !== entry.id),
        current: prev
      }));
      setPhase("idle");
      setError({
        tone: "warning",
        text: "That did not go through — nothing was lost.",
        retry: () => answerList()
      });
    }
  };
  const skipQuestion = async () => {
    if (busy || !current || current.opener || !convo.sessionId) return;
    const prev = current;
    const entry = { id: Date.now(), q: prev.question, a: "Skipped", skipped: true };
    setDraft("");
    setError(null);
    setConvo((c) => ({ ...c, history: [...c.history || [], entry], current: null }));
    setThinkingSet(THINKING_STEP);
    setPhase("thinking");
    try {
      const data = await postJson$1("/workspace/converse/step", {
        session_id: convo.sessionId,
        skip: true
      });
      if (!alive.current) return;
      if (!apply(data, { prev })) throw new Error("Unexpected response");
    } catch (e) {
      if (!alive.current) return;
      setConvo((c) => ({
        ...c,
        history: (c.history || []).filter((h) => h.id !== entry.id),
        current: prev
      }));
      setPhase("idle");
      setError({
        tone: "warning",
        text: "That skip did not go through — the question is still here.",
        retry: () => skipQuestion()
      });
    }
  };
  const startOver = () => {
    if (busy) return;
    if (convo.sessionId && !MOCK_MODE) {
      postJson$1("/workspace/converse/reset", { session_id: convo.sessionId }).catch(() => {
      });
    }
    setExpanded(false);
    start(startingPrompt, initialPreset || null, { keepHistory: false });
  };
  const questionText = current?.question || null;
  useEffect(() => {
    if (!questionText || busy) return;
    if (canAutoFocus()) textareaRef.current?.focus({ preventScroll: true });
  }, [questionText, busy]);
  const rows = useMemo(() => {
    const out = [{ id: "prompt", q: "Your business", a: startingPrompt, isPrompt: true }];
    for (const h of convo.history || []) out.push(h);
    return out;
  }, [convo.history, startingPrompt]);
  const showToggle = rows.length > 2;
  const visibleRows = expanded || !showToggle ? rows : rows.slice(-2);
  const hasAnswers = (convo.history || []).length > 0;
  const fade = still ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } } : {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  };
  return /* @__PURE__ */ jsxs("section", { className: "vq-cd", "aria-label": "Set up your workspace with VenQore AI", children: [
    /* @__PURE__ */ jsxs("div", { className: "vq-cd-log", children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-cd-log__head", children: [
        showToggle ? /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "vq-cd-log__toggle",
            "aria-expanded": expanded,
            "aria-controls": "vq-cd-log-list",
            onClick: () => setExpanded((v) => !v),
            children: [
              expanded ? "Hide earlier answers" : `Show all ${rows.length} answers`,
              /* @__PURE__ */ jsx(ChevronDown, { size: 15, "aria-hidden": "true" })
            ]
          }
        ) : /* @__PURE__ */ jsx("span", { className: "vq-cd-log__toggle", style: { cursor: "default" }, children: "What you have told us" }),
        hasAnswers && /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-cd-link", onClick: startOver, disabled: busy, children: [
          /* @__PURE__ */ jsx(RotateCcw, { size: 14, "aria-hidden": "true" }),
          "Start over"
        ] })
      ] }),
      /* @__PURE__ */ jsx("ol", { className: "vq-cd-log__list", id: "vq-cd-log-list", children: visibleRows.map((r) => /* @__PURE__ */ jsxs("li", { className: "vq-cd-log__row", children: [
        /* @__PURE__ */ jsxs("span", { className: "vq-cd-log__q", children: [
          !r.isPrompt && /* @__PURE__ */ jsx("b", { "aria-hidden": "true", children: "Q" }),
          shorten(r.q)
        ] }),
        /* @__PURE__ */ jsx("span", { className: "vq-cd-log__a", children: r.isPrompt ? shorten(r.a, 140) : r.a }),
        r.isPrompt && onEditPrompt && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "vq-cd-link vq-cd-log__edit",
            onClick: onEditPrompt,
            disabled: busy,
            "aria-label": "Edit your business description",
            children: "Edit"
          }
        )
      ] }, r.id)) })
    ] }),
    /* @__PURE__ */ jsx(AnimatePresence, { initial: false, children: error ? /* @__PURE__ */ jsx(motion.div, { ...fade, children: /* @__PURE__ */ jsxs("div", { className: "vq-cd-notice", "data-tone": "warning", role: "alert", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { size: 18, "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: error.text }),
        /* @__PURE__ */ jsxs("div", { className: "vq-cd-notice__actions", children: [
          error.retry && /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--secondary vq-btn--sm", onClick: error.retry, children: "Try again" }),
          error.restart && /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--secondary vq-btn--sm", onClick: startOver, children: "Start over" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "vq-btn vq-btn--quiet vq-btn--sm", onClick: onFallbackToManual, children: "Choose modules myself" })
        ] })
      ] })
    ] }) }, "err") : current?.notice && !busy ? /* @__PURE__ */ jsx(motion.div, { ...fade, children: /* @__PURE__ */ jsxs("div", { className: "vq-cd-notice", role: "status", children: [
      /* @__PURE__ */ jsx(Info, { size: 18, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: current.notice })
    ] }) }, `oos-${current.question}`) : null }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: busy || !current ? /* @__PURE__ */ jsx(motion.div, { ...fade, children: /* @__PURE__ */ jsx(Thinking, { texts: thinkingSet, still }, thinkingSet[0]) }, "thinking") : /* @__PURE__ */ jsxs(motion.div, { ...fade, children: [
      /* @__PURE__ */ jsxs("div", { className: "vq-cd-ask__who", children: [
        /* @__PURE__ */ jsx(ThinkingOrb, { state: "listening", size: 20, "aria-label": "" }),
        "VenQore AI"
      ] }),
      /* @__PURE__ */ jsxs("div", { "aria-live": "polite", "aria-atomic": "true", children: [
        /* @__PURE__ */ jsx("h2", { ref: headingRef, className: "vq-cd-question", tabIndex: -1, children: current.question }),
        current.hint && /* @__PURE__ */ jsx("p", { className: "vq-cd-why", children: current.hint })
      ] }),
      current.options.length > 0 && current.multi && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "vq-cd-options", role: "group", "aria-label": "Tick everything that applies", children: current.options.map((opt, i) => {
          const on = ticked.includes(opt.key);
          return /* @__PURE__ */ jsxs(
            motion.button,
            {
              type: "button",
              "aria-pressed": on,
              className: "vq-cd-option",
              "data-ticked": on ? "true" : void 0,
              onClick: () => setTicked(
                (t) => t.includes(opt.key) ? t.filter((k) => k !== opt.key) : [...t, opt.key]
              ),
              initial: still ? false : { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.26, delay: still ? 0 : 0.05 * i, ease: [0.22, 1, 0.36, 1] },
              children: [
                /* @__PURE__ */ jsxs("span", { className: "vq-cd-option__text", children: [
                  /* @__PURE__ */ jsx("span", { className: "vq-cd-option__label", children: opt.label }),
                  opt.desc && /* @__PURE__ */ jsx("span", { className: "vq-cd-option__desc", children: opt.desc })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `vq-cd-tick${on ? " vq-cd-tick--on" : ""}`, "aria-hidden": "true", children: on ? /* @__PURE__ */ jsx(Check, { size: 14, strokeWidth: 3 }) : null })
              ]
            },
            opt.key || i
          );
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-btn vq-btn--primary", onClick: answerList, children: [
            "Continue",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16, "aria-hidden": "true" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "vq-cd-tickcount", children: ticked.length === 0 ? "Nothing ticked — we will leave all of these out" : `${ticked.length} ticked` })
        ] })
      ] }),
      current.options.length > 0 && !current.multi && /* @__PURE__ */ jsx("div", { className: "vq-cd-options", role: "group", "aria-label": "Suggested answers", children: current.options.map((opt, i) => /* @__PURE__ */ jsxs(
        motion.button,
        {
          type: "button",
          className: "vq-cd-option",
          onClick: () => answer(opt.label, opt.key),
          initial: still ? false : { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.26, delay: still ? 0 : 0.05 * i, ease: [0.22, 1, 0.36, 1] },
          children: [
            /* @__PURE__ */ jsxs("span", { className: "vq-cd-option__text", children: [
              /* @__PURE__ */ jsx("span", { className: "vq-cd-option__label", children: opt.label }),
              opt.desc && /* @__PURE__ */ jsx("span", { className: "vq-cd-option__desc", children: opt.desc })
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 18, "aria-hidden": "true" })
          ]
        },
        opt.key || i
      )) })
    ] }, `q-${current.question}`) }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      current?.options?.length > 0 && !busy && /* @__PURE__ */ jsx("div", { className: "vq-cd-or", id: "vq-cd-or", children: "Or answer in your own words" }),
      /* @__PURE__ */ jsx(
        PromptTextarea,
        {
          ref: textareaRef,
          value: draft,
          onChange: setDraft,
          onSubmit: (t) => answer(t, null),
          busy,
          disabled: phase === "done",
          maxLength: MAX_CHARS,
          ariaLabel: current?.question ? `Your answer to: ${current.question}` : "Your answer",
          placeholder: current?.opener ? "Describe your business in a sentence…" : "Type your answer — any language is fine",
          submitLabel: "Send answer",
          hint: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("kbd", { children: "Enter" }),
            " to send · ",
            /* @__PURE__ */ jsx("kbd", { children: "Shift" }),
            " + ",
            /* @__PURE__ */ jsx("kbd", { children: "Enter" }),
            " for a new line"
          ] })
        }
      )
    ] }),
    current && !current.opener && convo.sessionId && phase !== "done" && /* @__PURE__ */ jsxs("div", { className: "vq-cd-foot", children: [
      /* @__PURE__ */ jsx("span", { children: "Not sure, or would rather not say?" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "vq-btn vq-btn--quiet vq-btn--sm",
          onClick: skipQuestion,
          disabled: busy,
          children: [
            /* @__PURE__ */ jsx(SkipForward, { size: 15, "aria-hidden": "true" }),
            "Skip this question"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "vq-cd-foot", children: [
      /* @__PURE__ */ jsx("span", { children: "Rather pick the modules yourself?" }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "vq-btn vq-btn--quiet vq-btn--sm", onClick: onFallbackToManual, children: [
        /* @__PURE__ */ jsx(Sliders, { size: 15, "aria-hidden": "true" }),
        "Manual setup"
      ] })
    ] })
  ] });
}
function Thinking({ texts, still }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (texts.length < 2) return void 0;
    const t = window.setInterval(() => setI((n) => (n + 1) % texts.length), 1700);
    return () => window.clearInterval(t);
  }, [texts]);
  return /* @__PURE__ */ jsxs("div", { className: "vq-cd-thinking", role: "status", children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "VenQore AI is thinking…" }),
    /* @__PURE__ */ jsx(ThinkingOrb, { state: "solving", size: 64, "aria-label": "" }),
    /* @__PURE__ */ jsxs("div", { "aria-hidden": "true", style: { minWidth: 0 }, children: [
      /* @__PURE__ */ jsx(AnimatePresence, { mode: "wait", initial: false, children: /* @__PURE__ */ jsxs(
        motion.span,
        {
          className: "vq-cd-shimmer",
          initial: still ? false : { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: still ? { opacity: 0 } : { opacity: 0, y: -10 },
          transition: { duration: 0.28 },
          children: [
            texts[i],
            "…"
          ]
        },
        texts[i]
      ) }),
      /* @__PURE__ */ jsx("p", { className: "vq-cd-thinking__sub", children: "Usually a couple of seconds." })
    ] })
  ] });
}
const singular = (w) => {
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
};
const tokens = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/-/g, " ").replace(/[^a-z0-9\s]+/g, " ").trim().split(/\s+/).filter(Boolean).map(singular);
const labelPhrase = (label) => String(label || "").split(/\s*(?:&|,|\(|\/)\s*/)[0];
function oneEditApart(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (a.length < b.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) === 1;
}
const indexCache = /* @__PURE__ */ new WeakMap();
function indexOf(types) {
  if (indexCache.has(types)) return indexCache.get(types);
  const index = types.map((t) => {
    const phrases = /* @__PURE__ */ new Map();
    [...t.aliases || [], labelPhrase(t.label)].forEach((a) => {
      const tk = tokens(a);
      if (tk.length) phrases.set(tk.join(" "), tk);
    });
    const words = new Set([...phrases.values()].flat());
    tokens(t.label).forEach((w) => words.add(w));
    return { type: t, phrases: [...phrases.values()], words };
  });
  indexCache.set(types, index);
  return index;
}
function rankBusinessTypes(text, types, limit = 4) {
  const tk = tokens(text);
  if (!tk.length || !types?.length) return [];
  const hay = ` ${tk.join(" ")} `;
  const set = new Set(tk);
  const last = tk[tk.length - 1];
  const scored = [];
  indexOf(types).forEach(({ type, phrases, words }) => {
    let score = 0;
    phrases.forEach((p) => {
      if (hay.includes(` ${p.join(" ")} `)) score += 3 * p.length;
      else if (p.length > 1 && p.every((w) => set.has(w))) score += 2 * p.length;
    });
    tk.forEach((t) => {
      if (t.length < 3) return;
      if (words.has(t)) score += 1;
      else if (t.length >= 5 && [...words].some((w) => oneEditApart(t, w))) score += 1;
    });
    if (last && last.length >= 3) {
      for (const w of words) {
        if (w !== last && w.startsWith(last)) {
          score += 1;
          break;
        }
      }
    }
    if (score > 0) scored.push({ type, score });
  });
  scored.sort((a, b) => b.score - a.score);
  const floor = scored.length ? scored[0].score / 2 : 0;
  return scored.filter((s) => s.score >= floor).slice(0, limit).map((s) => s.type);
}
function filterBusinessTypes(query, types) {
  const q = tokens(query);
  if (!q.length) return types;
  return indexOf(types).filter(({ type, words }) => {
    const all = [...words, ...tokens(type.note || "")];
    return q.every((w) => all.some((x) => x.startsWith(w)));
  }).map(({ type }) => type);
}
function BusinessTypePicker({ types = [], sectors = {}, onPick, selectedKey = null, className = "" }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const sectorKeys = Object.keys(sectors);
  const visible = useMemo(() => {
    const bySector = sector === "all" ? types : types.filter((t) => t.sector === sector);
    return filterBusinessTypes(query, bySector);
  }, [types, sector, query]);
  const groups = useMemo(
    () => sectorKeys.map((key) => ({ key, name: sectors[key]?.short || key, items: visible.filter((t) => t.sector === key) })).filter((g) => g.items.length),
    [sectorKeys, sectors, visible]
  );
  return /* @__PURE__ */ jsxs("div", { className, children: [
    /* @__PURE__ */ jsxs("label", { className: "relative block", children: [
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Search business types" }),
      /* @__PURE__ */ jsx(Search, { size: 16, className: "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          placeholder: `Search ${types.length} business types — plumber, pharmacy, darzi…`,
          className: "h-11 w-full rounded-md border border-line bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
        }
      ),
      query && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setQuery(""),
          "aria-label": "Clear search",
          className: "absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:bg-interactive-hover",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", role: "tablist", "aria-label": "Sector", children: [{ key: "all", name: "All" }, ...sectorKeys.map((k) => ({ key: k, name: sectors[k]?.short || k }))].map((s) => {
      const on = sector === s.key;
      const count = s.key === "all" ? types.length : types.filter((t) => t.sector === s.key).length;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": on,
          onClick: () => setSector(s.key),
          className: `rounded-full border px-3 py-1 text-2xs font-semibold transition-colors duration-fast ${on ? "border-accent bg-accent-quiet text-accent-text" : "border-line bg-surface text-ink-secondary hover:border-line-strong"}`,
          children: [
            s.name,
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: count })
          ]
        },
        s.key
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 max-h-[26rem] overflow-y-auto pr-1", children: [
      groups.length === 0 && /* @__PURE__ */ jsxs("p", { className: "rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-secondary", children: [
        "No business type matches “",
        query,
        "”. Describe it in the box above instead — we will set up the closest fit and note what you need."
      ] }),
      groups.map((g) => /* @__PURE__ */ jsxs("section", { className: "mb-4 last:mb-0", "aria-label": g.name, children: [
        /* @__PURE__ */ jsxs("h3", { className: "mb-2 text-3xs font-bold uppercase tracking-widest text-ink-muted", children: [
          g.name,
          " · ",
          g.items.length
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "grid gap-2 sm:grid-cols-2", children: g.items.map((t) => {
          const on = t.key === selectedKey;
          return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => onPick?.(t.key),
              className: `group flex h-full w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${on ? "border-accent bg-accent-quiet" : "border-line bg-surface hover:border-accent hover:bg-accent-quiet"}`,
              children: [
                /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: t.label }),
                  t.note && /* @__PURE__ */ jsx("span", { className: "mt-0.5 block text-xs leading-snug text-ink-secondary", children: t.note })
                ] }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "mt-1 shrink-0 text-ink-faint group-hover:text-accent-text" })
              ]
            }
          ) }, t.key);
        }) })
      ] }, g.key))
    ] })
  ] });
}
const STORAGE_KEY = "vq-build-workspace";
const CURRENCY_LIST = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "PKR", symbol: "Rs.", name: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" }
];
const EXAMPLES = [
  "I run a grocery store with two counters and sell on credit.",
  "Salon with four chairs, we book appointments and sell products.",
  "I am a freelance designer invoicing clients monthly.",
  "Wholesale distributor, 30-day terms, deliveries to shops.",
  "Phone repair shop — parts, jobs and walk-in sales."
];
const LIGHT_PRESETS = [
  "pos_only",
  "cafe",
  "freelancer",
  "salon",
  "professional_services",
  "membership_studio",
  "food_counter",
  "field_service",
  "rental_hire",
  "tailoring"
];
function TermsPreview({ terms, className = "" }) {
  const words = Object.values(terms || {}).map((w) => w?.plural).filter(Boolean);
  if (!words.length) return null;
  return /* @__PURE__ */ jsxs("p", { className: `text-xs text-ink-secondary ${className}`, children: [
    "Your workspace will say",
    " ",
    words.map((w, i) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
      i > 0 && " · ",
      /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: w })
    ] }, w)),
    " ",
    "— you can rename anything later."
  ] });
}
const isShippablePreset = (presets, key) => !!key && !!presets?.[key] && !(presets[key].blocked_by || []).length;
const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch (e) {
    return null;
  }
};
const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
const postJson = async (url, body) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": csrf()
    },
    body: JSON.stringify(body)
  });
  return res.json();
};
function BuildWorkspace({
  initialPrompt = "",
  initialPreset = "",
  initialType = "",
  initialEmail = "",
  initialCurrency = "USD",
  allModules = [],
  discovery = [],
  recommended = {},
  presets = {},
  plans = [],
  intendedPlan = null,
  authUser = null,
  license = null,
  businessTypes = [],
  sectors = {}
}) {
  const getTurnstileToken = useTurnstile();
  plans = license ? [] : plans;
  const typeByKey = useMemo(() => Object.fromEntries(businessTypes.map((t) => [t.key, t])), [businessTypes]);
  const entryType = !initialPrompt && initialType ? typeByKey[initialType] || null : null;
  const directEntry = !initialPrompt && (!!entryType || isShippablePreset(presets, initialPreset));
  const entryPhase = initialPrompt ? "questions" : directEntry ? "reveal" : "intent";
  const [rawPhase, setPhase] = useSessionState(`${STORAGE_KEY}:phase`, entryPhase);
  const [path, setPath] = useSessionState(
    `${STORAGE_KEY}:path`,
    directEntry ? "preset" : "questions"
  );
  const [businessType, setBusinessType] = useSessionState(`${STORAGE_KEY}:businessType`, entryType?.key || "");
  const [businessLabel, setBusinessLabel] = useSessionState(`${STORAGE_KEY}:businessLabel`, entryType?.label || "");
  const [terms, setTerms] = useSessionState(`${STORAGE_KEY}:terms`, entryType?.terms || {});
  const [candidates, setCandidates] = useSessionState(`${STORAGE_KEY}:candidates`, []);
  const [planKey, setPlanKey] = useSessionState(`${STORAGE_KEY}:planKey`, intendedPlan || "");
  const [planTouched, setPlanTouched] = useSessionState(`${STORAGE_KEY}:planTouched`, !!intendedPlan);
  const [skipping, setSkipping] = useState(false);
  const [qIndex, setQIndex] = useSessionState(`${STORAGE_KEY}:qIndex`, 0);
  const [prompt, setPrompt] = useSessionState(`${STORAGE_KEY}:prompt`, initialPrompt);
  const [presetKey, setPresetKey] = useSessionState(`${STORAGE_KEY}:presetKey`, entryType?.preset || initialPreset);
  const entryPreset = entryType ? presets[entryType.preset] || null : !initialPrompt && isShippablePreset(presets, initialPreset) ? presets[initialPreset] : null;
  const [presetLabel, setPresetLabel] = useSessionState(`${STORAGE_KEY}:presetLabel`, entryPreset?.label || "");
  const [presetDesc, setPresetDesc] = useSessionState(
    `${STORAGE_KEY}:presetDesc`,
    entryPreset ? entryPreset.description || entryPreset.blurb || "" : ""
  );
  const [matched, setMatched] = useSessionState(`${STORAGE_KEY}:matched`, true);
  const [baseModules, setBaseModules] = useSessionState(`${STORAGE_KEY}:baseModules`, entryPreset?.modules || []);
  const [capabilities, setCapabilities] = useSessionState(`${STORAGE_KEY}:capabilities`, []);
  const [reasons, setReasons] = useSessionState(`${STORAGE_KEY}:reasons`, {});
  const [unsupported, setUnsupported] = useSessionState(`${STORAGE_KEY}:unsupported`, []);
  const [analysed, setAnalysed] = useState(false);
  const legalKeys = useMemo(() => allModules.map((m) => m.key), [allModules]);
  const {
    questions,
    answers,
    answer,
    commitMulti,
    modules: proposedModules,
    attribution,
    headline,
    forget: forgetAnswers,
    reset: resetAnswers
  } = useDiscovery(discovery, baseModules, legalKeys, STORAGE_KEY, presetKey);
  const [edited, setEdited] = useSessionState(`${STORAGE_KEY}:edited`, null);
  const [blankSlate, setBlankSlate] = useSessionState(`${STORAGE_KEY}:blankSlate`, false);
  const activeModules = edited ?? proposedModules;
  const [discoveryMode, setDiscoveryMode] = useSessionState(`${STORAGE_KEY}:discoveryMode`, "ai");
  const [draft, setDraft] = useState(() => prompt || "");
  const [aiProgress, setAiProgress] = useState(0);
  const isFreshAttempt = () => {
    const incomingPrompt = initialPrompt || "";
    const incomingPreset = initialPreset || "";
    const incomingType = entryType ? entryType.key : "";
    return Boolean(
      incomingPrompt && incomingPrompt !== prompt || incomingType && incomingType !== businessType || !incomingType && incomingPreset && incomingPreset !== presetKey
    );
  };
  const [attemptResolved, setAttemptResolved] = useState(() => !isFreshAttempt());
  const handleAiProgress = (pct) => {
    if (typeof pct === "number") setAiProgress((p) => Math.max(p, Math.min(100, pct)));
  };
  const [aiSession, setAiSession] = useSessionState(`${STORAGE_KEY}:aiSession`, null);
  const [deepening, setDeepening] = useState(false);
  const handleAiComplete = (proposal, modules, preset, meta = {}) => {
    if (meta.sessionId) setAiSession({ id: meta.sessionId, turns: meta.turns || 0 });
    if (modules && modules.length > 0) {
      setBaseModules(modules);
    }
    if (preset) {
      setPresetKey(preset);
      const p = presets && presets[preset] || {};
      setPresetLabel(p.label || preset);
      setPresetDesc(p.description || "");
    }
    if (proposal?.confidence) {
      setMatched(true);
    }
    setPhase("reveal");
  };
  const handleAiStateUpdate = (confirmedCaps, facts) => {
    if (Array.isArray(confirmedCaps) && confirmedCaps.length > 0 && confirmedCaps.every((c) => c && typeof c === "object" && c.key)) {
      setCapabilities(confirmedCaps);
    }
  };
  const forgetAttempt = () => {
    forgetAnswers();
    [
      "phase",
      "qIndex",
      "prompt",
      "presetKey",
      "presetLabel",
      "presetDesc",
      "baseModules",
      "capabilities",
      "edited",
      "matched",
      "converse",
      "discoveryMode",
      "path",
      "planKey",
      "planTouched",
      "businessType",
      "businessLabel",
      "terms",
      "candidates",
      "reasons",
      "unsupported",
      "blankSlate",
      "aiSession"
    ].forEach((slot) => {
      try {
        window.sessionStorage.removeItem(`${STORAGE_KEY}:${slot}`);
      } catch (e) {
      }
    });
  };
  const [lastAnswer, setLastAnswer] = useState(null);
  const phase = rawPhase === "questions" && questions.length === 0 ? "reveal" : rawPhase === "identity" ? "account" : rawPhase;
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState(initialCurrency || "USD");
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [provisionError, setProvisionError] = useState("");
  const [buildIndex, setBuildIndex] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifySent, setNotifySent] = useState(false);
  const [demandOpen, setDemandOpen] = useState(false);
  const [demandText, setDemandText] = useState("");
  const [demandSent, setDemandSent] = useState(false);
  const [demandBusy, setDemandBusy] = useState(false);
  const promptRef = useRef(null);
  const analyse = async (text, preset, answersOverride, typeKey = null) => {
    try {
      const data = await postJson(route("workspace.analyze"), {
        prompt: text,
        preset,
        business_type: typeKey || null,
        // A caller starting a brand-new attempt (see the mount effect
        // below) passes {} here explicitly — otherwise this closes
        // over whatever `answers` happens to be at call time, which
        // for a fresh attempt is still the PREVIOUS business's
        // answers for one tick, and would taint the new preset's
        // module merge with them.
        answers: answersOverride ?? answers
      });
      if (!data?.success) return null;
      setPresetKey(data.preset_key || "");
      setPresetLabel(data.preset_label || "");
      setPresetDesc(data.preset_description || "");
      setBaseModules(data.modules || []);
      setCapabilities(data.capabilities || []);
      setReasons(data.reasons && typeof data.reasons === "object" ? data.reasons : {});
      setUnsupported(Array.isArray(data.unsupported) ? data.unsupported : []);
      setMatched(data.matched !== false);
      setBusinessType(data.business_type || "");
      setBusinessLabel(data.business_label || "");
      setTerms(data.terms || {});
      setCandidates(data.candidates || []);
      return data;
    } catch (e) {
      return null;
    } finally {
      setAnalysed(true);
    }
  };
  useEffect(() => {
    const incomingPrompt = initialPrompt || "";
    const incomingPreset = initialPreset || "";
    const incomingType = entryType ? entryType.key : "";
    if (isFreshAttempt()) {
      resetAnswers();
      setDiscoveryMode("ai");
      setPrompt(incomingPrompt);
      setPresetKey(incomingPreset);
      setPresetLabel("");
      setPresetDesc("");
      setBaseModules([]);
      setCapabilities([]);
      setReasons({});
      setUnsupported([]);
      setBlankSlate(false);
      setBusinessType("");
      setBusinessLabel("");
      setTerms({});
      setMatched(true);
      setEdited(null);
      setQIndex(0);
      if (!incomingPrompt && incomingType) {
        pickBusinessType(incomingType);
      } else if (!incomingPrompt && isShippablePreset(presets, incomingPreset)) {
        const p = presets[incomingPreset];
        setPresetLabel(p.label || incomingPreset);
        setPresetDesc(p.description || p.blurb || "");
        setBaseModules(p.modules || []);
        setPath("preset");
        setPhase("reveal");
        analyse("", incomingPreset, {});
      } else {
        setPath("questions");
        setPhase(incomingPrompt ? "questions" : "intent");
        if (incomingPrompt) analyse(incomingPrompt, incomingPreset, {});
      }
      setDraft(incomingPrompt);
      setAnalysed(false);
      setAttemptResolved(true);
      return;
    }
    if (analysed || presetKey || baseModules.length) {
      if (path === "preset" && presetKey && !capabilities.length) {
        analyse("", presetKey, {}, businessType || null);
        return;
      }
      setAnalysed(true);
      return;
    }
    if (initialPrompt || initialPreset) analyse(initialPrompt, initialPreset);
  }, []);
  useEffect(() => {
    if (phase !== "building") return;
    const t = window.setInterval(
      () => setBuildIndex((i) => Math.min(i + 1, 2)),
      900
    );
    return () => window.clearInterval(t);
  }, [phase]);
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
    for (const c of capabilities) {
      map[c.key] = {
        ...map[c.key],
        ...c,
        description: c.desc || map[c.key]?.description
      };
    }
    return map;
  }, [allModules, capabilities]);
  const locked = useMemo(() => {
    const out = {};
    for (const key of activeModules) {
      const reqs = catalogueByKey[key]?.requires || [];
      for (const dep of reqs) {
        if (activeModules.includes(dep)) {
          out[dep] = `Required by ${catalogueByKey[key]?.label || key}`;
        }
      }
    }
    return out;
  }, [activeModules, catalogueByKey]);
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
  const questionsRef = useRef(questions);
  const qIndexRef = useRef(qIndex);
  useEffect(() => {
    questionsRef.current = questions;
    qIndexRef.current = qIndex;
  });
  const advance = () => {
    const next = qIndexRef.current + 1;
    if (next >= questionsRef.current.length) {
      setPhase("reveal");
      return;
    }
    setQIndex(next);
  };
  const continueFromMulti = () => {
    const q = questions[qIndex];
    if (q) commitMulti(q.key);
    advance();
  };
  const startFromPrompt = (submitted) => {
    const text = (typeof submitted === "string" ? submitted : draft).trim();
    if (!text) {
      promptRef.current?.focus();
      return;
    }
    if (text !== prompt) {
      setPrompt(text);
      setEdited(null);
      setAiProgress(0);
      setBusinessType("");
      setBusinessLabel("");
      setTerms({});
      analyse(text, "", {});
    }
    setDiscoveryMode("ai");
    setBlankSlate(false);
    setPath("questions");
    setPhase("questions");
  };
  function pickBusinessType(key) {
    const t = typeByKey[key];
    if (!t) return;
    const p = presets?.[t.preset] || {};
    resetAnswers();
    setEdited(null);
    setBusinessType(key);
    setBusinessLabel(t.label);
    setTerms(t.terms || {});
    setCandidates([]);
    setPresetKey(t.preset);
    setPresetLabel(p.label || t.preset);
    setPresetDesc(t.note || p.blurb || p.description || "");
    setBaseModules(p.modules || []);
    setMatched(true);
    setPath("preset");
    setPhase("reveal");
    analyse("", t.preset, {}, key);
  }
  const foldInConfirmedCapabilities = () => {
    if (!capabilities.length) return;
    setBaseModules((prev) => {
      const merged = [...prev || []];
      for (const c of capabilities) {
        if (c?.key && !merged.includes(c.key)) merged.push(c.key);
      }
      return merged;
    });
  };
  const switchToManual = () => {
    foldInConfirmedCapabilities();
    setDiscoveryMode("manual");
  };
  const openBlankSlate = () => {
    setEdited([]);
    setBlankSlate(true);
    setPath("preset");
    setPhase("reveal");
  };
  const skipQuestions = async () => {
    if (skipping) return;
    if (!presetKey && !baseModules.length) {
      setSkipping(true);
      await analyse(prompt || "", "", answers);
      setSkipping(false);
    }
    foldInConfirmedCapabilities();
    setPhase("reveal");
  };
  const suggestedPlan = useMemo(() => {
    const keys = plans.map((p) => p.key);
    if (intendedPlan && keys.includes(intendedPlan)) return intendedPlan;
    const pick = LIGHT_PRESETS.includes(presetKey) ? "starter" : "core";
    return keys.includes(pick) ? pick : keys[0] || "";
  }, [plans, intendedPlan, presetKey]);
  const goToPlan = () => {
    if (!planTouched) setPlanKey(suggestedPlan);
    setPhase(plans.length ? "plan" : "account");
  };
  const selectedPlan = plans.find((p) => p.key === planKey) || null;
  const suggestions = useMemo(
    () => draft.trim().length >= 3 ? rankBusinessTypes(draft, businessTypes, 3) : [],
    [draft, businessTypes]
  );
  const displayLabel = businessLabel || (matched ? presetLabel : "");
  const editPrompt = () => {
    setDraft(prompt || "");
    setPhase("intent");
  };
  const toggleModule = (key) => {
    const current = activeModules;
    setEdited(
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  };
  const sendDemand = async () => {
    if (!demandText.trim()) return;
    setDemandBusy(true);
    try {
      const data = await postJson(route("workspace.demand"), {
        prompt: demandText,
        email: email || null,
        source: "build_workspace"
      });
      if (data?.success) setDemandSent(true);
    } catch (e) {
    } finally {
      setDemandBusy(false);
    }
  };
  const deepenQuestions = async () => {
    if (!aiSession?.id || deepening) return;
    setDeepening(true);
    try {
      const data = await postJson(route("workspace.converse.deepen"), { session_id: aiSession.id });
      if (data?.ok && data.question) {
        setDiscoveryMode("ai");
        setPhase("questions");
      }
    } catch (e) {
    } finally {
      setDeepening(false);
    }
  };
  const requestNotify = async () => {
    const address = notifyEmail.trim();
    if (!address || notifyBusy) return;
    setNotifyBusy(true);
    try {
      const data = await postJson(route("workspace.demand"), {
        prompt: `[not supported yet] ${unsupported.join(" | ")} — asked for in: ${prompt || ""}`.slice(0, 1e3),
        email: address,
        source: "build_workspace_unsupported"
      });
      if (data?.success) setNotifySent(true);
    } catch (e) {
    } finally {
      setNotifyBusy(false);
    }
  };
  const provision = async (e) => {
    e.preventDefault();
    setProvisionError("");
    setPhase("building");
    setBuildIndex(0);
    try {
      const turnstileToken = await getTurnstileToken();
      const data = await postJson(route("workspace.provision"), {
        ...turnstileToken ? { "cf-turnstile-response": turnstileToken } : {},
        business_name: businessName.trim(),
        currency,
        timezone: browserTimezone(),
        phone,
        // Signed-in users are identified by their session, not the form.
        ...authUser ? {} : { email, password },
        modules: activeModules,
        preset_key: presetKey || null,
        business_type: businessType || null,
        plan: planKey || null
      });
      if (data?.success && data.redirect) {
        setBuildIndex(3);
        forgetAttempt();
        window.setTimeout(() => {
          window.location.href = data.redirect;
        }, 520);
        return;
      }
      setProvisionError(data?.message || "We could not finish that. Please try again.");
      setPhase("account");
    } catch (err) {
      setProvisionError("Network problem — nothing was created. Please try again.");
      setPhase("account");
    }
  };
  const handleGoogleSignUp = async () => {
    setGoogleBusy(true);
    setProvisionError("");
    try {
      const data = await postJson(route("workspace.prepare-google"), {
        business_name: businessName.trim(),
        currency,
        timezone: browserTimezone(),
        phone,
        modules: activeModules,
        preset_key: presetKey || null,
        business_type: businessType || null,
        plan: planKey || null
      });
      if (data && data.success === false) {
        setProvisionError(data.message || "Please check the details above.");
        setGoogleBusy(false);
        return;
      }
      if (data?.auth_url) {
        forgetAttempt();
        window.location.href = data.auth_url;
        return;
      }
      window.location.href = route("auth.google");
    } catch (e) {
      window.location.href = route("auth.google");
    }
  };
  const hasIntent = !initialPrompt;
  const qCount = path === "preset" ? 0 : questions.length;
  const planSteps = plans.length ? 1 : 0;
  const totalSteps = (hasIntent ? 1 : 0) + qCount + 2 + planSteps;
  const stepNow = phase === "intent" ? 1 : phase === "questions" ? (hasIntent ? 1 : 0) + (discoveryMode !== "manual" ? Math.max(1, Math.round(aiProgress / 100 * questions.length)) : qIndex + 1) : phase === "reveal" ? (hasIntent ? 1 : 0) + qCount + 1 : phase === "plan" ? (hasIntent ? 1 : 0) + qCount + 2 : totalSteps;
  const backTarget = () => {
    if (phase === "questions" && qIndex > 0 && discoveryMode === "manual") return () => setQIndex((i) => i - 1);
    if (phase === "questions") return editPrompt;
    if (phase === "reveal" && path === "preset") return () => setPhase("intent");
    if (phase === "reveal" && questions.length) {
      return () => {
        setPhase("questions");
        setQIndex(Math.max(0, questions.length - 1));
      };
    }
    if (phase === "plan") return () => setPhase("reveal");
    if (phase === "account") return () => setPhase(plans.length ? "plan" : "reveal");
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
  const showStack = phase === "reveal";
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Build your VenQore workspace" }),
    /* @__PURE__ */ jsx(
      BuilderShell,
      {
        siteChrome: true,
        step: stepNow,
        total: phase === "building" ? 0 : totalSteps,
        eyebrow: displayLabel || "Your ERP, built by AI",
        orbState,
        onBack: phase === "building" ? null : backTarget(),
        wide: showStack,
        footer: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { size: 12, className: "text-accent-text" }),
          "14-day free trial · No credit card required · Cancel anytime"
        ] }),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: showStack ? "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_26rem]" : "mx-auto w-full max-w-3xl",
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
                phase === "questions" && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-wrap items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-1",
                      role: "group",
                      "aria-label": "Answer with AI, or do it yourself",
                      children: [
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => setDiscoveryMode("ai"),
                            "aria-pressed": discoveryMode !== "manual",
                            className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ease-standard ${discoveryMode !== "manual" ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:text-ink"}`,
                            children: [
                              /* @__PURE__ */ jsx(Sparkles, { size: 13 }),
                              "AI is asking"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: switchToManual,
                            "aria-pressed": discoveryMode === "manual",
                            className: `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-fast ease-standard ${discoveryMode === "manual" ? "bg-accent-fill text-accent-on" : "text-ink-secondary hover:text-ink"}`,
                            children: [
                              /* @__PURE__ */ jsx(Sliders, { size: 13 }),
                              "I’ll answer myself"
                            ]
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: skipQuestions,
                      disabled: skipping,
                      title: displayLabel ? `Stop here and set up the essentials for ${displayLabel}` : "Stop here and set up the essentials",
                      className: "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-semibold text-ink-secondary transition-colors duration-fast ease-standard hover:bg-interactive-hover hover:text-ink disabled:opacity-60",
                      children: [
                        /* @__PURE__ */ jsx(FastForward, { size: 13 }),
                        skipping ? "Setting up…" : "Skip questions"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs(AnimatePresence, { mode: "wait", children: [
                  phase === "intent" && /* @__PURE__ */ jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0, y: 16 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                      className: "mx-auto max-w-2xl",
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "vq-intent", children: [
                          /* @__PURE__ */ jsxs("span", { className: "mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-quiet px-2.5 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text", children: [
                            /* @__PURE__ */ jsx(MessageSquareText, { size: 12 }),
                            "Recommended · about a minute"
                          ] }),
                          /* @__PURE__ */ jsx("h1", { className: "vq-intent__title", children: "Tell us what your business does." }),
                          /* @__PURE__ */ jsx("p", { className: "vq-intent__lede", id: "vq-intent-lede", children: "One sentence in your own words, in any language. A few quick questions after it let us fit the system to how you actually work — you can skip them at any point." }),
                          /* @__PURE__ */ jsx(
                            PromptTextarea,
                            {
                              ref: promptRef,
                              size: "lg",
                              value: draft,
                              onChange: setDraft,
                              onSubmit: startFromPrompt,
                              maxLength: 600,
                              minRows: 1,
                              maxRows: 5,
                              autoFocus: true,
                              ariaLabel: "Describe your business",
                              ariaDescribedBy: "vq-intent-lede",
                              placeholder: "We sell…",
                              submitText: "Start building",
                              submitLabel: "Start building",
                              submitIcon: ArrowRight,
                              hint: /* @__PURE__ */ jsxs(Fragment, { children: [
                                /* @__PURE__ */ jsx("kbd", { children: "Enter" }),
                                " to start · ",
                                /* @__PURE__ */ jsx("kbd", { children: "Shift" }),
                                " + ",
                                /* @__PURE__ */ jsx("kbd", { children: "Enter" }),
                                " for a new line"
                              ] })
                            }
                          ),
                          suggestions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center gap-2", "aria-live": "polite", children: [
                            /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Looks like" }),
                            suggestions.map((t) => /* @__PURE__ */ jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () => pickBusinessType(t.key),
                                className: "inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-xs font-semibold text-accent-text transition-colors duration-fast hover:bg-accent-fill hover:text-accent-on",
                                title: "Use this setup — no questions",
                                children: [
                                  t.label,
                                  /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                                ]
                              },
                              t.key
                            ))
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "vq-intent__examples", role: "group", "aria-label": "Examples", children: EXAMPLES.map((ex) => /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setDraft(ex);
                                promptRef.current?.focus();
                              },
                              className: "vq-chip",
                              children: ex
                            },
                            ex
                          )) })
                        ] }),
                        businessTypes.length > 0 && /* @__PURE__ */ jsxs("section", { className: "mt-10", "aria-labelledby": "vq-types-title", children: [
                          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center py-2", children: [
                            /* @__PURE__ */ jsx("div", { className: "w-full border-t border-line" }),
                            /* @__PURE__ */ jsx("span", { className: "absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-app px-3 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "or skip the questions" })
                          ] }),
                          /* @__PURE__ */ jsxs("h2", { id: "vq-types-title", className: "mt-4 text-base font-semibold text-ink", children: [
                            "Pick your business — ",
                            businessTypes.length,
                            " ready-made setups"
                          ] }),
                          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-ink-secondary", children: "One click sets up the modules and the words your trade uses. You can add or remove anything before and after you sign up." }),
                          /* @__PURE__ */ jsx(
                            BusinessTypePicker,
                            {
                              className: "mt-4",
                              types: businessTypes,
                              sectors,
                              selectedKey: businessType || null,
                              onPick: pickBusinessType
                            }
                          )
                        ] })
                      ]
                    },
                    "intent"
                  ),
                  phase === "questions" && (discoveryMode !== "manual" ? attemptResolved && /* @__PURE__ */ jsx(
                    ConversationalDiscovery,
                    {
                      initialPrompt: prompt,
                      initialPreset: presetKey,
                      onComplete: handleAiComplete,
                      onFallbackToManual: openBlankSlate,
                      onStateUpdate: handleAiStateUpdate,
                      onProgress: handleAiProgress,
                      onEditPrompt: editPrompt,
                      storageKey: `${STORAGE_KEY}:converse`
                    },
                    `ai-discovery-${prompt || "init"}`
                  ) : questions[qIndex] && /* @__PURE__ */ jsx(
                    QuestionStep,
                    {
                      question: questions[qIndex],
                      value: answers[questions[qIndex].key],
                      onAnswer: handleAnswer,
                      onContinue: continueFromMulti,
                      autoAdvance: advance
                    },
                    questions[qIndex].key
                  )),
                  phase === "reveal" && /* @__PURE__ */ jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0, y: 16 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                      transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
                      children: [
                        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-accent bg-accent-quiet px-3 py-1 text-3xs font-bold uppercase tracking-widest text-accent-text", children: [
                          /* @__PURE__ */ jsx(Sparkles, { size: 12 }),
                          displayLabel || "Your workspace"
                        ] }),
                        /* @__PURE__ */ jsx("h1", { className: "mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl", children: blankSlate ? "Build it yourself." : headline || "Your system is ready to build." }),
                        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary", children: blankSlate ? "Nothing is switched on. Tap whatever you want — anything that needs something else switches that on too, and nothing here costs extra." : presetDesc || "Everything below is switched on for you. Add or remove anything — nothing here costs extra." }),
                        /* @__PURE__ */ jsx(TermsPreview, { terms, className: "mt-3" }),
                        !blankSlate && !matched && candidates.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-accent bg-accent-quiet p-4", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink", children: "Did you mean one of these?" }),
                          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap gap-2", children: [
                            candidates.map((c) => /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => pickBusinessType(c.key),
                                className: "rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink hover:border-accent",
                                children: c.label
                              },
                              c.key
                            )),
                            /* @__PURE__ */ jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () => setPhase("intent"),
                                className: "rounded-full px-3 py-1 text-xs font-semibold text-accent-text underline-offset-4 hover:underline",
                                children: [
                                  "See all ",
                                  businessTypes.length
                                ]
                              }
                            )
                          ] })
                        ] }),
                        !blankSlate && !matched && !candidates.length && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface p-4", children: [
                          /* @__PURE__ */ jsx(Compass, { size: 16, className: "mt-0.5 shrink-0 text-ink-muted" }),
                          /* @__PURE__ */ jsxs("p", { className: "text-sm leading-relaxed text-ink-secondary", children: [
                            "We don’t have a ready-made template for what you described yet, so this is a general starting point you can fully customise below — nothing here is final. We’ve noted what you told us for what to build next.",
                            " ",
                            /* @__PURE__ */ jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () => setPhase("intent"),
                                className: "font-semibold text-accent-text underline-offset-4 hover:underline",
                                children: [
                                  "Pick from all ",
                                  businessTypes.length,
                                  " business types"
                                ]
                              }
                            )
                          ] })
                        ] }),
                        !blankSlate && unsupported.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-lg border border-line bg-surface p-4", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink", children: unsupported.length === 1 ? "One thing we don’t do yet" : "A few things we don’t do yet" }),
                          /* @__PURE__ */ jsx("ul", { className: "mt-1.5 space-y-1", children: unsupported.map((item) => /* @__PURE__ */ jsxs("li", { className: "text-sm leading-relaxed text-ink-secondary", children: [
                            item,
                            " ",
                            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "— noted for our roadmap" })
                          ] }, item)) }),
                          /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs leading-relaxed text-ink-muted", children: "Nothing below pretends to cover it. That is the whole reason we said so rather than switching on something that sounds close." }),
                          notifySent ? /* @__PURE__ */ jsxs("p", { className: "mt-3 flex items-center gap-2 text-sm text-ink", children: [
                            /* @__PURE__ */ jsx(Check, { size: 15, className: "text-accent-text" }),
                            "We’ll email you the day it ships."
                          ] }) : /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                            /* @__PURE__ */ jsx("label", { htmlFor: "vq-notify", className: "text-xs font-semibold text-ink", children: "Want it? We’ll tell you when it’s ready." }),
                            /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex flex-col gap-2 sm:flex-row", children: [
                              /* @__PURE__ */ jsx(
                                "input",
                                {
                                  id: "vq-notify",
                                  type: "email",
                                  value: notifyEmail,
                                  onChange: (e) => setNotifyEmail(e.target.value),
                                  placeholder: "you@yourbusiness.com",
                                  className: "h-11 flex-1 rounded-md border border-line bg-app px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                                }
                              ),
                              /* @__PURE__ */ jsxs(
                                "button",
                                {
                                  type: "button",
                                  onClick: requestNotify,
                                  disabled: notifyBusy || !notifyEmail.trim(),
                                  className: "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-sunken px-4 text-xs font-semibold text-ink transition-colors duration-fast ease-standard hover:bg-interactive-hover disabled:opacity-50",
                                  children: [
                                    /* @__PURE__ */ jsx(Send, { size: 14 }),
                                    notifyBusy ? "Saving…" : "Notify me"
                                  ]
                                }
                              )
                            ] }),
                            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-3xs text-ink-faint", children: "Only about this. No newsletter." })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-7", children: [
                          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-baseline justify-between gap-4", children: [
                            /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-ink", children: "What your workspace can do" }),
                            /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Tap to add or remove" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            ModuleGrid,
                            {
                              catalogue: gridCatalogue,
                              active: activeModules,
                              locked,
                              onToggle: toggleModule
                            }
                          )
                        ] }),
                        !blankSlate && recommendedList.length > 0 && /* @__PURE__ */ jsx(
                          RecommendedBand,
                          {
                            items: recommendedList,
                            active: activeModules,
                            onToggle: toggleModule
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg border border-line bg-surface p-5", children: [
                          aiSession?.id && !blankSlate && /* @__PURE__ */ jsxs("div", { className: "mb-4 border-b border-line-subtle pb-4", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-ink", children: "Want it closer to how you actually work?" }),
                            /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs leading-relaxed text-ink-secondary", children: "We asked the short version. A few more questions — about your stock, your team, how people pay you — and this stops being a good guess." }),
                            /* @__PURE__ */ jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: deepenQuestions,
                                disabled: deepening,
                                className: "mt-3 inline-flex h-10 items-center gap-2 rounded-md border border-accent bg-accent-quiet px-4 text-xs font-semibold text-accent-text transition-colors duration-fast ease-standard hover:bg-accent-fill hover:text-accent-on disabled:opacity-60",
                                children: [
                                  /* @__PURE__ */ jsx(MessageSquareText, { size: 14 }),
                                  deepening ? "Picking up where we left off…" : "Ask me a few more"
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxs("p", { className: "text-xs leading-relaxed text-ink-secondary", children: [
                            /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: "Nothing here is final." }),
                            " ",
                            "Once you are in, everything on this page lives under",
                            " ",
                            /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: "Store Configuration → Builder" }),
                            ", where you can switch anything on or off, or answer a few questions and have it worked out for you again. Adding a module later costs nothing extra on your plan."
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "mt-6 rounded-lg border border-line bg-surface p-5", children: demandSent ? /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm text-ink", children: [
                          /* @__PURE__ */ jsx(Check, { size: 15, className: "text-accent-text" }),
                          "Noted — thank you. We read every one of these."
                        ] }) : demandOpen ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row", children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: demandText,
                              onChange: (e) => setDemandText(e.target.value),
                              placeholder: "What does your business need that you don't see?",
                              className: "h-11 flex-1 rounded-md border border-line bg-app px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            }
                          ),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              disabled: demandBusy,
                              onClick: sendDemand,
                              className: "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-sunken px-4 text-xs font-semibold text-ink transition-colors duration-fast ease-standard hover:bg-interactive-hover",
                              children: [
                                /* @__PURE__ */ jsx(Send, { size: 14 }),
                                "Send"
                              ]
                            }
                          )
                        ] }) : /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => setDemandOpen(true),
                            className: "text-xs font-semibold text-accent-text underline-offset-4 hover:underline",
                            children: "Something missing for your line of work? Tell us →"
                          }
                        ) }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-col gap-3 sm:flex-row sm:items-center", children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: goToPlan,
                              disabled: activeModules.length === 0,
                              className: "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
                              children: [
                                /* @__PURE__ */ jsx(Rocket, { size: 16 }),
                                "Build this workspace",
                                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                              ]
                            }
                          ),
                          path === "preset" ? /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => setPhase("intent"),
                              className: "text-xs font-semibold text-accent-text underline-offset-4 hover:underline",
                              children: "Pick a different business type"
                            }
                          ) : null
                        ] })
                      ]
                    },
                    "reveal"
                  ),
                  phase === "plan" && /* @__PURE__ */ jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0, y: 16 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                      className: "mx-auto max-w-3xl",
                      children: [
                        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink", children: "Pick a plan for after your trial." }),
                        /* @__PURE__ */ jsx("p", { className: "mt-3 text-base text-ink-secondary", children: "You get 14 days free on any plan, with no card needed now. Not sure? Skip this and decide before the trial ends." }),
                        /* @__PURE__ */ jsx("div", { className: "mt-7 grid gap-3 sm:grid-cols-2", role: "radiogroup", "aria-label": "Plan", children: plans.map((p) => {
                          const on = planKey === p.key;
                          return /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              role: "radio",
                              "aria-checked": on,
                              onClick: () => {
                                setPlanKey(p.key);
                                setPlanTouched(true);
                              },
                              className: `relative flex flex-col rounded-lg border p-4 text-left transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${on ? "border-accent bg-accent-quiet" : "border-line bg-surface hover:border-line-strong"}`,
                              children: [
                                /* @__PURE__ */ jsxs("span", { className: "flex items-start justify-between gap-3", children: [
                                  /* @__PURE__ */ jsxs("span", { children: [
                                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-semibold text-ink", children: p.name }),
                                    /* @__PURE__ */ jsxs("span", { className: "mt-0.5 block font-display text-2xl font-semibold text-ink", children: [
                                      p.price_monthly > 0 ? `$${p.price_monthly}` : "Free",
                                      p.price_monthly > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-ink-muted", children: " /mo" })
                                    ] })
                                  ] }),
                                  /* @__PURE__ */ jsx(
                                    "span",
                                    {
                                      className: `mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-accent bg-accent-fill text-accent-on" : "border-line-strong"}`,
                                      children: on && /* @__PURE__ */ jsx(Check, { size: 12, strokeWidth: 3 })
                                    }
                                  )
                                ] }),
                                p.badge && /* @__PURE__ */ jsx("span", { className: "mt-2 inline-flex w-fit rounded-full bg-sunken px-2 py-0.5 text-3xs font-bold uppercase tracking-widest text-ink-secondary", children: p.badge }),
                                /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-1", children: (p.points || []).map((pt) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-xs text-ink-secondary", children: [
                                  /* @__PURE__ */ jsx(Check, { size: 12, className: "shrink-0 text-accent-text" }),
                                  pt
                                ] }, pt)) }),
                                p.price_annual ? /* @__PURE__ */ jsxs("span", { className: "mt-3 text-3xs text-ink-muted", children: [
                                  "or $",
                                  p.price_annual,
                                  "/yr billed annually"
                                ] }) : null
                              ]
                            },
                            p.key
                          );
                        }) }),
                        /* @__PURE__ */ jsx("p", { className: "mt-3 text-2xs text-ink-muted", children: "Prices in USD. Local pricing, if available, is shown at checkout." }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-col gap-3 sm:flex-row sm:items-center", children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setPhase("account"),
                              disabled: !planKey,
                              className: "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-60 sm:w-auto",
                              children: [
                                selectedPlan ? `Continue with ${selectedPlan.name}` : "Continue",
                                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setPlanKey("");
                                setPlanTouched(true);
                                setPhase("account");
                              },
                              className: "inline-flex h-12 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors duration-fast hover:bg-interactive-hover",
                              children: "Skip — decide later"
                            }
                          )
                        ] })
                      ]
                    },
                    "plan"
                  ),
                  phase === "account" && /* @__PURE__ */ jsxs(
                    motion.form,
                    {
                      onSubmit: provision,
                      initial: { opacity: 0, y: 16 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                      className: "mx-auto max-w-xl",
                      children: [
                        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-ink", children: "Save your workspace." }),
                        /* @__PURE__ */ jsxs("p", { className: "mt-3 text-base text-ink-secondary", children: [
                          activeModules.length,
                          " modules, configured.",
                          " ",
                          authUser ? "Name it and it is ready." : "Name it, create a login, and it is yours."
                        ] }),
                        license && /* @__PURE__ */ jsxs("p", { className: "mt-4 flex items-center gap-2 rounded-md border border-accent bg-accent-quiet px-4 py-2.5 text-xs text-ink", children: [
                          /* @__PURE__ */ jsx(ShieldCheck, { size: 14, className: "shrink-0 text-accent-text" }),
                          "This workspace runs on your ",
                          /* @__PURE__ */ jsx("strong", { className: "font-semibold", children: license.label }),
                          " license."
                        ] }),
                        plans.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-2.5 text-xs", children: [
                          /* @__PURE__ */ jsxs("span", { className: "text-ink-secondary", children: [
                            "After the trial:",
                            " ",
                            /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: selectedPlan ? `${selectedPlan.name} · ${selectedPlan.price_monthly > 0 ? `$${selectedPlan.price_monthly}/mo` : "Free"}` : "decide later" })
                          ] }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => setPhase("plan"),
                              className: "font-semibold text-accent-text underline-offset-4 hover:underline",
                              children: "Change"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
                          /* @__PURE__ */ jsx(Field, { label: "Business name", icon: Building2, children: /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: businessName,
                              onChange: (e) => setBusinessName(e.target.value),
                              placeholder: "e.g. Rahman Trading Co. (you can change it later)",
                              autoComplete: "organization",
                              className: "h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            }
                          ) }),
                          /* @__PURE__ */ jsxs("div", { className: showPhone ? "grid gap-4 sm:grid-cols-2" : "", children: [
                            /* @__PURE__ */ jsx(CurrencyDropdown, { value: currency, onChange: setCurrency }),
                            showPhone && /* @__PURE__ */ jsx(Field, { label: "Phone (optional)", icon: Phone, children: /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "tel",
                                value: phone,
                                onChange: (e) => setPhone(e.target.value),
                                placeholder: "For receipts",
                                autoComplete: "tel",
                                className: "h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                              }
                            ) })
                          ] }),
                          !showPhone && /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => setShowPhone(true),
                              className: "text-xs font-semibold text-accent-text underline-offset-4 hover:underline",
                              children: "+ Add a phone number for receipts (optional)"
                            }
                          )
                        ] }),
                        authUser ? /* @__PURE__ */ jsxs("p", { className: "mt-7 flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm text-ink-secondary", children: [
                          /* @__PURE__ */ jsx(ShieldCheck, { size: 15, className: "shrink-0 text-accent-text" }),
                          "Signed in as ",
                          /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children: authUser.email }),
                          " — this workspace will be added to your account."
                        ] }) : /* @__PURE__ */ jsxs("div", { className: "mt-7 space-y-4", children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              disabled: googleBusy,
                              onClick: handleGoogleSignUp,
                              className: "inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-sm transition-all duration-fast hover:bg-interactive-hover hover:border-line-strong active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                              children: [
                                /* @__PURE__ */ jsx(GoogleMark, {}),
                                /* @__PURE__ */ jsx("span", { children: googleBusy ? "Connecting to Google…" : "Continue with Google" })
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center py-2", children: [
                            /* @__PURE__ */ jsx("div", { className: "w-full border-t border-line" }),
                            /* @__PURE__ */ jsx("span", { className: "absolute left-1/2 -translate-x-1/2 bg-app px-3 text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "or continue with email" })
                          ] }),
                          /* @__PURE__ */ jsx(Field, { label: "Email", icon: Mail, children: /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "email",
                              required: true,
                              value: email,
                              onChange: (e) => setEmail(e.target.value),
                              autoComplete: "email",
                              className: "h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            }
                          ) }),
                          /* @__PURE__ */ jsx(Field, { label: "Password", icon: Lock, children: /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "password",
                              required: true,
                              minLength: 8,
                              value: password,
                              onChange: (e) => setPassword(e.target.value),
                              autoComplete: "new-password",
                              className: "h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            }
                          ) })
                        ] }),
                        provisionError && /* @__PURE__ */ jsx("p", { className: "mt-4 rounded-md border border-danger-300 bg-danger-50 px-4 py-3 text-xs text-danger-700", children: provisionError }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "submit",
                            className: "mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                            children: [
                              /* @__PURE__ */ jsx(Rocket, { size: 16 }),
                              authUser ? "Create workspace" : "Create my workspace"
                            ]
                          }
                        )
                      ]
                    },
                    "account"
                  ),
                  phase === "building" && /* @__PURE__ */ jsxs(
                    motion.div,
                    {
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      className: "mx-auto max-w-md text-center",
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-20 w-20 items-center justify-center", children: /* @__PURE__ */ jsx(
                          ThinkingOrb,
                          {
                            state: "solving",
                            size: 80,
                            "aria-label": "Building your workspace"
                          }
                        ) }),
                        /* @__PURE__ */ jsx("h2", { className: "mt-6 font-display text-2xl font-semibold text-ink", children: "Building your workspace" }),
                        /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-2.5 text-left", children: [
                          "Opening your ledger",
                          "Switching on your modules",
                          "Naming things the way you do",
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
                      ]
                    },
                    "building"
                  )
                ] })
              ] }),
              showStack && /* @__PURE__ */ jsxs("div", { className: "sticky top-6 hidden max-h-[calc(100vh-3rem)] flex-col gap-3.5 lg:flex", children: [
                /* @__PURE__ */ jsx(
                  LiveStack,
                  {
                    modules: activeModules,
                    catalogue: catalogueByKey,
                    attribution,
                    reasons,
                    lastAnswer,
                    className: "max-h-[68vh]"
                  }
                ),
                phase === "reveal" && /* @__PURE__ */ jsx(
                  motion.div,
                  {
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                    children: /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: goToPlan,
                        className: "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-all duration-normal ease-standard hover:bg-accent-fill-hover hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        children: [
                          /* @__PURE__ */ jsx(Rocket, { size: 16 }),
                          "Build this workspace",
                          /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                        ]
                      }
                    )
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
function CurrencyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedCurrency = useMemo(() => {
    return CURRENCY_LIST.find((c) => c.code === value) || {
      code: value || "USD",
      symbol: "$",
      name: value || "US Dollar",
      flag: "🌐"
    };
  }, [value]);
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "relative block", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: "Currency" }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((prev) => !prev),
        className: `relative flex h-12 w-full items-center justify-between rounded-md border bg-surface px-3.5 text-left text-sm text-ink transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-focus ${open ? "border-accent ring-2 ring-focus" : "border-line hover:border-line-strong"}`,
        "aria-expanded": open,
        "aria-haspopup": "listbox",
        children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2.5 truncate", children: [
            /* @__PURE__ */ jsx("span", { className: "text-base leading-none", children: selectedCurrency.flag }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink", children: selectedCurrency.code }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-secondary", children: [
              "(",
              selectedCurrency.symbol,
              ")"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "hidden truncate text-xs text-ink-muted sm:inline", children: [
              "— ",
              selectedCurrency.name
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            ChevronDown,
            {
              size: 16,
              className: `shrink-0 text-ink-muted transition-transform duration-fast ${open ? "rotate-180 text-ink" : ""}`
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsx(
      motion.div,
      {
        initial: { opacity: 0, y: -4, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -4, scale: 0.98 },
        transition: { duration: 0.15, ease: "easeOut" },
        className: "absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-line bg-surface p-1.5 shadow-xl",
        role: "listbox",
        children: CURRENCY_LIST.map((c) => {
          const isSelected = c.code === selectedCurrency.code;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                onChange(c.code);
                setOpen(false);
              },
              className: `flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-xs transition-colors duration-fast ${isSelected ? "bg-accent-quiet font-semibold text-accent-text" : "text-ink hover:bg-surface-raised"}`,
              role: "option",
              "aria-selected": isSelected,
              children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2.5 truncate", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm leading-none", children: c.flag }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold", children: c.code }),
                  /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted", children: [
                    "(",
                    c.symbol,
                    ")"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "truncate text-ink-secondary", children: c.name })
                ] }),
                isSelected && /* @__PURE__ */ jsx(Check, { size: 14, className: "shrink-0 text-accent-text" })
              ]
            },
            c.code
          );
        })
      }
    ) })
  ] });
}
function GoogleMark() {
  return /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", "aria-hidden": "true", className: "shrink-0", children: [
    /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
    /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
    /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
    /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
  ] });
}
function Field({ label, icon: Icon, children }) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted", children: label }),
    /* @__PURE__ */ jsxs("span", { className: "relative block", children: [
      /* @__PURE__ */ jsx(
        Icon,
        {
          size: 16,
          className: "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
        }
      ),
      children
    ] })
  ] });
}
export {
  BuildWorkspace as default
};
