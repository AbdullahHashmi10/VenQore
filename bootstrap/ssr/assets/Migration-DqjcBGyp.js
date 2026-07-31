import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { usePage, Head, router } from "@inertiajs/react";
import axios from "axios";
import { Database, AlertTriangle, Upload, ArrowRight, Loader2, RefreshCw, Check } from "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function Migration() {
  const {
    store
  } = usePage().props;
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
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl mb-4", children: /* @__PURE__ */ jsx(Database, { size: 32 }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white mb-2", children: "System Migration Tool" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 max-w-lg mx-auto", children: "Seamlessly import your data from Vyapar backups (.vyp). We'll analyze your file and map Customers, Items, and Stock automatically." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center mb-12", children: [
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${step === "upload" ? "opacity-100" : "opacity-50"} `, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === "upload" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"} `, children: "1" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Upload" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-slate-200 mx-2" }),
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${["analyzing", "review", "importing", "results"].includes(step) ? "opacity-100" : "opacity-50"} `, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${["review", "importing", "results"].includes(step) ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"} `, children: "2" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Review" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-slate-200 mx-2" }),
        /* @__PURE__ */ jsxs("div", { className: `flex flex - col items - center z - 10 ${step === "results" ? "opacity-100" : "opacity-50"} `, children: [
          /* @__PURE__ */ jsx("div", { className: `w - 8 h - 8 rounded - full flex items - center justify - center font - bold mb - 2 ${step === "results" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"} `, children: "3" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Done" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[400px] relative", children: [
        error && /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center animate-in slide-in-from-top", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "mr-2" }),
          error
        ] }),
        step === "upload" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50", children: [
            /* @__PURE__ */ jsx(Upload, { size: 48, className: "mx-auto text-slate-400 mb-4" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-2", children: "Drop your .vyp file here" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mb-6", children: "Found in AppData/Roaming/Vyaparapp/DBUpdateBackup" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: ".vyp,.db,.sqlite",
                onChange: handleFileChange,
                className: "block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-4"
              }
            ),
            file && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-mono text-sm inline-block", children: [
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
              className: "mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2",
              children: [
                "Analyze File ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
              ]
            }
          )
        ] }),
        step === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
          /* @__PURE__ */ jsx(Loader2, { size: 48, className: "animate-spin text-indigo-600 mb-4" }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Scanning Database..." }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Identifying Parties, Items, and transaction history." })
        ] }),
        step === "review" && analysis && /* @__PURE__ */ jsxs("div", { className: "p-8 h-full flex flex-col animate-in fade-in slide-in-from-right-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-indigo-700 dark:text-indigo-400 mb-1", children: "Parties" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: analysis.analysis.potential_parties })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1", children: "Items" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: analysis.analysis.potential_items })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-blue-700 dark:text-blue-400 mb-1", children: "Sales" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: analysis.analysis.potential_sales })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100 dark:border-purple-800", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-purple-700 dark:text-purple-400 mb-1", children: "Purchases" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-900 dark:text-white", children: analysis.analysis.potential_purchases })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-8 flex-1 overflow-y-auto", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-xs uppercase tracking-wider text-slate-500 mb-3", children: "Raw Table Data Detected" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: Object.entries(analysis.tables).map(([name, count]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-700 rounded border border-slate-100 dark:border-slate-600", children: [
              /* @__PURE__ */ jsx("span", { className: "font-mono text-slate-600 dark:text-slate-300 truncate max-w-[120px]", title: name, children: name }),
              /* @__PURE__ */ jsx("span", { className: "font-bold bg-slate-100 dark:bg-slate-600 px-1.5 rounded", children: count })
            ] }, name)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center mt-auto", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleExecute,
                className: "w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 20 }),
                  "Start Migration Process"
                ]
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-3", children: "This action will merge data into your existing system. No existing data will be overwritten." })
          ] })
        ] }),
        step === "importing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6 relative", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping" }),
            /* @__PURE__ */ jsx(RefreshCw, { size: 64, className: "animate-spin text-indigo-600 relative z-10" })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl mb-2", children: "Importing Data..." }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 max-w-sm", children: "Please wait while we transfer your accounts and inventory. Do not close this window." })
        ] }),
        step === "results" && /* @__PURE__ */ jsxs("div", { className: "p-12 h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Check, { size: 40, strokeWidth: 4 }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-3xl mb-4 text-slate-900 dark:text-white", children: "Migration Successful!" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-8 max-w-md", children: "Your external data has been successfully imported. You can now view your new customers and products in the system." }),
          /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-48 overflow-y-auto", children: importLog.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-slate-600 dark:text-slate-300 py-1 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Check, { size: 12, className: "text-green-500" }),
            " ",
            log
          ] }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.parties.index", {
              store_slug: store.slug
            })), className: "px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors", children: "View Parties" }),
            /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.inventory.index", {
              store_slug: store.slug
            })), className: "px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-colors", children: "View Products" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Migration as default
};
