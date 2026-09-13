import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ArrowLeft, User, MapPin, Calendar, DollarSign, Plus, Trash2, Wrench, CheckCircle2 } from "lucide-react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
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
const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "High" },
  { key: "urgent", label: "Urgent" }
];
const emptyLine = () => ({ kind: "service", product_id: "", description: "", quantity: 1, unit_price: 0 });
function CreateServiceJob({ parties = [], services = [], employees = [], tools = [] }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialPartyId = params?.get("party_id") || "";
  const initialTitle = params?.get("title") || "";
  const initialTotal = parseFloat(params?.get("estimated_total") || "0") || 0;
  const initialSite = params?.get("site_address") || "";
  const { data, setData, post, processing, errors } = useForm({
    party_id: initialPartyId,
    title: initialTitle,
    description: params?.get("description") || "",
    site_address: initialSite,
    priority: params?.get("priority") || "normal",
    technician_id: params?.get("technician_id") || "",
    scheduled_for: params?.get("scheduled_for") || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    scheduled_start_at: params?.get("scheduled_start_at") || "",
    scheduled_end_at: params?.get("scheduled_end_at") || "",
    estimated_total: initialTotal,
    lines: [emptyLine()],
    tools: []
    // array of { id, quantity }
  });
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const updateLine = (index, patch) => {
    const lines = data.lines.map((line, i) => i === index ? { ...line, ...patch } : line);
    const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
    setData((prev) => ({
      ...prev,
      lines,
      estimated_total: total
    }));
  };
  const addLine = () => setData("lines", [...data.lines, emptyLine()]);
  const removeLine = (index) => {
    const lines = data.lines.filter((_, i) => i !== index);
    const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
    setData((prev) => ({
      ...prev,
      lines: lines.length > 0 ? lines : [emptyLine()],
      estimated_total: total
    }));
  };
  const handlePickService = (svcId) => {
    setSelectedServiceId(svcId);
    if (!svcId) return;
    const svc = services.find((s) => String(s.id) === String(svcId));
    if (!svc) return;
    const updatedTitle = data.title ? data.title : svc.name;
    const newLine = {
      kind: "service",
      product_id: svc.id,
      description: svc.name,
      quantity: 1,
      unit_price: parseFloat(svc.price) || 0
    };
    const existingLines = data.lines.filter((l) => l.description.trim() !== "");
    const updatedLines = [...existingLines, newLine];
    const total = updatedLines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
    let updatedTools = [...data.tools];
    if (svc.required_tools && Array.isArray(svc.required_tools)) {
      svc.required_tools.forEach((reqTool) => {
        if (!updatedTools.some((t) => t.id === reqTool.id)) {
          updatedTools.push({ id: reqTool.id, quantity: 1, name: reqTool.name });
        }
      });
    }
    setData((prev) => ({
      ...prev,
      title: updatedTitle,
      lines: updatedLines,
      estimated_total: total,
      tools: updatedTools
    }));
  };
  const toggleTool = (tool) => {
    const exists = data.tools.some((t) => t.id === tool.id);
    let updatedTools;
    if (exists) {
      updatedTools = data.tools.filter((t) => t.id !== tool.id);
    } else {
      updatedTools = [...data.tools, { id: tool.id, quantity: 1, name: tool.name }];
    }
    setData("tools", updatedTools);
  };
  const submit = (e) => {
    e.preventDefault();
    post(route("store.service-jobs.store", { store_slug: storeSlug }));
  };
  const inputClass = "w-full rounded-lg border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
  const labelClass = "mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted";
  const subtotal = data.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: tt("New Service Job"), activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: tt("New Service Job & Work Order") }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-4xl px-4 py-6 sm:px-6", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.service-jobs.index", { store_slug: storeSlug }),
          className: "inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
            tt("Back to Work Orders")
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight text-ink", children: tt("Create Service Work Order") }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ink-secondary", children: tt("Define the customer scope, dispatch a technician, and assign required equipment.") })
        ] }),
        services.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold uppercase tracking-wider text-ink-muted", children: "Catalog Preset:" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedServiceId,
              onChange: (e) => handlePickService(e.target.value),
              className: "rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: tt("+ Choose Catalog Service...") }),
                services.map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
                  s.name,
                  " (",
                  formatCurrency(s.price || 0),
                  ")"
                ] }, s.id))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-6 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(User, { size: 16, className: "text-accent-text" }),
            tt("Customer & Order Details")
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: labelClass, children: [
                tt("Customer"),
                " *"
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  required: true,
                  value: data.party_id,
                  onChange: (e) => {
                    setData("party_id", e.target.value);
                    const party = parties.find((p) => String(p.id) === String(e.target.value));
                    if (party?.address && !data.site_address) {
                      setData((prev) => ({ ...prev, party_id: e.target.value, site_address: party.address }));
                    }
                  },
                  className: inputClass,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: tt("Select a customer...") }),
                    parties.map((p) => /* @__PURE__ */ jsxs("option", { value: p.id, children: [
                      p.name,
                      " ",
                      p.phone ? `(${p.phone})` : ""
                    ] }, p.id))
                  ]
                }
              ),
              errors.party_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: errors.party_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: "Priority" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: data.priority,
                  onChange: (e) => setData("priority", e.target.value),
                  className: inputClass,
                  children: PRIORITIES.map((p) => /* @__PURE__ */ jsx("option", { value: p.key, children: p.label }, p.key))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsxs("label", { className: labelClass, children: [
                tt("Job Title / Scope Summary"),
                " *"
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  value: data.title,
                  onChange: (e) => setData("title", e.target.value),
                  placeholder: "e.g. Master Bedroom AC Installation & Duct Inspection",
                  className: inputClass
                }
              ),
              errors.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-rose-500", children: errors.title })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: "Description & Special Instructions" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: data.description,
                  onChange: (e) => setData("description", e.target.value),
                  rows: 3,
                  placeholder: tt("Add any specific instructions, gate codes, or customer requests..."),
                  className: inputClass
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: tt("Site / Service Location Address") }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(MapPin, { size: 15, className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.site_address,
                    onChange: (e) => setData("site_address", e.target.value),
                    placeholder: "Street address for on-site visit...",
                    className: `${inputClass} pl-9`
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 16, className: "text-accent-text" }),
            "Dispatch & Scheduling"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: tt("Assigned Technician") }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.technician_id,
                  onChange: (e) => setData("technician_id", e.target.value),
                  className: inputClass,
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Unassigned Queue" }),
                    employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: "Scheduled Date" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: data.scheduled_for,
                  onChange: (e) => setData("scheduled_for", e.target.value),
                  className: inputClass
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: labelClass, children: "Appointment Start Time" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "time",
                  value: data.scheduled_start_at ? data.scheduled_start_at.split("T")[1]?.substring(0, 5) || "" : "",
                  onChange: (e) => {
                    const time = e.target.value;
                    if (time) {
                      setData("scheduled_start_at", `${data.scheduled_for}T${time}:00`);
                    }
                  },
                  className: inputClass
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "text-accent-text" }),
                "Billable Items & Labor"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: tt("Services, replacement parts, or hourly labor fees.") })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addLine,
                className: "inline-flex items-center gap-1.5 rounded-lg border border-line bg-app px-3 py-1.5 text-xs font-semibold text-accent-text hover:bg-sunken transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  "Add Custom Line"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data.lines.map((line, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 rounded-lg border border-line bg-app p-3", children: [
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: line.kind,
                onChange: (e) => updateLine(i, { kind: e.target.value }),
                className: "h-9 rounded-md border border-line bg-surface px-2.5 text-xs font-semibold text-ink",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "service", children: tt("Service") }),
                  /* @__PURE__ */ jsx("option", { value: "part", children: "Part" }),
                  /* @__PURE__ */ jsx("option", { value: "ad_hoc", children: "Ad hoc" })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: line.description,
                onChange: (e) => updateLine(i, { description: e.target.value }),
                placeholder: tt("Service item / Part description..."),
                className: "h-9 flex-1 min-w-[160px] rounded-md border border-line bg-surface px-3 text-xs text-ink placeholder:text-ink-faint"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Qty" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0.0001",
                  step: "any",
                  value: line.quantity,
                  onChange: (e) => updateLine(i, { quantity: e.target.value }),
                  className: "h-9 w-16 rounded-md border border-line bg-surface px-2 text-center text-xs font-medium text-ink"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted", children: "Rate" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "any",
                  value: line.unit_price,
                  onChange: (e) => updateLine(i, { unit_price: e.target.value }),
                  className: "h-9 w-24 rounded-md border border-line bg-surface px-2 text-right text-xs font-mono font-medium text-ink"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-20 text-right font-mono text-xs font-semibold text-ink", children: formatCurrency((Number(line.quantity) || 0) * (Number(line.unit_price) || 0)) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeLine(i),
                disabled: data.lines.length === 1,
                className: "h-9 w-9 shrink-0 rounded-md text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 disabled:opacity-30",
                children: /* @__PURE__ */ jsx(Trash2, { size: 14, className: "mx-auto" })
              }
            )
          ] }, i)) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between border-t border-line pt-3 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-ink-secondary", children: tt("Estimated Work Order Total") }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-lg font-bold text-ink", children: formatCurrency(subtotal) })
          ] })
        ] }),
        tools.length > 0 && /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-line bg-surface p-5 shadow-sm", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-sm font-semibold text-ink flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx(Wrench, { size: 16, className: "text-accent-text" }),
            "Tool Checkout & Equipment Needed"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mb-4", children: "Check the tools to automatically reserve & checkout for this dispatch." }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3", children: tools.map((tool) => {
            const isChecked = data.tools.some((t) => t.id === tool.id);
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => toggleTool(tool),
                className: `flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-all ${isChecked ? "border-accent bg-accent-quiet/40 text-ink shadow-xs" : "border-line bg-app text-ink-secondary hover:bg-sunken"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 truncate", children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${isChecked ? "bg-accent-fill text-accent-on" : "border border-line bg-surface"}`,
                        children: isChecked ? /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }) : null
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "truncate", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink truncate", children: tool.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted truncate", children: tool.category || "Tool" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-medium uppercase text-ink-muted", children: tool.status })
                ]
              },
              tool.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 pt-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.service-jobs.index", { store_slug: storeSlug }),
              className: "rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover disabled:opacity-60",
              children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                /* @__PURE__ */ jsx("span", { children: tt("Create Work Order") })
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  CreateServiceJob as default
};
