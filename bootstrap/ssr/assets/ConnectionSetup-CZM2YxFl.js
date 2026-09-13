import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import axios from "axios";
import { ChevronRight, Sparkles, Download, Globe, Zap, HelpCircle, Loader2, ExternalLink, RefreshCw, Check, ArrowRight, AlertCircle, CheckCircle, Copy } from "lucide-react";
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
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function ConnectionSetup({
  connection,
  plain_token,
  setup_token,
  webhook_url,
  store_slug,
  plugin_download_url
}) {
  const [status, setStatus] = useState(connection.status);
  const [siteUrl, setSiteUrl] = useState(connection.site_url);
  const [isPolling, setIsPolling] = useState(connection.status === "pending");
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [checking, setChecking] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(null);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editingUrlVal, setEditingUrlVal] = useState(connection.site_url || "");
  const [savingUrl, setSavingUrl] = useState(false);
  const saveUrl = () => {
    if (savingUrl) return;
    let formattedUrl = editingUrlVal.trim();
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }
    setSavingUrl(true);
    axios.put(route("store.woo.connections.settings", { store_slug, connection: connection.id }), {
      site_url: formattedUrl
    }).then(() => {
      setSiteUrl(formattedUrl);
      setEditingUrlVal(formattedUrl);
      setIsEditingUrl(false);
    }).catch((err) => {
      console.error("Failed to save WordPress URL", err);
      alert("Failed to update URL. Please check that it is a valid web address.");
    }).finally(() => {
      setSavingUrl(false);
    });
  };
  useEffect(() => {
    if (status !== "pending") {
      setIsPolling(false);
      return;
    }
    const interval = setInterval(() => {
      axios.get(route("store.woo.connections.status-json", { store_slug, connection: connection.id })).then((res) => {
        if (res.data.status === "active") {
          setStatus("active");
          setSiteUrl(res.data.site_url);
          setIsPolling(false);
          clearInterval(interval);
          const timer = setTimeout(() => {
            window.location.href = route("store.woo.connections.sync", { store_slug, connection: connection.id });
          }, 3500);
          setRedirectTimer(timer);
        }
      }).catch((err) => {
        console.error("Handshake polling failed:", err);
      });
    }, 3e3);
    return () => {
      clearInterval(interval);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [status, store_slug, connection.id]);
  const checkStatusManually = () => {
    if (checking) return;
    setChecking(true);
    axios.get(route("store.woo.connections.status-json", { store_slug, connection: connection.id })).then((res) => {
      if (res.data.status === "active") {
        setStatus("active");
        setSiteUrl(res.data.site_url);
        setIsPolling(false);
        setTimeout(() => {
          window.location.href = route("store.woo.connections.sync", { store_slug, connection: connection.id });
        }, 2500);
      }
    }).catch((err) => {
      console.error("Manual check failed:", err);
    }).finally(() => {
      setChecking(false);
    });
  };
  const copyToken = () => {
    navigator.clipboard.writeText(plain_token ?? "");
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2e3);
  };
  const copyApiUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2e3);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "WooCommerce Setup", activeMenu: "Marketing", children: [
    /* @__PURE__ */ jsx(Head, { title: `Setup WooCommerce Integration — VenQore` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto space-y-6 px-4 sm:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.woo.connections.index", { store_slug }), className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 transition-colors text-sm font-medium", children: "← Back to Connections" }),
          /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-neutral-300 dark:text-ink-secondary" }),
          /* @__PURE__ */ jsxs("span", { className: "text-ink-muted text-sm", children: [
            "Store: ",
            /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary dark:text-white font-semibold", children: connection.name })
          ] })
        ] }),
        status === "pending" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" }),
          "Waiting for Handshake"
        ] })
      ] }),
      status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface dark:backdrop-blur-xl border border-line rounded-2xl p-6 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "text-violet-500 w-5 h-5 animate-pulse" }),
              /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink", children: "Zero-Configuration Setup" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-ink-secondary text-sm leading-relaxed mb-6", children: [
              "Setting up WooCommerce is now entirely automated. We've custom-baked a WordPress plugin tailored uniquely for ",
              /* @__PURE__ */ jsx("strong", { children: connection.name }),
              ". Download, activate, and your store connects securely in real-time."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[2px] before:bg-sunken dark:before:bg-neutral-800/60", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex gap-5 items-start group", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/50 flex items-center justify-center font-bold text-violet-600 dark:text-violet-400 text-base z-10 shadow-sm transition-transform", children: /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-semibold text-ink text-sm", children: "Download your Custom Plugin" }),
                    /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-xs mt-0.5", children: "Contains pre-configured security handshakes and credentials baked directly inside." })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: plugin_download_url,
                      className: "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-700 hover:to-brand-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md",
                      children: [
                        /* @__PURE__ */ jsx(Download, { size: 14 }),
                        "Download venqore-sync.zip"
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative flex gap-5 items-start group", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-app border border-line flex items-center justify-center font-bold text-ink-secondary text-base z-10 shadow-sm transition-transform", children: /* @__PURE__ */ jsx(Globe, { className: "w-5 h-5" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-semibold text-ink text-sm", children: "Install & Activate on WordPress" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-ink-muted text-xs leading-relaxed", children: [
                    "Go to your WordPress Admin Dashboard, click ",
                    /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary", children: "Plugins → Add New → Upload Plugin" }),
                    ", choose the downloaded ZIP, and click ",
                    /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary", children: "Activate" }),
                    "."
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative flex gap-5 items-start group", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-app border border-line flex items-center justify-center font-bold text-ink-secondary text-base z-10 shadow-sm transition-transform", children: /* @__PURE__ */ jsx(Zap, { className: "w-5 h-5 animate-pulse text-amber-500" }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-semibold text-ink text-sm", children: "Watch the connection happen" }),
                  /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-xs mt-0.5 leading-relaxed", children: "Once active, the plugin securely reaches back to VenQore, generates API keys, sets up hooks, and validates the connection instantly." })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-between items-center px-2", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowManual(!showManual),
              className: "text-xs font-semibold text-ink-muted hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                showManual ? "Hide manual connection details" : "Trouble connecting? Setup manually"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-5", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-b from-neutral-900 to-neutral-950 dark:from-neutral-950 dark:to-black text-white rounded-2xl p-8 text-center relative overflow-hidden border border-neutral-800 dark:border-line shadow-xl shadow-neutral-900/10 flex flex-col justify-between min-h-[480px] gap-6", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,58,237,0.12),transparent_60%)] pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-2 relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-medium tracking-wide", children: "AUTOMATED HANDSHAKE" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-neutral-100", children: "Connecting to WooCommerce" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted max-w-[280px] mx-auto", children: "Ensure your WordPress site is public and online. We are listening for the secure handshake payload." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center my-2 h-24 z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute w-24 h-24 rounded-full border border-violet-500/20 bg-violet-500/5 animate-ping opacity-60" }),
            /* @__PURE__ */ jsx("div", { className: "absolute w-16 h-16 rounded-full border border-violet-500/30 bg-violet-500/10 animate-pulse" }),
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-brand-600 text-white flex items-center justify-center shadow-lg relative z-20", children: /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin text-white" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 relative z-10 mb-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-4 space-y-3 text-left", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "WordPress Site URL" }),
                !isEditingUrl && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setIsEditingUrl(true),
                    className: "text-2xs text-violet-400 hover:text-violet-300 font-semibold",
                    children: "Edit URL"
                  }
                )
              ] }),
              isEditingUrl ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: editingUrlVal,
                    onChange: (e) => setEditingUrlVal(e.target.value),
                    placeholder: "https://my-wordpress-store.com",
                    className: "w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setIsEditingUrl(false);
                        setEditingUrlVal(siteUrl || "");
                      },
                      className: "px-2.5 py-1 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 rounded-lg text-2xs font-medium border border-neutral-700/30",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: saveUrl,
                      disabled: savingUrl,
                      className: "px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-2xs font-semibold disabled:opacity-50",
                      children: savingUrl ? "Saving..." : "Save"
                    }
                  )
                ] })
              ] }) : siteUrl ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-mono text-neutral-300 break-all bg-neutral-950/40 p-2 rounded-lg border border-neutral-800 truncate select-all", title: siteUrl, children: siteUrl }),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: `${siteUrl}/?venqore_debug=${setup_token}&venqore_action=force_handshake`,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-violet-600 to-brand-600 hover:from-violet-500 hover:to-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md",
                    children: [
                      /* @__PURE__ */ jsx(Zap, { size: 12, className: "animate-pulse text-amber-300 fill-amber-300" }),
                      "🚀 Launch Remote Handshake",
                      /* @__PURE__ */ jsx(ExternalLink, { size: 10 })
                    ]
                  }
                )
              ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Not provided. Add site URL to enable remote handshake execution." }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setIsEditingUrl(true),
                    className: "w-full py-1.5 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 border border-neutral-700/50 rounded-xl text-xs font-semibold",
                    children: "+ Add Website URL"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-ink-muted", children: "STATUS" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold tracking-wide text-amber-400", children: "WAITING FOR CONNECTION" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: checkStatusManually,
                disabled: checking,
                className: "inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-faint border border-neutral-800 hover:border-line-strong bg-sunken/60 px-4 py-2 rounded-xl transition-all disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 12, className: checking ? "animate-spin text-violet-500" : "" }),
                  checking ? "Checking Status..." : "Force Connection Check"
                ]
              }
            )
          ] })
        ] }) })
      ] }) : (
        /* Beautiful Glassmorphic Success Screen */
        /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto py-8", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface dark:backdrop-blur-xl border border-emerald-100 dark:border-emerald-950/60 rounded-2xl p-8 md:p-12 text-center shadow-xl relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.08),transparent_60%)] pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mx-auto shadow-md animate-bounce", children: /* @__PURE__ */ jsx(Check, { className: "text-emerald-500 w-10 h-10 stroke-[3px]" }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "inline-flex px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold tracking-wide", children: "CONNECTION SUCCESSFUL" }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold text-ink", children: "Store Successfully Synced! 🎉" }),
              /* @__PURE__ */ jsxs("p", { className: "text-ink-muted text-sm max-w-lg mx-auto leading-relaxed", children: [
                "Secure handshake completed with WooCommerce at ",
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink-secondary dark:text-ink", children: siteUrl }),
                ". VenQore has automatically initiated the initial product import."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "py-2.5 max-w-sm mx-auto bg-app rounded-2xl border border-line flex items-center justify-center gap-3", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin text-emerald-500" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-secondary font-medium", children: "Redirecting to operations control..." })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.woo.connections.sync", { store_slug, connection: connection.id }),
                className: "inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md",
                children: [
                  /* @__PURE__ */ jsx(Zap, { size: 15 }),
                  "Access Control Panel",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
                ]
              }
            ) })
          ] })
        ] }) })
      ),
      showManual && /* @__PURE__ */ jsxs("div", { className: "border border-line bg-surface rounded-2xl p-6 shadow-sm animate-slide-up space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-ink text-sm", children: "Manual Setup Protocol" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-xs mt-0.5", children: "If firewall rules or local network configurations prevent the automated handshake, you can configure the plugin manually." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "VenQore Host URL" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-app rounded-xl p-3 border border-line", children: [
              /* @__PURE__ */ jsx("code", { className: "text-xs font-mono text-ink-secondary flex-1 truncate", children: window.location.origin }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: copyApiUrl,
                  className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
                  title: "Copy URL",
                  children: copiedUrl ? /* @__PURE__ */ jsx(CheckCircle, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { size: 14 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Authentication Token" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-app rounded-xl p-3 border border-line", children: [
              /* @__PURE__ */ jsx("code", { className: "text-xs font-mono text-ink-secondary flex-1 truncate", children: plain_token ?? "(token expired - recreate connection)" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: copyToken,
                  className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
                  title: "Copy Token",
                  children: copiedToken ? /* @__PURE__ */ jsx(CheckCircle, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(Copy, { size: 14 })
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl text-xs text-ink-muted leading-relaxed border border-line", children: [
          /* @__PURE__ */ jsx("strong", { children: "How to use manual credentials:" }),
          " Open your WordPress Dashboard, navigate to ",
          /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary", children: "VenQore Sync" }),
          ", scroll to the bottom, paste the Host URL and the Authentication Token, and click ",
          /* @__PURE__ */ jsx("strong", { className: "text-ink-secondary", children: "Save & Connect" }),
          "."
        ] })
      ] })
    ] })
  ] });
}
export {
  ConnectionSetup as default
};
