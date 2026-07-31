import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { F as FormModal, a as FormField, b as FormInput, c as FormSelect, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import { M as MoneyModuleTabs } from "./MoneyModuleTabs-Bn5c0gSZ.js";
import { Landmark, Wallet, TrendingUp, TrendingDown, Search, Plus, MoreVertical, Edit, ArrowRightLeft, Trash2 } from "lucide-react";
import axios from "axios";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function BankAccountsIndex({ bankAccounts = [], stats = {} }) {
  const { store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    account_number: "",
    bank_name: "",
    account_type: "checking",
    opening_balance: 0,
    current_balance: 0,
    notes: ""
  });
  const [errors, setErrors] = useState({});
  const formatCurrency = (value) => {
    return (value < 0 ? "-" : "") + getCurrencySymbol() + " " + new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value) || 0);
  };
  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      account_number: "",
      bank_name: "",
      account_type: "checking",
      opening_balance: 0,
      current_balance: 0,
      notes: ""
    });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name || "",
      account_number: account.account_number || "",
      bank_name: account.bank_name || "",
      account_type: account.account_type === "Default" ? "cash" : account.account_type || "checking",
      opening_balance: account.opening_balance || 0,
      current_balance: account.current_balance || 0,
      notes: account.notes || ""
    });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleDelete = async (account) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"?`)) return;
    try {
      await axios.delete(route("store.bank-accounts.destroy", { store_slug: store.slug, bankAccount: account.id }));
      router.reload({ only: ["bankAccounts", "stats"] });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete account");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (editingAccount) {
        await axios.put(route("store.bank-accounts.update", { store_slug: store.slug, bankAccount: editingAccount.id }), formData);
      } else {
        await axios.post(route("store.bank-accounts.store", { store_slug: store.slug }), formData);
      }
      setIsModalOpen(false);
      router.reload({ only: ["bankAccounts", "stats"] });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  const filteredAccounts = bankAccounts.filter(
    (acc) => acc.name.toLowerCase().includes(searchTerm.toLowerCase()) || acc.bank_name && acc.bank_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  React.useEffect(() => {
    const handleClickOutside = () => setActiveActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "add") {
      handleCreate();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Bank Accounts", activeMenu: "Money", children: [
    /* @__PURE__ */ jsx(Head, { title: "Bank Accounts" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(MoneyModuleTabs, { activeTab: "accounts", className: "!mb-0" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Landmark, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Balance" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(stats.total_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(Wallet, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Cash on Hand" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: formatCurrency(stats.cash_balance) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Money In (Today)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-blue-600", children: formatCurrency(stats.today_in) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingDown, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Money Out (Today)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-rose-600", children: formatCurrency(stats.today_out) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Bank ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Accounts" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-500", children: [
            filteredAccounts.length,
            " Accounts"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative w-52 hidden md:block", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search accounts...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCreate,
              className: "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Add Account"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[35%]", children: "Account Details" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]", children: "Number" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%]", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%] text-right", children: "Balance" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%] text-right", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredAccounts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-12 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx(Landmark, { size: 32, className: "mb-2 opacity-50" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No accounts found" })
        ] }) }) }) : filteredAccounts.map((account) => /* @__PURE__ */ jsxs(
          "tr",
          {
            className: "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-400",
            onClick: () => router.visit(route("store.bank-accounts.transactions", { store_slug: store.slug, bankAccount: account.id })),
            children: [
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${account.account_type === "cash" ? "bg-emerald-500" : "bg-indigo-500"}`, children: account.account_type === "cash" ? /* @__PURE__ */ jsx(Wallet, { size: 18 }) : /* @__PURE__ */ jsx(Landmark, { size: 18 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: account.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: account.bank_name || "Cash Account" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 font-mono text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell", children: account.account_number ? `****${account.account_number.slice(-4)}` : "-" }),
              /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${account.account_type === "cash" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : account.account_type === "savings" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" : account.account_type === "credit" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"}`, children: account.account_type }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsx("p", { className: `text-sm font-black ${parseFloat(account.current_balance) < 0 ? "text-red-500" : "text-slate-800 dark:text-white"}`, children: formatCurrency(account.current_balance) }) }),
              /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      setActiveActionMenu(activeActionMenu === account.id ? null : account.id);
                    },
                    className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === account.id ? "text-indigo-600 bg-slate-100 dark:bg-slate-800" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600"}`,
                    children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                  }
                ),
                activeActionMenu === account.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        handleEdit(account);
                        setActiveActionMenu(null);
                      },
                      className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300",
                      children: [
                        /* @__PURE__ */ jsx(Edit, { size: 14 }),
                        " Edit Details"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => router.visit(route("store.bank-accounts.transactions", { store_slug: store.slug, bankAccount: account.id })),
                      className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300",
                      children: [
                        /* @__PURE__ */ jsx(ArrowRightLeft, { size: 14 }),
                        " Transactions"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        handleDelete(account);
                        setActiveActionMenu(null);
                      },
                      className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600",
                      children: [
                        /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                        " Delete Account"
                      ]
                    }
                  )
                ] })
              ] }) })
            ]
          },
          account.id
        )) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        title: editingAccount ? "Edit Bank Account" : "Add Bank Account",
        subtitle: editingAccount ? "Update account details" : "Add a new bank or cash account",
        size: "lg",
        errors,
        footer: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => setIsModalOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsx(PrimaryButton, { onClick: handleSubmit, loading, children: editingAccount ? "Update" : "Create" })
        ] }),
        children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Account Name", required: true, error: errors.name?.[0], children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                placeholder: "e.g., Main Business Account",
                error: errors.name
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Account Type", required: true, error: errors.account_type?.[0], children: /* @__PURE__ */ jsxs(
              FormSelect,
              {
                value: formData.account_type,
                onChange: (e) => setFormData({ ...formData, account_type: e.target.value }),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "cash", children: "Cash" }),
                  /* @__PURE__ */ jsx("option", { value: "checking", children: "Checking Account" }),
                  /* @__PURE__ */ jsx("option", { value: "savings", children: "Savings Account" }),
                  /* @__PURE__ */ jsx("option", { value: "credit", children: "Credit Card" })
                ]
              }
            ) })
          ] }),
          formData.account_type !== "cash" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Bank Name", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.bank_name,
                onChange: (e) => setFormData({ ...formData, bank_name: e.target.value }),
                placeholder: "e.g., HBL, UBL, Meezan"
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Account Number", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.account_number,
                onChange: (e) => setFormData({ ...formData, account_number: e.target.value }),
                placeholder: "Enter account number"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Opening Balance", hint: "Initial balance when adding this account", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "number",
                value: formData.opening_balance,
                onChange: (e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 }),
                placeholder: "0"
              }
            ) }),
            editingAccount && /* @__PURE__ */ jsx(FormField, { label: "Current Balance", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "number",
                value: formData.current_balance,
                disabled: true,
                className: "bg-slate-50 dark:bg-slate-800/50"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx(FormField, { label: "Notes", children: /* @__PURE__ */ jsx(
            FormTextarea,
            {
              value: formData.notes,
              onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
              placeholder: "Optional notes about this account",
              rows: 2
            }
          ) })
        ] })
      }
    )
  ] });
}
export {
  BankAccountsIndex as default
};
