import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { S as StockModuleTabs } from "./StockModuleTabs-CzdhnRlp.js";
import { List, Plus, Tag, Edit, Trash2, X, Save } from "lucide-react";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function AttributesIndex({ attributes }) {
  const { store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
    name: "",
    type: "select",
    // select, text, number
    options: []
    // for select type
  });
  const [optionInput, setOptionInput] = useState("");
  const openModal = (attribute = null) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setData({
        name: attribute.name,
        type: attribute.type,
        options: attribute.options || []
      });
    } else {
      setEditingAttribute(null);
      reset();
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setOptionInput("");
  };
  const addOption = () => {
    if (optionInput.trim()) {
      setData("options", [...data.options, optionInput.trim()]);
      setOptionInput("");
    }
  };
  const removeOption = (index) => {
    const newOptions = data.options.filter((_, i) => i !== index);
    setData("options", newOptions);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAttribute) {
      put(route("store.attributes.update", { store_slug: store?.slug, attribute: editingAttribute.id }), {
        onSuccess: closeModal
      });
    } else {
      post(route("store.attributes.store", { store_slug: store?.slug }), {
        onSuccess: closeModal
      });
    }
  };
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this attribute?")) {
      destroy(route("store.attributes.destroy", { store_slug: store?.slug, attribute: id }));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Product Attributes", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Attributes" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "attributes" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-6 overflow-auto pb-6", children: [
        /* @__PURE__ */ jsx(
          PageHeader,
          {
            title: "Product Attributes",
            subtitle: "Manage custom product attributes (Size, Color, etc.)",
            icon: List,
            breadcrumbs: [
              { label: "Inventory" },
              { label: "Config" },
              { label: "Attributes" }
            ],
            actions: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => openModal(),
                className: "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 20 }),
                  " Add Attribute"
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: attributes.map((attr) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsx(Tag, { size: 20 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: attr.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase tracking-wider", children: attr.type })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openModal(attr),
                  className: "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(attr.id),
                  className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                }
              )
            ] })
          ] }),
          attr.type === "select" && attr.options && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: attr.options.map((opt, idx) => /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium", children: opt }, idx)) })
        ] }, attr.id)) }),
        isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: editingAttribute ? "Edit Attribute" : "Add Attribute" }),
            /* @__PURE__ */ jsx("button", { onClick: closeModal, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
                  placeholder: "e.g. Size, Color",
                  required: true
                }
              ),
              errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Type" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: data.type,
                  onChange: (e) => setData("type", e.target.value),
                  className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "select", children: "Select (Dropdown)" }),
                    /* @__PURE__ */ jsx("option", { value: "text", children: "Text" }),
                    /* @__PURE__ */ jsx("option", { value: "number", children: "Number" })
                  ]
                }
              )
            ] }),
            data.type === "select" && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Options" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: optionInput,
                    onChange: (e) => setOptionInput(e.target.value),
                    onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), addOption()),
                    className: "flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
                    placeholder: "Type option and press Enter"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: addOption,
                    className: "px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors",
                    children: /* @__PURE__ */ jsx(Plus, { size: 16 })
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: data.options.map((opt, idx) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium border border-indigo-100 dark:border-indigo-800", children: [
                opt,
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeOption(idx),
                    className: "hover:text-red-500",
                    children: /* @__PURE__ */ jsx(X, { size: 12 })
                  }
                )
              ] }, idx)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 flex justify-end gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: closeModal,
                  className: "px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  disabled: processing,
                  className: "px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30",
                  children: [
                    /* @__PURE__ */ jsx(Save, { size: 16 }),
                    processing ? "Saving..." : "Save Attribute"
                  ]
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  AttributesIndex as default
};
