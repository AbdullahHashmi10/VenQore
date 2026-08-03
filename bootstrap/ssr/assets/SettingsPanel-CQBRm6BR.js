import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { Settings, Building2, ShoppingCart, Shield, ChevronRight, Check, RefreshCw, Save, Lock } from "lucide-react";
import { T as Toggle } from "./Toggle-DVyg61h2.js";
import { S as SectionHeader } from "./SectionHeader-CQ5Hn4MY.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const SETTINGS_CATEGORIES = [
  {
    id: "org",
    name: "Organization",
    icon: Building2,
    sections: ["general"]
  },
  {
    id: "ops",
    name: "Operations",
    icon: ShoppingCart,
    sections: ["pos"]
  },
  {
    id: "adv",
    name: "Advanced",
    icon: Shield,
    sections: ["security"]
  }
];
const SETTINGS_SECTIONS = [
  { id: "general", name: "Store Info", icon: Building2, description: "Store details and address" },
  { id: "pos", name: "POS & Sales", icon: ShoppingCart, description: "Sales and interface configuration" },
  { id: "security", name: "Security", icon: Shield, description: "Access control & passcodes" }
];
function SettingsPanel({ settings }) {
  const {
    store
  } = usePage().props;
  const { auth } = usePage().props;
  const isAdmin = auth.user.role === "admin" || auth.user.role === "owner" || auth.user.role === "platform_admin" || auth.user.email === "abdullah@example.com";
  const [activeSection, setActiveSection] = useState("general");
  const [saved, setSaved] = useState(false);
  const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(settings.pos_return_mode === "open");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(["org", "ops", "adv"]);
  const toggleCategory = (catId) => {
    setExpandedCategories(
      (prev) => prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };
  const { data, setData, post, processing } = useForm({
    // POS & Sales
    pos_auto_fill_cash: settings.pos_auto_fill_cash === "1",
    senior_mode: settings.senior_mode === "1",
    fbr_integration: settings.fbr_integration === "1",
    show_margin_percentage: settings.show_margin_percentage === "1",
    stop_sale_negative_stock: settings.stop_sale_negative_stock === "1",
    round_off_total: settings.round_off_total || "none",
    default_tax_rate: settings.default_tax_rate || "0",
    pos_return_mode: settings.pos_return_mode || "reference",
    pos_return_window: settings.pos_return_window || "",
    pos_return_window_behavior: settings.pos_return_window_behavior || "warn",
    charity_enabled: settings.charity_enabled === "1" || settings.charity_enabled === true,
    // General
    store_name: settings.store_name || "",
    store_address: settings.store_address || "",
    store_phone: settings.store_phone || "",
    product_cost_update_policy: settings.product_cost_update_policy || "never",
    // Security
    enable_passcode: settings.enable_passcode === "1",
    admin_passcode: settings.admin_passcode || ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedSettings = {
      pos_auto_fill_cash: data.pos_auto_fill_cash ? "1" : "0",
      senior_mode: data.senior_mode ? "1" : "0",
      fbr_integration: data.fbr_integration ? "1" : "0",
      show_margin_percentage: data.show_margin_percentage ? "1" : "0",
      stop_sale_negative_stock: data.stop_sale_negative_stock ? "1" : "0",
      round_off_total: data.round_off_total,
      enable_passcode: data.enable_passcode ? "1" : "0",
      store_name: data.store_name,
      store_address: data.store_address,
      store_phone: data.store_phone,
      default_tax_rate: data.default_tax_rate,
      admin_passcode: data.admin_passcode,
      product_cost_update_policy: data.product_cost_update_policy,
      pos_return_mode: data.pos_return_mode,
      pos_return_window: data.pos_return_window,
      pos_return_window_behavior: data.pos_return_window_behavior,
      charity_enabled: data.charity_enabled ? "1" : "0"
    };
    router.post(route("store.settings.update", {
      store_slug: store.slug
    }), { settings: formattedSettings }, {
      preserveScroll: true,
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3e3);
      }
    });
  };
  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Store Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.store_name,
                onChange: (e) => setData("store_name", e.target.value),
                className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                placeholder: "My Store"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Store Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.store_phone,
                onChange: (e) => setData("store_phone", e.target.value),
                className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                placeholder: "+92 300 1234567"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Store Address" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.store_address,
                onChange: (e) => setData("store_address", e.target.value),
                className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none",
                rows: 3,
                placeholder: "Full store address"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Default Tax Rate (%)" }),
            /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.default_tax_rate,
                onChange: (e) => setData("default_tax_rate", e.target.value),
                className: "w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer font-bold text-slate-800 dark:text-white",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "0", children: "None (0%)" }),
                  (() => {
                    try {
                      const parsedTaxRates = settings?.tax_rates ? typeof settings.tax_rates === "string" ? JSON.parse(settings.tax_rates) : settings.tax_rates : [
                        { id: 1, name: "GST 18%", rate: 18, type: "percentage" },
                        { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }
                      ];
                      return parsedTaxRates.map((tax) => /* @__PURE__ */ jsxs("option", { value: tax.rate, children: [
                        tax.name,
                        " (",
                        tax.rate,
                        "%)"
                      ] }, tax.id));
                    } catch (e) {
                      return null;
                    }
                  })(),
                  data.default_tax_rate && data.default_tax_rate !== "0" && !(() => {
                    try {
                      const rates = settings?.tax_rates ? typeof settings.tax_rates === "string" ? JSON.parse(settings.tax_rates) : settings.tax_rates : [];
                      return rates.some((t) => String(t.rate) === String(data.default_tax_rate));
                    } catch (e) {
                      return false;
                    }
                  })() && /* @__PURE__ */ jsxs("option", { value: data.default_tax_rate, children: [
                    "Custom (",
                    data.default_tax_rate,
                    "%)"
                  ] })
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Auto-Update Product Cost" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.product_cost_update_policy,
                onChange: (e) => setData("product_cost_update_policy", e.target.value),
                className: "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "never", children: "Never (Keep V3 FIFO Batches Only)" }),
                  /* @__PURE__ */ jsx("option", { value: "always", children: "Always (Update to Latest Purchase Price)" }),
                  /* @__PURE__ */ jsx("option", { value: "increase_only", children: "On Cost Increase Only" }),
                  /* @__PURE__ */ jsx("option", { value: "decrease_only", children: "On Cost Decrease Only" })
                ]
              }
            )
          ] })
        ] }) });
      case "pos":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Sales Configuration", description: "Customize your point of sale experience" }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: [
              /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled: data.pos_auto_fill_cash,
                  onChange: (v) => setData("pos_auto_fill_cash", v),
                  label: "Auto-Fill Cash Received",
                  description: "Automatically populate the 'Cash Received' field with the total amount"
                }
              ),
              /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled: data.senior_mode,
                  onChange: (v) => setData("senior_mode", v),
                  label: "Senior Mode (Accessibility)",
                  description: "Enable larger fonts and high-contrast UI for easier reading"
                }
              ),
              /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled: data.fbr_integration,
                  onChange: (v) => setData("fbr_integration", v),
                  label: "FBR Integration",
                  description: "Automatically report sales to FBR and print QR codes"
                }
              ),
              /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled: data.show_margin_percentage,
                  onChange: (v) => setData("show_margin_percentage", v),
                  label: "Show Margin Percentage",
                  description: "Display profit margin in sales overview"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "Round Off Invoice Totals" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Choose rounding precision for sales and purchases" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-1 mt-2", children: [
                  { value: "none", label: "None" },
                  { value: "0", label: "Whole" },
                  { value: "1", label: ".0" },
                  { value: "2", label: ".00" },
                  { value: "3", label: ".000" },
                  { value: "4", label: ".0000" }
                ].map((opt) => {
                  const currentVal = data.round_off_total === true || data.round_off_total === "1" ? "0" : data.round_off_total || "none";
                  const isActive = currentVal === opt.value;
                  return /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setData("round_off_total", opt.value),
                      className: `py-2 px-1 text-center font-bold text-1xs rounded-lg border transition-all ${isActive ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" : "border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-slate-200/50"}`,
                      children: opt.label
                    },
                    opt.value
                  );
                }) })
              ] }) }),
              /* @__PURE__ */ jsx(
                Toggle,
                {
                  enabled: data.stop_sale_negative_stock === "0" || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0,
                  onChange: (v) => setData("stop_sale_negative_stock", !v),
                  label: "Allow Negative Stock (Overselling)",
                  description: "Warning: Allows selling items even if inventory is 0",
                  variant: "danger"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Return Mode Configuration", description: "Configure return settings and validation rules" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "POS Return Mode" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Configure return authorization requirements" })
                ] }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: data.pos_return_mode,
                    onChange: (e) => {
                      const val = e.target.value;
                      setData("pos_return_mode", val);
                      if (val !== "open") {
                        setAcknowledgeOpenReturn(false);
                      }
                    },
                    className: "w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "reference", children: "Reference Number Required" }),
                      /* @__PURE__ */ jsx("option", { value: "customer_or_reference", children: "Customer or Reference" }),
                      /* @__PURE__ */ jsx("option", { value: "open", children: "Open Return — No Reference Needed" })
                    ]
                  }
                )
              ] }),
              data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-amber-500 text-lg", children: "⚠️" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed", children: "Warning: Open returns cannot be linked to original sales. You are responsible for verifying returned items were genuinely purchased. The system cannot detect abuse." })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer select-none", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: acknowledgeOpenReturn,
                      onChange: (e) => setAcknowledgeOpenReturn(e.target.checked),
                      className: "w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-300", children: "I understand and acknowledge this risk" })
                ] })
              ] }),
              data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Return Window (days)" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Max days allowed since original purchase for returns" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      value: data.pos_return_window,
                      onChange: (e) => setData("pos_return_window", e.target.value),
                      placeholder: "e.g. 7, 14, 30 — leave empty to disable",
                      className: "w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    }
                  )
                ] }),
                data.pos_return_window && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Window Behavior" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Action to take if return window has expired" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setData("pos_return_window_behavior", "warn"),
                        className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "warn" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500"}`,
                        children: "Soft Warning"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setData("pos_return_window_behavior", "block"),
                        className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "block" ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500"}`,
                        children: "Hard Block"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-700", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300", children: "Enable Charity Donations" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-500", children: "Show the Charity button on the POS for quick donation recording" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setData("charity_enabled", !data.charity_enabled),
                    className: `relative w-12 h-6 rounded-full transition-colors ${data.charity_enabled ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-600"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.charity_enabled ? "right-1" : "left-1"}` })
                  }
                )
              ] })
            ] })
          ] })
        ] });
      case "security":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6", children: [
          /* @__PURE__ */ jsx(SectionHeader, { title: "Access Control", description: "Manage login security" }),
          /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(
            Toggle,
            {
              enabled: data.enable_passcode,
              onChange: (v) => setData("enable_passcode", v),
              label: "Enable Passcode Login",
              description: "Allow users to log in using a 4-6 digit keypad PIN"
            }
          ) }),
          data.enable_passcode && /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-600 animate-in fade-in slide-in-from-top-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider", children: "Global Admin Passcode" }),
            /* @__PURE__ */ jsxs("div", { className: "relative max-w-xs", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  maxLength: "6",
                  value: data.admin_passcode,
                  onChange: (e) => setData("admin_passcode", e.target.value.replace(/[^0-9]/g, "")),
                  className: "w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-500 rounded-xl text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none",
                  placeholder: "Enter PIN"
                }
              ),
              /* @__PURE__ */ jsx(Lock, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-slate-500", children: [
              'This "Master Passcode" logs you in as Hashmi Dashboard.',
              /* @__PURE__ */ jsx("span", { className: "block mt-1 text-indigo-600 dark:text-indigo-400 font-medium", children: "Tip: Individual users can set personal passcodes in their Profile." })
            ] })
          ] })
        ] }) });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Settings", activeMenu: "Store Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex gap-6 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "w-20" : "w-72"} bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300`, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: `${sidebarCollapsed ? "px-2 py-4" : "px-4 py-6"} border-b border-slate-800/50 mb-3 relative z-20`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSidebarCollapsed(!sidebarCollapsed),
              className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform shrink-0",
              children: /* @__PURE__ */ jsx(Settings, { size: 20, className: `transition-transform ${sidebarCollapsed ? "rotate-180" : ""}` })
            }
          ),
          !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-black text-white tracking-tight", children: "Settings" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-[0.2em] text-indigo-400", children: "Shop Config" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1 relative z-10 pb-20", children: SETTINGS_CATEGORIES.map((category) => {
          const CatIcon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const categorySections = SETTINGS_SECTIONS.filter((s) => category.sections.includes(s.id));
          if (categorySections.length === 0) return null;
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            !sidebarCollapsed && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => toggleCategory(category.id),
                className: "w-full flex items-center justify-between px-3 py-2 text-2xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CatIcon, { size: 12 }),
                    category.name
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: `transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}` })
                ]
              }
            ),
            (isExpanded || sidebarCollapsed) && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: categorySections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setActiveSection(section.id),
                  title: sidebarCollapsed ? section.name : void 0,
                  className: `w-full flex items-center gap-3 ${sidebarCollapsed ? "p-2 justify-center" : "p-3"} rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${isActive ? "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"}`,
                  children: [
                    isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-100" }),
                    /* @__PURE__ */ jsx("div", { className: `relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-800 group-hover:bg-slate-700"}`, children: /* @__PURE__ */ jsx(Icon, { size: 16, className: isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400" }) }),
                    !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: `text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-slate-200"}`, children: section.name }),
                      /* @__PURE__ */ jsx("p", { className: `text-3xs leading-tight ${isActive ? "text-indigo-200" : "text-slate-500"} line-clamp-1`, children: section.description })
                    ] })
                  ]
                },
                section.id
              );
            }) })
          ] }, category.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col h-full relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xs font-black uppercase tracking-[0.2em] rounded-full", children: "Section" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-slate-900 dark:text-white tracking-tight", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.name })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-base text-slate-500 font-medium", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.description })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing || !isAdmin || data.pos_return_mode === "open" && !acknowledgeOpenReturn,
                className: `relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40 ${!isAdmin || data.pos_return_mode === "open" && !acknowledgeOpenReturn ? "opacity-50 grayscale cursor-not-allowed" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-slate-900 z-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-indigo-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-500" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center gap-3 text-white", children: saved ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { size: 20, strokeWidth: 3, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { children: "Changes Saved" })
                  ] }) : processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(RefreshCw, { size: 20, className: "animate-spin text-indigo-300" }),
                    /* @__PURE__ */ jsx("span", { children: "Syncing..." })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Save, { size: 20, className: "group-hover:scale-110 transition-transform" }),
                    /* @__PURE__ */ jsx("span", { children: isAdmin ? "Save Changes" : "Viewing Only" })
                  ] }) })
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-10 custom-scrollbar", children: /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: renderSection() }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            ` })
  ] });
}
export {
  SettingsPanel as default
};
