import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { Search, Plus, Mail, Phone, MapPin, Edit, Trash2, X, Save } from "lucide-react";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-jV-75rTJ.js";
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
function CustomersIndex({ customers, filters }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
    name: "",
    email: "",
    phone: "",
    address: "",
    pricing_tier: "standard",
    currency_code: "USD",
    is_tax_exempt: false,
    credit_limit: 0,
    date_of_birth: "",
    anniversary_date: "",
    addresses: []
  });
  const addAddress = () => {
    setData("addresses", [...data.addresses, { label: "Shipping", address: "", city: "", state: "", postal_code: "", country: "" }]);
  };
  const removeAddress = (index) => {
    const newAddresses = [...data.addresses];
    newAddresses.splice(index, 1);
    setData("addresses", newAddresses);
  };
  const updateAddress = (index, field, value) => {
    const newAddresses = [...data.addresses];
    newAddresses[index][field] = value;
    setData("addresses", newAddresses);
  };
  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setData({
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        pricing_tier: customer.pricing_tier || "standard",
        currency_code: customer.currency_code || "USD",
        is_tax_exempt: customer.is_tax_exempt || false,
        credit_limit: customer.credit_limit || 0,
        date_of_birth: customer.date_of_birth || "",
        anniversary_date: customer.anniversary_date || "",
        addresses: customer.addresses || []
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
    if (confirm(tt("Are you sure you want to delete this customer?"))) {
      destroy(route("store.customers.destroy", { store_slug: store?.slug, customer: id }));
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("store.customers.index", { store_slug: store?.slug }), { search: searchTerm }, { preserveState: true });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: tt("Customers"), activeMenu: "Contacts", children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Customers") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "customers" }),
      /* @__PURE__ */ jsxs("div", { className: "pb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center mb-6 gap-4", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "relative w-full md:w-96", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted", size: 20 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: tt("Search customers..."),
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-surface text-ink-secondary dark:text-ink focus:ring-2 ring-brand-500/20 outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => openModal(),
              className: "flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-95",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 20 }),
                " ",
                tt("Add Customer")
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl shadow-sm border border-line overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app text-ink-muted text-xs uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Name" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Contact" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Address" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Loyalty Points" }),
            /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold text-right", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: customers.data.length > 0 ? customers.data.map((customer) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold", children: customer.name.charAt(0) }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-ink", children: customer.name })
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 text-sm text-ink-secondary", children: [
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
            /* @__PURE__ */ jsx("td", { className: "p-4 text-ink-secondary text-sm", children: customer.address ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 14 }),
              " ",
              customer.address
            ] }) : "-" }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-ink-secondary font-medium", children: customer.loyalty_points }),
            /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => openModal(customer),
                  className: "p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(customer.id),
                  className: "p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                }
              )
            ] }) })
          ] }, customer.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-8 text-center text-ink-muted", children: tt("No customers found.") }) }) })
        ] }) })
      ] })
    ] }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-normal", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: editingCustomer ? tt("Edit Customer") : tt("Add Customer") }),
        /* @__PURE__ */ jsx("button", { onClick: closeModal, className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
              required: true
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Email" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Phone" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            ),
            errors.phone && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.phone })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Pricing Tier" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.pricing_tier,
                onChange: (e) => setData("pricing_tier", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "standard", children: "Standard" }),
                  /* @__PURE__ */ jsx("option", { value: "gold", children: "Gold (Level 2)" }),
                  /* @__PURE__ */ jsx("option", { value: "silver", children: "Silver (Level 3)" }),
                  /* @__PURE__ */ jsx("option", { value: "bronze", children: "Bronze (Level 4)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Billing Currency" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: data.currency_code,
                onChange: (e) => setData("currency_code", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "USD", children: "USD ($)" }),
                  /* @__PURE__ */ jsx("option", { value: "EUR", children: "EUR (€)" }),
                  /* @__PURE__ */ jsx("option", { value: "GBP", children: "GBP (£)" }),
                  /* @__PURE__ */ jsx("option", { value: "PKR", children: "PKR (Rs)" }),
                  /* @__PURE__ */ jsx("option", { value: "INR", children: "INR (₹)" }),
                  /* @__PURE__ */ jsx("option", { value: "AED", children: "AED (د.إ)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Main Address" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: data.address,
                onChange: (e) => setData("address", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none h-10 resize-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              id: "is_tax_exempt",
              checked: data.is_tax_exempt,
              onChange: (e) => setData("is_tax_exempt", e.target.checked),
              className: "rounded border-line text-brand-600 shadow-sm focus:ring-brand-500"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "is_tax_exempt", className: "text-sm font-medium text-ink-secondary", children: "Tax Exempt (Do not charge tax)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 pt-2", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Credit Limit" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "0",
                value: data.credit_limit,
                onChange: (e) => setData("credit_limit", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Date of Birth" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: data.date_of_birth,
                onChange: (e) => setData("date_of_birth", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Anniversary" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: data.anniversary_date,
                onChange: (e) => setData("anniversary_date", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-2", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary", children: "Additional Addresses" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addAddress,
                className: "text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Add Address"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 max-h-48 overflow-y-auto pr-2", children: [
            data.addresses.map((addr, idx) => /* @__PURE__ */ jsxs("div", { className: "p-3 bg-app rounded-xl border border-line relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeAddress(idx),
                  className: "absolute top-2 right-2 text-ink-muted hover:text-red-500",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-2", children: [
                /* @__PURE__ */ jsx("div", { className: "col-span-1", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Label (e.g. Shipping)",
                    value: addr.label,
                    onChange: (e) => updateAddress(idx, "label", e.target.value),
                    className: "w-full px-2 py-1 text-xs rounded border border-line bg-surface"
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "City",
                    value: addr.city || "",
                    onChange: (e) => updateAddress(idx, "city", e.target.value),
                    className: "w-full px-2 py-1 text-xs rounded border border-line bg-surface"
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  placeholder: "Full Address",
                  value: addr.address,
                  onChange: (e) => updateAddress(idx, "address", e.target.value),
                  className: "w-full px-2 py-1 text-xs rounded border border-line bg-surface resize-none h-16"
                }
              )
            ] }, idx)),
            data.addresses.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-xs text-ink-muted py-2 italic", children: "No additional addresses." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: closeModal,
              className: "px-4 py-2 text-ink-secondary hover:bg-interactive-hover rounded-xl transition-colors text-sm font-medium",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg ",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 16 }),
                processing ? "Saving..." : tt("Save Customer")
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
