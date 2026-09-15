import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, useForm, Link, router } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-BaNZJSYy.js";
import { ArrowLeft, AlertTriangle, CheckCircle, Gift, Plus, Building2, User, Tag, Package, Shield, Calendar, Globe, DollarSign, Zap, Save, Clock, Users, ShoppingCart, Sparkles, Search, RotateCcw, Edit2, AlertCircle, X } from "lucide-react";
import "./PlatformLayout-BPJ5VHcU.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./ui-CcDUonPh.js";
import "./runtime-DwSFgQZq.js";
import "./AiIsland-qlixTg74.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
function Toggle({ value, onChange }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(!value),
      className: `w-11 h-6 rounded-full p-0.5 transition-all duration-200 focus:outline-none ${value ? "bg-[#0BAA8F]" : "bg-neutral-700"}`,
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${value ? "translate-x-5" : "translate-x-0"}`
        }
      )
    }
  );
}
function FieldRow({ label, icon: Icon, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 py-3.5 border-b border-white/[0.05] last:border-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-48 shrink-0 pt-1", children: [
      Icon && /* @__PURE__ */ jsx(Icon, { size: 14, className: "text-neutral-400 shrink-0" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-400 uppercase tracking-wider", children: label })
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
      className: "w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F] focus:border-[#0BAA8F] transition-all placeholder:text-neutral-600"
    }
  );
}
function EditableSelect({ value, onChange, options }) {
  return /* @__PURE__ */ jsx(
    "select",
    {
      value: value ?? "",
      onChange: (e) => onChange(e.target.value),
      className: "w-full bg-neutral-900/80 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F] transition-all",
      children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, className: "bg-neutral-900 text-white", children: o.label }, o.value))
    }
  );
}
function checkIsBelowPlan(overrideVal, planDef) {
  if (overrideVal === null || overrideVal === void 0 || overrideVal === "") return false;
  if (planDef === null || planDef === void 0 || planDef === "") return false;
  const numOverride = Number(overrideVal);
  const numPlan = Number(planDef);
  if (!isNaN(numOverride) && !isNaN(numPlan)) {
    return numOverride < numPlan;
  }
  const isPlanEnabled = planDef === "1" || planDef === true || planDef === 1;
  const isOverrideDisabled = overrideVal === "0" || overrideVal === false || overrideVal === 0;
  if (isPlanEnabled && isOverrideDisabled) {
    return true;
  }
  return false;
}
function LimitCard({ limitKey, info, tenant }) {
  const [editing, setEditing] = useState(false);
  const { data, setData, post, processing, reset } = useForm({
    override_key: limitKey,
    override_value: info.override ?? "",
    reason: info.reason ?? "",
    expires_at: info.expires_at ? info.expires_at.substring(0, 16) : "",
    notify_user: false,
    notification_message: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("platform.tenants.overrides.apply", { tenant: tenant.id }), {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setEditing(false);
      }
    });
  };
  const removeOverride = () => {
    if (info.override_id && confirm("Remove this override? Tenant will revert to the plan default value.")) {
      router.delete(route("platform.tenants.overrides.remove", { tenant: tenant.id, override: info.override_id }), {
        preserveScroll: true
      });
    }
  };
  const hasOverride = info.override !== null && info.override !== void 0 && info.override !== "";
  const isCurrentlyBelow = info.is_below;
  const displayValue = info.effective === null ? "∞" : String(info.effective);
  const isBelowWarning = useMemo(() => {
    return checkIsBelowPlan(data.override_value, info.plan_default);
  }, [data.override_value, info.plan_default]);
  const isLtdSkuWarning = tenant.plan?.startsWith("ltd") && limitKey === "sku_limit";
  const adjustValue = (delta) => {
    const current = data.override_value === "" || data.override_value === null ? Number(info.plan_default) || 0 : Number(data.override_value);
    if (!isNaN(current)) {
      const next = Math.max(0, current + delta);
      setData("override_value", String(next));
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `rounded-2xl border p-4 transition-all ${hasOverride ? isCurrentlyBelow ? "bg-amber-500/10 border-amber-500/40" : "bg-[#0BAA8F]/5 border-[#0BAA8F]/30" : "bg-neutral-900/90 border-white/[0.08] hover:border-white/20"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-neutral-300 font-bold uppercase tracking-wider truncate", title: limitKey, children: limitKey }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 shrink-0", children: hasOverride ? /* @__PURE__ */ jsxs(Fragment, { children: [
        isCurrentlyBelow ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase", title: "This override restricts tenant below plan default!", children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 10, className: "text-amber-400" }),
          " Below Plan"
        ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-[#0BAA8F] bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 px-2 py-0.5 rounded-full uppercase", children: [
          /* @__PURE__ */ jsx(Zap, { size: 10 }),
          " Override"
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: removeOverride,
            className: "p-1 text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors",
            title: "Revert to plan default",
            children: /* @__PURE__ */ jsx(RotateCcw, { size: 12 })
          }
        )
      ] }) : /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase", children: [
        /* @__PURE__ */ jsx(CheckCircle, { size: 10 }),
        " Plan Default"
      ] }) })
    ] }),
    !editing ? /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between mt-1", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold font-mono tracking-tight text-white", children: displayValue }),
        hasOverride && /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-400 mt-1 flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { children: "Base default:" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-neutral-200 font-bold", children: info.plan_default === null ? "∞" : String(info.plan_default) })
        ] }),
        info.reason && /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-1 italic", children: info.reason }),
        info.expires_at && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-amber-400 mt-1 font-medium", children: [
          /* @__PURE__ */ jsx(Clock, { size: 11 }),
          " Expires ",
          new Date(info.expires_at).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            setData("override_value", info.override !== null && info.override !== void 0 ? String(info.override) : info.plan_default !== null ? String(info.plan_default) : "");
            setEditing(true);
          },
          className: "p-2 text-neutral-400 hover:text-[#0BAA8F] hover:bg-[#0BAA8F]/10 rounded-xl transition-all",
          title: "Adjust value",
          children: /* @__PURE__ */ jsx(Edit2, { size: 14 })
        }
      )
    ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3 mt-3 pt-3 border-t border-white/10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-neutral-400 mb-1", children: [
          /* @__PURE__ */ jsx("span", { children: "Override Value (blank = unlimited)" }),
          /* @__PURE__ */ jsxs("span", { className: "font-mono text-neutral-500", children: [
            "Base: ",
            info.plan_default === null ? "∞" : String(info.plan_default)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => adjustValue(-10),
              className: "px-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300",
              title: "Decrease by 10",
              children: "-10"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => adjustValue(-1),
              className: "px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300",
              title: "Decrease by 1",
              children: "-1"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.override_value,
              onChange: (e) => setData("override_value", e.target.value),
              placeholder: "Value (blank = ∞)",
              className: "flex-1 bg-neutral-950 border border-white/20 rounded-xl px-3 py-2 text-sm font-mono text-white text-center focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => adjustValue(1),
              className: "px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]",
              title: "Increase by 1",
              children: "+1"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => adjustValue(10),
              className: "px-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]",
              title: "Increase by 10",
              children: "+10"
            }
          )
        ] })
      ] }),
      (info.plan_default === "0" || info.plan_default === "1" || info.plan_default === false || info.plan_default === true) && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setData("override_value", "1"),
            className: `flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${data.override_value === "1" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`,
            children: "✓ Enabled (1)"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setData("override_value", "0"),
            className: `flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${data.override_value === "0" ? "bg-rose-500/20 border-rose-500/50 text-rose-300" : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"}`,
            children: "✕ Disabled (0)"
          }
        )
      ] }),
      isBelowWarning && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 animate-pulse", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "shrink-0 mt-0.5 text-amber-400" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "⚠️ Warning: Below Base Plan Level!" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-0.5 text-amber-300/90 leading-relaxed", children: [
            "You entered ",
            /* @__PURE__ */ jsx("strong", { className: "text-white font-mono", children: data.override_value }),
            ", which is ",
            /* @__PURE__ */ jsx("strong", { children: "LOWER" }),
            " than the tenant's base plan default (",
            /* @__PURE__ */ jsx("strong", { className: "text-white font-mono", children: info.plan_default ?? "∞" }),
            "). This restricts the tenant below their purchased plan tier."
          ] })
        ] })
      ] }),
      isLtdSkuWarning && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-xs flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 15, className: "shrink-0 mt-0.5 text-purple-400" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: "LTD Tier Notice:" }),
          " SKU limit is an anchor for LTD classification. Overriding it may shift tier calculation if snapshots are incomplete."
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: data.reason,
          onChange: (e) => setData("reason", e.target.value),
          placeholder: "Reason (e.g. VIP loyalty upgrade, promo, support ticket)",
          className: "w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Calendar, { size: 13, className: "text-neutral-500 shrink-0" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "datetime-local",
            value: data.expires_at,
            onChange: (e) => setData("expires_at", e.target.value),
            className: "w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]",
            title: "Optional Expiry Date"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-1", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#0BAA8F]/20 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Save, { size: 12 }),
              " ",
              processing ? "Saving…" : "Save Override"
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
            className: "px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-all",
            children: /* @__PURE__ */ jsx(X, { size: 12 })
          }
        )
      ] })
    ] })
  ] });
}
function OverrideDetail({
  tenant,
  effective_limits,
  override_history,
  available_keys,
  available_keys_metadata,
  plans,
  addons_catalogue,
  active_addons
}) {
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
    patch(route("platform.tenants.overrides.update", { tenant: tenant.id }), {
      preserveScroll: true
    });
  };
  const [selectedKey, setSelectedKey] = useState("");
  const [keySearch, setKeySearch] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [customExpiry, setCustomExpiry] = useState("");
  const [submittingCustom, setSubmittingCustom] = useState(false);
  const filteredAvailableKeys = useMemo(() => {
    if (!keySearch.trim()) return (available_keys || []).slice(0, 30);
    const q = keySearch.toLowerCase();
    return (available_keys || []).filter((k) => k.toLowerCase().includes(q)).slice(0, 30);
  }, [available_keys, keySearch]);
  const selectedKeyMeta = useMemo(() => {
    if (!selectedKey || !available_keys_metadata) return null;
    return available_keys_metadata[selectedKey] || null;
  }, [selectedKey, available_keys_metadata]);
  const customIsBelowWarning = useMemo(() => {
    if (!selectedKeyMeta) return false;
    return checkIsBelowPlan(customValue, selectedKeyMeta.plan_default);
  }, [customValue, selectedKeyMeta]);
  const handleApplyCustomOverride = (e) => {
    e.preventDefault();
    if (!selectedKey) return;
    setSubmittingCustom(true);
    router.post(
      route("platform.tenants.overrides.apply", { tenant: tenant.id }),
      {
        override_key: selectedKey,
        override_value: customValue,
        reason: customReason || "Manual platform override",
        expires_at: customExpiry || null
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSelectedKey("");
          setCustomValue("");
          setCustomReason("");
          setCustomExpiry("");
        },
        onFinish: () => setSubmittingCustom(false)
      }
    );
  };
  const [addonSlug, setAddonSlug] = useState("");
  const [addonQty, setAddonQty] = useState(1);
  const [addonExpiry, setAddonExpiry] = useState("");
  const [addonReason, setAddonReason] = useState("");
  const [submittingAddon, setSubmittingAddon] = useState(false);
  const [revokingReason, setRevokingReason] = useState(null);
  const selectedAddonDetails = useMemo(() => {
    if (!addonSlug || !addons_catalogue) return null;
    return addons_catalogue[addonSlug] || null;
  }, [addonSlug, addons_catalogue]);
  const handleGrantAddon = (e) => {
    e.preventDefault();
    if (!addonSlug) return;
    setSubmittingAddon(true);
    router.post(
      route("platform.tenants.overrides.grant-addon", { tenant: tenant.id }),
      {
        addon_slug: addonSlug,
        quantity: addonQty,
        expires_at: addonExpiry || null,
        reason: addonReason || null
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setAddonSlug("");
          setAddonQty(1);
          setAddonExpiry("");
          setAddonReason("");
        },
        onFinish: () => setSubmittingAddon(false)
      }
    );
  };
  const handleRevokeAddon = (reasonPrefix) => {
    if (confirm(`Revoke all overrides tagged "${reasonPrefix}"? Tenant limits will revert to base plan level.`)) {
      setRevokingReason(reasonPrefix);
      router.post(
        route("platform.tenants.overrides.revoke-addon", { tenant: tenant.id }),
        { reason_prefix: reasonPrefix },
        {
          preserveScroll: true,
          onFinish: () => setRevokingReason(null)
        }
      );
    }
  };
  const planOptions = useMemo(() => {
    const list = (plans || []).map((p) => ({
      value: p.slug,
      label: p.display_name || p.name || p.slug
    }));
    const hasCurrent = list.some((o) => o.value === tenant.plan);
    if (!hasCurrent && tenant.plan) {
      list.unshift({
        value: tenant.plan,
        label: `${tenant.plan.toUpperCase()} (Legacy)`
      });
    }
    return list;
  }, [plans, tenant.plan]);
  const statusOptions = [
    { value: "trial", label: "Trial" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "cancelled", label: "Cancelled" }
  ];
  const statusColor = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    trial: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    suspended: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };
  (override_history || []).filter(
    (o) => !o.expires_at || new Date(o.expires_at) > /* @__PURE__ */ new Date()
  );
  const belowPlanCount = Object.values(effective_limits || {}).filter((info) => info.is_below).length;
  return /* @__PURE__ */ jsx(PlatformShell, { title: `Store — ${tenant.name}`, mode: "admin", activeMenu: "Tenant Overrides", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-2", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("platform.tenants.overrides"),
              className: "hover:text-[#0BAA8F] transition-colors flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
                " Tenant Overrides"
              ]
            }
          ),
          /* @__PURE__ */ jsx("span", { children: "/" }),
          /* @__PURE__ */ jsx("span", { className: "text-white font-mono", children: tenant.slug })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { children: tenant.name }),
          /* @__PURE__ */ jsx("span", { className: `px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border uppercase ${statusColor[tenant.status] || "bg-neutral-800 text-neutral-300"}`, children: tenant.status })
        ] })
      ] }),
      belowPlanCount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-amber-400 shrink-0" }),
        /* @__PURE__ */ jsxs("span", { children: [
          belowPlanCount,
          " limit",
          belowPlanCount > 1 ? "s are" : " is",
          " set BELOW base plan level!"
        ] })
      ] })
    ] }),
    flash?.success && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 rounded-2xl text-[#0BAA8F] text-sm font-semibold", children: [
      /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
      " ",
      flash.success
    ] }),
    flash?.error && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-sm font-semibold", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }),
      " ",
      flash.error
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-7 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-[#0BAA8F]/15 border border-[#0BAA8F]/30 flex items-center justify-center text-[#0BAA8F]", children: /* @__PURE__ */ jsx(Gift, { size: 18 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "Add-on Packs & Entitlements" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-0.5", children: "Grant official add-on packages with grouped limits in one click" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-mono font-bold text-[#0BAA8F] bg-[#0BAA8F]/10 border border-[#0BAA8F]/20 px-2.5 py-1 rounded-full", children: "F8 Universal Add-ons" })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleGrantAddon, className: "space-y-4 bg-neutral-900/60 p-4 rounded-xl border border-white/[0.05]", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "sm:col-span-2", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5", children: "Select Add-on Product" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: addonSlug,
                    onChange: (e) => setAddonSlug(e.target.value),
                    className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "-- Choose Add-on Package --" }),
                      Object.entries(addons_catalogue || {}).map(([slug, details]) => /* @__PURE__ */ jsxs("option", { value: slug, children: [
                        details.name,
                        " (",
                        details.price_formatted || `$${details.price}/mo`,
                        ")"
                      ] }, slug))
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5", children: "Quantity" }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "1",
                    max: "20",
                    value: addonQty,
                    onChange: (e) => setAddonQty(Math.max(1, parseInt(e.target.value) || 1)),
                    className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-center text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                  }
                ) })
              ] })
            ] }),
            selectedAddonDetails && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-[#0BAA8F]/10 border border-[#0BAA8F]/25 rounded-xl text-xs space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[#0BAA8F] font-bold", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  selectedAddonDetails.name,
                  " × ",
                  addonQty
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Unlocks ",
                  Object.keys(selectedAddonDetails.entitlements || {}).length,
                  " entitlement(s)"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 pt-1", children: Object.entries(selectedAddonDetails.entitlements || {}).map(([k, v]) => /* @__PURE__ */ jsx("span", { className: "font-mono text-[11px] bg-neutral-950/80 text-neutral-300 px-2 py-0.5 rounded border border-white/10", children: k.startsWith("+") ? `${k} (+${Number(v) * addonQty})` : `${k} = ${v}` }, k)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-400 mb-1", children: "Optional Expiry Date" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "datetime-local",
                    value: addonExpiry,
                    onChange: (e) => setAddonExpiry(e.target.value),
                    className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-400 mb-1", children: "Custom Note / Reason" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: addonReason,
                    onChange: (e) => setAddonReason(e.target.value),
                    placeholder: `Default: add-on: ${addonSlug || "..."} x${addonQty}`,
                    className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: !addonSlug || submittingAddon,
                className: "w-full py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " ",
                  submittingAddon ? "Applying Add-on…" : `Grant ${selectedAddonDetails ? selectedAddonDetails.name : "Add-on"} Pack`
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 pt-5 border-t border-white/[0.08]", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3", children: [
              "Active Add-on Packages (",
              active_addons?.length || 0,
              ")"
            ] }),
            !active_addons || active_addons.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 italic", children: "No add-on packs currently assigned to this store." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: active_addons.map((pack) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center justify-between p-3 rounded-xl bg-neutral-900/90 border border-white/10",
                children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold font-mono text-[#0BAA8F]", children: pack.reason }),
                      pack.expires_at && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full", children: [
                        "Expires ",
                        new Date(pack.expires_at).toLocaleDateString()
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5 mt-1.5", children: pack.keys.map((k) => /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-mono text-neutral-300 bg-white/5 px-2 py-0.5 rounded", children: [
                      k.key,
                      ": ",
                      /* @__PURE__ */ jsx("strong", { className: "text-white", children: k.value ?? "∞" })
                    ] }, k.id)) })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleRevokeAddon(pack.reason),
                      disabled: revokingReason === pack.reason,
                      className: "px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold transition-all shrink-0 ml-3",
                      children: revokingReason === pack.reason ? "Revoking…" : "Revoke Pack"
                    }
                  )
                ]
              },
              pack.reason
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pb-4 mb-4 border-b border-white/[0.08]", children: [
            /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400", children: /* @__PURE__ */ jsx(Building2, { size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-base", children: "Store Profile & Plan Assignment" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mt-0.5", children: "Switch plans, adjust subscription dates, and toggle store configurations" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: saveProfile, className: "space-y-1", children: [
            /* @__PURE__ */ jsx(FieldRow, { label: "Store Name", icon: Building2, children: /* @__PURE__ */ jsx(EditableText, { value: data.name, onChange: (v) => setData("name", v), placeholder: "Store name" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Owner", icon: User, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsx("span", { className: "text-sm text-white font-semibold", children: tenant.owner_name }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-400", children: tenant.owner_email })
            ] }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Store ID / Slug", icon: Tag, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-[#0BAA8F]", children: [
                "#",
                tenant.id
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-neutral-400", children: tenant.slug })
            ] }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Industry", icon: Package, children: /* @__PURE__ */ jsx(EditableText, { value: data.industry, onChange: (v) => setData("industry", v), placeholder: "e.g. Retail, Fashion, Cafe" }) }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Shield, { size: 14, className: "text-[#0BAA8F]" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-[#0BAA8F] uppercase tracking-wider", children: "Plan & Subscription" })
            ] }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Assigned Plan", icon: Shield, children: /* @__PURE__ */ jsx(EditableSelect, { value: data.plan, onChange: (v) => setData("plan", v), options: planOptions }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Account Status", icon: CheckCircle, children: /* @__PURE__ */ jsx(EditableSelect, { value: data.status, onChange: (v) => setData("status", v), options: statusOptions }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Trial End Date", icon: Calendar, children: /* @__PURE__ */ jsx(EditableText, { type: "date", value: data.trial_ends_at, onChange: (v) => setData("trial_ends_at", v) }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Subscription End", icon: Calendar, children: /* @__PURE__ */ jsx(EditableText, { type: "date", value: data.subscription_ends_at, onChange: (v) => setData("subscription_ends_at", v) }) }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Globe, { size: 14, className: "text-sky-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-sky-400 uppercase tracking-wider", children: "Localization" })
            ] }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Timezone", icon: Globe, children: /* @__PURE__ */ jsx(EditableText, { value: data.timezone, onChange: (v) => setData("timezone", v), placeholder: "e.g. Asia/Karachi, UTC" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Currency Code", icon: DollarSign, children: /* @__PURE__ */ jsx(EditableText, { value: data.currency_code, onChange: (v) => setData("currency_code", v), placeholder: "PKR, USD" }) }),
            /* @__PURE__ */ jsx(FieldRow, { label: "Currency Symbol", icon: DollarSign, children: /* @__PURE__ */ jsx(EditableText, { value: data.currency_symbol, onChange: (v) => setData("currency_symbol", v), placeholder: "Rs, $" }) }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 pb-2 border-t border-white/[0.08] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { size: 14, className: "text-amber-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-400 uppercase tracking-wider", children: "Inventory Modules" })
            ] }),
            [
              { key: "feature_variants", label: "Product Variants" },
              { key: "feature_serials", label: "Serial Number Tracking" },
              { key: "feature_batches", label: "Batch & Expiry Tracking" },
              { key: "feature_manufacturing", label: "Manufacturing & Recipes" }
            ].map(({ key, label }) => /* @__PURE__ */ jsx(FieldRow, { label, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Toggle, { value: data[key], onChange: (v) => setData(key, v) }),
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${data[key] ? "text-emerald-400" : "text-neutral-500"}`, children: data[key] ? "Enabled" : "Disabled" })
            ] }) }, key)),
            /* @__PURE__ */ jsx("div", { className: "pt-6 border-t border-white/[0.08] flex justify-end", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "px-6 py-2.5 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx(Save, { size: 14 }),
                  " ",
                  processing ? "Saving Changes…" : "Save Store Profile"
                ]
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-6 shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-neutral-400" }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm uppercase tracking-wider", children: "Override History & Audit Log" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-neutral-400 font-mono", children: [
              override_history?.length || 0,
              " event",
              override_history?.length !== 1 ? "s" : ""
            ] })
          ] }),
          !override_history || override_history.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 italic py-4 text-center", children: "No overrides recorded yet." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/[0.08] text-neutral-400 font-bold uppercase tracking-wider text-left", children: [
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3", children: "Key" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3", children: "Value" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3", children: "Original" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3", children: "Reason" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 px-3 text-right", children: "Action" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/[0.05]", children: override_history.map((o) => {
              const isExpired = o.expires_at && new Date(o.expires_at) < /* @__PURE__ */ new Date();
              return /* @__PURE__ */ jsxs("tr", { className: isExpired ? "opacity-40" : "hover:bg-white/[0.02]", children: [
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-[#0BAA8F]", children: o.override_key }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-white", children: o.override_value ?? "∞" }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-mono text-neutral-400", children: o.original_value ?? "—" }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-neutral-300 max-w-[140px] truncate", children: o.reason || "—" }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3", children: isExpired ? /* @__PURE__ */ jsx("span", { className: "text-rose-400 font-medium", children: "Expired" }) : o.expires_at ? /* @__PURE__ */ jsxs("span", { className: "text-amber-400 font-medium", children: [
                  "Till ",
                  new Date(o.expires_at).toLocaleDateString()
                ] }) : /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-medium", children: "Active" }) }),
                /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right", children: !isExpired && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      if (confirm(`Revert ${o.override_key} override?`)) {
                        router.delete(route("platform.tenants.overrides.remove", { tenant: tenant.id, override: o.id }));
                      }
                    },
                    className: "px-2 py-1 rounded bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[11px] font-bold transition-all",
                    children: "Revert"
                  }
                ) })
              ] }, o.id);
            }) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "xl:col-span-5 space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3", children: "Live Tenant Usage" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: [
            { label: "Staff", value: tenant.staff_count, icon: Users, color: "text-sky-400" },
            { label: "Products", value: tenant.product_count, icon: Package, color: "text-emerald-400" },
            { label: "Sales", value: tenant.sales_count, icon: ShoppingCart, color: "text-amber-400" }
          ].map(({ label, value, icon: Icon, color }) => /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/80 rounded-xl p-3 text-center border border-white/[0.05]", children: [
            /* @__PURE__ */ jsx(Icon, { size: 16, className: `${color} mx-auto mb-1` }),
            /* @__PURE__ */ jsx("div", { className: "text-xl font-bold font-mono text-white", children: value }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-neutral-400 uppercase tracking-wider", children: label })
          ] }, label)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] p-5 shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 16, className: "text-[#0BAA8F]" }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm uppercase tracking-wider", children: "Grant Any Feature / Override" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-400 mb-4", children: "Grant any of the 227 canonical capabilities or custom limits to this store." }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleApplyCustomOverride, className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-neutral-300 mb-1", children: "Select Capability / Limit Key" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-2.5 text-neutral-500" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: keySearch,
                    onChange: (e) => setKeySearch(e.target.value),
                    placeholder: "Search all 227 canonical keys (e.g. multi_branch, locations)...",
                    className: "w-full bg-neutral-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: selectedKey,
                  onChange: (e) => {
                    const k = e.target.value;
                    setSelectedKey(k);
                    const meta = available_keys_metadata?.[k];
                    if (meta && meta.plan_default !== null) {
                      setCustomValue(String(meta.plan_default));
                    } else {
                      setCustomValue("");
                    }
                  },
                  className: "w-full mt-1.5 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]",
                  children: [
                    /* @__PURE__ */ jsxs("option", { value: "", children: [
                      "-- Choose Key to Override (",
                      filteredAvailableKeys.length,
                      " matching) --"
                    ] }),
                    filteredAvailableKeys.map((k) => {
                      const meta = available_keys_metadata?.[k];
                      const defStr = meta?.plan_default === null ? "∞" : meta?.plan_default ?? "not in plan";
                      return /* @__PURE__ */ jsxs("option", { value: k, children: [
                        k,
                        " (Base: ",
                        defStr,
                        ")"
                      ] }, k);
                    })
                  ]
                }
              )
            ] }),
            selectedKey && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-neutral-900/90 rounded-xl border border-white/10 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-[#0BAA8F]", children: selectedKey }),
                /* @__PURE__ */ jsxs("span", { className: "text-neutral-400", children: [
                  "Base default: ",
                  /* @__PURE__ */ jsx("strong", { className: "text-white font-mono", children: selectedKeyMeta?.plan_default ?? "None" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      const cur = Number(customValue) || 0;
                      setCustomValue(String(Math.max(0, cur - 1)));
                    },
                    className: "px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-neutral-300",
                    children: "-1"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: customValue,
                    onChange: (e) => setCustomValue(e.target.value),
                    placeholder: "Value (blank = ∞)",
                    className: "flex-1 bg-neutral-950 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-mono text-white text-center focus:outline-none focus:ring-2 focus:ring-[#0BAA8F]"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      const cur = Number(customValue) || 0;
                      setCustomValue(String(cur + 1));
                    },
                    className: "px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]",
                    children: "+1"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      const cur = Number(customValue) || 0;
                      setCustomValue(String(cur + 10));
                    },
                    className: "px-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#0BAA8F]",
                    children: "+10"
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setCustomValue("1"),
                    className: "flex-1 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
                    children: "✓ Enable (1)"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setCustomValue("0"),
                    className: "flex-1 py-1 text-xs font-bold rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30",
                    children: "✕ Disable (0)"
                  }
                )
              ] }),
              customIsBelowWarning && /* @__PURE__ */ jsxs("div", { className: "p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 15, className: "shrink-0 mt-0.5 text-amber-400" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Below Base Plan Warning:" }),
                  " The value ",
                  /* @__PURE__ */ jsx("strong", { children: customValue }),
                  " is lower than the base plan level (",
                  /* @__PURE__ */ jsx("strong", { children: selectedKeyMeta?.plan_default ?? "∞" }),
                  ")."
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: customReason,
                  onChange: (e) => setCustomReason(e.target.value),
                  placeholder: "Reason for granting this override",
                  className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "datetime-local",
                  value: customExpiry,
                  onChange: (e) => setCustomExpiry(e.target.value),
                  className: "w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white",
                  title: "Optional Expiry"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: submittingCustom,
                  className: "w-full py-2 bg-[#0BAA8F] hover:bg-[#09927b] text-white rounded-xl text-xs font-bold transition-all shadow-md",
                  children: submittingCustom ? "Applying…" : `Apply Override for ${selectedKey}`
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0D1322]/90 rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-white/[0.08]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx(Zap, { size: 16, className: "text-[#0BAA8F]" }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm uppercase tracking-wider", children: "Effective Plan Limits" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-neutral-400", children: [
              Object.keys(effective_limits || {}).length,
              " configured"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 space-y-3 max-h-[750px] overflow-y-auto", children: Object.entries(effective_limits || {}).map(([key, info]) => /* @__PURE__ */ jsx(
            LimitCard,
            {
              limitKey: key,
              info,
              tenant
            },
            key
          )) })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  OverrideDetail as default
};
