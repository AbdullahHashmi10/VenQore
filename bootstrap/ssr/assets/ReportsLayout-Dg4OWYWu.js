import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { FileText, BarChart2, DollarSign, Package, PieChart, Activity, Clock, ShoppingBag, TrendingUp, AlertTriangle, History, Layers, Scale, CreditCard, Hash, BookOpen, Calendar, Users, ChevronRight } from "lucide-react";
const REPORT_GROUPS = [
  {
    title: "Sales & Income",
    icon: TrendingUp,
    reports: [
      { title: "Sales Report", route: "store.reports.sales", icon: FileText },
      { title: "Sales Analytics", route: "store.reports.analytics", icon: BarChart2 },
      { title: "Profit & Loss", route: "store.reports.profit-loss", icon: DollarSign },
      { title: "Item-wise Profit", route: "store.reports.item-wise-profit", icon: Package },
      { title: "Category Profitability", route: "store.reports.item-category-wise-profit-loss", icon: PieChart },
      { title: "Bill-wise Profit", route: "store.reports.bill-wise-profit", icon: FileText },
      { title: "Discount Report", route: "store.reports.discount", icon: Activity },
      { title: "Sale Aging", route: "store.reports.sale-aging", icon: Clock },
      { title: "Sales Orders", route: "store.reports.sale-orders", icon: ShoppingBag },
      { title: "Sale Order Items", route: "store.reports.sale-order-items", icon: Package }
    ]
  },
  {
    title: "Inventory",
    icon: Package,
    reports: [
      { title: "Purchase Report", route: "store.reports.purchases", icon: ShoppingBag },
      { title: "Stock Valuation", route: "store.reports.stock-valuation", icon: DollarSign },
      { title: "Low Stock", route: "store.reports.low-stock", icon: AlertTriangle },
      { title: "Stock Movement", route: "store.reports.movement-history", icon: History },
      { title: "Stock Aging", route: "store.reports.stock-aging", icon: Clock },
      { title: "Stock Summary", route: "store.reports.stock-summary-by-category", icon: Package },
      { title: "Item Details", route: "store.reports.item-detail", icon: Layers },
      { title: "Expiry Report", route: "store.reports.expiry", icon: AlertTriangle },
      { title: "Point-In-Time Inventory", route: "store.reports.point-in-time-inventory", icon: History }
    ]
  },
  {
    title: "Finance",
    icon: Scale,
    reports: [
      { title: "Balance Sheet", route: "store.reports.balance-sheet", icon: Scale },
      { title: "Trial Balance", route: "store.reports.trial-balance", icon: Scale },
      { title: "Cash Flow", route: "store.reports.cash-flow", icon: Activity },
      { title: "Bank Statement", route: "store.reports.bank-statement", icon: FileText },
      { title: "Expenses", route: "store.reports.expenses", icon: CreditCard },
      { title: "Expense Category", route: "store.reports.expense-by-category", icon: PieChart },
      { title: "Tax Report", route: "store.reports.tax", icon: FileText },
      { title: "Tax Rates", route: "store.reports.tax-rate", icon: Hash },
      { title: "Owner's Daily Pulse", route: "store.reports.owner-daily-pulse", icon: Activity }
    ]
  },
  {
    title: "Ledgers",
    icon: BookOpen,
    reports: [
      { title: "Chart of Accounts", route: "store.accounting.index", icon: FileText },
      { title: "Journal Entries", route: "store.reports.account-ledger", icon: BookOpen },
      { title: "Day Book", route: "store.reports.day-book", icon: Calendar },
      { title: "All Transactions", route: "store.reports.transactions", icon: Activity }
    ]
  },
  {
    title: "Parties",
    icon: Users,
    reports: [
      { title: "All Parties", route: "store.reports.all-parties", icon: Users },
      { title: "Party Statement", route: "store.reports.party-statement", icon: FileText },
      { title: "Party P&L", route: "store.reports.party-wise-profit-loss", icon: TrendingUp },
      { title: "Party Volume", route: "store.reports.sale-purchase-by-party", icon: Activity },
      { title: "Customer Buying", route: "store.reports.item-report-by-party", icon: ShoppingBag },
      { title: "Product Fans", route: "store.reports.party-report-by-item", icon: Users },
      { title: "Loan Statement", route: "store.reports.loan-statement", icon: DollarSign },
      { title: "Customer Insights", route: "store.reports.customer-insights", icon: Users },
      { title: "Supplier Insights", route: "store.reports.supplier-insights", icon: ShoppingBag }
    ]
  }
];
function ReportsLayout({ children, title, showSidebar = true }) {
  const {
    store
  } = usePage().props;
  const { url } = usePage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(REPORT_GROUPS.map((_, i) => i));
  const isRouteActive = (routeName) => {
    if (!store?.slug) return false;
    try {
      return route().current(routeName);
    } catch (e) {
      return false;
    }
  };
  const toggleGroup = (index) => {
    setExpandedGroups(
      (prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };
  return /* @__PURE__ */ jsx(OneGlanceLayout, { title, activeMenu: "Insights", noPadding: true, children: /* @__PURE__ */ jsxs("div", { className: `flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950 ${showSidebar ? "lg:gap-4 p-2 lg:p-4 pt-2" : ""}`, children: [
    " ",
    showSidebar && /* @__PURE__ */ jsxs("div", { className: `hidden lg:flex ${sidebarCollapsed ? "w-20" : "w-64"} bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300`, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: `${sidebarCollapsed ? "px-2 py-4 justify-center" : "px-4 py-5 justify-between"} flex items-center border-b border-slate-800/50 mb-3 relative z-10`, children: [
        !sidebarCollapsed && /* @__PURE__ */ jsxs(Link, { href: store?.slug ? route("store.reports.index", {
          store_slug: store.slug
        }) : "#", className: "min-w-0 group cursor-pointer block", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-base font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors", children: "Reports" }),
          /* @__PURE__ */ jsx("p", { className: "text-3xs font-bold uppercase tracking-[0.2em] text-indigo-400", children: "Hub Access" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setSidebarCollapsed(!sidebarCollapsed),
            className: "w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0",
            children: /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: `transition-transform ${sidebarCollapsed ? "rotate-180" : ""}` })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 overflow-y-auto px-1 custom-scrollbar space-y-3 relative z-10 pb-20", children: REPORT_GROUPS.map((group, idx) => {
        const GroupIcon = group.icon;
        const isExpanded = expandedGroups.includes(idx);
        const hasActiveChild = group.reports.some((r) => isRouteActive(r.route));
        return /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
          !sidebarCollapsed && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => toggleGroup(idx),
              className: `w-full flex items-center justify-between px-3 py-1.5 text-3xs font-black uppercase tracking-[0.2em] transition-colors group ${hasActiveChild ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(GroupIcon, { size: 10 }),
                  group.title
                ] }),
                /* @__PURE__ */ jsx(ChevronRight, { size: 10, className: `transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}` })
              ]
            }
          ),
          (isExpanded || sidebarCollapsed) && /* @__PURE__ */ jsx("div", { className: "space-y-1", children: group.reports.map((report, rIdx) => {
            const RIcon = report.icon;
            const isActive = isRouteActive(report.route);
            return /* @__PURE__ */ jsxs(
              Link,
              {
                href: report.route.startsWith("platform.") ? route(report.route) : store?.slug ? route(report.route, { store_slug: store.slug }) : "#",
                title: sidebarCollapsed ? report.title : void 0,
                className: `w-full flex items-center gap-3 ${sidebarCollapsed ? "p-2 justify-center" : "p-2 px-3"} rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${isActive ? "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border-transparent"}`,
                children: [
                  isActive && !sidebarCollapsed && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-100" }),
                  /* @__PURE__ */ jsx("div", { className: `relative z-10 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "bg-slate-800/80 group-hover:bg-slate-700"}`, children: /* @__PURE__ */ jsx(RIcon, { size: 12, className: isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400" }) }),
                  !sidebarCollapsed && /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 min-w-0", children: /* @__PURE__ */ jsx("p", { className: `text-1xs font-bold tracking-tight ${isActive ? "text-white" : "text-slate-300"}`, children: report.title }) })
                ]
              },
              rIdx
            );
          }) })
        ] }, idx);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `flex-1 overflow-hidden flex flex-col relative transition-all duration-300 ${showSidebar ? "bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl" : ""}`, children: [
      showSidebar && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `relative z-10 h-full overflow-y-auto custom-scrollbar ${showSidebar ? "p-3 lg:p-5" : "p-4 lg:p-6"}`, children })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                ` })
  ] }) });
}
export {
  ReportsLayout as R
};
