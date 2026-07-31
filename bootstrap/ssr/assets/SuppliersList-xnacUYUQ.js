import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { P as PremiumButton } from "./PremiumButton-BcHxfadR.js";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-DNI7vPXW.js";
import { Truck, Plus, Search, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import axios from "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function SuppliersIndex({ suppliers }) {
  const { store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allSuppliers, setAllSuppliers] = useState(suppliers.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(suppliers.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (suppliers.data && suppliers.current_page === 1) {
      setAllSuppliers(suppliers.data);
      setNextPageUrl(suppliers.next_page_url);
    }
  }, [suppliers]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      setAllSuppliers((prev) => [...prev, ...response.data.data]);
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error("Failed to load more suppliers:", error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "800px" }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      router.get(route("store.suppliers.index", { store_slug: store.slug }), { search: searchTerm }, { preserveState: true, preserveScroll: true });
    }
  };
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
    notes: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupplier) {
      put(route("store.suppliers.update", { store_slug: store.slug, supplier: editingSupplier.id }), {
        onSuccess: () => {
          closeModal();
        }
      });
    } else {
      post(route("store.suppliers.store", { store_slug: store.slug }), {
        onSuccess: () => {
          closeModal();
        }
      });
    }
  };
  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setData({
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        tax_id: supplier.tax_id || "",
        notes: supplier.notes || ""
      });
    } else {
      setEditingSupplier(null);
      reset();
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    reset();
  };
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      router.delete(route("store.suppliers.destroy", { store_slug: store.slug, supplier: id }));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Suppliers", activeMenu: "Contacts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Suppliers" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab: "suppliers" }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 flex-1 overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400", children: /* @__PURE__ */ jsx(Truck, { size: 24 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: "Suppliers" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Manage your vendor relationships." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(PremiumButton, { onClick: () => openModal(), children: [
            /* @__PURE__ */ jsx(Plus, { size: 18 }),
            "Add Supplier"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 relative max-w-md", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size: 20 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search suppliers...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: handleServerSearch,
              className: "w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: allSuppliers.map((supplier) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow group", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900 dark:text-white", children: supplier.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => openModal(supplier), className: "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Edit, { size: 16 }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(supplier.id), className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-slate-500 dark:text-slate-400", children: [
            supplier.contact_person && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Truck, { size: 14 }),
              /* @__PURE__ */ jsx("span", { children: supplier.contact_person })
            ] }),
            supplier.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Mail, { size: 14 }),
              /* @__PURE__ */ jsx("a", { href: `mailto:${supplier.email}`, className: "hover:text-indigo-500", children: supplier.email })
            ] }),
            supplier.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Phone, { size: 14 }),
              /* @__PURE__ */ jsx("span", { children: supplier.phone })
            ] }),
            supplier.address && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { size: 14 }),
              /* @__PURE__ */ jsx("span", { className: "truncate", children: supplier.address })
            ] })
          ] })
        ] }, supplier.id)) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm opacity-0 h-4", children: nextPageUrl ? "Loading..." : "" }),
        isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-700", children: /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white", children: editingSupplier ? "Edit Supplier" : "Add New Supplier" }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Company Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  className: "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Contact Person" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.contact_person,
                    onChange: (e) => setData("contact_person", e.target.value),
                    className: "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Phone" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.phone,
                    onChange: (e) => setData("phone", e.target.value),
                    className: "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Email" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  className: "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Address" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: data.address,
                  onChange: (e) => setData("address", e.target.value),
                  rows: "2",
                  className: "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none resize-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: closeModal,
                  className: "px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsx(PremiumButton, { type: "submit", disabled: processing, children: editingSupplier ? "Update Supplier" : "Create Supplier" })
            ] })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  SuppliersIndex as default
};
