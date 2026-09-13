import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, router } from "@inertiajs/react";
import axios from "axios";
import { Database, AlertTriangle, Upload, ArrowRight, Loader2, RefreshCw, Check } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
function Migration() {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [importLog, setImportLog] = useState([]);
  const [progress, setProgress] = useState(0);
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  const handleAnalyze = () => {
    if (!file) return;
    setStep("analyzing");
    const formData = new FormData();
    formData.append("file", file);
    axios.post(route("store.legacy.admin.migration.analyze", { store_slug: store.slug }), formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((res) => {
      if (res.data.success) {
        setAnalysis(res.data);
        setStep("review");
      } else {
        setError(res.data.message);
        setStep("upload");
      }
    }).catch((err) => {
      setError(err.response?.data?.message || "Failed to analyze file.");
      setStep("upload");
    });
  };
  const handleExecute = () => {
    if (!analysis) return;
    setStep("importing");
    axios.post(route("store.legacy.admin.migration.execute", { store_slug: store.slug }), {
      path: analysis.path
    }).then((res) => {
      if (res.data.success) {
        setImportLog(res.data.log);
        setStep("results");
      } else {
        setError(res.data.message);
        setStep("review");
      }
    }).catch((err) => {
      setError(err.response?.data?.message || "Import failed.");
      setStep("review");
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Import from External System", children: [
    /* @__PURE__ */ jsx(Head, { title: "Migration Tool" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto py-8 px-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl mb-4", children: /* @__PURE__ */ jsx(Database, { size: 32 }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-ink mb-2", children: "System Migration Tool" }),
        /* @__PURE__ */ jsxs("p", { className: "text-ink-muted max-w-lg mx-auto", children: [
          "Seamlessly import your data from Vyapar backups (.vyp).",
          tt("We'll analyze your file and map Customers, Items, and Stock automatically.")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${step === "upload" ? "opacity-100" : "opacity-50"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === "upload" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "1" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Upload" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-sunken mx-2" }),
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${["analyzing", "review", "importing", "results"].includes(step) ? "opacity-100" : "opacity-50"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${["review", "importing", "results"].includes(step) ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "2" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Review" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-sunken mx-2" }),
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${step === "results" ? "opacity-100" : "opacity-50"}`, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === "results" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "3" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Done" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-xl overflow-hidden min-h-[400px] relative", children: [
        error && /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center animate-in slide-in-from-top", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "mr-2" }),
          error
        ] }),
        step === "upload" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 border-2 border-dashed border-line dark:border-line rounded-2xl hover:border-brand-500 transition-colors bg-app", children: [
            /* @__PURE__ */ jsx(Upload, { size: 48, className: "mx-auto text-ink-muted mb-4" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-2", children: "Drop your .vyp file here" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mb-6", children: "Found in AppData/Roaming/Vyaparapp/DBUpdateBackup" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: ".vyp,.db,.sqlite",
                onChange: handleFileChange,
                className: "block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 mb-4"
              }
            ),
            file && /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-mono text-sm inline-block", children: [
              file.name,
              " (",
              (file.size / 1024 / 1024).toFixed(2),
              " MB)"
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              disabled: !file,
              onClick: handleAnalyze,
              className: "mt-8 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg transition-transform disabled:opacity-50 flex items-center gap-2",
              children: [
                "Analyze File ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          )
        ] }),
        step === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 48, className: "animate-spin text-brand-600 mb-4" }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Scanning Database..." }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: "Identifying Parties, Items, and transaction history." })
        ] }),
        step === "review" && analysis && /* @__PURE__ */ jsxs("div", { className: "p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-brand-700 dark:text-brand-400 mb-1", children: "Parties" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: analysis.analysis.potential_parties })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1", children: "Items" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: analysis.analysis.potential_items })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-blue-700 dark:text-blue-400 mb-1", children: "Sales" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: analysis.analysis.potential_sales })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-brand-700 dark:text-brand-400 mb-1", children: "Purchases" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: analysis.analysis.potential_purchases })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl mb-8 flex-1 overflow-y-auto", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-xs uppercase tracking-wider text-ink-muted mb-3", children: "Raw Table Data Detected" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: Object.entries(analysis.tables).map(([name, count]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs p-2 bg-sunken rounded border border-line dark:border-line", children: [
              /* @__PURE__ */ jsx("span", { className: "font-mono text-ink-secondary truncate max-w-[120px]", title: name, children: name }),
              /* @__PURE__ */ jsx("span", { className: "font-bold bg-sunken px-1.5 rounded", children: count })
            ] }, name)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center mt-auto", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleExecute,
                className: "w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg transition-transform flex items-center justify-center gap-3",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 20 }),
                  "Start Migration Process"
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-3", children: "This action will merge data into your existing system. No existing data will be overwritten." })
          ] })
        ] }),
        step === "importing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping" }),
            /* @__PURE__ */ jsx(RefreshCw, { size: 64, className: "animate-spin text-brand-600 relative z-10" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl mb-2", children: "Importing Data..." }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted max-w-sm", children: "Please wait while we transfer your accounts and inventory. Do not close this window." })
        ] }),
        step === "results" && /* @__PURE__ */ jsxs("div", { className: "p-12 h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Check, { size: 40, strokeWidth: 4 }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-3xl mb-4 text-ink", children: "Migration Successful!" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted mb-8 max-w-md", children: tt("Your external data has been successfully imported. You can now view your new customers and products in the system.") }),
          /* @__PURE__ */ jsx("div", { className: "bg-app p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-48 overflow-y-auto", children: importLog.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-ink-secondary py-1 border-b border-line last:border-0 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Check, { size: 12, className: "text-green-500" }),
            " ",
            log
          ] }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.parties.index", {
              store_slug: store.slug
            })), className: "px-6 py-2.5 bg-sunken text-ink-secondary hover:bg-interactive-hover rounded-xl font-bold transition-colors", children: "View Parties" }),
            /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.inventory.index", {
              store_slug: store.slug
            })), className: "px-6 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-bold shadow-lg transition-colors", children: tt("View Products") })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Migration as default
};
