import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-B_nL-Bzp.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-C3Zz64cZ.js";
import { P as PremiumSelect } from "./PremiumSelect-CyM9VGV1.js";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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
function ChequeBookCreate({ bankAccounts = [] }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const { data, setData, post, processing, errors } = useForm({
    bank_account_id: bankAccounts.length === 1 ? bankAccounts[0].id : "",
    series_prefix: "",
    start_number: "",
    end_number: "",
    padding_zeros: "6",
    description: ""
  });
  const totalLeaves = useMemo(() => {
    const start = parseInt(data.start_number, 10);
    const end = parseInt(data.end_number, 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return end - start + 1;
    }
    return 0;
  }, [data.start_number, data.end_number]);
  const previewSerials = useMemo(() => {
    const start = parseInt(data.start_number, 10);
    const end = parseInt(data.end_number, 10);
    const pad = parseInt(data.padding_zeros, 10) || 6;
    const prefix = data.series_prefix ? data.series_prefix.trim().toUpperCase() + "-" : "";
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const first = prefix + String(start).padStart(pad, "0");
      const last = prefix + String(end).padStart(pad, "0");
      return { first, last };
    }
    return null;
  }, [data.start_number, data.end_number, data.series_prefix, data.padding_zeros]);
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.banking.cheque-books.store", { store_slug: storeSlug }));
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Register Chequebook", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Register Chequebook" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "cheque-books", className: "!mb-0" }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.banking.cheque-books.index", { store_slug: storeSlug }),
            className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 })
          }
        ),
        /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight", children: [
          "Register ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Chequebook" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface p-4 sm:p-6", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "max-w-4xl mx-auto space-y-6", children: [
        errors.error && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: "Unable to register chequebook" }),
            /* @__PURE__ */ jsx("p", { children: errors.error })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: [
              "Bank Account ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              PremiumSelect,
              {
                value: data.bank_account_id,
                onChange: (val) => setData("bank_account_id", val),
                options: [
                  { value: "", label: "-- Select Bank Account --" },
                  ...bankAccounts.map((b) => ({
                    value: String(b.id),
                    label: `${b.name} (${b.bank_name}) ${b.account_number ? `— #${b.account_number}` : ""}`
                  }))
                ],
                placeholder: "-- Select Bank Account --",
                inputClassName: `!rounded-2xl !py-3 !px-4 !bg-neutral-50/70 dark:!bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 ${errors.bank_account_id ? "!border-red-500" : "!border-neutral-200 dark:!border-neutral-700"}`
              }
            ),
            errors.bank_account_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.bank_account_id })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: [
              "Series Prefix ",
              /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-neutral-400", children: "(Optional)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "E.G. CHK, HBL",
                value: data.series_prefix,
                onChange: (e) => setData("series_prefix", e.target.value.toUpperCase()),
                maxLength: 10,
                className: "w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 py-3 px-4 text-sm uppercase bg-neutral-50/70 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-1.5", children: "Leading letters printed on the cheque leaves." })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: "Display Digit Length (Padding)" }),
            /* @__PURE__ */ jsx(
              PremiumSelect,
              {
                value: data.padding_zeros,
                onChange: (val) => setData("padding_zeros", val),
                options: [
                  { value: "4", label: "4 Digits (e.g. 0001)" },
                  { value: "6", label: "6 Digits (e.g. 000001) - Standard" },
                  { value: "8", label: "8 Digits (e.g. 00000001)" },
                  { value: "10", label: "10 Digits (e.g. 0000000001)" }
                ],
                placeholder: "Select digit length",
                inputClassName: "!rounded-2xl !py-3 !px-4 !bg-neutral-50/70 dark:!bg-neutral-900/50 !border-neutral-200 dark:!border-neutral-700 text-neutral-900 dark:text-neutral-100"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: [
              "Starting Serial Number ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                placeholder: "e.g. 1001",
                min: "0",
                value: data.start_number,
                onChange: (e) => setData("start_number", e.target.value),
                className: `w-full rounded-2xl border py-3 px-4 text-sm font-mono bg-neutral-50/70 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 ${errors.start_number ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"}`,
                required: true
              }
            ),
            errors.start_number && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.start_number })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: [
              "Ending Serial Number ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                placeholder: "e.g. 1050",
                min: "0",
                value: data.end_number,
                onChange: (e) => setData("end_number", e.target.value),
                className: `w-full rounded-2xl border py-3 px-4 text-sm font-mono bg-neutral-50/70 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100 ${errors.end_number ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"}`,
                required: true
              }
            ),
            errors.end_number && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.end_number })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-2", children: [
              "Notes / Purpose ",
              /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-neutral-400", children: "(Optional)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "e.g. Operational expense chequebook issued Sept 2026",
                value: data.description,
                onChange: (e) => setData("description", e.target.value),
                className: "w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 py-3 px-4 text-sm bg-neutral-50/70 dark:bg-neutral-900/50 text-neutral-900 dark:text-neutral-100"
              }
            )
          ] })
        ] }),
        previewSerials && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/40", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-brand-600" }),
              "Range Preview (",
              totalLeaves,
              " leaves)"
            ] }),
            totalLeaves > 500 && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-600 font-bold", children: "Exceeds maximum limit of 500 leaves per book!" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "font-mono text-base font-bold text-brand-900 dark:text-brand-200", children: [
            previewSerials.first,
            "  ➔  ",
            previewSerials.last
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-brand-600 dark:text-brand-400 mt-1", children: "Every cheque leaf in this range will be generated and tracked individually." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-700/60", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.banking.cheque-books.index", { store_slug: storeSlug }),
              className: "text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing || totalLeaves <= 0 || totalLeaves > 500,
              className: "px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-full shadow-sm transition-colors",
              children: processing ? "Registering..." : `Register Chequebook (${totalLeaves} Leaves)`
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ChequeBookCreate as default
};
