import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { P as PlatformShell } from "./PlatformShell-a5p7K_Zs.js";
import { Plus, Database, Edit2, Save, X, Shield } from "lucide-react";
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
function PlatformIndex({ platforms }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: "",
    slug: "",
    is_active: true
  });
  const startAdd = () => {
    reset();
    setIsAdding(true);
    setEditingId(null);
  };
  const startEdit = (p) => {
    setData({
      name: p.name,
      slug: p.slug,
      is_active: p.is_active
    });
    setEditingId(p.id);
    setIsAdding(false);
  };
  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    reset();
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      put(route("platform.platforms.update", editingId), {
        onSuccess: () => cancel()
      });
    } else {
      post(route("platform.platforms.store"), {
        onSuccess: () => cancel()
      });
    }
  };
  return /* @__PURE__ */ jsxs(PlatformShell, { title: "System Platforms", mode: "admin", activeMenu: "Platforms", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white", children: "System Platforms" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 mt-1", children: "Define high-level software platforms (e.g. VenQore Cloud, VenQore On-Prem)" })
      ] }),
      !isAdding && !editingId && /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: startAdd,
          className: "flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 18 }),
            " Add Platform"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-4", children: [
        platforms.map((p) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `p-6 rounded-3xl border transition-all flex items-center justify-between ${editingId === p.id ? "bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10" : "bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center ${p.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500"}`, children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-white", children: p.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-mono text-slate-500 uppercase tracking-widest", children: p.slug })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.is_active ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-slate-800 text-slate-500 border border-slate-700"}`, children: p.is_active ? "Active" : "Disabled" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => startEdit(p),
                    className: "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all",
                    children: /* @__PURE__ */ jsx(Edit2, { size: 18 })
                  }
                )
              ] })
            ]
          },
          p.id
        )),
        platforms.length === 0 && /* @__PURE__ */ jsxs("div", { className: "p-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800", children: [
          /* @__PURE__ */ jsx(Database, { size: 48, className: "mx-auto mb-4 text-slate-700" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium", children: "No platforms defined yet." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: isAdding || editingId ? /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl p-8 sticky top-28 shadow-2xl", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-white mb-6 flex items-center gap-3", children: [
          editingId ? /* @__PURE__ */ jsx(Edit2, { size: 20, className: "text-indigo-400" }) : /* @__PURE__ */ jsx(Plus, { size: 20, className: "text-emerald-400" }),
          editingId ? "Edit Platform" : "New Platform"
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-black text-slate-400 uppercase tracking-widest mb-2", children: "Platform Name" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.name,
                onChange: (e) => {
                  setData("name", e.target.value);
                  if (!editingId) setData("slug", e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""));
                },
                className: "w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold",
                placeholder: "e.g. VenQore Cloud",
                required: true
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-black text-slate-400 uppercase tracking-widest mb-2", children: "Identifier (Slug)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.slug,
                onChange: (e) => setData("slug", e.target.value),
                className: "w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm uppercase tracking-tighter",
                placeholder: "E.G. CLOUD-S1",
                required: true
              }
            ),
            errors.slug && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-1", children: errors.slug })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-300", children: "Status Active" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setData("is_active", !data.is_active),
                className: `w-12 h-6 rounded-full p-1 transition-all ${data.is_active ? "bg-emerald-600" : "bg-slate-700"}`,
                children: /* @__PURE__ */ jsx("div", { className: `w-4 h-4 bg-white rounded-full transition-all ${data.is_active ? "translate-x-6" : "translate-x-0"}` })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20",
                children: [
                  /* @__PURE__ */ jsx(Save, { size: 18 }),
                  editingId ? "Update Platform" : "Save Platform"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: cancel,
                className: "w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest transition-all",
                children: [
                  /* @__PURE__ */ jsx(X, { size: 18 }),
                  " Cancel"
                ]
              }
            )
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-10 text-center", children: [
        /* @__PURE__ */ jsx(Shield, { size: 40, className: "mx-auto mb-4 text-slate-700 opacity-50" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-sm font-medium", children: "Select a platform to edit or add a new one." })
      ] }) })
    ] })
  ] });
}
export {
  PlatformIndex as default
};
