import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { f as formatCurrency, b as formatDate, c as formatTime } from "./format-B_ph0Qec.js";
import { ChevronDown, FileText, CheckSquare, Clock, History, Search, FileSpreadsheet, BarChart3, Printer, Filter, Trash2, X, ChevronUp, Plus, CornerUpRight, Mail, MessageCircle, MoreVertical, Edit, RefreshCcw, Truck, XCircle, Copy, Eye } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-_fjGjxMs.js";
import { P as PrintService } from "./PrintService-CHQ9qBZV.js";
import { P as PrintButton } from "./PrintButton-Dgsai7Fu.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "react-dom";
import "react-dom/client";
import "./PrintPreview-u3rEkqC1.js";
const AmazonLogo = ({ size = 12 }) => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", style: { width: size, height: size, display: "block" }, children: [
  /* @__PURE__ */ jsx("path", { fill: "#ffffff", d: "M10.813 11.968c.157.083.36.074.5-.05l.005.005a90 90 0 0 1 1.623-1.405c.173-.143.143-.372.006-.563l-.125-.17c-.345-.465-.673-.906-.673-1.791v-3.3l.001-.335c.008-1.265.014-2.421-.933-3.305C10.404.274 9.06 0 8.03 0 6.017 0 3.77.75 3.296 3.24c-.047.264.143.404.316.443l2.054.22c.19-.009.33-.196.366-.387.176-.857.896-1.271 1.703-1.271.435 0 .929.16 1.188.55.264.39.26.91.257 1.376v.432q-.3.033-.621.065c-1.113.114-2.397.246-3.36.67C3.873 5.91 2.94 7.08 2.94 8.798c0 2.2 1.387 3.298 3.168 3.298 1.506 0 2.328-.354 3.489-1.54l.167.246c.274.405.456.675 1.047 1.166ZM6.03 8.431C6.03 6.627 7.647 6.3 9.177 6.3v.57c.001.776.002 1.434-.396 2.133-.336.595-.87.961-1.465.961-.812 0-1.286-.619-1.286-1.533" }),
  /* @__PURE__ */ jsx("path", { fill: "#FF9900", d: "M.435 12.174c2.629 1.603 6.698 4.084 13.183.997.28-.116.475.078.199.431C13.538 13.96 11.312 16 7.57 16 3.832 16 .968 13.446.094 12.386c-.24-.275.036-.4.199-.299z" }),
  /* @__PURE__ */ jsx("path", { fill: "#FF9900", d: "M13.828 11.943c.567-.07 1.468-.027 1.645.204.135.176-.004.966-.233 1.533-.23.563-.572.961-.762 1.115s-.333.094-.23-.137c.105-.23.684-1.663.455-1.963-.213-.278-1.177-.177-1.625-.13l-.09.009q-.142.013-.233.024c-.193.021-.245.027-.274-.032-.074-.209.779-.556 1.347-.623" })
] });
const TikTokLogo = ({ size = 12 }) => /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 24 24", style: { width: size, height: size, display: "block" }, children: [
  /* @__PURE__ */ jsx("path", { fill: "#69C9D0", transform: "translate(-0.6, -0.3)", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z" }),
  /* @__PURE__ */ jsx("path", { fill: "#EE1D52", transform: "translate(0.6, 0.3)", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z" }),
  /* @__PURE__ */ jsx("path", { fill: "#ffffff", d: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-2.2.82-4.48 2.4-6.03 1.52-1.5 3.73-2.33 5.9-2.2 1.16.03 2.3.29 3.35.85V10.2c-.75-.45-1.61-.71-2.49-.75-1.16-.07-2.35.21-3.33.87-1.14.73-1.86 2.01-1.98 3.35-.12 1.34.39 2.72 1.34 3.67.95.95 2.32 1.46 3.67 1.34 1.34-.12 2.62-.84 3.35-1.98.66-.98.94-2.17.87-3.33V0h.03z" })
] });
const EbayLogo = ({ size = 12 }) => {
  const scale = size / 28;
  const width = 44 * scale;
  const height = 18 * scale;
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 1000 400.75", style: { width, height, display: "block" }, children: [
    /* @__PURE__ */ jsx("path", { fill: "#f12c2d", d: "m 199.63633,185.86602 c -1.94427,-46.87735 -35.77951,-64.41973 -71.94139,-64.41973 -38.99421,0 -70.12667,19.7327 -75.58026,64.41973 z M 51.034408,219.1909 c 2.704332,45.48365 34.069782,72.38437 77.197532,72.38437 29.88033,0 56.45979,-12.17498 65.35948,-38.66041 h 51.68424 c -10.05205,53.73979 -67.15384,71.98058 -116.303,71.98058 C 39.606424,324.89544 0,275.67889 0,209.30653 0,136.24203 40.965642,88.12194 129.78809,88.12194 c 70.69867,0 122.49992,36.99926 122.49992,117.75572 v 13.31324 z" }),
    /* @__PURE__ */ jsx("path", { fill: "#0968f6", d: "m 380.83181,290.6235 c 46.57228,0 78.44078,-33.52181 78.44078,-84.10854 0,-50.58203 -31.8685,-84.10854 -78.44078,-84.10854 -46.31058,0 -78.44392,33.52651 -78.44392,84.10854 0,50.58673 32.13334,84.10854 78.44392,84.10854 z M 252.2854,0 h 50.10249 l -0.005,125.87707 c 24.55682,-29.25975 58.38892,-37.75513 91.68976,-37.75513 55.83503,0 117.85132,37.6773 117.85132,119.02875 0,68.12232 -49.32155,117.74475 -118.78114,117.74475 -36.35726,0 -70.58062,-13.04265 -91.68663,-38.88294 0,10.32107 -0.57618,20.72364 -1.70503,30.56413 h -49.17162 c 0.85513,-15.90944 1.70555,-35.7184 1.70555,-51.74693 z" }),
    /* @__PURE__ */ jsx("path", { fill: "#ffbc13", d: "m 633.07803,212.53323 c -45.43873,1.48929 -73.6715,9.689 -73.6715,39.61897 0,19.37591 15.44713,40.38162 54.66334,40.38162 52.57698,0 80.64259,-28.65902 80.64259,-75.66331 l 0.003,-5.16994 c -18.43302,0 -41.16414,0.16089 -61.63704,0.83266 z m 111.75103,62.10248 c 0,14.58313 0.42155,28.9782 1.69406,41.94092 h -46.61408 c -1.24325,-10.67368 -1.6972,-21.27945 -1.6972,-31.56656 -25.20195,30.97941 -55.17735,39.88537 -96.76149,39.88537 -61.67674,0 -94.70072,-32.59982 -94.70072,-70.30689 0,-54.61215 44.91583,-73.86739 122.89013,-75.65391 21.32332,-0.48686 45.27419,-0.55894 65.07531,-0.55894 l -0.003,-5.33606 c 0,-36.56098 -23.44364,-51.59335 -64.06765,-51.59335 -30.15876,0 -52.38579,12.48057 -54.6764,34.0468 h -52.65168 c 5.57217,-53.77165 62.06643,-67.37115 111.74005,-67.37115 59.50837,0 109.77228,21.17288 109.77228,84.11481 z" }),
    /* @__PURE__ */ jsx("path", { fill: "#93c822", d: "M 1000,96.45747 845.05541,400.75099 H 788.94926 L 833.49578,316.25589 716.89033,96.45747 h 58.6266 l 85.80469,171.73057 85.56283,-171.73057 z" })
  ] });
};
function SalesIndex({ sales, filters, stats }) {
  const { auth, flash, store, vensynq_enabled } = usePage().props;
  const isSuperAdmin = auth.user?.role === "platform_admin" || auth.user?.role === "admin" || auth.user?.role === "owner";
  const [allSales, setAllSales] = useState(sales.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(sales.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (sales.data && sales.current_page === 1) {
      setAllSales(sales.data);
      setNextPageUrl(sales.next_page_url);
    }
  }, [sales]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllSales((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
    }, { threshold: 0.1, rootMargin: "800px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  useEffect(() => {
    if (flash.success || flash.error) {
      const timer = setTimeout(() => {
      }, 3e3);
      return () => clearTimeout(timer);
    }
  }, [flash]);
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [activeFilter, setActiveFilter] = useState(params.get("filter") || "all");
  const [dateRange, setDateRange] = useState({
    from: params.get("from_date") || "",
    to: params.get("to_date") || ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: params.get("sort_by") || "date",
    direction: params.get("sort_dir") || "desc"
  });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [activeSharePopup, setActiveSharePopup] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "12%" },
    { key: "reference", label: "Invoice No", width: "15%" },
    { key: "party_name", label: "Party Name", width: "15%" },
    { key: "transaction", label: "Transaction", width: "10%", className: "hidden md:table-cell" },
    { key: "payment_method", label: "Payment Type", width: "10%", className: "hidden md:table-cell" },
    { key: "amount", label: "Amount", width: "10%" },
    { key: "balance", label: "Balance", width: "10%", className: "hidden md:table-cell" },
    { key: "due_date", label: "Due Date", width: "8%", className: "hidden md:table-cell" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "10%", frozen: true, className: "hidden md:table-cell" }
  ]);
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
  }, [sortConfig, activeFilter, dateRange]);
  useEffect(() => {
    if (searchTerm !== (params.get("search") || "")) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm]);
  const [selectedSales, setSelectedSales] = useState([]);
  const applyFilters = (newParams) => {
    router.get(route("store.sales.index", { store_slug: store?.slug }), {
      search: searchTerm,
      filter: activeFilter,
      from_date: dateRange.from,
      to_date: dateRange.to,
      sort_by: sortConfig.key,
      sort_dir: sortConfig.direction,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  };
  const sortedSales = allSales;
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    applyFilters({ sort_by: key, sort_dir: direction });
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSales(sortedSales.map((s) => s.id));
    } else {
      setSelectedSales([]);
    }
  };
  const handleSelectRow = (id) => {
    if (selectedSales.includes(id)) {
      setSelectedSales(selectedSales.filter((s) => s !== id));
    } else {
      setSelectedSales([...selectedSales, id]);
    }
  };
  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedSales.length} sales? This cannot be undone.`)) return;
    router.post(route("store.sales.bulk-destroy", { store_slug: store?.slug }), { ids: selectedSales }, {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedSales([]);
        setActiveActionMenu(null);
        window.location.reload();
      }
    });
  };
  const [quickViewSale, setQuickViewSale] = useState(null);
  const [clickTimeout, setClickTimeout] = useState(null);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && quickViewSale) {
        setQuickViewSale(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [quickViewSale]);
  const handleRowClick = useCallback((row) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      router.visit(route("store.sales.edit", { store_slug: store?.slug, sale: row.id }));
    } else {
      const timeout = setTimeout(() => {
        setQuickViewSale(row);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  }, [clickTimeout]);
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
    if (newRange.from && newRange.to) {
      applyFilters({ from_date: newRange.from, to_date: newRange.to });
    }
  };
  const handleDragStart = (e, index) => setDraggedColumn(index);
  const handleDragOver = (e, index) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    if (draggedColumn === null) return;
    const newCols = [...tableColumns];
    const draggedItem = newCols[draggedColumn];
    newCols.splice(draggedColumn, 1);
    newCols.splice(dropIndex, 0, draggedItem);
    setTableColumns(newCols);
    setDraggedColumn(null);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Sales History", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales History" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "orders" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-indigo-600 dark:text-indigo-400", children: [
              "Sale: ",
              formatCurrency(stats?.total_sale || 0, store)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: [
              "Txns: ",
              stats?.transaction_count || 0
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
              "Paid: ",
              formatCurrency(stats?.total_paid || 0, store)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-rose-600", children: [
              "Due: ",
              formatCurrency(stats?.total_unpaid || 0, store)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Sale" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(stats?.total_sale || 0, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Paid Amount" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: formatCurrency(stats?.total_paid || 0, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Unpaid (Due)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-rose-600", children: formatCurrency(stats?.total_unpaid || 0, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-start gap-1 justify-between sm:flex-row sm:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.transaction_count || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Sales ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "all", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("today");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "today", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("month");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "month", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "This Month"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("year");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "year", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "year" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "This Year"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Custom"
            }
          ),
          activeFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 ml-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "from",
                value: dateRange.from,
                onChange: handleDateChange,
                className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "→" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "to",
                value: dateRange.to,
                onChange: handleDateChange,
                className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: handleSearch,
                onKeyDown: handleServerSearch,
                placeholder: "Search invoice, customer...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx("a", { href: route("store.sales.export", { ...filters, store_slug: store?.slug }), className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx(Link, { href: route("store.reports.analytics", { store_slug: store?.slug }), className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Analytics", children: /* @__PURE__ */ jsx(BarChart3, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: [
            "Sales ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(Filter, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: route("store.sales.export", { ...filters, store_slug: store?.slug }),
                className: "p-2 bg-slate-100 dark:bg-slate-800 text-emerald-600 hover:bg-slate-200 rounded-lg transition-colors",
                title: "Export spreadsheet",
                children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.reports.analytics", { store_slug: store?.slug }),
                className: "p-2 bg-slate-100 dark:bg-slate-800 text-indigo-600 hover:bg-slate-200 rounded-lg transition-colors",
                title: "View analytics graph",
                children: /* @__PURE__ */ jsx(BarChart3, { size: 16 })
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsxs("div", { className: "w-full relative mt-1 border-t border-slate-100 dark:border-slate-800 pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchTerm,
              onChange: handleSearch,
              onKeyDown: handleServerSearch,
              placeholder: "Search invoice, customer...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsxs("div", { className: "w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setActiveFilter("all");
                  setDateRange({ from: "", to: "" });
                  applyFilters({ filter: "all", from_date: "", to_date: "" });
                },
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                children: "All"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setActiveFilter("today");
                  setDateRange({ from: "", to: "" });
                  applyFilters({ filter: "today", from_date: "", to_date: "" });
                },
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                children: "Today"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setActiveFilter("month");
                  setDateRange({ from: "", to: "" });
                  applyFilters({ filter: "month", from_date: "", to_date: "" });
                },
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                children: "This Month"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setActiveFilter("year");
                  setDateRange({ from: "", to: "" });
                  applyFilters({ filter: "year", from_date: "", to_date: "" });
                },
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "year" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                children: "This Year"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setActiveFilter("custom"),
                className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
                children: "Custom"
              }
            )
          ] }),
          activeFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "from",
                value: dateRange.from,
                onChange: handleDateChange,
                className: "px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 flex-1"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "→" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "to",
                value: dateRange.to,
                onChange: handleDateChange,
                className: "px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 flex-1"
              }
            )
          ] })
        ] })
      ] }),
      selectedSales.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg mb-2 animate-in slide-in-from-top-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm", children: [
          selectedSales.length,
          " Selected"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          isSuperAdmin && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleBulkDelete,
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
              onClick: () => setSelectedSales([]),
              className: "p-1 hover:bg-indigo-700 rounded transition-colors",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-[calc(100vh-190px)] lg:min-h-0 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-2 md:p-4 w-8 md:w-10", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                checked: selectedSales.length === sortedSales.length && sortedSales.length > 0,
                onChange: handleSelectAll
              }
            ) }),
            tableColumns.map((col, index) => /* @__PURE__ */ jsx(
              "th",
              {
                draggable: true,
                onDragStart: (e) => handleDragStart(e, index),
                onDragOver: (e) => handleDragOver(e),
                onDrop: (e) => handleDrop(e, index),
                onClick: () => col.key !== "actions" && handleSort(col.key),
                className: `
                                            p-2 md:p-4 text-2xs md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${col.className || ""}
                                            ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-indigo-500" : ""}
                                        `,
                style: { width: col.width },
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  col.label,
                  col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" }))
                ] })
              },
              col.key
            ))
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedSales.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No sales found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Transactions will appear here once you create your first sale" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.sales.invoice.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Create First Invoice"
                ]
              }
            )
          ] }) }) }) : sortedSales.map((row) => /* @__PURE__ */ jsxs(
            "tr",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${row.source === "pos" ? "bg-orange-50/30 dark:bg-orange-900/5 border-l-4 border-orange-500" : "border-l-4 border-transparent hover:border-indigo-400"}
                                            ${quickViewSale?.id === row.id ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                        `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-2 md:p-4 w-8 md:w-10 sticky left-0 z-10 bg-white dark:bg-slate-900", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                    checked: selectedSales.includes(row.id),
                    onChange: () => handleSelectRow(row.id)
                  }
                ) }),
                tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: `p-2 md:p-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 ${col.className || ""}`, children: (() => {
                  switch (col.key) {
                    case "date":
                      return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                    case "reference":
                      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.reference_number }),
                        row.source === "pos" && /* @__PURE__ */ jsx("span", { className: "text-2xs font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded uppercase", children: "POS" }),
                        row.is_dropship && /* @__PURE__ */ jsxs("span", { className: "text-2xs font-black bg-indigo-50 border border-indigo-100/50 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1.5", children: [
                          row.ecommerce_channel?.platform === "amazon" && /* @__PURE__ */ jsx(AmazonLogo, { size: 12 }),
                          row.ecommerce_channel?.platform === "tiktok" && /* @__PURE__ */ jsx(TikTokLogo, { size: 12 }),
                          row.ecommerce_channel?.platform === "ebay" && /* @__PURE__ */ jsx(EbayLogo, { size: 12 }),
                          vensynq_enabled ? "VenSynQ • " : "",
                          row.ecommerce_channel?.platform ? row.ecommerce_channel.platform.toUpperCase() : "AMAZON"
                        ] })
                      ] });
                    case "party_name":
                      return /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.customer?.name || "Walk-in" }),
                        row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.customer.phone })
                      ] });
                    case "transaction":
                      const isReturn = row.status === "returned" || row.reference_number && row.reference_number.startsWith("RET");
                      return isReturn ? /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded-md", children: "Return" }) : /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-md", children: "Sale" });
                    case "payment_method":
                      return /* @__PURE__ */ jsx("span", { className: "uppercase text-xs font-semibold", children: row.payment_method || "-" });
                    case "amount":
                      return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.total, store) });
                    case "balance":
                      const paid = parseFloat(row.paid_amount || (row.payment_status === "paid" ? row.total : 0) || 0);
                      const balance = parseFloat(row.total) - paid;
                      if (balance > 1) return /* @__PURE__ */ jsx("span", { className: "text-red-500 font-bold", children: formatCurrency(balance, store) });
                      if (balance < -1) return /* @__PURE__ */ jsxs("span", { className: "text-blue-600 font-bold", title: "Overpaid Amount", children: [
                        "+",
                        formatCurrency(Math.abs(balance), store)
                      ] });
                      return /* @__PURE__ */ jsx("span", { className: "text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full", children: "Settled" });
                    case "due_date":
                      return /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" });
                    case "status":
                      let status = row.payment_status;
                      const pAmt = parseFloat(row.paid_amount || (status === "paid" ? row.total : 0));
                      const tAmt = parseFloat(row.total);
                      if (pAmt > tAmt + 1) status = "overpaid";
                      const statusStyles = {
                        paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                        partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                        unpaid: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                        overpaid: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      };
                      return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[status] || "bg-slate-100 text-slate-700"}`, children: status });
                    case "actions":
                      return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          PrintService.quickPrint(row);
                        }, className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setActiveSharePopup(activeSharePopup === row.id ? null : row.id);
                          }, className: `p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(CornerUpRight, { size: 16 }) }),
                          activeSharePopup === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in zoom-in-95", children: [
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                              /* @__PURE__ */ jsx(Mail, { size: 14, className: "text-red-500" }),
                              " Email"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                              /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-green-500" }),
                              " WhatsApp"
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                          }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                          activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                            row.source === "pos" ? /* @__PURE__ */ jsxs("a", { href: route("store.pos", { store_slug: store?.slug }) + "?recall=" + row.id, className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Edit, { size: 14 }),
                              " Open in POS"
                            ] }) : /* @__PURE__ */ jsxs(Link, { href: route("store.sales.edit", { store_slug: store?.slug, sale: row.id }), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Edit, { size: 14 }),
                              " View/Edit"
                            ] }),
                            /* @__PURE__ */ jsxs(Link, { href: route("store.sales.show", { store_slug: store?.slug, sale: row.id }) + "?action=return", className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(RefreshCcw, { size: 14 }),
                              " Convert To Return"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Truck, { size: 14 }),
                              " Preview Delivery Challan"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(History, { size: 14 }),
                              " Payment History"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { onClick: async () => {
                              if (await confirm("Cancel invoice? Stock will be restored.")) router.post(route("store.sales.cancel", { store_slug: store?.slug, sale: row.id }));
                            }, className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-red-600", children: [
                              /* @__PURE__ */ jsx(XCircle, { size: 14 }),
                              " Cancel Invoice"
                            ] }),
                            /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                            isSuperAdmin && /* @__PURE__ */ jsxs(
                              "button",
                              {
                                onClick: () => {
                                  if (confirm("Are you sure you want to permanently delete this sale? This will restore stock.")) {
                                    router.delete(route("store.sales.destroy", { store_slug: store?.slug, sale: row.id }), {
                                      preserveScroll: true,
                                      onSuccess: () => setActiveActionMenu(null)
                                    });
                                  }
                                },
                                className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600",
                                children: [
                                  /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                                  " Delete"
                                ]
                              }
                            ),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Copy, { size: 14 }),
                              " Duplicate"
                            ] }),
                            /* @__PURE__ */ jsxs("a", { href: route("store.sales.print", { store_slug: store?.slug, sale: row.id }), target: "_blank", className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(FileText, { size: 14 }),
                              " Open PDF"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Eye, { size: 14 }),
                              " Preview"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { onClick: (e) => {
                              e.stopPropagation();
                              PrintService.quickPrint(row);
                              setActiveActionMenu(null);
                            }, className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Printer, { size: 14 }),
                              " Print"
                            ] }),
                            /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Clock, { size: 14 }),
                              " View History"
                            ] })
                          ] }) })
                        ] })
                      ] });
                    default:
                      return /* @__PURE__ */ jsx("span", { children: "-" });
                  }
                })() }, `${row.id}- ${col.key}`))
              ]
            },
            row.id
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedSales.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(FileText, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No sales found" })
        ] }) : sortedSales.map((row) => {
          const isReturn = row.status === "returned" || row.reference_number && row.reference_number.startsWith("RET");
          const isPos = row.source === "pos";
          const paid = parseFloat(row.paid_amount || (row.payment_status === "paid" ? row.total : 0) || 0);
          const balance = parseFloat(row.total) - paid;
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            p-3 bg-white dark:bg-slate-900 rounded-xl border shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-indigo-400 transition-colors
                                            ${quickViewSale?.id === row.id ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/20 dark:bg-indigo-900/10" : ""}
                                            ${isPos ? "border-orange-200 dark:border-orange-900/40" : "border-slate-200 dark:border-slate-800"}
                                        `,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-slate-800 dark:text-white text-sm", children: row.customer?.name || "Walk-in" }),
                    row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-semibold", children: row.customer.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block", children: row.reference_number }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400 font-semibold block mt-0.5", children: formatDate(row.created_at) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  isReturn ? /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded border border-rose-200/30", children: "Return" }) : isPos ? /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200/30", children: "POS Sale" }) : /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200/30", children: "Sale" }),
                  (() => {
                    let status = row.payment_status;
                    const pAmt = parseFloat(row.paid_amount || (status === "paid" ? row.total : 0));
                    const tAmt = parseFloat(row.total);
                    if (pAmt > tAmt + 1) status = "overpaid";
                    const statusStyles = {
                      paid: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
                      partial: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
                      unpaid: "bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20",
                      overpaid: "bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20"
                    };
                    return /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[status] || "bg-slate-100 text-slate-700"}`, children: status });
                  })()
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase block tracking-wider", children: "Total" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-900 dark:text-white", children: formatCurrency(row.total, store) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase block tracking-wider", children: "Balance" }),
                      balance > 1 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-rose-600 dark:text-rose-450", children: formatCurrency(balance, store) }) : balance < -1 ? /* @__PURE__ */ jsxs("span", { className: "text-xs font-black text-blue-600 dark:text-blue-400", children: [
                        "+",
                        formatCurrency(Math.abs(balance), store)
                      ] }) : /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10", children: "Settled" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => PrintService.quickPrint(row),
                        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors",
                        title: "Print",
                        children: /* @__PURE__ */ jsx(Printer, { size: 16 })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setActiveSharePopup(activeSharePopup === row.id ? null : row.id),
                          className: `p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? "text-indigo-600 bg-slate-100 dark:bg-slate-800" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
                          title: "Share",
                          children: /* @__PURE__ */ jsx(CornerUpRight, { size: 16 })
                        }
                      ),
                      activeSharePopup === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: [
                        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                          /* @__PURE__ */ jsx(Mail, { size: 14, className: "text-red-500" }),
                          " Email"
                        ] }),
                        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                          /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-green-500" }),
                          " WhatsApp"
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setActiveActionMenu(activeActionMenu === row.id ? null : row.id),
                          className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100 dark:bg-slate-800" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
                          children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                        }
                      ),
                      activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                        row.source === "pos" ? /* @__PURE__ */ jsxs("a", { href: route("store.pos", { store_slug: store?.slug }) + "?recall=" + row.id, className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Edit, { size: 14 }),
                          " Open in POS"
                        ] }) : /* @__PURE__ */ jsxs(Link, { href: route("store.sales.edit", { store_slug: store?.slug, sale: row.id }), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Edit, { size: 14 }),
                          " View/Edit"
                        ] }),
                        /* @__PURE__ */ jsxs(Link, { href: route("store.sales.show", { store_slug: store?.slug, sale: row.id }) + "?action=return", className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(RefreshCcw, { size: 14 }),
                          " Convert To Return"
                        ] }),
                        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Truck, { size: 14 }),
                          " Preview Delivery Challan"
                        ] }),
                        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(History, { size: 14 }),
                          " Payment History"
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: async () => {
                              if (await confirm("Cancel invoice? Stock will be restored.")) router.post(route("store.sales.cancel", { store_slug: store?.slug, sale: row.id }));
                            },
                            className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-red-600",
                            children: [
                              /* @__PURE__ */ jsx(XCircle, { size: 14 }),
                              " Cancel Invoice"
                            ]
                          }
                        ),
                        isSuperAdmin && /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: () => {
                              if (confirm("Are you sure you want to permanently delete this sale? This will restore stock.")) {
                                router.delete(route("store.sales.destroy", { store_slug: store?.slug, sale: row.id }), {
                                  preserveScroll: true,
                                  onSuccess: () => setActiveActionMenu(null)
                                });
                              }
                            },
                            className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600",
                            children: [
                              /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                              " Delete"
                            ]
                          }
                        )
                      ] }) })
                    ] })
                  ] })
                ] })
              ]
            },
            row.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm opacity-0 h-4", children: sales.next_page_url ? "Loading..." : "" })
      ] })
    ] }),
    quickViewSale && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", onClick: () => setQuickViewSale(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Invoice Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-lg sm:text-xl font-black text-indigo-600 truncate", children: quickViewSale.reference_number })
              ] }),
              quickViewSale.source === "pos" && /* @__PURE__ */ jsx("span", { className: "text-2xs font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase shrink-0", children: "POS" }),
              (() => {
                const statusStyles = {
                  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  unpaid: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                };
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[quickViewSale.payment_status] || "bg-slate-100 text-slate-700"}`, children: quickViewSale.payment_status });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
              /* @__PURE__ */ jsx(
                PrintButton,
                {
                  sale: quickViewSale,
                  label: "Print",
                  variant: "secondary",
                  size: "sm",
                  className: "font-bold text-xs"
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.sales.edit", { store_slug: store?.slug, sale: quickViewSale.id }),
                  className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { size: 14 }),
                    " Edit Invoice"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuickViewSale(null),
                  className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Customer" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewSale.customer?.name || "Walk-in" }),
                quickViewSale.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: quickViewSale.customer.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Date & Time" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewSale.created_at) }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: formatTime(quickViewSale.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Payment" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm uppercase", children: quickViewSale.payment_method || "Cash" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-indigo-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-indigo-600 text-lg", children: formatCurrency(quickViewSale.total, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-300 uppercase", children: [
                "Items in this Invoice (",
                quickViewSale.items?.length || 0,
                ")"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "hidden sm:block max-h-[300px] overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "Item Name" }),
                  /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-slate-400 uppercase", children: quickViewSale.items?.some((i) => parseFloat(i.free_quantity || 0) > 0) ? "Qty + Free" : "Qty" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Rate" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Discount" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: quickViewSale.items && quickViewSale.items.length > 0 ? quickViewSale.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-400 font-mono text-xs", children: idx + 1 }),
                  /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: item.product?.name || item.name || "Unknown Item" }),
                    item.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-mono", children: item.product.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: parseFloat(item.free_quantity || 0) > 0 ? `${parseFloat(item.quantity) || 0}+${parseFloat(item.free_quantity) || 0}` : parseFloat(item.quantity) || 0 }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: formatCurrency(item.price || item.unit_price || 0, store) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-orange-600", children: parseFloat(item.discount_amount || item.discount || 0) > 0 ? `-${formatCurrency(parseFloat(item.discount_amount || item.discount || 0), store)}` : "-" }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency(item.quantity * (item.price || item.unit_price || 0) - parseFloat(item.discount_amount || item.discount || 0), store) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "block sm:hidden divide-y divide-slate-150 dark:divide-slate-800 max-h-[300px] overflow-auto", children: quickViewSale.items && quickViewSale.items.length > 0 ? quickViewSale.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-start", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-mono text-xs", children: [
                      idx + 1,
                      "."
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white text-xs", children: item.product?.name || item.name || "Unknown Item" }),
                      item.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-mono mt-0.5", children: item.product.sku })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-800 dark:text-white shrink-0", children: formatCurrency(item.quantity * (item.price || item.unit_price || 0) - parseFloat(item.discount_amount || item.discount || 0), store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-2xs bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400 block uppercase", children: parseFloat(item.free_quantity || 0) > 0 ? "Qty + Free" : "Qty" }),
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-300", children: parseFloat(item.free_quantity || 0) > 0 ? `${parseFloat(item.quantity) || 0}+${parseFloat(item.free_quantity) || 0}` : parseFloat(item.quantity) || 0 })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400 block uppercase", children: "Rate" }),
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700 dark:text-slate-300", children: formatCurrency(item.price || item.unit_price || 0, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400 block uppercase", children: "Discount" }),
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-orange-600", children: parseFloat(item.discount_amount || item.discount || 0) > 0 ? `-${formatCurrency(parseFloat(item.discount_amount || item.discount || 0), store)}` : "-" })
                  ] })
                ] })
              ] }, idx)) : /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-slate-400 text-xs", children: "No items data available" }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-between sm:justify-end gap-4 sm:gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(quickViewSale.subtotal_gross || quickViewSale.subtotal || quickViewSale.total, store) })
                ] }),
                parseFloat(quickViewSale.total_item_discounts || 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Item Discounts" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-bold text-orange-600", children: [
                    "-",
                    formatCurrency(quickViewSale.total_item_discounts, store)
                  ] })
                ] }),
                parseFloat(quickViewSale.global_discount || quickViewSale.discount || 0) > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Invoice Discount" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-bold text-orange-600", children: [
                    "-",
                    formatCurrency(quickViewSale.global_discount || quickViewSale.discount, store)
                  ] })
                ] }),
                quickViewSale.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Tax" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(quickViewSale.tax, store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-slate-200 dark:border-slate-700 pl-8", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-indigo-600 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-indigo-600", children: formatCurrency(quickViewSale.total, store) })
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex gap-6 justify-between w-full sm:w-auto", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Paid Amount" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600", children: formatCurrency(quickViewSale.paid_amount || (quickViewSale.payment_status === "paid" ? quickViewSale.total : 0), store) })
                ] }),
                (() => {
                  const paid = parseFloat(quickViewSale.paid_amount || (quickViewSale.payment_status === "paid" ? quickViewSale.total : 0));
                  const balance = parseFloat(quickViewSale.total) - paid;
                  if (balance > 1) {
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Balance Due" }),
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: formatCurrency(balance, store) })
                    ] });
                  }
                  return null;
                })()
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 w-full sm:w-auto justify-end", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                    },
                    className: "px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx(MessageCircle, { size: 14 }),
                      " Share"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: route("store.sales.show", { store_slug: store?.slug, sale: quickViewSale.id }) + "?action=return",
                    className: "px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx(RefreshCcw, { size: 14 }),
                      " Return"
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-400", children: [
            "Double-click row to edit directly • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono", children: "Esc" }),
            " to close"
          ] }) })
        ]
      }
    ) })
  ] });
}
export {
  SalesIndex as default
};
