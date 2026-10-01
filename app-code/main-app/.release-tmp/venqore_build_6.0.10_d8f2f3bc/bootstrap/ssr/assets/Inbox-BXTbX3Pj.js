import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { ShieldCheck, Clock, Eye } from "lucide-react";
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
function ApprovalsInbox({ documents = { data: [] }, filters = {}, stats = {} }) {
  const [selectedType, setSelectedType] = useState(filters.type || "");
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const docs = Array.isArray(documents) ? documents : documents.data || [];
  const handleFilter = (type) => {
    setSelectedType(type);
    router.get(window.location.pathname, { type: type || void 0, search: searchTerm || void 0 }, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Approvals Inbox" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-7 h-7 text-indigo-600" }),
            "Approval Inbox (Reviewer)"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Review and authorize pending transactions across customer receipts, supplier payments, invoices, and expenses." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.approvals.my-submissions", { store_slug: window.location.pathname.split("/")[2] }),
            className: "text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition",
            children: "My Submissions"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => handleFilter(""),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${!selectedType ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: [
              "All Types (",
              docs.length,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("customer_receipt"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === "customer_receipt" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Customer Receipts"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("supplier_payment"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === "supplier_payment" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Supplier Payments"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("sales_invoice"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === "sales_invoice" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Admin Sales Invoices"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("operating_expense"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedType === "operating_expense" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Operating Expenses"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-gray-600", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Document #" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Maker / Submitted" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: docs.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "6", className: "text-center py-12 text-gray-400", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-10 h-10 mx-auto mb-2 text-gray-300" }),
          "No pending documents awaiting your review."
        ] }) }) : docs.map((doc) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/75 transition", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-medium text-gray-900", children: doc.document_number }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "capitalize px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md", children: doc.document_type?.replace(/_/g, " ") }) }),
          /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsx("div", { className: "text-gray-900 font-medium", children: doc.maker?.name || "Staff" }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-400", children: new Date(doc.created_at).toLocaleString() })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-semibold text-gray-900", children: formatCurrency(doc.amount) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
            "Pending Review"
          ] }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.approvals.show", { store_slug: window.location.pathname.split("/")[2], id: doc.id }),
              className: "inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition",
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
                "Review"
              ]
            }
          ) })
        ] }, doc.id)) })
      ] }) })
    ] })
  ] });
}
export {
  ApprovalsInbox as default
};
