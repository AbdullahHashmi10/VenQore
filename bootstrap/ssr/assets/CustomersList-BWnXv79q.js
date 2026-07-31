import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { Search, Plus, Mail, Phone, MapPin, Edit, Trash2, X, Save } from "lucide-react";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-DNI7vPXW.js";
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
function CustomersIndex({ customers, filters }) {
  const { store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setData({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || ""
      });
    } else {
      setEditingCustomer(null);
      reset();
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      put(route("store.customers.update", { store_slug: store?.slug, customer: editingCustomer.id }), {
        onSuccess: closeModal
      });
    } else {
      post(route("store.customers.store", { store_slug: store?.slug }), {
        onSuccess: closeModal
      });
    }
  };
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      destroy(route("store.customers.destroy", { store_slug: store?.slug, customer: id }));
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("store.customers.index", { store_slug: store?.slug }), { search: searchTerm }, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Customers", activeMenu: "Contacts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Customers" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "customers" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center mb-6 gap-4", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "relative w-full md:w-96", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 20 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search customers...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 ring-indigo-500/20 outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => openModal(),
              className: "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 20 }),
                " Add Customer"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Name" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Contact" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Address" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Loyalty Points" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: customers.data.length > 0 ? customers.data.map((customer) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold", children: customer.name.charAt(0) }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-800 dark:text-white", children: customer.name })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400", children: [
              customer.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Mail, { size: 14 }),
                " ",
                customer.email
              ] }),
              customer.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Phone, { size: 14 }),
                " ",
                customer.phone
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-600 dark:text-slate-400 text-sm", children: customer.address ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 14 }),
              " ",
              customer.address
            ] }) : "-" }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-600 dark:text-slate-400 font-medium", children: customer.loyalty_points }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openModal(customer),
                  className: "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(customer.id),
                  className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                }
              )
            ] }) })
          ] }, customer.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-8 text-center text-slate-400", children: "No customers found." }) }) })
        ] }) })
      ] })
    ] }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: editingCustomer ? "Edit Customer" : "Add Customer" }),
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
              required: true
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
              }
            ),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.phone })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Address" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: data.address,
              onChange: (e) => setData("address", e.target.value),
              className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none h-24 resize-none"
            }
          )
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
                processing ? "Saving..." : "Save Customer"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  CustomersIndex as default
};
