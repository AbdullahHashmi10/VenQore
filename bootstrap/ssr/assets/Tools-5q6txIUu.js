import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Wrench, Plus, CheckCircle2, User, AlertTriangle, Search, Hammer, ShieldAlert, MapPin, RotateCcw, LogOut, Clock, Edit, Trash2, X } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import ServiceNavTabs from "./ServiceNavTabs-C0mnPWx8.js";
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
const STATUS_CONFIG = {
  available: { label: "Available in Shop", bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40", icon: CheckCircle2 },
  with_staff: { label: "Checked Out", bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40", icon: User },
  in_maintenance: { label: "In Maintenance", bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40", icon: AlertTriangle },
  lost: { label: "Lost / Missing", bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40", icon: ShieldAlert },
  retired: { label: "Retired", bg: "bg-sunken text-ink-muted border-line", icon: Hammer }
};
function Tools({ tools, filters = {}, stats = {}, employees = [], categories = [] }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");
  const tt = useTermText();
  const [search, setSearch] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedToolForAction, setSelectedToolForAction] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    status: "available",
    holder_employee_id: "",
    current_location: "Shop / Storeroom",
    maintenance_interval_days: 90,
    last_maintenance_at: "",
    purchase_cost: "",
    notes: ""
  });
  const [checkoutForm, setCheckoutForm] = useState({
    employee_id: "",
    location: "",
    quantity: 1
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    cost: "",
    notes: ""
  });
  const openAddTool = () => {
    setEditingTool(null);
    setForm({
      name: "",
      category: categories[0] || "General Tools",
      description: "",
      status: "available",
      holder_employee_id: "",
      current_location: "Shop / Storeroom",
      maintenance_interval_days: 90,
      last_maintenance_at: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      purchase_cost: "",
      notes: ""
    });
    setIsToolModalOpen(true);
  };
  const openEditTool = (tool) => {
    setEditingTool(tool);
    setForm({
      name: tool.name || "",
      category: tool.category || "",
      description: tool.description || "",
      status: tool.status || "available",
      holder_employee_id: tool.holder_employee_id || "",
      current_location: tool.current_location || "",
      maintenance_interval_days: tool.maintenance_interval_days || 90,
      last_maintenance_at: tool.last_maintenance_at || "",
      purchase_cost: tool.purchase_cost || "",
      notes: tool.notes || ""
    });
    setIsToolModalOpen(true);
  };
  const handleSaveTool = (e) => {
    e.preventDefault();
    if (editingTool) {
      router.put(route("store.tools.update", { store_slug: storeSlug, tool: editingTool.id }), form, {
        onSuccess: () => setIsToolModalOpen(false)
      });
    } else {
      router.post(route("store.tools.store", { store_slug: storeSlug }), form, {
        onSuccess: () => setIsToolModalOpen(false)
      });
    }
  };
  const openCheckout = (tool) => {
    setSelectedToolForAction(tool);
    setCheckoutForm({
      employee_id: tool.holder_employee_id || (employees[0]?.id || ""),
      location: tool.current_location || "Service Van #1",
      quantity: 1
    });
    setIsCheckoutModalOpen(true);
  };
  const handleCheckout = (e) => {
    e.preventDefault();
    if (!selectedToolForAction) return;
    router.post(route("store.tools.checkout", { store_slug: storeSlug, tool: selectedToolForAction.id }), checkoutForm, {
      onSuccess: () => setIsCheckoutModalOpen(false)
    });
  };
  const handleCheckin = (tool) => {
    router.post(route("store.tools.checkin", { store_slug: storeSlug, tool: tool.id }));
  };
  const openMaintenance = (tool) => {
    setSelectedToolForAction(tool);
    setMaintenanceForm({
      maintenance_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      cost: "",
      notes: "Inspected and certified ready for service."
    });
    setIsMaintenanceModalOpen(true);
  };
  const handleLogMaintenance = (e) => {
    e.preventDefault();
    if (!selectedToolForAction) return;
    router.post(route("store.tools.maintenance", { store_slug: storeSlug, tool: selectedToolForAction.id }), maintenanceForm, {
      onSuccess: () => setIsMaintenanceModalOpen(false)
    });
  };
  const handleDeleteTool = (tool) => {
    if (confirm(`Remove "${tool.name}" from tools inventory?`)) {
      router.delete(route("store.tools.destroy", { store_slug: storeSlug, tool: tool.id }));
    }
  };
  const applyFilter = (status) => {
    setSelectedStatus(status);
    router.get(route("store.tools.index", { store_slug: storeSlug }), { search, status }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  const handleSearch = (e) => {
    if (e.key !== "Enter") return;
    router.get(route("store.tools.index", { store_slug: storeSlug }), { search, status: selectedStatus }, {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Tools & Equipment", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Tools & Equipment Management" }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6", children: [
      /* @__PURE__ */ jsx(ServiceNavTabs, { active: "tools" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "p-2 rounded-xl bg-accent-quiet text-accent-text", children: /* @__PURE__ */ jsx(Wrench, { size: 22 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-ink flex items-center gap-2", children: "Tools & Field Equipment" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Track workshop tools, vehicle kits, staff checkouts, and maintenance cadences.") })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: openAddTool,
            className: "inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent-fill px-4 text-xs font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 15 }),
              " Add Tool"
            ]
          }
        ) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-line bg-surface shadow-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted block", children: "Total Equipment" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-ink", children: stats.total ?? 0 }),
            /* @__PURE__ */ jsx(Wrench, { size: 16, className: "text-indigo-500" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-line bg-surface shadow-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider text-emerald-600 block", children: "Available in Shop" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-emerald-600", children: stats.available ?? 0 }),
            /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-500" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-line bg-surface shadow-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider text-blue-600 block", children: tt("Checked Out to Staff") }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-blue-600", children: stats.with_staff ?? 0 }),
            /* @__PURE__ */ jsx(User, { size: 16, className: "text-blue-500" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl border border-line bg-surface shadow-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase tracking-wider text-amber-600 block", children: "Maintenance Due Soon" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-amber-600", children: stats.due_maintenance ?? 0 }),
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-amber-500" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-line", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto custom-scrollbar", children: [
          { key: "all", label: "All Equipment" },
          { key: "available", label: "Available" },
          { key: "with_staff", label: tt("With Staff") },
          { key: "due_maintenance", label: "Maintenance Due (7d)" },
          { key: "in_maintenance", label: "In Repair" }
        ].map((tab) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => applyFilter(tab.key),
            className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${selectedStatus === tab.key ? "bg-indigo-600 text-white" : "bg-sunken text-ink-secondary hover:bg-interactive-hover"}`,
            children: tab.label
          },
          tab.key
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              onKeyDown: handleSearch,
              placeholder: tt("Search tools, staff, category..."),
              className: "w-full pl-9 pr-3 py-1.5 bg-app border border-line rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "rounded-xl border border-line bg-surface overflow-hidden shadow-xs", children: tools.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsx(Wrench, { size: 36, className: "mx-auto text-ink-muted mb-2 opacity-50" }),
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink", children: "No tools found" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Register shop tools or equipment to track field assignments." }),
        /* @__PURE__ */ jsx("button", { onClick: openAddTool, className: "mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold", children: "+ Register Tool" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line text-ink-muted uppercase font-bold text-3xs tracking-wider", children: [
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Tool / Equipment" }),
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Category" }),
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Current Holder / Location" }),
          /* @__PURE__ */ jsx("th", { className: "p-3", children: "Next Maintenance" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: tools.data.map((tool) => {
          const statusObj = STATUS_CONFIG[tool.status] || STATUS_CONFIG.available;
          const StatusIcon = statusObj.icon;
          const isDue = tool.next_maintenance_due_at && new Date(tool.next_maintenance_due_at) <= new Date(Date.now() + 7 * 864e5);
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-sunken/40 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0 border border-line", children: /* @__PURE__ */ jsx(Wrench, { size: 14 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: tool.name }),
                tool.description && /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted line-clamp-1", children: tool.description })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-sunken font-semibold text-3xs text-ink-secondary border border-line", children: tool.category || "General" }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold border ${statusObj.bg}`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { size: 10 }),
              statusObj.label
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: tool.holder ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 font-bold text-ink", children: [
              /* @__PURE__ */ jsx(User, { size: 12, className: "text-blue-500" }),
              /* @__PURE__ */ jsx("span", { children: tool.holder.name })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-ink-muted", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 12 }),
              /* @__PURE__ */ jsx("span", { children: tool.current_location || "Shop / Storeroom" })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: tool.next_maintenance_due_at ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: `font-semibold tabular-nums ${isDue ? "text-amber-600 font-bold" : "text-ink-secondary"}`, children: tool.next_maintenance_due_at }),
              isDue && /* @__PURE__ */ jsx(AlertTriangle, { size: 12, className: "text-amber-500", title: "Maintenance due soon" })
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
              tool.status === "with_staff" ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleCheckin(tool),
                  className: "px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1",
                  title: "Return tool to shop",
                  children: [
                    /* @__PURE__ */ jsx(RotateCcw, { size: 11 }),
                    " Return"
                  ]
                }
              ) : /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => openCheckout(tool),
                  className: "px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded font-bold hover:bg-blue-100 transition-colors flex items-center gap-1",
                  title: "Check out to employee/job",
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { size: 11 }),
                    " Check Out"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openMaintenance(tool),
                  className: "p-1 hover:bg-interactive-hover rounded text-ink-muted hover:text-amber-600",
                  title: "Log maintenance",
                  children: /* @__PURE__ */ jsx(Clock, { size: 13 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openEditTool(tool),
                  className: "p-1 hover:bg-interactive-hover rounded text-ink-muted hover:text-indigo-600",
                  title: "Edit",
                  children: /* @__PURE__ */ jsx(Edit, { size: 13 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDeleteTool(tool),
                  className: "p-1 hover:bg-rose-50 rounded text-ink-muted hover:text-rose-600",
                  title: "Delete",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 13 })
                }
              )
            ] }) })
          ] }, tool.id);
        }) })
      ] }) }) })
    ] }),
    isToolModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-lg rounded-2xl border border-line shadow-2xl overflow-hidden animate-in zoom-in-95", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-line", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-sm font-bold text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Wrench, { size: 16, className: "text-indigo-600" }),
          editingTool ? "Edit Tool / Equipment" : "Register New Tool"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsToolModalOpen(false), className: "p-1 rounded-lg text-ink-muted hover:bg-sunken", children: /* @__PURE__ */ jsx(X, { size: 16 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveTool, className: "p-4 space-y-3.5 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Tool / Equipment Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                value: form.name,
                onChange: (e) => setForm({ ...form, name: e.target.value }),
                placeholder: "e.g. Cordless Hammer Drill, Vacuum Pump",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Category" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: form.category,
                onChange: (e) => setForm({ ...form, category: e.target.value }),
                placeholder: "Power Tools, Diagnostics, HVAC",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Status" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: form.status,
                onChange: (e) => setForm({ ...form, status: e.target.value }),
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "available", children: "Available in Shop" }),
                  /* @__PURE__ */ jsx("option", { value: "with_staff", children: tt("With Staff / In Field") }),
                  /* @__PURE__ */ jsx("option", { value: "in_maintenance", children: "In Maintenance" }),
                  /* @__PURE__ */ jsx("option", { value: "lost", children: "Lost / Missing" }),
                  /* @__PURE__ */ jsx("option", { value: "retired", children: "Retired" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Assigned Holder (Optional)" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: form.holder_employee_id,
                onChange: (e) => setForm({ ...form, holder_employee_id: e.target.value }),
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "None (In Shop)" }),
                  employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Current Location" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: form.current_location,
                onChange: (e) => setForm({ ...form, current_location: e.target.value }),
                placeholder: "Shop shelf A3, Van #2",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Maintenance Cadence (Days)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                value: form.maintenance_interval_days,
                onChange: (e) => setForm({ ...form, maintenance_interval_days: e.target.value }),
                placeholder: "e.g. 90 (every 3 months)",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Last Maintenance Date" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: form.last_maintenance_at,
                onChange: (e) => setForm({ ...form, last_maintenance_at: e.target.value }),
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Purchase / Replacement Cost" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                value: form.purchase_cost,
                onChange: (e) => setForm({ ...form, purchase_cost: e.target.value }),
                placeholder: "0.00",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Notes / Serial Number" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 2,
                value: form.notes,
                onChange: (e) => setForm({ ...form, notes: e.target.value }),
                placeholder: "Serial #, battery specs, warranty details...",
                className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-3 border-t border-line", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIsToolModalOpen(false), className: "px-4 py-2 rounded-xl bg-sunken text-ink font-bold", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm", children: editingTool ? "Save Changes" : "Register Tool" })
        ] })
      ] })
    ] }) }),
    isCheckoutModalOpen && selectedToolForAction && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-md rounded-2xl border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 text-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-3", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-sm text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(LogOut, { size: 16, className: "text-blue-600" }),
          "Check Out: ",
          selectedToolForAction.name
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsCheckoutModalOpen(false), className: "p-1 text-ink-muted", children: /* @__PURE__ */ jsx(X, { size: 15 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCheckout, className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: tt("Assign to Staff Member *") }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              required: true,
              value: checkoutForm.employee_id,
              onChange: (e) => setCheckoutForm({ ...checkoutForm, employee_id: e.target.value }),
              className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Select Employee" }),
                employees.map((emp) => /* @__PURE__ */ jsx("option", { value: emp.id, children: emp.name }, emp.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Field Location / Vehicle" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: checkoutForm.location,
              onChange: (e) => setCheckoutForm({ ...checkoutForm, location: e.target.value }),
              placeholder: tt("e.g. Service Van #1, Client Site"),
              className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIsCheckoutModalOpen(false), className: "px-3 py-1.5 bg-sunken text-ink font-bold rounded-lg", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm", children: "Confirm Check Out" })
        ] })
      ] })
    ] }) }),
    isMaintenanceModalOpen && selectedToolForAction && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-md rounded-2xl border border-line shadow-2xl p-5 space-y-4 animate-in zoom-in-95 text-xs", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-line pb-3", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-sm text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-amber-600" }),
          "Log Maintenance: ",
          selectedToolForAction.name
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsMaintenanceModalOpen(false), className: "p-1 text-ink-muted", children: /* @__PURE__ */ jsx(X, { size: 15 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleLogMaintenance, className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: tt("Service / Inspection Date") }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              required: true,
              value: maintenanceForm.maintenance_date,
              onChange: (e) => setMaintenanceForm({ ...maintenanceForm, maintenance_date: e.target.value }),
              className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: tt("Service Cost (If Any)") }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: maintenanceForm.cost,
              onChange: (e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value }),
              placeholder: "0.00",
              className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "font-bold text-ink block mb-1", children: "Inspection Notes & Findings" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              value: maintenanceForm.notes,
              onChange: (e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value }),
              placeholder: "Oil changed, blades sharpened, safety test passed...",
              className: "w-full px-3 py-2 bg-app border border-line rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-3xs text-ink-muted", children: [
          "Logging maintenance will reset the countdown and recalculate the next due date based on ",
          selectedToolForAction.maintenance_interval_days || 90,
          " days interval."
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setIsMaintenanceModalOpen(false), className: "px-3 py-1.5 bg-sunken text-ink font-bold rounded-lg", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm", children: "Record Maintenance" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Tools as default
};
