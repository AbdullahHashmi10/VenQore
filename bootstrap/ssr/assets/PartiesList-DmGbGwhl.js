import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, router, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { C as ContactsModuleTabs } from "./ContactsModuleTabs-DNI7vPXW.js";
import { u as useAlert, F as FormModal, a as FormField, b as FormInput, c as FormSelect, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import { ChevronDown, Users, UserCheck, TrendingUp, TrendingDown, Search, Filter, Download, Printer, Plus, Trash2, X, Building2, FileText, Edit2, ChevronUp } from "lucide-react";
import axios from "axios";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function PartiesIndex({ parties = {}, stats = {}, flash }) {
  const { showAlert, showConfirm } = useAlert();
  const { url, store } = usePage().props;
  const { url: currentUrl } = usePage();
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const isLedgersRoute = currentUrl.includes("ledgers");
  const activeTab = isLedgersRoute ? "ledgers" : type === "customer" ? "customers" : type === "supplier" ? "suppliers" : "all";
  const [allParties, setAllParties] = useState(Array.isArray(parties.data) ? parties.data : []);
  const [nextPageUrl, setNextPageUrl] = useState(parties.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(params.get("type") || (params.get("type") === null ? isLedgersRoute ? "all" : activeTab : params.get("type")) || "all");
  const [sortConfig, setSortConfig] = useState({
    key: params.get("sort_by") || "name",
    direction: params.get("sort_dir") || "asc"
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinToSubmit, setPinToSubmit] = useState("");
  const [partyToDelete, setPartyToDelete] = useState(null);
  const [pinError, setPinError] = useState("");
  const [selectedParties, setSelectedParties] = useState([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [debouncedSearch] = useMemo(() => {
    let timer;
    return [
      (val) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          applyFilters({ search: val });
        }, 400);
      }
    ];
  }, [sortConfig, typeFilter]);
  useEffect(() => {
    if (searchTerm !== (params.get("search") || "")) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm]);
  const applyFilters = (newParams) => {
    router.get(route(isLedgersRoute ? "store.parties.ledgers" : "store.parties.index", { store_slug: store?.slug }), {
      search: searchTerm,
      type: typeFilter,
      sort_by: sortConfig.key,
      sort_dir: sortConfig.direction,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  };
  const sortedParties = allParties;
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    applyFilters({ sort_by: key, sort_dir: direction });
  };
  useEffect(() => {
    if (parties.data && parties.current_page === 1) {
      setAllParties(Array.isArray(parties.data) ? parties.data : []);
      setNextPageUrl(parties.next_page_url);
    }
  }, [parties]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    type: "customer",
    opening_balance: 0,
    opening_balance_type: "receivable",
    credit_limit: "",
    payment_terms: "",
    address: "",
    notes: "",
    category: "",
    sub_category: ""
  });
  const [errors, setErrors] = useState({});
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, {
        headers: { "Accept": "application/json" }
      });
      const newParties = response.data.data;
      setAllParties((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(safePrev.map((p) => p.id));
        const uniqueNew = newParties.filter((p) => !existingIds.has(p.id));
        return [...safePrev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error("Failed to load more parties:", error);
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
      applyFilters({ search: searchTerm });
    }
  };
  const handleTypeFilter = (newType) => {
    setTypeFilter(newType);
    applyFilters({ type: newType });
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" });
  };
  const handleCreate = () => {
    setEditingParty(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      type: "customer",
      opening_balance: 0,
      opening_balance_type: "receivable",
      credit_limit: "",
      payment_terms: "",
      address: "",
      notes: ""
    });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleEdit = (party) => {
    setEditingParty(party);
    setFormData({
      name: party.name || "",
      phone: party.phone || "",
      email: party.email || "",
      type: party.type || "customer",
      opening_balance: party.opening_balance || 0,
      opening_balance_type: party.opening_balance_type || "receivable",
      credit_limit: party.credit_limit || "",
      payment_terms: party.payment_terms || "",
      address: party.address || "",
      notes: party.notes || "",
      category: party.category || "",
      sub_category: party.sub_category || ""
    });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleViewLedger = (party) => {
    router.visit(route("store.parties.ledger", { store_slug: store?.slug, party: party.id }));
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParties(sortedParties.map((p) => p.id));
    } else {
      setSelectedParties([]);
    }
  };
  const handleSelectRow = (id) => {
    if (selectedParties.includes(id)) {
      setSelectedParties(selectedParties.filter((item) => item !== id));
    } else {
      setSelectedParties([...selectedParties, id]);
    }
  };
  const handleDelete = async (party, passcode = null) => {
    if (party === "bulk") {
      if (!passcode) {
        showConfirm({
          title: "Confirm Bulk Delete",
          message: `Are you sure you want to delete the ${selectedParties.length} selected contacts?`,
          confirmLabel: "Yes, Delete Selected",
          onConfirm: () => performBulkDelete(passcode)
        });
      } else {
        performBulkDelete(passcode);
      }
      return;
    }
    if (!passcode) {
      showConfirm({
        title: "Confirm Delete",
        message: `Are you sure you want to delete "${party.name}"?`,
        confirmLabel: "Yes, Delete",
        onConfirm: () => performDelete(party, passcode)
      });
    } else {
      performDelete(party, passcode);
    }
  };
  const performDelete = async (party, passcode = null) => {
    try {
      await axios.delete(route("store.parties.destroy", { store_slug: store?.slug, party: party.id }), { data: { passcode } });
      if (isPinModalOpen) {
        setIsPinModalOpen(false);
        setPinToSubmit("");
        setPinError("");
        setPartyToDelete(null);
      }
      setSelectedParties((prev) => prev.filter((id) => id !== party.id));
      router.reload({ only: ["parties", "stats"] });
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.requires_passcode) {
        setPartyToDelete(party);
        setIsPinModalOpen(true);
      } else if (error.response?.status === 403) {
        setPinError(error.response?.data?.message || "Invalid PIN.");
      } else {
        alert(error.response?.data?.message || "Failed to delete party");
      }
    }
  };
  const performBulkDelete = async (passcode = null) => {
    try {
      await axios.delete(route("store.parties.bulk-destroy", { store_slug: store?.slug }), {
        data: { ids: selectedParties, passcode }
      });
      if (isPinModalOpen) {
        setIsPinModalOpen(false);
        setPinToSubmit("");
        setPinError("");
        setPartyToDelete(null);
      }
      setSelectedParties([]);
      router.reload({ only: ["parties", "stats"] });
    } catch (error) {
      if (error.response?.status === 422 && error.response.data.requires_passcode) {
        setPartyToDelete("bulk");
        setIsPinModalOpen(true);
      } else if (error.response?.status === 403) {
        setPinError(error.response?.data?.message || "Invalid PIN.");
      } else {
        alert(error.response?.data?.message || "Failed to delete selected contacts");
      }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (editingParty) {
        await axios.put(route("store.parties.update", { store_slug: store?.slug, party: editingParty.id }), formData);
      } else {
        await axios.post(route("store.parties.store", { store_slug: store?.slug }), formData);
      }
      setIsModalOpen(false);
      router.reload({ only: ["parties", "stats"] });
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
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Contacts", activeMenu: "Contacts", children: [
    /* @__PURE__ */ jsx(Head, { title: "Contacts" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(ContactsModuleTabs, { activeTab }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "text-[10px] font-bold text-slate-500 truncate", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
            "Rec: ",
            formatCurrency(stats.receivables)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "mx-1", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-rose-600", children: [
            "Pay: ",
            formatCurrency(stats.payables)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 ${isStatsExpanded ? "grid" : "hidden sm:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(Users, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Total Parties" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-none mt-1 sm:mt-0", children: stats.total || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(UserCheck, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Customers" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-blue-600 leading-none mt-1 sm:mt-0", children: stats.customers || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "To Receive" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-emerald-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.receivables) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between items-start gap-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(TrendingDown, { size: 14 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight truncate", children: "Payables" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg font-black text-rose-600 leading-none mt-1 sm:mt-0", children: formatCurrency(stats.payables) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "sm:hidden flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight", children: [
            activeTab === "customers" ? "Customers" : activeTab === "suppliers" ? "Suppliers" : "All",
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Contacts" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-1.5 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-1.5 rounded-lg transition-colors ${showMobileFilters ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Filter",
                children: /* @__PURE__ */ jsx(Filter, { size: 14 })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5 ml-0.5", children: [
              /* @__PURE__ */ jsx("button", { className: "p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCreate,
                className: "ml-1 px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg flex items-center gap-1 transition-all shadow-md font-bold text-[10px]",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 12 }),
                  " Add"
                ]
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: handleServerSearch,
              placeholder: "Search contacts...",
              className: "w-full pl-8 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 12 })
        ] }) }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "px-3 pb-2 border-t border-slate-100 dark:border-slate-800/80 pt-2 animate-in slide-in-from-top duration-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0", children: "Type:" }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-850 rounded-lg p-1 gap-1 flex-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  handleTypeFilter("all");
                  setShowMobileFilters(false);
                },
                className: `flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === "all" ? "bg-white dark:bg-slate-705 text-indigo-650 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`,
                children: "All"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  handleTypeFilter("customer");
                  setShowMobileFilters(false);
                },
                className: `flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === "customer" ? "bg-white dark:bg-slate-705 text-blue-650 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`,
                children: "Customers"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  handleTypeFilter("supplier");
                  setShowMobileFilters(false);
                },
                className: `flex-1 text-center py-1 rounded text-[9px] font-bold uppercase transition-all ${typeFilter === "supplier" ? "bg-white dark:bg-slate-705 text-amber-650 dark:text-amber-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`,
                children: "Suppliers"
              }
            )
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex flex-row items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-sm sm:text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
              activeTab === "customers" ? "Customers" : activeTab === "suppliers" ? "Suppliers" : "All",
              " ",
              /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Contacts" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleTypeFilter("all"),
                className: `px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === "all" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                children: "All"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleTypeFilter("customer"),
                className: `px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === "customer" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm shadow-blue-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                children: "Customers"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleTypeFilter("supplier"),
                className: `px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded-full transition-all shrink-0 ${typeFilter === "supplier" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                children: "Suppliers"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1 sm:flex-none", children: [
            /* @__PURE__ */ jsx(Search, { size: 14, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search...",
                className: "pl-8 pr-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-36"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-1.5", children: [
              /* @__PURE__ */ jsx("button", { className: "p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 14 }) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCreate,
                className: "flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-md shrink-0",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 12 }),
                  /* @__PURE__ */ jsx("span", { children: "Add Party" })
                ]
              }
            )
          ] })
        ] })
      ] }),
      selectedParties.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 shrink-0", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm", children: [
          selectedParties.length,
          " Selected"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => handleDelete("bulk"),
              className: "px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                " Delete Selected"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedParties([]),
              className: "p-1 hover:bg-indigo-700 rounded transition-colors",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:block", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-3 w-10", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer",
                checked: selectedParties.length === sortedParties.length && sortedParties.length > 0,
                onChange: handleSelectAll
              }
            ) }),
            /* @__PURE__ */ jsx(
              "th",
              {
                onClick: () => handleSort("name"),
                className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  "Party Name ",
                  /* @__PURE__ */ jsx(SortIcon, { columnKey: "name" })
                ] })
              }
            ),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Type" }),
            /* @__PURE__ */ jsx(
              "th",
              {
                onClick: () => handleSort("balance"),
                className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-right",
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                  "Balance ",
                  /* @__PURE__ */ jsx(SortIcon, { columnKey: "balance" })
                ] })
              }
            ),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right", children: "Credit Limit" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Phone" }),
            /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedParties.length > 0 ? sortedParties.map((party) => /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer
                                                ${party.type === "customer" ? "border-l-4 border-blue-500" : "border-l-4 border-amber-500"}
                                                ${selectedParties.includes(party.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                            `,
              onClick: () => handleViewLedger(party),
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3 w-10", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer",
                    checked: selectedParties.includes(party.id),
                    onChange: () => handleSelectRow(party.id)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(UserCheck, { size: 14, className: "text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 14, className: "text-amber-600 dark:text-amber-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-slate-800 dark:text-white", children: party.name }),
                    party.email && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: party.email })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"}`, children: party.type === "customer" ? "Customer" : "Supplier" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: `font-bold text-sm ${party.type === "customer" && party.current_balance >= 0 || party.type === "supplier" && party.current_balance < 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(Math.abs(party.current_balance || 0)) }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: party.current_balance > 0 ? party.type === "customer" ? "To Receive" : "To Pay" : party.current_balance < 0 ? party.type === "customer" ? "To Pay" : "To Receive" : "Settled" })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-sm text-slate-600 dark:text-slate-400", children: party.credit_limit ? formatCurrency(party.credit_limit) : "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-600 dark:text-slate-400", children: party.phone || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleViewLedger(party),
                      className: "p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all",
                      title: "View Ledger",
                      children: /* @__PURE__ */ jsx(FileText, { size: 16 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleEdit(party),
                      className: "p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all",
                      title: "Edit",
                      children: /* @__PURE__ */ jsx(Edit2, { size: 16 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDelete(party),
                      className: "p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all",
                      title: "Delete",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                    }
                  )
                ] }) })
              ]
            },
            party.id
          )) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Users, { size: 28, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No parties found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-3", children: "Add your first customer or supplier" }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleCreate,
                className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  "Add Party"
                ]
              }
            )
          ] }) }) }) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "block sm:hidden divide-y divide-slate-150 dark:divide-slate-800", children: sortedParties.length > 0 ? sortedParties.map((party) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => handleViewLedger(party),
            className: `p-3 hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 flex flex-col gap-2 cursor-pointer relative ${party.type === "customer" ? "border-l-4 border-blue-500" : "border-l-4 border-amber-500"} ${selectedParties.includes(party.id) ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-start", children: [
                  /* @__PURE__ */ jsx("div", { className: "pt-0.5", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer",
                      checked: selectedParties.includes(party.id),
                      onChange: () => handleSelectRow(party.id)
                    }
                  ) }),
                  /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${party.type === "customer" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`, children: party.type === "customer" ? /* @__PURE__ */ jsx(UserCheck, { size: 14, className: "text-blue-600 dark:text-blue-400" }) : /* @__PURE__ */ jsx(Building2, { size: 14, className: "text-amber-600 dark:text-amber-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-850 dark:text-white text-xs", children: party.name }),
                    party.phone && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-0.5", children: party.phone })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
                  /* @__PURE__ */ jsx("span", { className: `font-black text-xs ${party.type === "customer" && party.current_balance >= 0 || party.type === "supplier" && party.current_balance < 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(Math.abs(party.current_balance || 0)) }),
                  /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 uppercase font-bold tracking-tight", children: party.current_balance > 0 ? party.type === "customer" ? "To Receive" : "To Pay" : party.current_balance < 0 ? party.type === "customer" ? "To Pay" : "To Receive" : "Settled" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Limit: ",
                  party.credit_limit ? formatCurrency(party.credit_limit) : "-"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => handleViewLedger(party), className: "p-1 text-slate-400 hover:text-indigo-600 rounded", children: /* @__PURE__ */ jsx(FileText, { size: 14 }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleEdit(party), className: "p-1 text-slate-400 hover:text-blue-600 rounded", children: /* @__PURE__ */ jsx(Edit2, { size: 14 }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(party), className: "p-1 text-slate-400 hover:text-red-600 rounded", children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
                ] })
              ] })
            ]
          },
          party.id
        )) : /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-slate-400 text-xs", children: [
          /* @__PURE__ */ jsx(Users, { size: 24, className: "mx-auto mb-2 opacity-50" }),
          "No contacts available"
        ] }) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm opacity-0 h-4", children: nextPageUrl ? "Loading..." : "" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        title: editingParty ? "Edit Party" : "Add Party",
        subtitle: editingParty ? "Update party details" : "Add a new customer or supplier",
        size: "lg",
        errors,
        footer: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => setIsModalOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsx(PrimaryButton, { onClick: handleSubmit, loading, children: editingParty ? "Update" : "Create" })
        ] }),
        children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Party Name", required: true, error: errors.name?.[0], children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.name,
                onChange: (e) => setFormData({ ...formData, name: e.target.value }),
                placeholder: "Enter party name",
                error: errors.name
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Type", required: true, children: /* @__PURE__ */ jsxs(
              FormSelect,
              {
                value: formData.type,
                onChange: (e) => setFormData({ ...formData, type: e.target.value }),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "customer", children: "Customer" }),
                  /* @__PURE__ */ jsx("option", { value: "supplier", children: "Supplier" })
                ]
              }
            ) })
          ] }),
          (usePage().props.settings?.party_grouping === "1" || usePage().props.settings?.party_grouping === true) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Category", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.category,
                onChange: (e) => setFormData({ ...formData, category: e.target.value }),
                placeholder: "e.g. Retailer, Wholesaler"
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Sub-Category", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.sub_category,
                onChange: (e) => setFormData({ ...formData, sub_category: e.target.value }),
                placeholder: "e.g. Area A, Area B"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Phone", error: errors.phone?.[0], children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.phone,
                onChange: (e) => setFormData({ ...formData, phone: e.target.value }),
                placeholder: "e.g., 0300-1234567"
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Email", error: errors.email?.[0], children: /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "email",
                value: formData.email,
                onChange: (e) => setFormData({ ...formData, email: e.target.value }),
                placeholder: "email@example.com"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-2 grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsx(FormField, { label: "Opening Balance", hint: "Initial balance", children: /* @__PURE__ */ jsx(
                FormInput,
                {
                  type: "number",
                  value: formData.opening_balance,
                  onChange: (e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 }),
                  placeholder: "0"
                }
              ) }),
              /* @__PURE__ */ jsx(FormField, { label: "Balance Type", children: /* @__PURE__ */ jsxs(
                FormSelect,
                {
                  value: formData.opening_balance_type,
                  onChange: (e) => setFormData({ ...formData, opening_balance_type: e.target.value }),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "receivable", children: "To Receive (Dr)" }),
                    /* @__PURE__ */ jsx("option", { value: "payable", children: "To Pay (Cr)" })
                  ]
                }
              ) })
            ] }),
            (usePage().props.settings?.enable_credit_limit ?? "1") !== "0" && /* @__PURE__ */ jsx(FormField, { label: "Credit Limit", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                type: "number",
                value: formData.credit_limit,
                onChange: (e) => setFormData({ ...formData, credit_limit: e.target.value }),
                placeholder: "No limit"
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Payment Terms", children: /* @__PURE__ */ jsx(
              FormInput,
              {
                value: formData.payment_terms,
                onChange: (e) => setFormData({ ...formData, payment_terms: e.target.value }),
                placeholder: "e.g., Net 30"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx(FormField, { label: "Address", children: /* @__PURE__ */ jsx(
            FormTextarea,
            {
              value: formData.address,
              onChange: (e) => setFormData({ ...formData, address: e.target.value }),
              placeholder: "Enter full address",
              rows: 2
            }
          ) }),
          /* @__PURE__ */ jsx(FormField, { label: "Notes", children: /* @__PURE__ */ jsx(
            FormTextarea,
            {
              value: formData.notes,
              onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
              placeholder: "Additional notes about this party",
              rows: 2
            }
          ) })
        ] })
      }
    ),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: isPinModalOpen,
        onClose: () => {
          setIsPinModalOpen(false);
          setPinToSubmit("");
          setPinError("");
          setPartyToDelete(null);
        },
        title: "Passcode Required",
        subtitle: partyToDelete === "bulk" ? "Some of the selected contacts have outstanding balances. A Manager or Admin passcode is required to delete them." : "This contact has an outstanding balance. A Manager or Admin passcode is required to delete it.",
        size: "sm",
        footer: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => setIsPinModalOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsx(
            PrimaryButton,
            {
              onClick: () => handleDelete(partyToDelete, pinToSubmit),
              className: "bg-red-600 hover:bg-red-700 text-white",
              children: "Confirm Delete"
            }
          )
        ] }),
        children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx(FormField, { label: "Enter Passcode", error: pinError, children: /* @__PURE__ */ jsx(
          FormInput,
          {
            type: "password",
            value: pinToSubmit,
            onChange: (e) => {
              setPinToSubmit(e.target.value);
              setPinError("");
            },
            placeholder: "Enter PIN",
            autoFocus: true,
            onKeyDown: (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleDelete(partyToDelete, pinToSubmit);
              }
            }
          }
        ) }) })
      }
    )
  ] });
}
export {
  PartiesIndex as default
};
