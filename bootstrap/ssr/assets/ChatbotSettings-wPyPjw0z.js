import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { Check, RefreshCw, Save, Key, EyeOff, Eye, AlertCircle, Wallet, ArrowUpRight, ArrowDownLeft, Cpu, Coins } from "lucide-react";
import { S as SectionHeader } from "./SectionHeader-CQ5Hn4MY.js";
import axios from "axios";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ChatbotSettings({ settings, context, usageStats }) {
  const { store } = usePage().props;
  const isPlatform = context === "platform" || !store;
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const formatCost = (cost) => {
    if (!cost || cost === 0) return "$0.00";
    if (cost < 0.01) return `$${Number(cost).toFixed(6)}`;
    return `$${Number(cost).toFixed(2)}`;
  };
  const { data, setData, processing } = useForm({
    chatbot_api_key: settings.chatbot_api_key || "",
    chatbot_custom_rules: settings.chatbot_custom_rules || ""
  });
  const submitRoute = isPlatform ? route("platform.chatbot.settings.update") : route("store.admin.chatbot.settings.update", { store_slug: store?.slug });
  const testRoute = isPlatform ? route("platform.ai.test") : route("store.admin.chatbot.ai.test", { store_slug: store?.slug });
  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(submitRoute, data, {
      preserveScroll: true,
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3e3);
      }
    });
  };
  const handleTestConnection = async () => {
    if (!data.chatbot_api_key) {
      setTestResult({ success: false, message: "Please enter an API key first." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const response = await axios.post(testRoute, {
        api_key: data.chatbot_api_key,
        provider: "gemini",
        model: "gemini-2.5-flash"
      });
      if (response.data.success) {
        setTestResult({ success: true, message: "Connection verified successfully!" });
      } else {
        setTestResult({ success: false, message: response.data.message || "Verification failed." });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to verify key. Please check your credentials.";
      setTestResult({ success: false, message: errMsg });
    } finally {
      setTesting(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Chatbot Settings", activeMenu: "Chatbot Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Chatbot Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex gap-6 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-[2] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col h-full relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xs font-black uppercase tracking-[0.2em] rounded-full", children: isPlatform ? "VenQore Support Bot" : "Store Assistant Config" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-slate-900 dark:text-white tracking-tight", children: "Chatbot Settings" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-base text-slate-500 font-medium", children: isPlatform ? "Configure Vena — VenQore's company-wide support assistant for platform visitors." : "Configure your store's AI assistant that talks to your customers." })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center gap-3 text-white", children: saved ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { size: 20, strokeWidth: 3, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { children: "Settings Saved" })
                  ] }) : processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(RefreshCw, { size: 20, className: "animate-spin text-indigo-300" }),
                    /* @__PURE__ */ jsx("span", { children: "Saving..." })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Save, { size: 20, className: "group-hover:scale-110 transition-transform" }),
                    /* @__PURE__ */ jsx("span", { children: "Save Settings" })
                  ] }) })
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-10 custom-scrollbar", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 p-8 rounded-3xl", children: [
              /* @__PURE__ */ jsx(
                SectionHeader,
                {
                  title: "AI Integration",
                  description: "Enter your API key to power the chatbot. We default to Google Gemini."
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300", children: "Gemini API Key" }),
                  data.chatbot_api_key && data.chatbot_api_key === settings.chatbot_api_key && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm animate-in fade-in duration-200", children: [
                    /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
                    "Connected"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: showKey ? "text" : "password",
                        value: data.chatbot_api_key,
                        onChange: (e) => setData("chatbot_api_key", e.target.value),
                        className: "w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200",
                        placeholder: "AI API Key (Google Cloud Console)"
                      }
                    ),
                    /* @__PURE__ */ jsx(Key, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setShowKey(!showKey),
                        className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors",
                        children: showKey ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: handleTestConnection,
                      disabled: testing,
                      className: "px-6 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2 border border-slate-800 shadow",
                      children: testing ? /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: "animate-spin text-slate-300" }) : /* @__PURE__ */ jsx("span", { children: "Test Key" })
                    }
                  )
                ] }),
                testResult && /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border flex items-start gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200 ${testResult.success ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"}`, children: [
                  testResult.success ? /* @__PURE__ */ jsx(Check, { size: 16, className: "text-emerald-500 mt-0.5 shrink-0" }) : /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-rose-500 mt-0.5 shrink-0" }),
                  /* @__PURE__ */ jsx("span", { children: testResult.message })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 p-8 rounded-3xl", children: [
              /* @__PURE__ */ jsx(
                SectionHeader,
                {
                  title: "Chatbot Personalization Rules",
                  description: isPlatform ? "Write instructions for how Vena should represent VenQore and handle support queries." : "Write instructions, store policies, or specific information for your store's assistant to follow."
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300", children: "Store Custom Rules & Context" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: data.chatbot_custom_rules,
                    onChange: (e) => setData("chatbot_custom_rules", e.target.value),
                    className: "w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans",
                    rows: 8,
                    placeholder: "Example:\n- Our return window is 7 days with receipt.\n- We are located in Lahore and ship nationwide.\n- For wholesale inquiries, contact sales@mybusiness.com.\n- Never offer discount matches manually."
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "These rules are injected directly into the AI's core logic. Be clear and specific." })
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-96 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 flex flex-col overflow-hidden relative shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl", children: /* @__PURE__ */ jsx(Wallet, { size: 20 }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-900 dark:text-white tracking-tight", children: "Usage & Billing" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider", children: [
              "Cycle: ",
              usageStats?.billing_cycle || "Current Month"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8 p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-indigo-500/10 transition-all duration-300", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500", children: "Estimated Cost" }),
            /* @__PURE__ */ jsx("div", { className: "text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 select-all", children: formatCost(usageStats?.estimated_cost) }),
            /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400 dark:text-slate-500 font-medium block mt-2", children: "Gemini Flash pay-as-you-go rate" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-8 flex-1 overflow-y-auto custom-scrollbar", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2", children: "Token Metrics" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 16 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-700 dark:text-slate-300 block", children: "Input Tokens" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400", children: "Prompts & Context" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-900 dark:text-white", children: usageStats?.input_tokens?.toLocaleString() || "0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 16 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-700 dark:text-slate-300 block", children: "Output Tokens" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400", children: "AI Responses" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-900 dark:text-white", children: usageStats?.output_tokens?.toLocaleString() || "0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 rounded-2xl hover:scale-[1.02] transition-transform duration-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Cpu, { size: 16 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-700 dark:text-slate-300 block", children: "Total Tokens" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400", children: "Total Volume" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-slate-900 dark:text-white", children: usageStats?.total_tokens?.toLocaleString() || "0" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 pt-6", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4", children: "Models Active" }),
            usageStats?.models && Object.keys(usageStats.models).length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-3", children: Object.entries(usageStats.models).map(([model, count]) => /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 font-mono", children: [
                /* @__PURE__ */ jsx("span", { className: "text-2xs truncate max-w-[180px]", children: model }),
                /* @__PURE__ */ jsxs("span", { className: "text-2xs text-slate-400", children: [
                  count.toLocaleString(),
                  " tkn"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full",
                  style: {
                    width: `${usageStats.total_tokens > 0 ? Math.min(100, Math.round(count / usageStats.total_tokens * 100)) : 0}%`
                  }
                }
              ) })
            ] }, model)) }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl", children: [
              /* @__PURE__ */ jsx(Coins, { size: 24, className: "text-slate-300 dark:text-slate-600 mb-2 animate-pulse" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: "No usage logs found" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            ` })
  ] });
}
export {
  ChatbotSettings as default
};
