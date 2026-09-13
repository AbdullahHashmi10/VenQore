import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { RefreshCw, Plus, Monitor, Copy, Trash2, Settings, Building2, ShoppingCart, Shield, Percent, Smartphone, ChevronRight, Check, Save, Lock } from "lucide-react";
import { T as Toggle } from "./Toggle-Djmy2ap1.js";
import { S as SectionHeader } from "./SectionHeader-CPHLUsd1.js";
import axios from "axios";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
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
function TerminalPairingSection({ storeSlug }) {
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [terminals, setTerminals] = useState([]);
  const load = useCallback(async () => {
    try {
      const res = await axios.get(route("store.terminal-pairing.index", { store_slug: storeSlug }));
      setError("");
      setTokens(res.data?.tokens || []);
      const t = await axios.get(route("store.terminals.index", { store_slug: storeSlug }));
      setTerminals(t.data?.terminals || []);
    } catch (e) {
      setError(e.response?.status === 403 ? "Only owners and admins can pair terminals." : "Could not load pairing codes.");
    }
  }, [storeSlug]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  const create = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(route("store.terminal-pairing.store", { store_slug: storeSlug }), {
        label: label.trim() || null,
        ttl_minutes: 60
      });
      setLabel("");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not create a pairing code.");
    } finally {
      setLoading(false);
    }
  };
  const revoke = async (id) => {
    try {
      await axios.delete(route("store.terminal-pairing.destroy", { store_slug: storeSlug, id }));
      await load();
    } catch (e) {
      setError("Could not cancel that code.");
    }
  };
  const disconnect = async (id) => {
    if (!window.confirm("Disconnect this terminal? It will need a new pairing code.")) return;
    try {
      await axios.post(route("store.terminals.revoke", { store_slug: storeSlug, id }));
      await load();
    } catch (e) {
      setError("Could not disconnect that terminal.");
    }
  };
  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1500);
    } catch (e) {
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        title: "Terminals (VenQore Station)",
        description: "Create a one-time code, then enter it on the Station setup screen. Each code works once and expires after 60 minutes."
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end mb-5", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex-1 text-sm text-ink-secondary", children: [
        "Terminal name (optional)",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: label,
            maxLength: 100,
            onChange: (e) => setLabel(e.target.value),
            placeholder: "Front counter",
            className: "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: create,
          disabled: loading,
          className: "inline-flex items-center justify-center gap-2 rounded-md bg-accent-fill px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
          children: [
            loading ? /* @__PURE__ */ jsx(RefreshCw, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Plus, { size: 16 }),
            "Create pairing code"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", className: "mb-4 text-sm text-danger-700", children: error }),
    tokens.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No active pairing codes." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-line rounded-md border border-line", children: tokens.map((t) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx(Monitor, { size: 16, className: "text-ink-muted", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("code", { className: "font-numeric text-base tracking-widest text-ink select-all", children: t.token }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-muted", children: t.label || "Unnamed terminal" }),
      /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-ink-muted", children: t.expires_at ? `expires ${new Date(t.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "" }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => copy(t.token), className: "rounded-md p-2 hover:bg-interactive-hover", "aria-label": "Copy code", children: [
        /* @__PURE__ */ jsx(Copy, { size: 16 }),
        copied === t.token && /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Copied" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => revoke(t.id), className: "rounded-md p-2 hover:bg-interactive-hover", "aria-label": "Cancel code", children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) })
    ] }, t.id)) }),
    /* @__PURE__ */ jsx("h4", { className: "mt-6 mb-2 text-sm font-semibold text-ink", children: "Paired terminals" }),
    terminals.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No terminals paired yet." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-line rounded-md border border-line", children: terminals.map((t) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx(Monitor, { size: 16, className: "text-ink-muted", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-ink", children: t.name }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: t.last_heartbeat_at ? `last seen ${new Date(t.last_heartbeat_at).toLocaleString()}` : "never seen" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => disconnect(t.id), className: "ml-auto rounded-md px-3 py-1 text-sm text-danger-700 hover:bg-interactive-hover", children: "Disconnect" })
    ] }, t.id)) })
  ] });
}
const SETTINGS_CATEGORIES = [
  {
    id: "org",
    name: "Organization",
    icon: Building2,
    sections: ["general", "taxes"]
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
    sections: ["security", "terminals"]
  }
];
const SETTINGS_SECTIONS = [
  { id: "general", name: "Store Info", icon: Building2, description: "Store details and address" },
  { id: "pos", name: "POS & Sales", icon: ShoppingCart, description: "Sales and interface configuration" },
  { id: "security", name: "Security", icon: Shield, description: "Access control & passcodes" },
  { id: "taxes", name: "Tax Rates", icon: Percent, description: "Configure custom tax brackets" },
  { id: "terminals", name: "Terminals", icon: Smartphone, description: "Pair VenQore Station devices" }
];
function SettingsPanel({ settings }) {
  const {
    store,
    modules
  } = usePage().props;
  const { auth } = usePage().props;
  const isAdmin = auth.user.role === "admin" || auth.user.role === "owner" || auth.user.role === "platform_admin";
  const tt = useTermText();
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
    admin_passcode: settings.admin_passcode || "",
    // Invoice styling & Custom domain
    invoice_theme: settings.invoice_theme || "classic",
    invoice_primary_color: settings.invoice_primary_color || "rgb(var(--vq-indigo-600))",
    show_margin_on_invoice: settings.show_margin_on_invoice === "1",
    custom_domain: store.custom_domain || "",
    tax_rates: typeof settings.tax_rates === "string" ? settings.tax_rates : JSON.stringify(settings.tax_rates || [{ id: 1, name: "GST 18%", rate: 18, type: "percentage" }, { id: 2, name: "VAT 5%", rate: 5, type: "percentage" }], null, 2),
    sso_enabled: settings.sso_enabled === "1",
    sso_idp_entity_id: settings.sso_idp_entity_id || "",
    sso_url: settings.sso_url || "",
    sso_certificate: settings.sso_certificate || ""
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
      charity_enabled: data.charity_enabled ? "1" : "0",
      invoice_theme: data.invoice_theme,
      invoice_primary_color: data.invoice_primary_color,
      show_margin_on_invoice: data.show_margin_on_invoice ? "1" : "0",
      custom_domain: data.custom_domain,
      tax_rates: data.tax_rates,
      sso_enabled: data.sso_enabled ? "1" : "0",
      sso_idp_entity_id: data.sso_idp_entity_id,
      sso_url: data.sso_url,
      sso_certificate: data.sso_certificate
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
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Store Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.store_name,
                onChange: (e) => setData("store_name", e.target.value),
                className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                placeholder: "My Store"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Store Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.store_phone,
                onChange: (e) => setData("store_phone", e.target.value),
                className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                placeholder: "+92 300 1234567"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Store Address" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.store_address,
                onChange: (e) => setData("store_address", e.target.value),
                className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none",
                rows: 3,
                placeholder: "Full store address"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Default Tax Rate (%)" }),
            /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.default_tax_rate,
                onChange: (e) => setData("default_tax_rate", e.target.value),
                className: "w-full pl-4 pr-10 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer font-bold text-ink",
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
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Custom Domain Mapping" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.custom_domain,
                onChange: (e) => setData("custom_domain", e.target.value),
                className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                placeholder: "e.g. store.mydomain.com"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken dark:bg-white/10 md:col-span-2 my-4" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-md font-bold text-ink", children: "Invoice & PDF Customization" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Manage the design and interactive elements of generated B2B invoices." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Invoice Template Theme" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.invoice_theme,
                onChange: (e) => setData("invoice_theme", e.target.value),
                className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "classic", children: "Classic Minimalist" }),
                  /* @__PURE__ */ jsx("option", { value: "modern", children: "Modern Professional" }),
                  /* @__PURE__ */ jsx("option", { value: "elegant", children: "Elegant Serif" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Primary Brand Color" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "color",
                  value: data.invoice_primary_color,
                  onChange: (e) => setData("invoice_primary_color", e.target.value),
                  className: "h-11 w-14 bg-sunken border border-line dark:border-line rounded-xl cursor-pointer p-1"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.invoice_primary_color,
                  onChange: (e) => setData("invoice_primary_color", e.target.value),
                  className: "flex-1 px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 md:col-span-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-sunken rounded-xl border border-line", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink", children: "B2B Margin Display" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Display item-level profit margin column directly on B2B invoices." })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  checked: data.show_margin_on_invoice,
                  onChange: (e) => setData("show_margin_on_invoice", e.target.checked),
                  className: "w-5 h-5 accent-brand-500 rounded border-line focus:ring-brand-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: tt("Auto-Update Product Cost") }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.product_cost_update_policy,
                  onChange: (e) => setData("product_cost_update_policy", e.target.value),
                  className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "never", children: "Never (Keep V3 FIFO Batches Only)" }),
                    /* @__PURE__ */ jsx("option", { value: "always", children: "Always (Update to Latest Purchase Price)" }),
                    /* @__PURE__ */ jsx("option", { value: "increase_only", children: "On Cost Increase Only" }),
                    /* @__PURE__ */ jsx("option", { value: "decrease_only", children: "On Cost Decrease Only" })
                  ]
                }
              )
            ] })
          ] })
        ] }) });
      case "pos":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Sales Configuration", description: "Customize your point of sale experience" }),
            /* @__PURE__ */ jsxs("div", { className: "divide-y divide-line", children: [
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
              /* @__PURE__ */ jsx("div", { className: "p-5 bg-app rounded-2xl border border-line dark:border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsx("label", { className: "text-sm font-bold text-ink-secondary", children: "Round Off Invoice Totals" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Choose rounding precision for sales and purchases" }),
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
                      className: `py-2 px-1 text-center font-bold text-1xs rounded-lg border transition-all ${isActive ? "border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300" : "border-transparent bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "Return Mode Configuration", description: "Configure return settings and validation rules" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary", children: "POS Return Mode" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: "Configure return authorization requirements" })
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
                    className: "w-64 px-4 py-2.5 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "reference", children: "Reference Number Required" }),
                      /* @__PURE__ */ jsx("option", { value: "customer_or_reference", children: tt("Customer or Reference") }),
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
                      className: "w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-line"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-secondary", children: "I understand and acknowledge this risk" })
                ] })
              ] }),
              data.pos_return_mode === "open" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-line", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary", children: "Return Window (days)" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: "Max days allowed since original purchase for returns" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      min: "1",
                      value: data.pos_return_window,
                      onChange: (e) => setData("pos_return_window", e.target.value),
                      placeholder: "e.g. 7, 14, 30 — leave empty to disable",
                      className: "w-64 px-4 py-2.5 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    }
                  )
                ] }),
                data.pos_return_window && /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center py-2", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink-secondary", children: "Window Behavior" }),
                    /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: "Action to take if return window has expired" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex bg-sunken p-1 rounded-xl", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setData("pos_return_window_behavior", "warn"),
                        className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "warn" ? "bg-surface text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted"}`,
                        children: "Soft Warning"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setData("pos_return_window_behavior", "block"),
                        className: `px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === "block" ? "bg-surface text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted"}`,
                        children: "Hard Block"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-4 border-b border-line", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-ink-secondary", children: "Enable Charity Donations" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted", children: "Show the Charity button on the POS for quick donation recording" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setData("charity_enabled", !data.charity_enabled),
                    className: `relative w-12 h-6 rounded-full transition-colors ${data.charity_enabled ? "bg-rose-500" : "bg-sunken"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.charity_enabled ? "right-1" : "left-1"}` })
                  }
                )
              ] })
            ] })
          ] })
        ] });
      case "security":
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
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
            data.enable_passcode && /* @__PURE__ */ jsxs("div", { className: "p-6 bg-sunken rounded-2xl border border-line dark:border-line animate-in fade-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wider", children: "Global Admin Passcode" }),
              /* @__PURE__ */ jsxs("div", { className: "relative max-w-xs", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    maxLength: "6",
                    value: data.admin_passcode,
                    onChange: (e) => setData("admin_passcode", e.target.value.replace(/[^0-9]/g, "")),
                    className: "w-full pl-4 pr-10 py-3 bg-surface border border-line dark:border-line rounded-xl text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-brand-500 outline-none",
                    placeholder: "Enter PIN"
                  }
                ),
                /* @__PURE__ */ jsx(Lock, { className: "absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted", size: 16 })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "mt-3 text-xs text-ink-muted", children: [
                'This "Master Passcode" logs you in as Hashmi Dashboard.',
                /* @__PURE__ */ jsx("span", { className: "block mt-1 text-brand-600 dark:text-brand-400 font-medium", children: "Tip: Individual users can set personal passcodes in their Profile." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
            /* @__PURE__ */ jsx(SectionHeader, { title: "SSO / SAML Authentication", description: "Configure Single Sign-On for your organization" }),
            /* @__PURE__ */ jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsx(
              Toggle,
              {
                enabled: data.sso_enabled,
                onChange: (v) => setData("sso_enabled", v),
                label: "Enable SSO",
                description: "Allow members to sign in securely using SAML Identity Provider"
              }
            ) }),
            data.sso_enabled && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "IdP Entity ID" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.sso_idp_entity_id,
                    onChange: (e) => setData("sso_idp_entity_id", e.target.value),
                    className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                    placeholder: "https://identity-provider.com/metadata"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: tt("Single Sign-On Service URL") }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.sso_url,
                    onChange: (e) => setData("sso_url", e.target.value),
                    className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none",
                    placeholder: "https://identity-provider.com/sso"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "X.509 Public Certificate" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: data.sso_certificate,
                    onChange: (e) => setData("sso_certificate", e.target.value),
                    className: "w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none resize-none",
                    rows: 5,
                    placeholder: "-----BEGIN CERTIFICATE-----\\n...\\n-----END CERTIFICATE-----"
                  }
                )
              ] })
            ] })
          ] })
        ] });
      case "terminals":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: /* @__PURE__ */ jsx(TerminalPairingSection, { storeSlug: store?.slug }) });
      case "taxes":
        return /* @__PURE__ */ jsx("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
          /* @__PURE__ */ jsx(SectionHeader, { title: "Custom Tax Configurator", description: "Define custom tax rates and brackets for B2B invoice billing" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wider", children: "Tax Rates JSON Configuration" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.tax_rates,
                onChange: (e) => setData("tax_rates", e.target.value),
                className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none",
                rows: 10,
                placeholder: '[{"id": 1, "name": "GST 18%", "rate": 18, "type": "percentage"}]'
              }
            ),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-ink-muted", children: [
              "Enter valid JSON configuration matching the structure: ",
              /* @__PURE__ */ jsxs("code", { children: [
                "[",
                "{",
                '"id": unique_id, "name": "Label", "rate": percentage_number, "type": "percentage"',
                "}",
                "]"
              ] })
            ] })
          ] }) })
        ] }) });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Settings", activeMenu: "Store Settings", children: [
    /* @__PURE__ */ jsx(Head, { title: "Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex gap-6 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "w-20" : "w-72"} bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-slow`, children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-brand-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-brand-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: `${sidebarCollapsed ? "px-2 py-4" : "px-4 py-6"} border-b border-neutral-800/50 mb-3 relative z-20`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setSidebarCollapsed(!sidebarCollapsed),
              className: "w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-lg transition-transform shrink-0",
              children: /* @__PURE__ */ jsx(Settings, { size: 20, className: `transition-transform ${sidebarCollapsed ? "rotate-180" : ""}` })
            }
          ),
          !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-white tracking-tight", children: "Settings" }),
            /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-[0.2em] text-brand-400", children: "Shop Config" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1 relative z-10 pb-20", children: SETTINGS_CATEGORIES.map((category) => {
          const CatIcon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const categorySections = SETTINGS_SECTIONS.filter((s) => {
            if (!category.sections.includes(s.id)) return false;
            if (s.id === "pos" && Array.isArray(modules) && !modules.includes("pos")) return false;
            if (s.id === "taxes" && Array.isArray(modules) && !modules.includes("tax_compliance")) return false;
            return true;
          });
          if (categorySections.length === 0) return null;
          return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            !sidebarCollapsed && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => toggleCategory(category.id),
                className: "w-full flex items-center justify-between px-3 py-2 text-2xs font-bold uppercase tracking-[0.2em] text-ink-muted hover:text-brand-400 transition-colors group",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(CatIcon, { size: 12 }),
                    category.name
                  ] }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: `transition-transform duration-normal ${isExpanded ? "rotate-90" : ""}` })
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
                  className: `w-full flex items-center gap-3 ${sidebarCollapsed ? "p-2 justify-center" : "p-3"} rounded-xl text-left transition-all duration-normal group relative overflow-hidden border ${isActive ? "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg " : "text-ink-muted hover:bg-white/5 hover:text-white border-transparent"}`,
                  children: [
                    isActive && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-brand-600/20 opacity-100" }),
                    /* @__PURE__ */ jsx("div", { className: `relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-normal ${isActive ? "bg-brand-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-neutral-800 group-hover:bg-interactive-hover"}`, children: /* @__PURE__ */ jsx(Icon, { size: 16, className: isActive ? "text-white" : "text-ink-muted group-hover:text-brand-400" }) }),
                    !sidebarCollapsed && /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: `text-xs font-bold tracking-tight ${isActive ? "text-white" : "text-neutral-200"}`, children: section.name }),
                      /* @__PURE__ */ jsx("p", { className: `text-3xs leading-tight ${isActive ? "text-brand-200" : "text-ink-muted"} line-clamp-1`, children: section.description })
                    ] })
                  ]
                },
                section.id
              );
            }) })
          ] }, category.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col h-full relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "p-10 border-b border-line shrink-0 bg-white/80 dark:bg-app backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-[0.2em] rounded-full", children: "Section" }),
                /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-ink tracking-tight", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.name })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-base text-ink-muted font-medium", children: SETTINGS_SECTIONS.find((s) => s.id === activeSection)?.description })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing || !isAdmin || data.pos_return_mode === "open" && !acknowledgeOpenReturn,
                className: `relative group px-10 py-4 rounded-2xl font-bold text-sm transition-all duration-slower transform active:scale-95 overflow-hidden shadow-2xl ${!isAdmin || data.pos_return_mode === "open" && !acknowledgeOpenReturn ? "opacity-50 grayscale cursor-not-allowed" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-neutral-900 z-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-brand-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform duration-slower" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-brand-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 transition-transform duration-slower" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-20" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-50" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center gap-3 text-white", children: saved ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Check, { size: 20, strokeWidth: 3, className: "text-emerald-400" }),
                    /* @__PURE__ */ jsx("span", { children: "Changes Saved" })
                  ] }) : processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(RefreshCw, { size: 20, className: "animate-spin text-brand-300" }),
                    /* @__PURE__ */ jsx("span", { children: "Syncing..." })
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Save, { size: 20, className: "transition-transform" }),
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
 background: rgb(var(--vq-slate-700));
 border-radius: 10px;
 }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
 background: rgb(var(--vq-slate-600));
 }
` })
  ] });
}
export {
  SettingsPanel as default
};
