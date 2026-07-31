import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import { router } from "@inertiajs/react";
import { ServerCrash, Clock, AlertTriangle, ShieldAlert, RefreshCw, ArrowLeft, Home } from "lucide-react";
const ERROR_CONFIGS = {
  403: {
    icon: ShieldAlert,
    color: "amber",
    title: "Access Denied",
    subtitle: "Permission Required"
  },
  404: {
    icon: AlertTriangle,
    color: "blue",
    title: "Page Not Found",
    subtitle: "Route Missing"
  },
  419: {
    icon: Clock,
    color: "orange",
    title: "Session Expired",
    subtitle: "CSRF Token Mismatch"
  },
  500: {
    icon: ServerCrash,
    color: "red",
    title: "Server Error",
    subtitle: "Internal Error"
  }
};
const COLOR_CLASSES = {
  red: { bg: "bg-red-50 dark:bg-red-900/10", icon: "text-red-500", border: "border-red-100 dark:border-red-800", bar: "from-red-500 to-rose-600", badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/10", icon: "text-amber-500", border: "border-amber-100 dark:border-amber-800", bar: "from-amber-500 to-orange-500", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  blue: { bg: "bg-blue-50 dark:bg-blue-900/10", icon: "text-blue-500", border: "border-blue-100 dark:border-blue-800", bar: "from-blue-500 to-indigo-500", badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  orange: { bg: "bg-orange-50 dark:bg-orange-900/10", icon: "text-orange-500", border: "border-orange-100 dark:border-orange-800", bar: "from-orange-500 to-amber-500", badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" }
};
function Error({ status = 500, message }) {
  const config = ERROR_CONFIGS[status] || ERROR_CONFIGS[500];
  const colors = COLOR_CLASSES[config.color];
  const Icon = config.icon;
  const handleReload = () => window.location.reload();
  const handleHome = () => router.visit("/");
  const handleBack = () => window.history.back();
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-lg w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: `bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border ${colors.border} overflow-hidden`, children: [
      /* @__PURE__ */ jsx("div", { className: `h-1.5 bg-gradient-to-r ${colors.bar}` }),
      /* @__PURE__ */ jsxs("div", { className: "p-10 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: `w-20 h-20 ${colors.bg} rounded-2xl flex items-center justify-center mx-auto mb-6`, children: /* @__PURE__ */ jsx(Icon, { size: 40, className: colors.icon }) }),
        /* @__PURE__ */ jsxs("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${colors.badge} mb-4`, children: [
          "ERROR ",
          status,
          " · ",
          config.subtitle
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight", children: config.title }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-base mb-8 max-w-sm mx-auto leading-relaxed", children: message || "An unexpected error occurred. Your data is safe." }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: status === 419 ? (
          /* For CSRF/session expired — reload is the correct fix */
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleReload,
              className: "flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 18 }),
                "Refresh Page"
              ]
            }
          )
        ) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleBack,
              className: "flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }),
                "Go Back"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleHome,
              className: "flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 hover:scale-105 active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Home, { size: 18 }),
                "Dashboard"
              ]
            }
          )
        ] }) }),
        status === 500 && /* @__PURE__ */ jsx("p", { className: "mt-6 text-xs text-slate-400 dark:text-slate-600 font-mono", children: "This error has been automatically reported to our team." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center mt-4 text-[11px] text-slate-400 dark:text-slate-600 font-mono", children: [
      "REF · ",
      Date.now().toString(36).toUpperCase()
    ] })
  ] }) });
}
export {
  Error as default
};
