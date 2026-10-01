import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import axios from "axios";
import { Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import "react-dom";
import "lucide-react";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
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
const title = (key) => key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
function Correct({ document }) {
  const initialStructured = useMemo(() => Object.fromEntries(
    Object.entries(document.payload || {}).filter(([, value]) => value !== null && typeof value === "object")
  ), [document.payload]);
  const [payload, setPayload] = useState(document.payload || {});
  const [structured, setStructured] = useState(Object.fromEntries(
    Object.entries(initialStructured).map(([key, value]) => [key, JSON.stringify(value, null, 2)])
  ));
  const [amount, setAmount] = useState(document.amount || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const nextPayload = { ...payload };
    try {
      Object.entries(structured).forEach(([key, value]) => {
        nextPayload[key] = JSON.parse(value);
      });
    } catch (parseError) {
      setError("One of the line-item sections is not valid. Check commas, brackets and values.");
      return;
    }
    setBusy(true);
    try {
      await axios.post(document.resubmit_url, {
        payload: nextPayload,
        amount: Number(amount),
        notes,
        expected_version: document.version
      });
      router.visit(document.show_url);
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(" ") : requestError.response?.data?.message || "Unable to resubmit this document.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Correct approval request", children: [
    /* @__PURE__ */ jsx(Head, { title: `Correct ${document.document_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl space-y-5 p-4 sm:p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 p-5", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-gray-900", children: [
          "Correct and resubmit ",
          document.document_number
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-600", children: title(document.document_type) }),
        document.return_notes && /* @__PURE__ */ jsxs("p", { className: "mt-3 text-sm text-amber-900", children: [
          /* @__PURE__ */ jsx("strong", { children: "Reviewer note:" }),
          " ",
          document.return_notes
        ] }),
        document.return_reason_codes?.length > 0 && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-amber-800", children: [
          "Reasons: ",
          document.return_reason_codes.join(", ")
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700", children: "Approval amount" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: "0.01", step: "0.01", value: amount, onChange: (e) => setAmount(e.target.value), className: "mt-1 w-full rounded-lg border-gray-300", required: true })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: Object.entries(payload).filter(([, value]) => value === null || typeof value !== "object").map(([key, value]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700", children: title(key) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: typeof value === "number" ? "number" : key.includes("date") ? "date" : "text",
              step: typeof value === "number" ? "any" : void 0,
              value: value ?? "",
              onChange: (e) => setPayload((current) => ({ ...current, [key]: typeof value === "number" ? Number(e.target.value) : e.target.value })),
              className: "mt-1 w-full rounded-lg border-gray-300"
            }
          )
        ] }, key)) }),
        Object.entries(structured).map(([key, value]) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700", children: title(key) }),
          /* @__PURE__ */ jsx("p", { className: "mb-1 text-xs text-gray-500", children: "Edit the line details carefully. The system will validate them before resubmission." }),
          /* @__PURE__ */ jsx("textarea", { value, onChange: (e) => setStructured((current) => ({ ...current, [key]: e.target.value })), rows: Math.min(18, Math.max(6, value.split("\n").length + 1)), className: "w-full rounded-lg border-gray-300 font-mono text-sm" })
        ] }, key)),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-700", children: "What you corrected" }),
          /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: "3", maxLength: "1000", className: "mt-1 w-full rounded-lg border-gray-300" })
        ] }),
        error && /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-red-50 p-3 text-sm text-red-700", children: error }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => router.visit(document.show_url), className: "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, className: "rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50", children: busy ? "Resubmitting…" : "Resubmit for approval" })
        ] })
      ] })
    ] })
  ] });
}
export {
  Correct as default
};
