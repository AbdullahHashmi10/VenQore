import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Link, router } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-VlY6tyr6.js";
import { ArrowLeft, CheckCircle, Building2, User, Hash, Tag, DollarSign, Shield, Calendar, Globe, Zap, Save, Clock, Info, RotateCcw, Users, Package, ShoppingCart, Edit2, X } from "lucide-react";
import "./PlatformLayout-Bffb0vmW.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-Bi1AXgyR.js";
function Toggle({ value, onChange }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(!value),
      className: `w-11 h-6 rounded-full p-0.5 transition-all duration-200 ${value ? "bg-indigo-600" : "bg-slate-700"}`,
      children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? "translate-x-5" : "translate-x-0"}` })
    }
  );
}
function FieldRow({ label, icon: Icon, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 py-3.5 border-b border-slate-800/60 last:border-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-48 shrink-0 pt-0.5", children: [
      Icon && /* @__PURE__ */ jsx(Icon, { size: 14, className: "text-slate-500 shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase tracking-widest", children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1", children })
  ] });
}
function EditableText({ value, onChange, placeholder, type = "text" }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      value: value ?? "",
      onChange: (e) => onChange(e.target.value),
      placeholder,
      className: "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
    }
  );
}
function EditableSelect({ value, onChange, options }) {
  return /* @__PURE__ */ jsx(
    "select",
    {
      value: value ?? "",
      onChange: (e) => onChange(e.target.value),
      className: "w-full bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all",
      children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value))
    }
  );
}
function LimitCard({ limitKey, info, tenant, availableKeys }) {
  const [editing, setEditing] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    override_key: limitKey,
    override_value: info.override ?? "",
    reason: info.reason ?? "",
    expires_at: "",
    notify_user: false,
    notification_message: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("platform.tenants.overrides.apply", { tenant: tenant.id }), {
      onSuccess: () => {
        reset();
        setEditing(false);
      }
    });
  };
  const removeOverride = () => {
    if (info.override_id && confirm("Remove this override? Tenant reverts to plan default.")) {
      router.delete(route("platform.tenants.overrides.remove", { tenant: tenant.id, override: info.override_id }));
    }
  };
  const hasOverride = info.override !== null && info.override !== void 0;
  const displayValue = info.effective === null ? "∞" : String(info.effective);
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border p-4 transition-all ${hasOverride ? "bg-amber-500/5 border-amber-500/30" : "bg-slate-900 border-slate-800 hover:border-slate-700"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-slate-400 uppercase tracking-wider", children: limitKey }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: hasOverride ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-2xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase", children: [
          /* @__PURE__ */ jsx(Zap, { size: 9 }),
          " Override"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: removeOverride, className: "p-1 text-red-500/60 hover:text-red-400 transition-colors", title: "Remove override", children: /* @__PURE__ */ jsx(RotateCcw, { size: 12 }) })
      ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-2xs font-black text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full uppercase", children: [
        /* @__PURE__ */ jsx(CheckCircle, { size: 9 }),
        " Plan Default"
      ] }) })
    ] }),
    !editing ? /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-black text-white", children: displayValue }),
        hasOverride && /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-600 mt-0.5", children: [
          "Plan default: ",
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: info.plan_default === null ? "∞" : String(info.plan_default) })
        ] }),
        info.reason && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-400/60 mt-1", children: info.reason }),
        info.expires_at && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-slate-600 mt-1", children: [
          /* @__PURE__ */ jsx(Clock, { size: 10 }),
          " Expires ",
          new Date(info.expires_at).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setEditing(true),
          className: "p-2 text-slate-600 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition-all",
          title: "Edit",
          children: /* @__PURE__ */ jsx(Edit2, { size: 13 })
        }
      )
    ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-2 mt-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: data.override_value,
          onChange: (e) => setData("override_value", e.target.value),
          placeholder: "Value (blank = unlimited)",
          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: data.reason,
          onChange: (e) => setData("reason", e.target.value),
          placeholder: "Reason (internal)",
          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "datetime-local",
          value: data.expires_at,
          onChange: (e) => setData("expires_at", e.target.value),
          className: "w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all",
            children: [
              /* @__PURE__ */ jsx(Save, { size: 12 }),
              " ",
              processing ? "Saving…" : "Apply"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setEditing(false);
              reset();
            },
            className: "px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all",
            children: /* @__PURE__ */ jsx(X, { size: 12 })
          }
        )
      ] })
    ] })
  ] });
}
function OverrideDetail({ tenant, effective_limits, override_history, available_keys }) {
  const { flash } = usePage().props;
  const { data, setData, patch, processing, errors } = useForm({
    name: tenant.name ?? "",
    plan: tenant.plan ?? "trial",
    status: tenant.status ?? "trial",
    trial_ends_at: tenant.trial_ends_at ? tenant.trial_ends_at.substring(0, 10) : "",
    subscription_ends_at: tenant.subscription_ends_at ? tenant.subscription_ends_at.substring(0, 10) : "",
    timezone: tenant.timezone ?? "",
    currency_code: tenant.currency_code ?? "",
    currency_symbol: tenant.currency_symbol ?? "",
    industry: tenant.industry ?? "",
    feature_variants: !!tenant.feature_variants,
    feature_serials: !!tenant.feature_serials,
    feature_batches: !!tenant.feature_batches,
    feature_manufacturing: !!tenant.feature_manufacturing
  });
  const saveProfile = (e) => {
    e.preventDefault();
    patch(route("platform.tenants.overrides.update", { tenant: tenant.id }));
  };
  const activeOverrides = override_history.filter((o) => !o.expires_at || new Date(o.expires_at) > /* @__PURE__ */ new Date());
  const planOptions = [
    { value: "trial", label: "Trial" },
    { value: "starter", label: "Starter" },
    { value: "growth", label: "Growth / Professional" },
    { value: "business", label: "Business / Enterprise" },
    { value: "ltd_1", label: "LTD — 1 Code (Starter)" },
    { value: "ltd_2", label: "LTD — 2 Codes (Growth)" },
    { value: "ltd_3", label: "LTD — 3 Codes (Business)" }
  ];
  const statusOptions = [
    { value: "trial", label: "Trial" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "cancelled", label: "Cancelled" }
  ];
  const statusColor = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    trial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    suspended: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: `Store — ${tenant.name}`, mode: "admin", activeMenu: "Tenant Overrides", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("platform.tenants.overrides"),
          className: "flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors font-semibold text-sm",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
            " Tenant Overrides"
          ]
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "/" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-bold", children: tenant.name })
    ] }),
    flash?.success && /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold", children: [
      /* @__PURE__ */ jsx(CheckCircle, { size: 16 }),
      " ",
      flash.success
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-6 py-4 border-b border-slate-800", children: [
            /* @__PURE__ */ jsx(Building2, { size: 16, className: "text-indigo-400" }),
            /* @__PURE__ */ jsx("h3", { className: "font-black text-white text-sm uppercase tracking-widest", children: "Store Identity" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: saveProfile, className: "px-6 py-2", children: [
            /* @__PURE__ */ jsx(FieldRow, { label: "Store Name", icon: Building2, children: /* @__PURE__ */ jsx(EditableText, { value: data.name, onChange: (v) => setData("name", v), placeholder: "Store name" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Owner", icon: User, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-white font-semibold", children: tenant.owner_name }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: tenant.owner_email })
            ] }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Store ID", icon: Hash, children: /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400 font-mono", children: [
              "#",
              tenant.id
            ] }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Slug", icon: Tag, children: /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400 font-mono", children: tenant.slug }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Industry", icon: Building2, children: /* @__PURE__ */ jsx(EditableText, { value: data.industry, onChange: (v) => setData("industry", v), placeholder: "e.g. Retail, Fashion, F&B" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800", children: [
              /* @__PURE__ */ jsx(DollarSign, { size: 14, className: "text-emerald-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-400 uppercase tracking-widest", children: "Billing & Plan" })
            ] }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Plan", icon: Shield, children: /* @__PURE__ */ jsx(EditableSelect, { value: data.plan, onChange: (v) => setData("plan", v), options: planOptions }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Status", icon: CheckCircle, children: /* @__PURE__ */ jsx(EditableSelect, { value: data.status, onChange: (v) => setData("status", v), options: statusOptions }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Trial Ends", icon: Calendar, children: /* @__PURE__ */ jsx(EditableText, { type: "date", value: data.trial_ends_at, onChange: (v) => setData("trial_ends_at", v) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Subscription Ends", icon: Calendar, children: /* @__PURE__ */ jsx(EditableText, { type: "date", value: data.subscription_ends_at, onChange: (v) => setData("subscription_ends_at", v) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800", children: [
              /* @__PURE__ */ jsx(Globe, { size: 14, className: "text-sky-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-400 uppercase tracking-widest", children: "Locale & Currency" })
            ] }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Timezone", icon: Globe, children: /* @__PURE__ */ jsx(EditableText, { value: data.timezone, onChange: (v) => setData("timezone", v), placeholder: "e.g. Asia/Karachi" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Currency Code", icon: DollarSign, children: /* @__PURE__ */ jsx(EditableText, { value: data.currency_code, onChange: (v) => setData("currency_code", v), placeholder: "e.g. PKR, USD" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Currency Symbol", icon: DollarSign, children: /* @__PURE__ */ jsx(EditableText, { value: data.currency_symbol, onChange: (v) => setData("currency_symbol", v), placeholder: "e.g. ₨, $" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-4 mb-2 pt-4 border-t border-slate-800", children: [
              /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-amber-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-400 uppercase tracking-widest", children: "Feature Flags" })
            ] }),
            [
              { key: "feature_variants", label: "Product Variants" },
              { key: "feature_serials", label: "Serial Number Tracking" },
              { key: "feature_batches", label: "Batch / Expiry Tracking" },
              { key: "feature_manufacturing", label: "Manufacturing Module" }
            ].map(({ key, label }) => /* @__PURE__ */ jsx(FieldRow, { label, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Toggle, { value: data[key], onChange: (v) => setData(key, v) }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${data[key] ? "text-emerald-400" : "text-slate-600"}`, children: data[key] ? "Enabled" : "Disabled" })
            ] }) }, key)),
            /* @__PURE__ */ jsx("div", { className: "pt-5 pb-4 border-t border-slate-800 mt-4", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 text-sm",
                children: [
                  /* @__PURE__ */ jsx(Save, { size: 15 }),
                  " ",
                  processing ? "Saving…" : "Save All Changes"
                ]
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-6 py-4 border-b border-slate-800", children: [
            /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-slate-400" }),
            /* @__PURE__ */ jsx("h3", { className: "font-black text-white text-sm uppercase tracking-widest", children: "Override History" })
          ] }),
          override_history.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
            /* @__PURE__ */ jsx(Info, { size: 32, className: "mx-auto mb-3 text-slate-700" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-600 font-medium", children: "No overrides applied yet." })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-800/50", children: ["Key", "Value", "Original", "Reason", "Expires", ""].map((h) => /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest", children: h }, h)) }) }),
            /* @__PURE__ */ jsx("tbody", { children: override_history.map((o, i) => {
              const isExpired = o.expires_at && new Date(o.expires_at) < /* @__PURE__ */ new Date();
              return /* @__PURE__ */ jsxs("tr", { className: `border-t border-slate-800 ${isExpired ? "opacity-40" : "hover:bg-slate-800/30"}`, children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs text-indigo-400", children: o.override_key }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-bold text-white", children: o.override_value ?? /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "∞" }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500", children: o.original_value ?? "—" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-500 max-w-[160px] truncate", children: o.reason || "—" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: o.expires_at ? /* @__PURE__ */ jsxs("span", { className: `text-xs font-semibold ${isExpired ? "text-red-400" : "text-amber-400"}`, children: [
                  isExpired ? "Expired · " : "",
                  new Date(o.expires_at).toLocaleDateString()
                ] }) : /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-400 font-semibold", children: "Permanent" }) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: !isExpired && /* @__PURE__ */ jsxs("button", { onClick: () => {
                  if (confirm("Remove override?")) {
                    router.delete(route("platform.tenants.overrides.remove", { tenant: tenant.id, override: o.id }));
                  }
                }, className: "flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all", children: [
                  /* @__PURE__ */ jsx(RotateCcw, { size: 11 }),
                  " Revert"
                ] }) })
              ] }, o.id);
            }) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 rounded-3xl border border-slate-800 p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-black text-slate-500 uppercase tracking-widest mb-4", children: "Live Usage" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: [
            { label: "Staff", value: tenant.staff_count, icon: Users, color: "text-indigo-400" },
            { label: "Products", value: tenant.product_count, icon: Package, color: "text-emerald-400" },
            { label: "Sales", value: tenant.sales_count, icon: ShoppingCart, color: "text-amber-400" }
          ].map(({ label, value, icon: Icon, color }) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/60 rounded-2xl p-3 text-center", children: [
            /* @__PURE__ */ jsx(Icon, { size: 16, className: `${color} mx-auto mb-1` }),
            /* @__PURE__ */ jsx("div", { className: "text-xl font-black text-white", children: value }),
            /* @__PURE__ */ jsx("div", { className: "text-2xs font-bold text-slate-500 uppercase", children: label })
          ] }, label)) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-black border uppercase ${statusColor[tenant.status] ?? "bg-slate-800 text-slate-400 border-slate-700"}`, children: tenant.status }),
            /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full text-xs font-black border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 uppercase", children: tenant.plan }),
            /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 rounded-full text-xs font-black border bg-slate-800 text-slate-400 border-slate-700", children: [
              activeOverrides.length,
              " active override",
              activeOverrides.length !== 1 ? "s" : ""
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-slate-800", children: [
            /* @__PURE__ */ jsx(Zap, { size: 15, className: "text-amber-400" }),
            /* @__PURE__ */ jsx("h3", { className: "font-black text-white text-sm uppercase tracking-widest", children: "Plan Limits" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs text-slate-600 font-semibold", children: [
              Object.keys(effective_limits).length,
              " keys"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 space-y-3 max-h-[700px] overflow-y-auto", children: Object.entries(effective_limits).map(([key, info]) => /* @__PURE__ */ jsx(
            LimitCard,
            {
              limitKey: key,
              info,
              tenant,
              availableKeys: available_keys
            },
            key
          )) })
        ] })
      ] })
    ] })
  ] });
}
export {
  OverrideDetail as default
};
