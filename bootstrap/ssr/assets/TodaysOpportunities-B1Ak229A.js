import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, MessageCircle, Package, Eye, X, ChevronRight, Wallet, AlertTriangle, Users } from "lucide-react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
const TodaysOpportunities = ({ className = "" }) => {
  const { store } = usePage().props;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchData = async (refresh = false) => {
    setLoading(true);
    if (!route().has("store.growth-engine.dashboard")) {
      setLoading(false);
      return;
    }
    try {
      if (refresh) {
        await axios.post(route("store.growth-engine.refresh", { store_slug: store.slug }));
      }
      const response = await axios.get(route("store.growth-engine.dashboard", { store_slug: store.slug }));
      setData(response.data);
      setError(null);
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }
      setError("Failed to load opportunities.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1e3);
    return () => clearInterval(interval);
  }, []);
  const dismissTip = async (id) => {
    try {
      await axios.post(route("store.growth-engine.dismiss", [store.slug, id]));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };
  const openWhatsApp = async (id) => {
    try {
      const response = await axios.get(route("store.growth-engine.whatsapp", [store.slug, id]));
      if (response.data.url) {
        window.open(response.data.url, "_blank");
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (loading && !data) {
    return /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" }),
      /* @__PURE__ */ jsx("div", { className: "h-20 bg-slate-200 dark:bg-slate-700 rounded" })
    ] }) });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-red-200 dark:border-red-800 shadow-sm text-center text-red-500", children: [
      error,
      /* @__PURE__ */ jsx("button", { onClick: fetchData, className: "ml-2 text-indigo-500 hover:underline", children: "Retry" })
    ] });
  }
  const stats = data?.stats || {};
  const recommendations = data?.recommendations || [];
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "retention":
        return /* @__PURE__ */ jsx(Users, { className: "text-emerald-500", size: 18 });
      case "forecast":
        return /* @__PURE__ */ jsx(Package, { className: "text-orange-500", size: 18 });
      case "churn":
        return /* @__PURE__ */ jsx(AlertTriangle, { className: "text-red-500", size: 18 });
      case "recovery":
        return /* @__PURE__ */ jsx(Wallet, { className: "text-amber-500", size: 18 });
      default:
        return /* @__PURE__ */ jsx(TrendingUp, { className: "text-indigo-500", size: 18 });
    }
  };
  const getTypeLabel = (type) => {
    switch (type) {
      case "retention":
        return "Sales Opportunity";
      case "forecast":
        return "Stock Risk";
      case "churn":
        return "Churn Risk";
      case "recovery":
        return "Recovery";
      default:
        return "Tip";
    }
  };
  if (data?.forbidden) {
    return null;
  }
  if (!data) {
    return null;
  }
  return /* @__PURE__ */ jsxs("div", { className: `bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full ${className}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-white/5 dark:to-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25", children: /* @__PURE__ */ jsx(TrendingUp, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white text-lg", children: "Today's Opportunities" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "AI-powered insights to grow your business" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency(data.total_potential_revenue || 0, store) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Potential Revenue" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => fetchData(true),
            className: "p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 text-slate-500 transition-all",
            disabled: loading,
            title: "Run AI Analysis",
            children: /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: loading ? "animate-spin" : "" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 grid grid-cols-4 gap-4 border-b border-slate-100 dark:border-white/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-600 dark:text-emerald-400", children: stats.customers_due || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-700 dark:text-emerald-300 font-medium", children: "Customers Due" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-orange-600 dark:text-orange-400", children: stats.stock_risks || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-orange-700 dark:text-orange-300 font-medium", children: "Stock Risks" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-red-600 dark:text-red-400", children: stats.churn_risks || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-700 dark:text-red-300 font-medium", children: "At Risk" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-amber-600 dark:text-amber-400", children: stats.overdue_invoices || 0 }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 dark:text-amber-300 font-medium", children: "Overdue" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar", children: recommendations.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center text-slate-400", children: [
      /* @__PURE__ */ jsx(TrendingUp, { size: 48, className: "mx-auto mb-4 opacity-30" }),
      /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No opportunities right now!" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Check back later or run the AI analysis." })
    ] }) : recommendations.slice(0, 10).map((rec) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group",
        children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full mt-2 ${getPriorityColor(rec.priority)}` }),
          /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0", children: getTypeIcon(rec.type) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-slate-400", children: getTypeLabel(rec.type) }),
              rec.priority === "urgent" && /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded", children: "URGENT" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white text-sm", children: rec.title }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1 line-clamp-2", children: rec.message }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              rec.action_type === "whatsapp" && rec.party && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => openWhatsApp(rec.id),
                  className: "flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(MessageCircle, { size: 12 }),
                    "WhatsApp"
                  ]
                }
              ),
              rec.action_url && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: rec.action_url,
                  className: `flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${rec.action_type === "purchase_order" ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-500 hover:bg-indigo-600"}`,
                  children: [
                    rec.action_type === "purchase_order" ? /* @__PURE__ */ jsx(Package, { size: 12 }) : /* @__PURE__ */ jsx(Eye, { size: 12 }),
                    rec.action_type === "purchase_order" ? "Order Stock" : "View"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => dismissTip(rec.id),
                  className: "flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(X, { size: 12 }),
                    "Dismiss"
                  ]
                }
              )
            ] })
          ] }),
          rec.potential_revenue > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-indigo-600 dark:text-indigo-400", children: formatCurrency(rec.potential_revenue || 0, store) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: "Potential" })
          ] })
        ] })
      },
      rec.id
    )) }),
    recommendations.length > 10 && /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-100 dark:border-slate-800 text-center", children: /* @__PURE__ */ jsxs(
      "a",
      {
        href: route("store.growth-engine.index", { store_slug: store.slug }),
        className: "text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center justify-center gap-1",
        children: [
          "View All ",
          recommendations.length,
          " Opportunities",
          /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
        ]
      }
    ) })
  ] });
};
export {
  TodaysOpportunities as T
};
