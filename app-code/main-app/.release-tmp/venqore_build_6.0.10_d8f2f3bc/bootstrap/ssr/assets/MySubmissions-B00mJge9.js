import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import { Send, FileText, Eye, XCircle, RotateCcw, CheckCircle, Clock } from "lucide-react";
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
function MySubmissions({ documents = { data: [] }, filters = {} }) {
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
  const docs = Array.isArray(documents) ? documents : documents.data || [];
  const handleFilter = (status) => {
    setSelectedStatus(status);
    router.get(window.location.pathname, { status: status || void 0 }, { preserveState: true });
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-3.5 h-3.5" }),
          " Pending"
        ] });
      case "approved":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-3.5 h-3.5" }),
          " Approved"
        ] });
      case "returned":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800", children: [
          /* @__PURE__ */ jsx(RotateCcw, { className: "w-3.5 h-3.5" }),
          " Returned for Correction"
        ] });
      case "rejected":
        return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800", children: [
          /* @__PURE__ */ jsx(XCircle, { className: "w-3.5 h-3.5" }),
          " Rejected"
        ] });
      default:
        return /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800", children: status });
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "My Approval Submissions" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Send, { className: "w-7 h-7 text-indigo-600" }),
          "My Submissions (Maker)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Track the status of transactions you have submitted for manager review and approval." })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter(""),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${!selectedStatus ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "All Statuses"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("pending"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === "pending" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Pending Review"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("returned"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === "returned" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Returned for Correction"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("approved"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === "approved" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Approved"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleFilter("rejected"),
            className: `px-3 py-1.5 text-xs font-semibold rounded-full transition ${selectedStatus === "rejected" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`,
            children: "Rejected"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm text-gray-600", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Document #" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Submitted Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-3.5 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-gray-100", children: docs.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: "6", className: "text-center py-12 text-gray-400", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-10 h-10 mx-auto mb-2 text-gray-300" }),
          "No submitted documents found."
        ] }) }) : docs.map((doc) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50/75 transition", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-mono font-medium text-gray-900", children: doc.document_number }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("span", { className: "capitalize px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md", children: doc.document_type?.replace(/_/g, " ") }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-xs text-gray-500", children: new Date(doc.created_at).toLocaleString() }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-semibold text-gray-900", children: formatCurrency(doc.amount) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: getStatusBadge(doc.status) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.approvals.show", { store_slug: window.location.pathname.split("/")[2], id: doc.id }),
              className: "inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition",
              children: [
                /* @__PURE__ */ jsx(Eye, { className: "w-3.5 h-3.5" }),
                "View"
              ]
            }
          ) })
        ] }, doc.id)) })
      ] }) })
    ] })
  ] });
}
export {
  MySubmissions as default
};
