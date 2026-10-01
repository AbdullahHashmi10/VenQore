import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { ArrowLeft, RotateCcw, XCircle, CheckCircle, ExternalLink, Edit3, Ban, FileText, Layers, Clock, GitCommit, ArrowRight } from "lucide-react";
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
function CustomerReceiptCard({ payload, amount }) {
  const allocations = payload.allocations || [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Customer ID" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-800 text-sm font-semibold", children: payload.customer_id || "N/A" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Payment Method" }),
        /* @__PURE__ */ jsx("span", { className: "capitalize text-gray-800 text-sm font-semibold", children: payload.payment_method || "Cash" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Receipt Date" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: payload.payment_date || "Today" })
      ] }),
      payload.reference && /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Reference Number" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-800", children: payload.reference })
      ] })
    ] }),
    allocations.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-gray-700 uppercase tracking-wider mb-2", children: "Invoice Allocations" }),
      /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-gray-500 font-semibold border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5", children: "Invoice / Sale ID" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-right", children: "Allocated Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: allocations.map((alloc, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-mono text-gray-800", children: alloc.sale_id }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right font-semibold text-gray-900", children: formatCurrency(alloc.amount) })
        ] }, idx)) })
      ] }) })
    ] })
  ] });
}
function SupplierPaymentCard({ payload, amount }) {
  const allocations = payload.allocations || [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Supplier ID" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-800 text-sm font-semibold", children: payload.supplier_id || "N/A" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Payment Method" }),
        /* @__PURE__ */ jsx("span", { className: "capitalize text-gray-800 text-sm font-semibold", children: payload.payment_method || "Cash" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Payment Date" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: payload.payment_date || "Today" })
      ] }),
      payload.reference && /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Reference" }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-800", children: payload.reference })
      ] })
    ] }),
    allocations.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-gray-700 uppercase tracking-wider mb-2", children: "Bill Allocations" }),
      /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-gray-500 font-semibold border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5", children: "Purchase Bill ID" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-right", children: "Allocated Amount" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: allocations.map((alloc, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-mono text-gray-800", children: alloc.purchase_id }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right font-semibold text-gray-900", children: formatCurrency(alloc.amount) })
        ] }, idx)) })
      ] }) })
    ] })
  ] });
}
function SalesInvoiceCard({ payload }) {
  const items = payload.items || [];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Customer" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: payload.customer_name || payload.party_id || "Walk-in Customer" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Payment Method" }),
        /* @__PURE__ */ jsx("span", { className: "capitalize text-gray-800 text-sm font-semibold", children: payload.payment_method || "Credit" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Subtotal" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: formatCurrency(payload.subtotal || 0) })
      ] }),
      payload.discount_amount > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Discount" }),
        /* @__PURE__ */ jsxs("span", { className: "text-rose-600 font-semibold", children: [
          "-",
          formatCurrency(payload.discount_amount)
        ] })
      ] }),
      payload.tax_amount > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Tax" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-800 font-semibold", children: formatCurrency(payload.tax_amount) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Total Payable" }),
        /* @__PURE__ */ jsx("span", { className: "text-indigo-600 text-sm font-bold", children: formatCurrency(payload.total || 0) })
      ] })
    ] }),
    items.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-gray-700 uppercase tracking-wider mb-2", children: "Line Items" }),
      /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-gray-500 font-semibold border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-center", children: "Qty" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-right", children: "Unit Price" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-2.5 text-right", children: "Total" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 font-medium text-gray-900", children: item.product_name || item.name || item.product_id }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-center text-gray-600", children: item.quantity || item.qty || 1 }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right text-gray-600", children: formatCurrency(item.unit_price || item.price || 0) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-2.5 text-right font-semibold text-gray-900", children: formatCurrency((item.quantity || item.qty || 1) * (item.unit_price || item.price || 0)) })
        ] }, idx)) })
      ] }) })
    ] })
  ] });
}
function OperatingExpenseCard({ payload }) {
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Expense Category" }),
      /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: payload.category_name || payload.expense_category_id || "General Expense" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Expense Date" }),
      /* @__PURE__ */ jsx("span", { className: "text-gray-800 text-sm font-semibold", children: payload.expense_date || payload.date || "Today" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Payment Method" }),
      /* @__PURE__ */ jsx("span", { className: "capitalize text-gray-800 text-sm font-semibold", children: payload.payment_method || "Cash" })
    ] }),
    payload.input_tax > 0 && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Input Tax" }),
      /* @__PURE__ */ jsx("span", { className: "text-gray-800 font-semibold", children: formatCurrency(payload.input_tax) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-gray-400 block font-medium", children: "Description / Reason" }),
      /* @__PURE__ */ jsx("span", { className: "text-gray-800", children: payload.notes || payload.description || "No notes provided." })
    ] })
  ] }) });
}
function RevisionDiffView({ revisions = [] }) {
  if (revisions.length <= 1) {
    return /* @__PURE__ */ jsx("div", { className: "p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center", children: "This document is currently on its initial submission (v1). No previous revisions to compare." });
  }
  const currentRev = revisions[revisions.length - 1];
  const prevRev = revisions[revisions.length - 2];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded-xl", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-amber-700", children: [
        /* @__PURE__ */ jsx(GitCommit, { className: "w-4 h-4" }),
        " Previous (v",
        prevRev.version,
        ")"
      ] }),
      /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-gray-400" }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-indigo-700", children: [
        /* @__PURE__ */ jsx(GitCommit, { className: "w-4 h-4" }),
        " Current (v",
        currentRev.version,
        ")"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-bold text-amber-900", children: [
          "v",
          prevRev.version,
          " by ",
          prevRev.maker?.name || "Maker"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: new Date(prevRev.created_at).toLocaleString() }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold text-gray-900 mt-2", children: [
          "Amount: ",
          formatCurrency(prevRev.amount)
        ] }),
        prevRev.notes && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-700 italic mt-1", children: [
          '"',
          prevRev.notes,
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-bold text-indigo-900", children: [
          "v",
          currentRev.version,
          " by ",
          currentRev.maker?.name || "Maker"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500", children: new Date(currentRev.created_at).toLocaleString() }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-bold text-indigo-900 mt-2", children: [
          "Amount: ",
          formatCurrency(currentRev.amount),
          currentRev.amount !== prevRev.amount && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-normal", children: [
            "Changed (",
            formatCurrency(currentRev.amount - prevRev.amount),
            ")"
          ] })
        ] }),
        currentRev.notes && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-700 italic mt-1", children: [
          '"',
          currentRev.notes,
          '"'
        ] })
      ] })
    ] })
  ] });
}
function ApprovalDetail({
  document = {},
  returnReasons = [],
  canApprove = false,
  isMaker = false,
  canWithdraw = false,
  canResubmit = false
}) {
  const [actionModal, setActionModal] = useState(null);
  const [notes, setNotes] = useState("");
  const [selectedReasonCodes, setSelectedReasonCodes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const currentPayload = document.current_revision?.payload || {};
  const [resubmitAmount, setResubmitAmount] = useState(document.amount || "");
  const [resubmitNotes, setResubmitNotes] = useState("");
  const [editablePayload, setEditablePayload] = useState(currentPayload);
  const storeSlug = window.location.pathname.split("/")[2];
  const getOriginalEditorUrl = () => {
    if (!storeSlug || !document.id) return null;
    return `/s/${storeSlug}/approvals/${document.id}/correct`;
  };
  const handleAction = (action) => {
    setSubmitting(true);
    const url = route(`store.approvals.${action}`, { store_slug: storeSlug, id: document.id });
    let data = {
      version: document.version,
      expected_version: document.version,
      notes,
      reason: notes,
      reason_codes: selectedReasonCodes
    };
    if (action === "resubmit") {
      data = {
        version: document.version,
        expected_version: document.version,
        amount: parseFloat(resubmitAmount),
        payload: { ...editablePayload, amount: parseFloat(resubmitAmount) },
        notes: resubmitNotes || notes
      };
    } else if (action === "withdraw") {
      data = {
        version: document.version,
        expected_version: document.version,
        reason: notes || "Withdrawn by maker."
      };
    }
    router.post(url, data, {
      onFinish: () => {
        setSubmitting(false);
        setActionModal(null);
        setNotes("");
      }
    });
  };
  const renderPayloadCard = () => {
    switch (document.document_type) {
      case "customer_receipt":
        return /* @__PURE__ */ jsx(CustomerReceiptCard, { payload: currentPayload, amount: document.amount });
      case "supplier_payment":
        return /* @__PURE__ */ jsx(SupplierPaymentCard, { payload: currentPayload, amount: document.amount });
      case "sales_invoice":
      case "direct_sale":
      case "pos_sale":
        return /* @__PURE__ */ jsx(SalesInvoiceCard, { payload: currentPayload });
      case "operating_expense":
        return /* @__PURE__ */ jsx(OperatingExpenseCard, { payload: currentPayload });
      default:
        return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-gray-700 uppercase tracking-wider", children: "Transaction Data" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-xs", children: Object.entries(currentPayload).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "truncate", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-400 block capitalize", children: k.replace(/_/g, " ") }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-gray-800", children: typeof v === "object" ? JSON.stringify(v) : String(v) })
          ] }, k)) })
        ] });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Approval #${document.document_number || document.id}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-5xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.approvals.inbox", { store_slug: storeSlug }),
              className: "p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition",
              children: /* @__PURE__ */ jsx(ArrowLeft, { className: "w-5 h-5 text-gray-600" })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: document.document_number }),
              /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase", children: document.document_type?.replace(/_/g, " ") }),
              /* @__PURE__ */ jsxs("span", { className: `px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${document.status === "approved" ? "bg-emerald-100 text-emerald-800" : document.status === "returned" ? "bg-orange-100 text-orange-800" : document.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`, children: [
                document.status,
                " (v",
                document.version,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [
              "Submitted on ",
              new Date(document.created_at).toLocaleString()
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          document.status === "pending" && canApprove && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActionModal("return"),
                className: "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition",
                children: [
                  /* @__PURE__ */ jsx(RotateCcw, { className: "w-4 h-4" }),
                  " Return for Correction"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActionModal("reject"),
                className: "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition",
                children: [
                  /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
                  " Reject"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActionModal("approve"),
                className: "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4" }),
                  " Approve & Post"
                ]
              }
            )
          ] }),
          canResubmit && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            getOriginalEditorUrl() && /* @__PURE__ */ jsxs(
              "a",
              {
                href: getOriginalEditorUrl(),
                className: "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition",
                children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4" }),
                  " Edit in Original Form"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActionModal("resubmit"),
                className: "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition",
                children: [
                  /* @__PURE__ */ jsx(Edit3, { className: "w-4 h-4" }),
                  " Quick Resubmit"
                ]
              }
            )
          ] }),
          canWithdraw && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActionModal("withdraw"),
              className: "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition",
              children: [
                /* @__PURE__ */ jsx(Ban, { className: "w-4 h-4" }),
                " Withdraw"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b border-gray-200", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTab("details"),
            className: `px-4 py-2 text-xs font-bold border-b-2 transition ${activeTab === "details" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
            children: "Document Details"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("diff"),
            className: `px-4 py-2 text-xs font-bold border-b-2 transition ${activeTab === "diff" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
            children: [
              "Revision Comparison (",
              document.revisions?.length || 1,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("audit"),
            className: `px-4 py-2 text-xs font-bold border-b-2 transition ${activeTab === "audit" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`,
            children: [
              "Audit Trail (",
              document.transitions?.length || 0,
              ")"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-6", children: [
          activeTab === "details" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-base font-bold text-gray-900 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-indigo-600" }),
                "Structured Transaction Details"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 block", children: "Total Amount" }),
                /* @__PURE__ */ jsx("span", { className: "text-xl font-extrabold text-gray-900", children: formatCurrency(document.amount) })
              ] })
            ] }),
            renderPayloadCard()
          ] }),
          activeTab === "diff" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-base font-bold text-gray-900 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Layers, { className: "w-5 h-5 text-indigo-600" }),
              "Revision History & Changes"
            ] }),
            /* @__PURE__ */ jsx(RevisionDiffView, { revisions: document.revisions || [] })
          ] }),
          activeTab === "audit" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-base font-bold text-gray-900 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-indigo-600" }),
              "Audit & Transition History"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-4", children: (document.transitions || []).map((t, idx) => /* @__PURE__ */ jsx("div", { className: "flex items-start gap-3 text-sm border-l-2 border-indigo-200 pl-4 py-1", children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "font-semibold text-gray-900", children: [
                t.from_status,
                " → ",
                /* @__PURE__ */ jsx("span", { className: "text-indigo-600 uppercase", children: t.to_status }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-normal text-gray-400 ml-2", children: [
                  "by ",
                  t.actor?.name || "System"
                ] })
              ] }),
              t.notes && /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-xs mt-1", children: t.notes }),
              t.reason_codes?.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex gap-1 mt-1", children: t.reason_codes.map((rc) => /* @__PURE__ */ jsx("span", { className: "text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono", children: rc }, rc)) }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-400 mt-1", children: new Date(t.created_at).toLocaleString() })
            ] }) }, t.id || idx)) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-gray-900", children: "Document Metadata" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-xs", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 block", children: "Maker" }),
              /* @__PURE__ */ jsxs("span", { className: "font-medium text-gray-800", children: [
                document.maker?.name || "Staff",
                " (",
                document.maker?.email,
                ")"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 block", children: "Current Version" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-indigo-600", children: [
                "v",
                document.version
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 block", children: "Idempotency Key" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-gray-800 text-[11px] break-all", children: document.idempotency_key || "None" })
            ] }),
            document.posted_at && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 block", children: "Posted At" }),
              /* @__PURE__ */ jsx("span", { className: "text-emerald-700 font-medium", children: new Date(document.posted_at).toLocaleString() })
            ] })
          ] })
        ] }) })
      ] }),
      actionModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 capitalize", children: actionModal === "resubmit" ? "Correct & Resubmit Document" : actionModal === "withdraw" ? "Withdraw Submission" : `Confirm ${actionModal}` }),
        actionModal === "return" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "block text-xs font-semibold text-gray-700 mb-2", children: "Preset Return Reasons" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-1.5 max-h-40 overflow-y-auto border p-2 rounded-lg", children: (returnReasons || []).map((r) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-xs text-gray-700 cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                value: r.code,
                onChange: (e) => {
                  if (e.target.checked) {
                    setSelectedReasonCodes([...selectedReasonCodes, r.code]);
                  } else {
                    setSelectedReasonCodes(selectedReasonCodes.filter((c) => c !== r.code));
                  }
                },
                className: "rounded border-gray-300 text-indigo-600"
              }
            ),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { className: "font-mono", children: r.code }),
              ": ",
              r.label
            ] })
          ] }, r.code)) })
        ] }),
        actionModal === "resubmit" && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "resubmit-amount-input", className: "block text-xs font-semibold text-gray-700 mb-1", children: "Corrected Total Amount *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                id: "resubmit-amount-input",
                type: "number",
                step: "0.01",
                min: "0.01",
                value: resubmitAmount,
                onChange: (e) => setResubmitAmount(e.target.value),
                className: "w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { htmlFor: "resubmit-notes-input", className: "block text-xs font-semibold text-gray-700 mb-1", children: "Maker Correction Notes" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                id: "resubmit-notes-input",
                value: resubmitNotes,
                onChange: (e) => setResubmitNotes(e.target.value),
                rows: 2,
                placeholder: "Explain what corrections were made...",
                className: "w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              }
            )
          ] })
        ] }),
        actionModal !== "resubmit" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-gray-700 mb-1", children: actionModal === "approve" ? "Reviewer Notes (Optional)" : actionModal === "withdraw" ? "Reason for Withdrawal *" : "Reason / Instructions for Maker *" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              rows: 3,
              placeholder: actionModal === "approve" ? "Optional remarks..." : "Provide details...",
              className: "w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActionModal(null),
              className: "px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleAction(actionModal),
              disabled: submitting || actionModal === "return" && selectedReasonCodes.length === 0,
              className: `px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-sm ${actionModal === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : actionModal === "reject" ? "bg-rose-600 hover:bg-rose-700" : actionModal === "resubmit" ? "bg-indigo-600 hover:bg-indigo-700" : actionModal === "withdraw" ? "bg-gray-700 hover:bg-gray-800" : "bg-orange-600 hover:bg-orange-700"} disabled:opacity-50`,
              children: submitting ? "Processing..." : `Confirm ${actionModal}`
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ApprovalDetail as default
};
