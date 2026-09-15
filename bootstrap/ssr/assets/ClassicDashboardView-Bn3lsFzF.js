import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import { R as RightPanel, P as PremiumDropdown, C as ChartSection, T as TodaysOpportunities } from "./TodaysOpportunities-CMnJKMTq.js";
import { ChevronLeft, TrendingUp, Percent, ArrowDownLeft, ArrowUpRight, Wallet, Activity, MoreHorizontal, ShieldCheck, Package } from "lucide-react";
import { u as usePermission } from "./usePermission-CvyvxnRG.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "recharts";
import "./terms-DwYjlWsV.js";
function ClassicDashboardView({
  performance = {},
  outstanding = {},
  netProfit = {},
  salesData,
  topSellingItems = [],
  lowStockItems = [],
  recentPurchases = [],
  recentTransactions = [],
  plSummary = {},
  bankAccounts = [],
  cashAccounts = [],
  cashData = {},
  inventoryValue,
  desktopSidePanelVisible = true,
  mobileRightPanelOpen = false,
  setMobileRightPanelOpen
}) {
  const { auth, store } = usePage().props;
  const { hasPerm, isAdmin } = usePermission();
  const canSales = hasPerm("sales", "reports");
  const canFinance = hasPerm("finance");
  const canInventory = hasPerm("inventory");
  hasPerm("reports");
  const canPurchases = hasPerm("purchases");
  const showRightPanel = isAdmin || auth?.user?.role === "manager" || auth?.user?.role === "accountant";
  const [performancePeriod, setPerformancePeriod] = useState("Today");
  const [grossProfitPeriod, setGrossProfitPeriod] = useState("Today");
  const [toReceivePeriod, setToReceivePeriod] = useState("Month");
  const [toPayPeriod, setToPayPeriod] = useState("Month");
  const [netProfitPeriod, setNetProfitPeriod] = useState("Month");
  const [purchasesPeriod, setPurchasesPeriod] = useState("Month");
  useEffect(() => {
    const handleReset = () => {
      setPerformancePeriod("Today");
      setGrossProfitPeriod("Today");
      setToReceivePeriod("Month");
      setToPayPeriod("Month");
      setNetProfitPeriod("Month");
      setPurchasesPeriod("Month");
    };
    window.addEventListener("vq:classic-reset", handleReset);
    return () => window.removeEventListener("vq:classic-reset", handleReset);
  }, []);
  const timeframeOptions = [
    { value: "Today", label: "Today" },
    { value: "Month", label: "Month" },
    { value: "Year", label: "Year" },
    { value: "All Time", label: "All Time" }
  ];
  const purchasesList = Array.isArray(recentPurchases) ? recentPurchases : recentPurchases[purchasesPeriod] || [];
  const totalRevVal = parseFloat(performance[performancePeriod]?.sales || 0);
  const grossProfitVal = parseFloat(performance[grossProfitPeriod]?.gross_profit || 0);
  const grossProfitRev = parseFloat(performance[grossProfitPeriod]?.sales || 0);
  const grossMarginPct = grossProfitRev > 0 ? (grossProfitVal / grossProfitRev * 100).toFixed(1) : "0.0";
  const toReceiveVal = parseFloat(outstanding[toReceivePeriod]?.receivables || 0);
  const toPayVal = parseFloat(outstanding[toPayPeriod]?.payables || 0);
  const netProfitData = netProfit[netProfitPeriod] || {};
  const netProfitVal = parseFloat(netProfitData.value || 0);
  const netProfitIncome = parseFloat(netProfitData.income || 0);
  const netProfitExpense = parseFloat(netProfitData.expense || 0);
  const healthStatus = netProfitData.status || (netProfitVal >= 0 ? "Good" : "Needs Attention");
  return /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes nudge-left {
                    0%, 100% { transform: translateY(-50%) translateX(0); }
                    50% { transform: translateY(-50%) translateX(-3px); }
                }
                .animate-nudge-left {
                    animation: nudge-left 2.5s ease-in-out infinite;
                }
            ` }),
    showRightPanel && /* @__PURE__ */ jsxs("div", { className: "lg:hidden", children: [
      mobileRightPanelOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-drawer lg:hidden", onClick: () => setMobileRightPanelOpen && setMobileRightPanelOpen(false) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `
                            fixed top-0 right-0 h-[100vh] z-drawer
                            transition-transform duration-slow ease-in-out transform
                            ${mobileRightPanelOpen ? "translate-x-0" : "translate-x-full"}
                            w-[320px] bg-surface border-l border-line p-4 flex flex-col h-full
                        `,
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setMobileRightPanelOpen && setMobileRightPanelOpen(!mobileRightPanelOpen),
                className: `absolute left-[-24px] top-1/2 -translate-y-1/2 z-modal lg:hidden w-6 h-32 flex items-center justify-center text-ink-muted hover:text-brand-500 transition-colors pointer-events-auto ${!mobileRightPanelOpen ? "animate-nudge-left" : ""}`,
                style: { filter: "drop-shadow(-4px 4px 6px rgba(0, 0, 0, 0.04))" },
                children: [
                  /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      className: "absolute inset-0 w-full h-full text-white dark:text-ink pointer-events-none",
                      viewBox: "0 0 24 128",
                      fill: "currentColor",
                      xmlns: "http://www.w3.org/2000/svg",
                      children: [
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128 Z",
                            fill: "currentColor"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            d: "M 24 0 C 24 20, 0 35, 0 64 C 0 93, 24 108, 24 128",
                            fill: "none",
                            className: "stroke-chart-grid",
                            strokeWidth: "1"
                          }
                        )
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(ChevronLeft, { size: 14, className: `relative z-10 transition-transform duration-slow ${mobileRightPanelOpen ? "rotate-180" : ""}` })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto custom-scrollbar pr-1", children: /* @__PURE__ */ jsx(
              RightPanel,
              {
                recentTransactions,
                bankAccounts,
                cashAccounts,
                cashData,
                inventoryValue
              }
            ) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-full max-w-full py-2 px-1 sm:px-2", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-5 sm:gap-6 w-full animate-in fade-in duration-slower", children: [
      /* @__PURE__ */ jsxs("div", { className: `col-span-12 ${showRightPanel && desktopSidePanelVisible ? "xl:col-span-9" : "col-span-12"} flex flex-col gap-6 min-w-0`, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-4.5 w-full", children: [
          canSales && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-revenue",
              onClick: () => router.visit(route("store.sales.index", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0", children: /* @__PURE__ */ jsx(TrendingUp, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Revenue" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: performancePeriod,
                      onChange: setPerformancePeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight", children: formatCurrency(totalRevVal, store) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 truncate", children: [
                    "Gross: ",
                    formatCurrency(parseFloat(performance[performancePeriod]?.gross_profit || 0), store)
                  ] })
                ] })
              ]
            }
          ),
          canSales && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-profit",
              onClick: () => router.visit(route("store.reports.dashboard", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-brand-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0", children: /* @__PURE__ */ jsx(Percent, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Gross Profit" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: grossProfitPeriod,
                      onChange: setGrossProfitPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-ink tracking-tight truncate leading-tight", children: formatCurrency(grossProfitVal, store) }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-brand-600 dark:text-brand-400 font-semibold mt-1 truncate", children: [
                    "Margin: ",
                    grossMarginPct,
                    "%"
                  ] })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-receivables",
              onClick: () => router.visit(route("store.finance.receivables", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0", children: /* @__PURE__ */ jsx(ArrowDownLeft, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "To Receive" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: toReceivePeriod,
                      onChange: setToReceivePeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight truncate leading-tight", children: formatCurrency(toReceiveVal, store) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1 truncate", children: "Customer receivables" })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-payables",
              onClick: () => router.visit(route("store.finance.payables", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "To Pay" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: toPayPeriod,
                      onChange: setToPayPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight truncate leading-tight", children: formatCurrency(toPayVal, store) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1 truncate", children: "Supplier payables" })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-netprofit",
              onClick: () => router.visit(route("store.reports.profit-loss", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-teal-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0", children: /* @__PURE__ */ jsx(Wallet, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Net Profit" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), className: "shrink-0", children: /* @__PURE__ */ jsx(
                    PremiumDropdown,
                    {
                      options: timeframeOptions,
                      value: netProfitPeriod,
                      onChange: setNetProfitPeriod
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight truncate leading-tight", children: formatCurrency(netProfitVal, store) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1 text-3xs text-ink-muted font-medium truncate", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-emerald-600 dark:text-emerald-400 font-semibold truncate", children: [
                      "+",
                      formatCurrency(netProfitIncome, store)
                    ] }),
                    /* @__PURE__ */ jsx("span", { children: "·" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-rose-500 font-semibold truncate", children: [
                      "-",
                      formatCurrency(netProfitExpense, store)
                    ] })
                  ] })
                ] })
              ]
            }
          ),
          canFinance && /* @__PURE__ */ jsxs(
            "div",
            {
              id: "tour-stat-health",
              onClick: () => router.visit(route("store.reports.dashboard", { store_slug: store?.slug })),
              className: "bg-surface rounded-lg p-4 sm:p-4.5 border border-line shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-slow cursor-pointer flex flex-col justify-between relative overflow-hidden group min-h-[148px]",
              children: [
                /* @__PURE__ */ jsx("div", { className: "absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transition-transform duration-slower pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0", children: /* @__PURE__ */ jsx(Activity, { size: 15 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink-muted text-3xs uppercase tracking-wider truncate", children: "Store Health" })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "flex h-2 w-2 relative shrink-0", children: [
                    /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" }),
                    /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-emerald-500" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2.5 relative z-10 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 text-2xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide", children: healthStatus }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium mt-1.5 truncate", children: "Books balanced & active" })
                ] })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-5 sm:gap-6 w-full min-w-0", children: [
          canSales && /* @__PURE__ */ jsx(
            "div",
            {
              id: "tour-sales-chart",
              className: `${isAdmin && store?.features?.growth_engine == 1 ? "col-span-12 xl:col-span-8" : "col-span-12"} min-h-[340px] min-w-0`,
              children: /* @__PURE__ */ jsx(ChartSection, { salesData })
            }
          ),
          isAdmin && store?.features?.growth_engine == 1 && /* @__PURE__ */ jsx("div", { id: "tour-opportunities", className: "col-span-12 xl:col-span-4 min-w-0 flex flex-col min-h-[340px]", children: /* @__PURE__ */ jsx(TodaysOpportunities, { className: "flex-1" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 w-full min-w-0", children: [
          canSales && /* @__PURE__ */ jsxs("div", { id: "tour-top-products", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] group min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink text-sm flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-emerald-500 rounded-full" }),
                "Top Products"
              ] }),
              /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover rounded-lg transition-colors text-ink-muted hover:text-brand-600", children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 16 }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-0 pr-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-3xs font-bold uppercase tracking-wider text-ink-muted border-b border-line", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 pl-1", children: "Product" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2.5 text-right pr-1", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { children: [
                topSellingItems.map((item, i) => /* @__PURE__ */ jsxs("tr", { className: "group/row hover:bg-interactive-hover transition-colors cursor-default rounded-xl", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 pl-1 border-b border-line group-last/row:border-none", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-sunken flex items-center justify-center text-sm shadow-2xs border border-line shrink-0 group-hover/row:scale-105 transition-transform", children: item.image }),
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium truncate", children: item.category })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 text-xs text-center font-bold text-ink-secondary border-b border-line group-last/row:border-none", children: /* @__PURE__ */ jsx("span", { className: "bg-sunken px-2 py-0.5 rounded-md text-3xs font-semibold", children: item.sold }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 pr-1 text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-line group-last/row:border-none whitespace-nowrap", children: item.revenue })
                ] }, i)),
                topSellingItems.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "3", className: "py-8 text-center text-ink-muted text-xs", children: "No sales data recorded yet." }) })
              ] })
            ] }) })
          ] }),
          canInventory && /* @__PURE__ */ jsxs("div", { id: "tour-low-stock", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink text-sm flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-rose-500 rounded-full" }),
                "Low Stock Alerts"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })),
                  className: "text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline",
                  children: "View Inventory"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 pr-1 space-y-2.5", children: [
              lowStockItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2.5 bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-3xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5", children: [
                    "Stock: ",
                    formatNumber(item.stock),
                    " / Min: ",
                    formatNumber(item.alert)
                  ] })
                ] }),
                canPurchases && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => router.visit(route("store.purchases.create", { store_slug: store?.slug, product_id: item.id })),
                    className: "px-2.5 py-1 bg-surface text-3xs font-bold text-ink-secondary dark:text-ink-faint rounded-lg shadow-2xs border border-line hover:text-brand-600 dark:hover:text-brand-400 shrink-0 transition-colors",
                    children: "Order"
                  }
                )
              ] }, item.id)),
              lowStockItems.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted py-8", children: [
                /* @__PURE__ */ jsx(ShieldCheck, { size: 28, className: "text-emerald-500 mb-1" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink-secondary", children: "All Stock Healthy" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5", children: "No products below alert threshold" })
              ] })
            ] })
          ] }),
          canPurchases && /* @__PURE__ */ jsxs("div", { id: "tour-purchases", className: "bg-surface rounded-lg p-5 sm:p-6 shadow-sm border border-line flex flex-col min-h-[340px] min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4 shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-4 bg-amber-500 rounded-full" }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm", children: "Recent Purchases" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  PremiumDropdown,
                  {
                    options: timeframeOptions,
                    value: purchasesPeriod,
                    onChange: setPurchasesPeriod
                  }
                ) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => router.visit(route("store.purchases.index", { store_slug: store?.slug })),
                    className: "text-3xs text-brand-600 dark:text-brand-400 font-bold hover:underline",
                    children: "View All"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 pr-1 space-y-2.5", children: [
              purchasesList.map((item) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: item.id })),
                  className: "flex items-center justify-between p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-800 transition-colors cursor-pointer gap-2",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-secondary dark:text-ink-faint truncate", children: item.supplier_name }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted font-medium", children: item.date })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-600 dark:text-amber-400", children: item.total_amount }),
                      /* @__PURE__ */ jsx("p", { className: "text-3xs uppercase tracking-wider font-bold text-ink-muted leading-none mt-0.5", children: item.status })
                    ] })
                  ]
                },
                item.id
              )),
              purchasesList.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted py-8", children: [
                /* @__PURE__ */ jsx(Package, { size: 28, className: "text-ink-faint dark:text-ink-secondary mb-1" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-ink-secondary", children: "No Purchases" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xs text-ink-muted mt-0.5", children: "No recent purchases for this period" })
              ] })
            ] })
          ] })
        ] })
      ] }),
      showRightPanel && desktopSidePanelVisible && /* @__PURE__ */ jsx("div", { id: "tour-right-panel", className: "hidden xl:block xl:col-span-3 min-w-0 self-start sticky top-0", children: /* @__PURE__ */ jsx(
        RightPanel,
        {
          recentTransactions,
          bankAccounts,
          cashAccounts,
          cashData,
          inventoryValue
        }
      ) })
    ] }) })
  ] });
}
export {
  ClassicDashboardView as default
};
