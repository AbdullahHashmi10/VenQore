import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import { usePage, router } from "@inertiajs/react";
import { ServerCrash, Clock, AlertTriangle, ShieldAlert, Lock, RefreshCw, ArrowLeft, Home } from "lucide-react";
const ERROR_CONFIGS = {
  403: {
    icon: ShieldAlert,
    color: "warning",
    badgeText: "403 · RESTRICTED ACCESS",
    title: "Access Denied",
    defaultMessage: "You do not have the required permissions to view or perform actions on this section. Please contact your store administrator or store owner to request access."
  },
  404: {
    icon: AlertTriangle,
    color: "teal",
    badgeText: "404 · PAGE NOT FOUND",
    title: "Resource Missing",
    defaultMessage: "The page or record you are looking for has been moved, renamed, or is no longer available."
  },
  419: {
    icon: Clock,
    color: "warning",
    badgeText: "419 · SESSION EXPIRED",
    title: "Session Expired",
    defaultMessage: "Your security session has expired due to inactivity. Please refresh the page to continue."
  },
  500: {
    icon: ServerCrash,
    color: "danger",
    badgeText: "500 · SERVER ERROR",
    title: "System Malfunction",
    defaultMessage: "Our systems encountered an unexpected issue. We have been notified and are working on a fix."
  }
};
const COLOR_CLASSES = {
  danger: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    icon: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200/80 dark:border-rose-900/40",
    badge: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200/80 dark:border-amber-900/40",
    badge: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50"
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/20",
    icon: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200/80 dark:border-teal-900/40",
    badge: "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/50"
  }
};
function Error({ status = 500, message }) {
  const pageProps = usePage()?.props || {};
  const store = pageProps.store || {};
  const auth = pageProps.auth || {};
  const config = ERROR_CONFIGS[status] || ERROR_CONFIGS[500];
  const colors = COLOR_CLASSES[config.color] || COLOR_CLASSES.danger;
  const Icon = config.icon;
  const permMatch = message ? message.match(/\(([a-zA-Z0-9_\.\s\-]+)\)/) : null;
  const requiredPerm = permMatch ? permMatch[1] : null;
  const handleReload = () => window.location.reload();
  const handleHome = () => {
    if (store?.slug) {
      router.visit(`/s/${store.slug}/dashboard`);
    } else {
      router.visit("/");
    }
  };
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleHome();
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen w-full flex flex-col items-center justify-center bg-app p-6 antialiased font-sans", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-6", children: [
      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(11,170,143,0.5)]" }),
      /* @__PURE__ */ jsx("span", { className: "font-bold text-lg tracking-tight text-ink", children: "VenQore" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-elev-2 border border-line p-8 md:p-10 text-center transition-all", children: [
      /* @__PURE__ */ jsx("div", { className: `w-16 h-16 ${colors.bg} border ${colors.border} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm`, children: /* @__PURE__ */ jsx(Icon, { size: 32, className: colors.icon }) }),
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-2xs font-bold font-numeric tracking-wider uppercase border ${colors.badge}`, children: config.badgeText }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold font-display text-ink mb-3 tracking-tight", children: config.title }),
      /* @__PURE__ */ jsx("p", { className: "text-ink-secondary text-sm leading-relaxed mb-6", children: message && status !== 500 ? message : config.defaultMessage }),
      status === 403 && requiredPerm && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-3.5 bg-app border border-line rounded-xl text-left flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(Lock, { size: 16, className: "text-ink-muted mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-numeric font-bold tracking-wider text-ink-muted", children: "Security Policy" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-ink font-medium mt-0.5", children: "Required permission key:" }),
          /* @__PURE__ */ jsx("span", { className: "inline-block mt-1.5 px-2 py-0.5 bg-surface border border-line rounded text-2xs font-mono font-semibold text-brand-600 dark:text-brand-400", children: requiredPerm })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: status === 419 ? /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleReload,
          className: "w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-glow active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { size: 16 }),
            "Refresh Page"
          ]
        }
      ) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleBack,
            className: "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface text-ink border border-line rounded-xl font-semibold text-sm hover:bg-interactive-hover transition-all active:scale-[0.98]",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
              "Go Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleHome,
            className: "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-all shadow-glow active:scale-[0.98]",
            children: [
              /* @__PURE__ */ jsx(Home, { size: 16 }),
              "Dashboard"
            ]
          }
        )
      ] }) }),
      auth?.user && /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-2xs text-ink-muted", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Signed in as ",
          /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary", children: auth.user.name })
        ] }),
        auth.user.role && /* @__PURE__ */ jsx("span", { className: "capitalize", children: auth.user.role })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center mt-5 text-3xs font-numeric uppercase tracking-widest text-ink-faint", children: [
      "Error Code: ",
      status,
      " · VenQore V6 Engine"
    ] })
  ] }) });
}
export {
  Error as default
};
