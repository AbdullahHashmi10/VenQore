import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head, router, useForm } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-a5p7K_Zs.js";
import { Gift, Plus, RotateCcw, XCircle, Trash2, CheckCircle, Ban, Clock, Copy } from "lucide-react";
import "./PlatformLayout-CV-DtcbF.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ui-Dd6dJcJr.js";
function grantStatus(grant) {
  if (grant.revoked_at) return { label: "Revoked", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: Ban };
  if (grant.expires_at && new Date(grant.expires_at) < /* @__PURE__ */ new Date() && grant.redemption_count === 0) {
    return { label: "Expired (unused)", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock };
  }
  if (grant.redemption_count >= grant.max_redemptions) {
    return { label: "Fully Redeemed", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: CheckCircle };
  }
  return { label: "Active", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle };
}
function durationLabel(grant) {
  const unit = grant.duration_value === 1 ? grant.duration_unit : `${grant.duration_unit}s`;
  return `${grant.duration_value} ${unit.charAt(0).toUpperCase()}${unit.slice(1)}`;
}
function CopyLinkButton({ url, primary = false }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: copy,
      className: primary ? "flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all" : "flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-bold transition-all border border-white/10",
      children: [
        copied ? /* @__PURE__ */ jsx(CheckCircle, { size: 14 }) : /* @__PURE__ */ jsx(Copy, { size: 14 }),
        copied ? "Copied!" : "Copy Link"
      ]
    }
  );
}
function NewGrantDrawer({ open, onClose, plans, onCreated }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    plan_id: plans[0]?.id ?? "",
    duration_value: 1,
    duration_unit: "year",
    label: "",
    max_redemptions: 1,
    expires_at: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post(route("platform.access-grants.store"), {
      onSuccess: () => {
        reset();
        onCreated();
      }
    });
  };
  if (!open) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 bg-black/50", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "w-[480px] bg-slate-900 border-l border-white/10 overflow-y-auto shadow-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-7 py-5 border-b border-white/10", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Gift, { size: 18, className: "text-indigo-400" }),
          " New Gift Link"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-500 hover:text-white text-xl", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "px-7 py-6 space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2", children: "Plan to Grant" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: data.plan_id,
              onChange: (e) => setData("plan_id", e.target.value),
              className: "w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none",
              children: plans.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.display_name || p.name }, p.id))
            }
          ),
          errors.plan_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-1", children: errors.plan_id })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2", children: "Duration — type any amount you want" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                value: data.duration_value,
                onChange: (e) => setData("duration_value", e.target.value),
                className: "w-24 bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.duration_unit,
                onChange: (e) => setData("duration_unit", e.target.value),
                className: "flex-1 bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "day", children: "Days" }),
                  /* @__PURE__ */ jsx("option", { value: "month", children: "Months" }),
                  /* @__PURE__ */ jsx("option", { value: "year", children: "Years" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1.5", children: "e.g. 1 Month, 18 Months, 5 Years — anything you want." }),
          (errors.duration_value || errors.duration_unit) && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-400 mt-1", children: errors.duration_value || errors.duration_unit })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2", children: "Your Note (private — never shown to the customer)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.label,
              onChange: (e) => setData("label", e.target.value),
              placeholder: "e.g. Ahmed — referral gift",
              className: "w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-600"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2", children: "Max Uses" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "1",
                value: data.max_redemptions,
                onChange: (e) => setData("max_redemptions", e.target.value),
                className: "w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mt-1", children: "1 = single customer only" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2", children: "Link Expires" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: data.expires_at,
                onChange: (e) => setData("expires_at", e.target.value),
                className: "w-full bg-white/5 border border-white/10 rounded-xl text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mt-1", children: "Blank = never" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-4 border-t border-white/10", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all", children: "Cancel" }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: processing, className: "flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50", children: processing ? "Creating…" : "Create Gift Link" })
        ] })
      ] })
    ] })
  ] });
}
function NewLinkBanner({ url, onDismiss }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
      /* @__PURE__ */ jsx(CheckCircle, { size: 20, className: "text-emerald-400 shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-emerald-400", children: "Gift link created — send this to your customer:" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 font-mono truncate mt-0.5", children: url })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
      /* @__PURE__ */ jsx(CopyLinkButton, { url, primary: true }),
      /* @__PURE__ */ jsx("button", { onClick: onDismiss, className: "text-slate-500 hover:text-white text-lg px-2", children: "✕" })
    ] })
  ] });
}
function AccessGrantsIndex({ grants, plans }) {
  const { flash } = usePage().props;
  const [showDrawer, setShowDrawer] = useState(false);
  const [newUrl, setNewUrl] = useState(flash?.new_grant_url ?? null);
  useEffect(() => {
    if (flash?.new_grant_url) setNewUrl(flash.new_grant_url);
  }, [flash?.new_grant_url]);
  const revoke = (grant) => {
    if (confirm(`Revoke this gift link${grant.label ? ` ("${grant.label}")` : ""}? It will stop working immediately.`)) {
      router.post(route("platform.access-grants.revoke", { grant: grant.id }));
    }
  };
  const unrevoke = (grant) => {
    router.post(route("platform.access-grants.unrevoke", { grant: grant.id }));
  };
  const destroy = (grant) => {
    if (confirm("Delete this unused gift link permanently?")) {
      router.delete(route("platform.access-grants.destroy", { grant: grant.id }));
    }
  };
  const stats = {
    total: grants.length,
    active: grants.filter((g) => !g.revoked_at && g.redemption_count < g.max_redemptions && (!g.expires_at || new Date(g.expires_at) > /* @__PURE__ */ new Date())).length,
    redeemed: grants.reduce((s, g) => s + g.redemption_count, 0),
    revoked: grants.filter((g) => g.revoked_at).length
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "Gift Access Links", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Gift Access Links" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Gift, { className: "text-indigo-400" }),
            "Gift Access Links"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1", children: "Generate a link that gives a customer any plan for any duration you choose — no payment required." })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowDrawer(true),
            className: "bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 16 }),
              " New Gift Link"
            ]
          }
        )
      ] }),
      newUrl && /* @__PURE__ */ jsx(NewLinkBanner, { url: newUrl, onDismiss: () => setNewUrl(null) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs font-bold uppercase tracking-widest mb-1", children: "Total Links" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-slate-900 dark:text-white", children: stats.total })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-emerald-500/60 text-xs font-bold uppercase tracking-widest mb-1", children: "Active" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-emerald-400", children: stats.active })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-indigo-500/60 text-xs font-bold uppercase tracking-widest mb-1", children: "Redemptions" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-indigo-400", children: stats.redeemed })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-red-500/5 border border-red-500/10 p-6 rounded-3xl", children: [
          /* @__PURE__ */ jsx("p", { className: "text-red-500/60 text-xs font-bold uppercase tracking-widest mb-1", children: "Revoked" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-red-400", children: stats.revoked })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Plan & Duration" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Note" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Uses" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Created" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-white/5", children: grants.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-6 py-16 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-slate-500", children: [
          /* @__PURE__ */ jsx(Gift, { size: 48, className: "opacity-20" }),
          /* @__PURE__ */ jsx("p", { children: "No gift links yet. Create your first one above." })
        ] }) }) }) : grants.map((grant) => {
          const status = grantStatus(grant);
          const StatusIcon = status.icon;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-white/5 transition-colors", children: [
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsx("div", { className: "font-bold text-white text-sm", children: grant.plan?.display_name || grant.plan?.name }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500 mt-0.5", children: durationLabel(grant) })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-400 max-w-[180px] truncate", children: grant.label || /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "—" }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${status.color}`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { size: 11 }),
              " ",
              status.label
            ] }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 text-sm text-slate-400", children: [
              grant.redemption_count,
              " / ",
              grant.max_redemptions
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-sm text-slate-500", children: new Date(grant.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsx(CopyLinkButton, { url: `${window.location.origin}/gift/${grant.token}` }),
              grant.revoked_at ? /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => unrevoke(grant),
                  title: "Re-activate",
                  className: "p-1.5 text-emerald-400/70 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(RotateCcw, { size: 14 })
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => revoke(grant),
                  title: "Revoke",
                  className: "p-1.5 text-amber-400/70 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(XCircle, { size: 14 })
                }
              ),
              grant.redemption_count === 0 && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => destroy(grant),
                  title: "Delete",
                  className: "p-1.5 text-red-400/70 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                }
              )
            ] }) })
          ] }, grant.id);
        }) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsx(
      NewGrantDrawer,
      {
        open: showDrawer,
        onClose: () => setShowDrawer(false),
        plans,
        onCreated: () => setShowDrawer(false)
      }
    )
  ] });
}
export {
  AccessGrantsIndex as default
};
