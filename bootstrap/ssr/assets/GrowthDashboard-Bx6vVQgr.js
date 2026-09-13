import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import axios from "axios";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { g as getCurrencySymbol } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { Info, Sparkles, Activity, Wallet, Percent, Package, Users, AlertTriangle, ShieldCheck, RefreshCcw, Target, ChevronRight, CheckCircle2, X, MessageCircle, ArrowRight, Clock, BellOff } from "lucide-react";
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
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
const BRAIN_META = {
  customer: { icon: Users, label: "Customers", tone: "indigo" },
  inventory: { icon: Package, label: "Stock", tone: "emerald" },
  profit: { icon: Percent, label: "Profit", tone: "amber" },
  cash: { icon: Wallet, label: "Cash & Ops", tone: "sky" }
};
const TONE = {
  indigo: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  sky: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
};
const PRIORITY_STYLE = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  low: "bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted border-line"
};
const money = (v) => {
  const n = Number(v || 0);
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} Lac`;
  return n.toLocaleString(void 0, { maximumFractionDigits: 0 });
};
function GrowthDashboard({
  recommendations,
  stats,
  facets,
  scorecard,
  engineStatus,
  trend,
  filters = {}
}) {
  const tt = useTermText();
  const cur = getCurrencySymbol();
  const { store } = usePage().props;
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefresh] = useState(false);
  const [notice, setNotice] = useState(null);
  const [showScore, setShowScore] = useState(false);
  const [hidden, setHidden] = useState([]);
  const rows = useMemo(
    () => (recommendations?.data || []).filter((r) => !hidden.includes(r.id)),
    [recommendations, hidden]
  );
  const hasAnySignals = (stats?.total_signals || 0) > 0;
  const applyFilter = useCallback((key, value) => {
    const next = { ...filters };
    if (!value || next[key] === value) delete next[key];
    else next[key] = value;
    router.get(route("store.growth-engine.index", { store_slug: store.slug }), next, {
      preserveScroll: true,
      preserveState: true,
      replace: true
    });
  }, [filters, store]);
  const openSignal = async (rec) => {
    setSelected(rec);
    setDetail(null);
    try {
      const { data } = await axios.get(route("store.growth-engine.show", { store_slug: store.slug, id: rec.id }));
      setDetail(data);
    } catch {
      setDetail({ recommendation: rec, context: {}, track_record: null });
    }
  };
  const interact = async (rec, action, payload = {}) => {
    setBusy(true);
    try {
      await axios.post(route(`store.growth-engine.${action}`, { store_slug: store.slug, id: rec.id }), payload);
      if (action !== "act") setHidden((h) => [...h, rec.id]);
      setSelected(null);
      setNotice(
        action === "act" ? "Marked as done — the engine will check whether it worked." : action === "snooze" ? "Snoozed. It will come back if it is still relevant." : "Dismissed. This type will be shown less often."
      );
      setTimeout(() => setNotice(null), 4e3);
    } finally {
      setBusy(false);
    }
  };
  const doRefresh = async () => {
    setRefresh(true);
    try {
      const { data } = await axios.post(route("store.growth-engine.refresh", { store_slug: store.slug }));
      setNotice(data.message);
    } catch (e) {
      setNotice(e?.response?.data?.message || "Could not start the analysis.");
    } finally {
      setRefresh(false);
      setTimeout(() => setNotice(null), 6e3);
    }
  };
  const whatsapp = async (rec) => {
    try {
      const { data } = await axios.get(route("store.growth-engine.whatsapp", { store_slug: store.slug, id: rec.id }));
      window.open(data.url, "_blank", "noopener");
      await interact(rec, "act");
    } catch (e) {
      setNotice(e?.response?.data?.error || "No phone number on file.");
      setTimeout(() => setNotice(null), 4e3);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Growth Engine", activeMenu: "Growth Engine", children: [
    /* @__PURE__ */ jsx(Head, { title: "Growth Engine" }),
    notice && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-2xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-5 py-3 text-sm font-medium text-brand-800 dark:text-brand-200 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Info, { size: 16 }),
      " ",
      notice
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-2xl bg-gradient-brand p-6 md:p-8 text-white shadow-xl mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/20 backdrop-blur-md rounded-xl", children: /* @__PURE__ */ jsx(Sparkles, { size: 22, className: "text-yellow-300" }) }),
              /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold tracking-tight", children: "Growth Engine" }),
              scorecard?.maturity && /* @__PURE__ */ jsxs("span", { className: "hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold", children: [
                /* @__PURE__ */ jsx(Activity, { size: 12 }),
                " ",
                scorecard.maturity.label
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-brand-100 max-w-2xl text-sm md:text-base", children: "Four brains reading your sales, stock, margin and cash — every insight tracked, checked against what actually happened, and tuned to your business." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsx(Stat, { label: "Opportunity on the table", value: `${cur} ${money(stats?.potential_revenue)}` }),
            /* @__PURE__ */ jsx(Stat, { label: "Live insights", value: stats?.total_signals ?? 0 }),
            stats?.realised_value > 0 && /* @__PURE__ */ jsx(Stat, { label: "Recovered so far", value: `${cur} ${money(stats.realised_value)}`, accent: true })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6", children: (stats?.by_brain || []).map((b) => {
          const meta = BRAIN_META[b.brain] || BRAIN_META.customer;
          const Icon = meta.icon;
          const active = filters.brain === b.brain;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => applyFilter("brain", b.brain),
              className: `text-left p-3 rounded-2xl border transition-all ${active ? "bg-white text-brand-900 border-white shadow-lg" : "bg-white/10 border-white/10 hover:bg-white/20"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx(Icon, { size: 15, className: active ? "text-brand-700" : "text-brand-200" }),
                  /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase tracking-wide ${active ? "text-brand-700" : "text-brand-200"}`, children: tt(meta.label) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-bold", children: b.count }),
                  b.value > 0 && /* @__PURE__ */ jsxs("span", { className: `text-xs ${active ? "text-brand-600" : "text-brand-200"}`, children: [
                    cur,
                    " ",
                    money(b.value)
                  ] })
                ] })
              ]
            },
            b.brain
          );
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsx(
        FilterChip,
        {
          active: !filters.category && !filters.brain && !filters.priority,
          onClick: () => router.get(route("store.growth-engine.index", { store_slug: store.slug }), {}, { preserveScroll: true }),
          children: "Everything"
        }
      ),
      (facets?.categories || []).map((c) => /* @__PURE__ */ jsxs(
        FilterChip,
        {
          active: filters.category === c.key,
          onClick: () => applyFilter("category", c.key),
          children: [
            c.label,
            " ",
            /* @__PURE__ */ jsx("span", { className: "opacity-60", children: c.count })
          ]
        },
        c.key
      )),
      /* @__PURE__ */ jsxs(FilterChip, { active: filters.priority === "urgent", onClick: () => applyFilter("priority", "urgent"), children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 13, className: "inline mr-1" }),
        " Urgent only"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowScore(true),
            className: "px-4 py-2 rounded-full text-sm font-semibold bg-surface border border-line text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(ShieldCheck, { size: 15 }),
              scorecard?.overall_precision != null ? `${scorecard.overall_precision}% accurate` : "How accurate is this?"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: doRefresh,
            disabled: refreshing,
            className: "px-4 py-2 rounded-full text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(RefreshCcw, { size: 15, className: refreshing ? "animate-spin" : "" }),
              refreshing ? "Starting…" : "Re-analyse"
            ]
          }
        )
      ] })
    ] }),
    rows.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5", children: rows.map((rec) => /* @__PURE__ */ jsx(SignalCard, { rec, cur, onOpen: () => openSignal(rec) }, rec.id)) }) : /* @__PURE__ */ jsx(
      EmptyState,
      {
        hasAnySignals,
        engineStatus,
        maturity: scorecard?.maturity,
        filters,
        onClear: () => router.get(route("store.growth-engine.index", { store_slug: store.slug }), {}, { preserveScroll: true }),
        onRefresh: doRefresh,
        refreshing
      }
    ),
    recommendations?.last_page > 1 && /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2 mt-8", children: recommendations.links.map((l, i) => /* @__PURE__ */ jsx(
      "button",
      {
        disabled: !l.url,
        onClick: () => l.url && router.visit(l.url, { preserveScroll: true }),
        className: `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${l.active ? "bg-brand-600 text-white" : l.url ? "bg-surface text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover border border-line" : "text-ink-faint dark:text-ink-secondary cursor-not-allowed"}`,
        dangerouslySetInnerHTML: { __html: l.label }
      },
      i
    )) }),
    selected && /* @__PURE__ */ jsx(
      DetailPanel,
      {
        rec: selected,
        detail,
        cur,
        busy,
        onClose: () => setSelected(null),
        onAct: () => interact(selected, "act"),
        onDismiss: () => interact(selected, "dismiss"),
        onSnooze: (d) => interact(selected, "snooze", { days: d }),
        onWhatsApp: () => whatsapp(selected)
      }
    ),
    showScore && /* @__PURE__ */ jsx(
      ScorecardPanel,
      {
        scorecard,
        cur,
        trend,
        engineStatus,
        onClose: () => setShowScore(false)
      }
    )
  ] });
}
function Stat({ label, value, accent }) {
  return /* @__PURE__ */ jsxs("div", { className: `text-center px-5 py-3 rounded-2xl border ${accent ? "bg-emerald-400/20 border-emerald-300/30" : "bg-white/10 border-white/10"} backdrop-blur-sm`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-200 uppercase tracking-widest font-bold whitespace-nowrap", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-xl font-bold mt-0.5", children: value })
  ] });
}
function FilterChip({ active, onClick, children }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      className: `px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${active ? "bg-brand-600 text-white border-brand-600 shadow-md " : "bg-surface text-ink-secondary border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover"}`,
      children
    }
  );
}
function SignalCard({ rec, cur, onOpen }) {
  const meta = BRAIN_META[rec.brain] || BRAIN_META.customer;
  const Icon = meta.icon;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick: onOpen,
      className: "group bg-surface rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-slow border border-line cursor-pointer flex flex-col",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [
          /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-2xl border ${TONE[meta.tone]} transition-transform`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            !rec.is_read && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-brand-500", title: "New" }),
            /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-full text-2xs uppercase font-bold tracking-wider border ${PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.low}`, children: rec.priority })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider font-bold text-ink-muted mb-1", children: rec.type_label }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-[15px] text-ink leading-snug mb-2", children: rec.title }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-secondary text-[13px] leading-relaxed mb-4 line-clamp-4", children: rec.message }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto pt-3 border-t border-line flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            Number(rec.potential_revenue) > 0 && /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate", children: [
              cur,
              " ",
              money(rec.potential_revenue)
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-1xs text-ink-muted flex items-center gap-1 truncate", children: [
              /* @__PURE__ */ jsx(Target, { size: 11 }),
              " ",
              Math.round(rec.confidence),
              "% confidence",
              rec.seen_count > 1 && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
                "· seen ",
                rec.seen_count,
                "×"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(ChevronRight, { size: 18, className: "text-neutral-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all shrink-0" })
        ] })
      ]
    }
  );
}
function EmptyState({ hasAnySignals, engineStatus, maturity, filters, onClear, onRefresh, refreshing }) {
  const isFiltered = Object.keys(filters || {}).length > 0;
  if (isFiltered && hasAnySignals) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-surface rounded-2xl border border-line", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mx-auto mb-4 text-ink-muted", children: /* @__PURE__ */ jsx(Sparkles, { size: 28 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Nothing matches that filter" }),
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted mt-1 text-sm", children: "There are other insights waiting under different filters." }),
      /* @__PURE__ */ jsx("button", { onClick: onClear, className: "mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700", children: "Show everything" })
    ] });
  }
  if (!engineStatus?.has_run) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-surface rounded-2xl border border-line", children: [
      /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-500", children: /* @__PURE__ */ jsx(Activity, { size: 28 }) }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Not analysed yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted mt-1 text-sm max-w-md mx-auto", children: "The engine runs automatically each morning. You can start the first analysis now — it usually takes under a minute." }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onRefresh,
          disabled: refreshing,
          className: "mt-5 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx(RefreshCcw, { size: 15, className: refreshing ? "animate-spin" : "" }),
            "Analyse my business now"
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "text-center py-20 bg-surface rounded-2xl border border-line", children: [
    /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 28 }) }),
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: "Nothing needs your attention" }),
    /* @__PURE__ */ jsxs("p", { className: "text-ink-muted mt-1 text-sm max-w-md mx-auto", children: [
      "No customers slipping, no stock about to run out, no margin or cash problems found.",
      engineStatus?.customers > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        " Last checked ",
        engineStatus.customers.toLocaleString(),
        " customers and ",
        engineStatus.products?.toLocaleString(),
        " products."
      ] })
    ] }),
    maturity?.stage === "learning" && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-3 max-w-md mx-auto", children: maturity.detail })
  ] });
}
function DetailPanel({ rec, detail, cur, busy, onClose, onAct, onDismiss, onSnooze, onWhatsApp }) {
  const meta = BRAIN_META[rec.brain] || BRAIN_META.customer;
  const Icon = meta.icon;
  const evidence = detail?.recommendation?.evidence || rec.evidence || {};
  const track = detail?.track_record;
  const orders = detail?.context?.recent_orders || [];
  const canWhatsApp = rec.action_type === "whatsapp" || rec.action_type === "send_reminder";
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex justify-end", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-neutral-900/40 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-lg h-full bg-surface shadow-2xl overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-10 bg-surface border-b border-line px-6 py-4 flex items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-2xl border ${TONE[meta.tone]}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-2xs uppercase tracking-wider font-bold text-ink-muted", children: [
            rec.brain_label,
            " · ",
            rec.type_label
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink leading-tight", children: rec.title })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1.5 rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 space-y-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[14px] leading-relaxed text-ink-secondary", children: rec.message }),
        rec.action_hint && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 px-4 py-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs uppercase tracking-wider font-bold text-brand-500 mb-0.5", children: "What to do" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-brand-900 dark:text-brand-200", children: rec.action_hint })
        ] }),
        Number(rec.potential_revenue) > 0 && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider font-bold text-emerald-600", children: "At stake" }),
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-emerald-700 dark:text-emerald-300", children: [
              cur,
              " ",
              money(rec.potential_revenue)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-app border border-line px-4 py-3", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider font-bold text-ink-muted", children: "Confidence" }),
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-ink-secondary dark:text-ink", children: [
              Math.round(rec.confidence),
              "%"
            ] })
          ] })
        ] }),
        Object.keys(evidence).length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs uppercase tracking-wider font-bold text-ink-muted mb-2", children: "Why we're telling you this" }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-line divide-y divide-line", children: Object.entries(evidence).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 px-4 py-2.5", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[13px] text-ink-muted", children: k }),
            /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold text-ink text-right", children: String(v) })
          ] }, k)) })
        ] }),
        orders.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs uppercase tracking-wider font-bold text-ink-muted mb-2", children: "Their recent orders" }),
          /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-line divide-y divide-line max-h-56 overflow-y-auto", children: orders.map((o, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 px-4 py-2.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[13px] font-medium text-ink-secondary truncate", children: o.reference }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-ink-muted", children: o.date ? new Date(o.date).toLocaleDateString() : "—" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-[13px] font-semibold text-ink", children: [
              cur,
              " ",
              money(o.amount)
            ] })
          ] }, i)) })
        ] }),
        track && track.gradeable && track.precision != null && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-app border border-line px-4 py-3", children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs uppercase tracking-wider font-bold text-ink-muted mb-1", children: "This kind of insight, for you" }),
          /* @__PURE__ */ jsxs("p", { className: "text-[13px] text-ink-secondary", children: [
            "Correct ",
            /* @__PURE__ */ jsxs("strong", { children: [
              track.precision,
              "%"
            ] }),
            " of the time across ",
            track.graded,
            " checked prediction",
            track.graded === 1 ? "" : "s",
            ". You've acted on ",
            track.acted,
            " of ",
            track.generated,
            "."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sticky bottom-0 bg-surface border-t border-line px-6 py-4 space-y-2", children: [
        canWhatsApp && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onWhatsApp,
            disabled: busy,
            className: "w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2",
            children: [
              /* @__PURE__ */ jsx(MessageCircle, { size: 16 }),
              " Message on WhatsApp"
            ]
          }
        ),
        rec.action_url && /* @__PURE__ */ jsxs(
          "a",
          {
            href: rec.action_url,
            className: "w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 flex items-center justify-center gap-2",
            children: [
              "Open in the system ",
              /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: onAct,
              disabled: busy,
              className: "flex-1 py-2.5 rounded-xl border border-line text-ink-secondary font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 15 }),
                " Done"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => onSnooze(7),
              disabled: busy,
              className: "flex-1 py-2.5 rounded-xl border border-line text-ink-secondary font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx(Clock, { size: 15 }),
                " Later"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: onDismiss,
              disabled: busy,
              className: "flex-1 py-2.5 rounded-xl border border-line text-ink-muted font-semibold text-sm hover:bg-sunken dark:hover:bg-interactive-hover disabled:opacity-50 flex items-center justify-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx(BellOff, { size: 15 }),
                " Not useful"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function ScorecardPanel({ scorecard, cur, trend, engineStatus, onClose }) {
  const m = scorecard?.maturity;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex justify-end", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-neutral-900/40 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-xl h-full bg-surface shadow-2xl overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 z-10 bg-surface border-b border-line px-6 py-4 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { size: 20, className: "text-brand-500" }),
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink flex-1", children: "How accurate is the Growth Engine?" }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1.5 rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-muted", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 space-y-6", children: [
        m && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-900 dark:text-brand-200", children: m.label }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-brand-500", children: [
              m.progress,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-2 rounded-full bg-brand-100 dark:bg-brand-950 overflow-hidden mb-2", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-brand-500 rounded-full transition-all", style: { width: `${m.progress}%` } }) }),
          /* @__PURE__ */ jsx("p", { className: "text-[13px] text-brand-800 dark:text-brand-300 leading-relaxed", children: m.detail })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsx(MiniStat, { label: "Insights given", value: scorecard?.total_generated ?? 0 }),
          /* @__PURE__ */ jsx(MiniStat, { label: "Checked", value: scorecard?.total_graded ?? 0 }),
          /* @__PURE__ */ jsx(MiniStat, { label: "Correct", value: scorecard?.overall_precision != null ? `${scorecard.overall_precision}%` : "—" })
        ] }),
        scorecard?.realised_value > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-1xs uppercase tracking-wider font-bold text-emerald-600", children: "Value recovered because you acted" }),
          /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1", children: [
            cur,
            " ",
            money(scorecard.realised_value)
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[12px] text-emerald-700/70 dark:text-emerald-400/70 mt-1", children: "Counted only where you marked an insight as done and the result was verified afterwards." })
        ] }),
        (scorecard?.brains || []).map((b) => {
          const meta = BRAIN_META[b.brain] || BRAIN_META.customer;
          const Icon = meta.icon;
          if (!b.generated) return null;
          return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-line overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-4 py-3 bg-app", children: [
              /* @__PURE__ */ jsx("div", { className: `p-2 rounded-xl border ${TONE[meta.tone]}`, children: /* @__PURE__ */ jsx(Icon, { size: 15 }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-ink", children: b.label }),
                /* @__PURE__ */ jsxs("p", { className: "text-1xs text-ink-muted", children: [
                  b.generated,
                  " insight",
                  b.generated === 1 ? "" : "s",
                  " · ",
                  b.acted,
                  " acted on",
                  b.precision != null && ` · ${b.precision}% correct`
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "divide-y divide-line", children: b.types.slice(0, 6).map((t) => /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-[13px] font-medium text-ink-secondary truncate", children: [
                  t.label,
                  t.muted && /* @__PURE__ */ jsx("span", { className: "ml-2 text-2xs px-1.5 py-0.5 rounded bg-sunken text-ink-muted uppercase font-bold", children: "Muted" })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-1xs text-ink-muted", children: [
                  t.generated,
                  " shown · ",
                  t.acted,
                  " acted",
                  t.sensitivity !== 1 && ` · sensitivity ${t.sensitivity.toFixed(2)}×`
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: `text-[13px] font-bold shrink-0 ${t.precision == null ? "text-neutral-300" : t.precision >= 70 ? "text-emerald-600" : t.precision >= 45 ? "text-amber-600" : "text-red-500"}`, children: t.precision != null ? `${t.precision}%` : t.gradeable ? "—" : "n/a" })
            ] }, t.type)) })
          ] }, b.brain);
        }),
        /* @__PURE__ */ jsxs("p", { className: "text-[12px] text-ink-muted leading-relaxed", children: [
          `Only predictions can be scored. Observations — like "this stock hasn't sold in 90 days" — are facts rather than forecasts, so they are marked `,
          /* @__PURE__ */ jsx("em", { children: "n/a" }),
          " and excluded from the accuracy figures rather than inflating them."
        ] }),
        engineStatus?.last_run_at && /* @__PURE__ */ jsxs("p", { className: "text-[12px] text-ink-muted", children: [
          "Last analysed ",
          new Date(engineStatus.last_run_at).toLocaleString(),
          engineStatus.duration_ms ? ` in ${(engineStatus.duration_ms / 1e3).toFixed(1)}s` : "",
          "."
        ] })
      ] })
    ] })
  ] });
}
function MiniStat({ label, value }) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-2xl bg-app border border-line px-3 py-3 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-wider font-bold text-ink-muted", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink mt-0.5", children: value })
  ] });
}
export {
  GrowthDashboard as default
};
