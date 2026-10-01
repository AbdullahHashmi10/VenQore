import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { Calendar, Plus, Lock, CheckCircle2, ShieldAlert, FileText, Unlock, FileDown, RefreshCw, AlertTriangle } from "lucide-react";
import { a as formatNumber } from "./format-Dor_DYzH.js";
import "react-dom";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-B_UmKR56.js";
import "./terms-BnWz3Igl.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function FiscalYears({ auth, fiscal_years = [], active_lock = null, active_exceptions = [], retained_accounts = [] }) {
  const [selectedFy, setSelectedFy] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  useForm({
    name: "",
    start_date: "",
    end_date: "",
    retained_earnings_account_id: retained_accounts[0]?.id || "",
    notes: ""
  });
  const closeForm = useForm({
    fiscal_year_id: "",
    approved_by: auth?.user?.id || "",
    approval_pin: "",
    preview_hash: "",
    override_reason: ""
  });
  useForm({
    approved_by: auth?.user?.id || "",
    approval_pin: "",
    reopen_reason: ""
  });
  useForm({
    fiscal_year_id: "",
    lock_type: "soft",
    locked_through_date: "",
    reason: ""
  });
  useForm({
    period_lock_id: active_lock?.id || "",
    user_id: "",
    scope: "user",
    valid_from: (/* @__PURE__ */ new Date()).toISOString().slice(0, 16),
    expires_at: new Date(Date.now() + 24 * 3600 * 1e3).toISOString().slice(0, 16),
    reason: ""
  });
  const fetchPreview = async (fy) => {
    setSelectedFy(fy);
    setLoadingPreview(true);
    try {
      const res = await fetch(route("store.v3.fiscal-year.preview", { store_slug: route().params.store_slug, id: fy.id }));
      const data = await res.json();
      setPreviewData(data);
      closeForm.setData({
        fiscal_year_id: fy.id,
        approved_by: auth?.user?.id || "",
        approval_pin: "",
        preview_hash: data.preview_hash,
        override_reason: ""
      });
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  };
  const downloadReport = (fyId) => {
    window.open(route("store.v3.fiscal-year.report", { store_slug: route().params.store_slug, id: fyId }), "_blank");
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "closed":
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300", children: "Closed" });
      case "open":
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300", children: "Open" });
      case "reopened":
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300", children: "Reopened" });
      case "closing":
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300", children: "Closing" });
      default:
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300", children: "Draft" });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Fiscal Years & Period Locks" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-7 h-7 text-indigo-600" }),
            "Fiscal Years & Accounting Period Control"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Manage financial reporting boundaries, period locking, pre-close checklists, and controlled reopen history." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowCreateModal(true),
              className: "inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4 mr-2" }),
                "New Fiscal Year"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowLockModal(true),
              className: "inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors",
              children: [
                /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 mr-2" }),
                "Set Period Lock"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-50 text-indigo-600 rounded-lg", children: /* @__PURE__ */ jsx(Lock, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Active Period Lock" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 mt-1", children: active_lock ? `Locked through ${active_lock.locked_through_date}` : "No Active Lock" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: active_lock ? `Lock Type: ${active_lock.lock_type.toUpperCase()} (${active_lock.reason})` : "All dates open for posting" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-50 text-emerald-600 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Total Fiscal Years" }),
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-gray-900 mt-1", children: [
              fiscal_years.length,
              " Defined Period(s)"
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
              fiscal_years.filter((f) => f.status === "closed").length,
              " Closed, ",
              fiscal_years.filter((f) => f.status === "open").length,
              " Open"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-amber-50 text-amber-600 rounded-lg", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider", children: "Active Exceptions" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowExceptionModal(true),
                  className: "text-xs text-indigo-600 hover:text-indigo-800 font-medium",
                  children: "+ Grant"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-gray-900 mt-1", children: [
              active_exceptions.length,
              " Temporary Exemption(s)"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: active_exceptions.length > 0 ? "Permitted posting inside locked range" : "Strict lock enforcement active" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "px-6 py-4 border-b border-gray-200 flex justify-between items-center", children: /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-gray-900", children: "Fiscal Years Catalogue" }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-gray-600", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Fiscal Year Name" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Start Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "End Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3", children: "Version" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: fiscal_years.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-8 text-center text-gray-400", children: 'No fiscal year records created yet. Click "New Fiscal Year" to setup your first period.' }) }) : fiscal_years.map((fy) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-semibold text-gray-900", children: fy.name }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: fy.start_date }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: fy.end_date }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: getStatusBadge(fy.status) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-xs font-mono", children: [
              "v",
              fy.close_version || 1
            ] }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-right space-x-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => fetchPreview(fy),
                  className: "inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(FileText, { className: "w-3.5 h-3.5 mr-1" }),
                    "Preview & Checklist"
                  ]
                }
              ),
              fy.status !== "closed" && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    fetchPreview(fy);
                    setShowCloseModal(true);
                  },
                  className: "inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 mr-1" }),
                    "Close Year"
                  ]
                }
              ),
              fy.status === "closed" && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setSelectedFy(fy);
                      setShowReopenModal(true);
                    },
                    className: "inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Unlock, { className: "w-3.5 h-3.5 mr-1" }),
                      "Reopen"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => downloadReport(fy.id),
                    className: "inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(FileDown, { className: "w-3.5 h-3.5 mr-1" }),
                      "Close Certificate"
                    ]
                  }
                )
              ] })
            ] })
          ] }, fy.id)) })
        ] }) })
      ] }),
      selectedFy && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-gray-200 pb-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-gray-900", children: [
              "Pre-Close Readiness Checklist & P&L Preview — ",
              selectedFy.name
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
              "Period: ",
              selectedFy.start_date,
              " to ",
              selectedFy.end_date
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => fetchPreview(selectedFy),
              className: "inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium",
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 mr-1 ${loadingPreview ? "animate-spin" : ""}` }),
                "Refresh Calculation"
              ]
            }
          )
        ] }),
        loadingPreview ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-gray-400", children: "Loading readiness metrics..." }) : previewData ? /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg border border-gray-200", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 font-medium", children: "Total Income" }),
              /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-gray-900 mt-1", children: [
                "Rs. ",
                previewData.financial_summary.total_income.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg border border-gray-200", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 font-medium", children: "Total Expenses" }),
              /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-gray-900 mt-1", children: [
                "Rs. ",
                previewData.financial_summary.total_expense.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 p-4 rounded-lg border border-indigo-200", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-indigo-700 font-medium", children: "Net Profit / (Loss)" }),
              /* @__PURE__ */ jsxs("p", { className: `text-lg font-bold mt-1 ${previewData.financial_summary.net_profit >= 0 ? "text-emerald-700" : "text-rose-700"}`, children: [
                "Rs. ",
                previewData.financial_summary.net_profit.toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg border border-gray-200", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 font-medium", children: "Retained Earnings Account" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm font-bold text-gray-900 mt-1", children: [
                "[",
                previewData.financial_summary.retained_account.code,
                "] ",
                previewData.financial_summary.retained_account.name
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-800", children: "Readiness Controls" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: previewData.checks.map((chk, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs", children: [
              chk.status === "pass" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-600 shrink-0 mt-0.5" }) : chk.severity === "blocking" ? /* @__PURE__ */ jsx(ShieldAlert, { className: "w-5 h-5 text-rose-600 shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900", children: chk.label }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-500 mt-0.5", children: chk.measured_value })
              ] })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-800", children: "Proposed Retained Earnings Transfer Journal Lines" }),
            /* @__PURE__ */ jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 rounded-lg", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left text-gray-600", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-gray-100 font-semibold text-gray-700 sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Code" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2", children: "Account Name" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Debit" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right", children: "Credit" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-200", children: previewData.proposed_journal_lines.map((line, idx) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-mono", children: line.account_code }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2 font-medium", children: line.account_name }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right", children: line.debit > 0 ? formatNumber(line.debit) : "-" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-2 text-right", children: line.credit > 0 ? formatNumber(line.credit) : "-" })
              ] }, idx)) })
            ] }) })
          ] })
        ] }) : null
      ] })
    ] })
  ] });
}
export {
  FiscalYears as default
};
