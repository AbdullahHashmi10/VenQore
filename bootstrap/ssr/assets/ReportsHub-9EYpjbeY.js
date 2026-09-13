import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo, useRef } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { TrendingUp, BarChart3, BarChart2, FileText, Percent, Clock, ShoppingCart, Package, PackageMinus, AlertTriangle, History, Hourglass, Layers, Box, Scale, RefreshCw, Landmark, CreditCard, PieChart, Hash, Activity, BookOpen, Calendar, Users, ArrowLeftRight, UserPlus, PackageSearch, Users2, Search, Lock, ArrowRight } from "lucide-react";
import { i as isReportLocked, g as getReportTier, a as getReportDecisionMessage } from "./OneGlanceLayout-D0x15wPs.js";
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
const DummyPreviewTable = () => /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-lg border border-line/60 bg-subtle/70 p-2.5 font-mono text-[11px] text-ink-muted select-none", children: [
  /* @__PURE__ */ jsxs("div", { className: "flex justify-between border-b border-line/50 pb-1 font-semibold text-ink-secondary", children: [
    /* @__PURE__ */ jsx("span", { children: "Item / Account" }),
    /* @__PURE__ */ jsx("span", { children: "Trend" }),
    /* @__PURE__ */ jsx("span", { children: "Performance" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "flex justify-between py-1 border-b border-line/30 opacity-85", children: [
    /* @__PURE__ */ jsx("span", { children: "Sample Metric A" }),
    /* @__PURE__ */ jsx("span", { children: "Volume +12%" }),
    /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400 font-medium", children: "+24.5%" })
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-1 opacity-75", children: [
    /* @__PURE__ */ jsx("span", { children: "Sample Metric B" }),
    /* @__PURE__ */ jsx("span", { children: "Volume -3%" }),
    /* @__PURE__ */ jsx("span", { className: "text-rose-600 dark:text-rose-400 font-medium", children: "-4.2%" })
  ] })
] });
const Card3D = ({ report }) => {
  const { store, planFeatures = {} } = usePage().props;
  const cardRef = useRef(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const Icon = report.icon;
  const getReportRouteName = (href) => {
    if (!href) return "";
    const parts = href.split("/reports/");
    if (parts.length > 1) {
      return `store.reports.${parts[1].split("?")[0]}`;
    }
    if (href.includes("/v3/reports/")) {
      const v3parts = href.split("/v3/reports/");
      return `store.v3.reports.${v3parts[1].split("?")[0]}`;
    }
    return "";
  };
  const reportRouteName = getReportRouteName(report.href);
  const isLocked = isReportLocked(reportRouteName, planFeatures);
  const getGlowColor = (colorClass) => {
    if (colorClass.includes("emerald")) return "rgba(16, 185, 129, 0.7)";
    if (colorClass.includes("purple")) return "rgba(168, 85, 247, 0.7)";
    if (colorClass.includes("indigo")) return "rgba(99, 102, 241, 0.7)";
    if (colorClass.includes("blue")) return "rgba(59, 130, 246, 0.7)";
    if (colorClass.includes("rose") || colorClass.includes("red")) return "rgba(244, 63, 94, 0.7)";
    if (colorClass.includes("orange") || colorClass.includes("amber")) return "rgba(249, 115, 22, 0.7)";
    if (colorClass.includes("cyan")) return "rgba(6, 182, 212, 0.7)";
    if (colorClass.includes("violet")) return "rgba(139, 92, 246, 0.7)";
    return "rgba(99, 102, 241, 0.7)";
  };
  const glowColor = getGlowColor(report.color || "");
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -5;
    const rotateY = (x - centerX) / centerX * 5;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlowPos({ x, y });
  };
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };
  if (isLocked) {
    const tier = getReportTier(reportRouteName) || "Starter";
    const decision = getReportDecisionMessage(reportRouteName);
    return /* @__PURE__ */ jsx("div", { className: "relative bg-surface rounded-2xl border border-line overflow-hidden flex flex-col h-full shadow-xs", children: /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col h-full z-10 justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-subtle border border-line text-ink-secondary", children: /* @__PURE__ */ jsx(Icon, { size: 22, strokeWidth: 1.5 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink leading-tight", children: report.title }),
              /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20", children: tier })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium mt-0.5 line-clamp-1", children: report.description })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 pt-3 border-t border-line", children: /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ink-secondary leading-relaxed font-normal", children: report.longDescription }) }),
        /* @__PURE__ */ jsx(DummyPreviewTable, {})
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-3 border-t border-line flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-ink-muted line-clamp-1", title: decision, children: decision }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: store?.slug ? route("store.billing", { store_slug: store.slug }) : "/billing",
            className: "shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-xs",
            children: [
              /* @__PURE__ */ jsx(Lock, { size: 12 }),
              "Upgrade"
            ]
          }
        )
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs(
    Link,
    {
      href: report.href,
      ref: cardRef,
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      style: { transform, transition: "transform 0.1s ease-out" },
      className: "group relative bg-surface rounded-2xl border border-line overflow-hidden flex flex-col h-full transform-gpu",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "pointer-events-none absolute -inset-px transition duration-slow opacity-0 group-hover:opacity-100",
            style: {
              background: `radial-gradient(800px circle at ${glowPos.x}px ${glowPos.y}px, ${glowColor}, transparent 55%)`
            }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative p-6 flex flex-col h-full z-10 bg-white/5 dark:bg-app backdrop-blur-3xl h-full", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center shrink-0", style: { filter: isHovered ? `drop-shadow(0 0 12px ${glowColor})` : "none", transition: "filter 0.3s ease" }, children: /* @__PURE__ */ jsx(Icon, { size: 30, strokeWidth: 1.5, className: `${report.color} transition-transform duration-slow` }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight", children: report.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium line-clamp-1 mt-0.5", children: report.description })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 pt-4 border-t border-line flex-grow", children: /* @__PURE__ */ jsx("p", { className: "text-[12px] text-ink-muted/80 leading-relaxed font-medium", children: report.longDescription }) }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 right-4 text-neutral-300 dark:text-ink-secondary group-hover:text-brand-500 group-hover:translate-x-1 transition-all duration-slow opacity-0 group-hover:opacity-100", children: /* @__PURE__ */ jsx(ArrowRight, { size: 18 }) })
        ] })
      ]
    }
  );
};
function ReportsHub() {
  const tt = useTermText();
  const {
    store,
    hiddenReports = []
  } = usePage().props;
  const [searchTerm, setSearchTerm] = useState("");
  if (!store?.slug) return null;
  const reportGroups = useMemo(() => [
    {
      title: "Sales & Income",
      description: "Analyze your sales performance and revenue",
      reports: [
        {
          title: "Sales Report",
          description: "Detailed sales history",
          longDescription: "View a comprehensive and detailed log of every sales invoice generated. This report allows you to filter by specific date ranges, customers, or payment statuses to accurately track your revenue trends over time.",
          icon: TrendingUp,
          color: "text-emerald-500",
          visible: !hiddenReports.includes("sales"),
          href: route("store.reports.sales", {
            store_slug: store.slug
          })
        },
        {
          title: "Sales Analytics",
          description: "Visual insights & trends",
          longDescription: "Deep dive into your sales data with interactive visual charts and graphs. This tool helps you understand complex revenue trends, identify your peak selling hours, and measure overall business growth metrics at a glance.",
          icon: BarChart3,
          color: "text-brand-500",
          visible: !hiddenReports.includes("analytics"),
          href: route("store.reports.analytics", {
            store_slug: store.slug
          })
        },
        {
          title: "Profit & Loss",
          description: "Net profit analysis",
          longDescription: "The ultimate financial health check for your business. This statement summarizes all income minus expenses to clearly reveal your net profit or loss for any selected period, ensuring you stay profitable.",
          icon: BarChart2,
          color: "text-brand-500",
          visible: !hiddenReports.includes("profit-loss"),
          href: route("store.reports.profit-loss", {
            store_slug: store.slug
          })
        },
        {
          title: "Item-wise Profit",
          description: "Product profitability",
          longDescription: "Analyze exactly which products are driving your bottom line. See the specific profit margin earned on each item sold to help you optimize your inventory mix and focus on high-yield products.",
          icon: TrendingUp,
          color: "text-emerald-400",
          visible: !hiddenReports.includes("item-wise-profit"),
          href: route("store.reports.item-wise-profit", {
            store_slug: store.slug
          })
        },
        {
          title: "Bill-wise Profit",
          description: "Invoice profitability",
          longDescription: "Granular profit tracking for every single invoice. See exactly how much money you made on each specific sale after costs, helping you identify which transactions are most valuable to your business.",
          icon: FileText,
          color: "text-blue-500",
          visible: !hiddenReports.includes("bill-wise-profit"),
          href: route("store.reports.bill-wise-profit", {
            store_slug: store.slug
          })
        },
        {
          title: "Discount Report",
          description: "Track price concessions",
          longDescription: "Monitor how much potential revenue is being forgone through discounts. Identify which customers are receiving the most concessions and adjust your pricing strategy to maximize earnings.",
          icon: Percent,
          color: "text-rose-500",
          visible: !hiddenReports.includes("discount"),
          href: route("store.reports.discount", {
            store_slug: store.slug
          })
        },
        {
          title: "Sale Aging",
          description: "Outstanding receivables",
          longDescription: "Essential cash flow forecasting tool. Quickly see which customers owe you money and how long their invoices have been outstanding, helping you prioritize collections and maintain liquidity.",
          icon: Clock,
          color: "text-orange-500",
          visible: !hiddenReports.includes("sale-aging"),
          href: route("store.reports.sale-aging", {
            store_slug: store.slug
          })
        },
        {
          title: tt("Sales Orders"),
          description: tt("Open order tracking"),
          longDescription: "Monitor all open sales orders that are currently pending. Track orders that are yet to be converted into final invoices or delivered, ensuring no customer request falls through the cracks.",
          icon: ShoppingCart,
          color: "text-cyan-500",
          visible: !hiddenReports.includes("sale-orders"),
          href: route("store.reports.sale-orders", {
            store_slug: store.slug
          })
        },
        {
          title: "Sale Order Items",
          description: "Item-level order details",
          longDescription: "See exactly what specific products are currently on order across all clients. This helps drastically with procurement planning and ensuring you have enough stock to fulfill pending commitments.",
          icon: Package,
          color: "text-brand-400",
          visible: !hiddenReports.includes("sale-order-items"),
          href: route("store.reports.sale-order-items", {
            store_slug: store.slug
          })
        }
      ]
    },
    {
      title: "Inventory & Purchase",
      description: "Track stock movement and purchasing",
      reports: [
        {
          title: "Purchase Report",
          description: "Supplier bill history",
          longDescription: "A comprehensive history of all your purchases. Track every supplier bill, cost, and procurement date in one place to better understand your spending habits and supplier relationships.",
          icon: ShoppingCart,
          color: "text-amber-500",
          visible: !hiddenReports.includes("purchases"),
          href: route("store.reports.purchases", {
            store_slug: store.slug
          })
        },
        {
          title: "Purchase Returns",
          description: "Debit notes & returns",
          longDescription: "Track all stock returns and debit notes sent to suppliers. Monitor refund progress, return reasons, and adjust accounts payable accordingly.",
          icon: PackageMinus,
          color: "text-rose-500",
          visible: !hiddenReports.includes("purchase-returns"),
          href: route("store.reports.purchase-returns", {
            store_slug: store.slug
          })
        },
        {
          title: "Stock Valuation",
          description: "Inventory asset value",
          longDescription: "Calculate the total financial worth of your current stock based on cost price. This report provides a crucial figure for your balance sheet and helps you understand exactly how much capital is tied up in inventory.",
          icon: Package,
          color: "text-brand-500",
          visible: !hiddenReports.includes("stock-valuation"),
          href: route("store.reports.stock-valuation", {
            store_slug: store.slug
          })
        },
        {
          title: "Low Stock Report",
          description: "Reorder warnings",
          longDescription: "A critical alert system for your inventory. Get a list of items running low to help you reorder in time, preventing stockouts and ensuring you never miss a sale due to missing products.",
          icon: AlertTriangle,
          color: "text-red-500",
          visible: !hiddenReports.includes("low-stock"),
          href: route("store.reports.low-stock", {
            store_slug: store.slug
          })
        },
        {
          title: "Stock Movement",
          description: "Item audit trail",
          longDescription: "A detailed history of every single stock addition, deduction, or transfer. This provides complete traceability for every item, helping you identify shrinkage or tracking errors immediately.",
          icon: History,
          color: "text-blue-500",
          visible: !hiddenReports.includes("movement-history"),
          href: route("store.reports.movement-history", {
            store_slug: store.slug
          })
        },
        {
          title: "Stock Aging",
          description: "Inventory freshness",
          longDescription: "Identify old stock that has been sitting in your warehouse for too long. Clearing out slow-moving inventory releases cash and makes room for more profitable, fast-moving items.",
          icon: Hourglass,
          color: "text-orange-500",
          visible: !hiddenReports.includes("stock-aging"),
          href: route("store.reports.stock-aging", {
            store_slug: store.slug
          })
        },
        {
          title: "Stock Summary",
          description: "Category valuation",
          longDescription: "See the distribution of your inventory value across different product categories. This high-level view helps you decide which categories warrant more investment and which are overstocked.",
          icon: Layers,
          color: "text-brand-500",
          visible: !hiddenReports.includes("stock-summary-by-category"),
          href: route("store.reports.stock-summary-by-category", {
            store_slug: store.slug
          })
        },
        {
          title: "Item Detail Report",
          description: "Master data view",
          longDescription: "View full specifications and configuration details for every item in your system. This master data view is essential for auditing product settings, prices, and tax configurations.",
          icon: Box,
          color: "text-ink-muted",
          visible: !hiddenReports.includes("item-detail"),
          href: route("store.reports.item-detail", {
            store_slug: store.slug
          })
        },
        {
          title: "Expiry Report",
          description: "Perishability tracker",
          longDescription: "Monitor batches that are nearing their expiration date. This report helps you proactively discount or clear out perishable goods before they spoil, significantly reducing wastage and loss.",
          icon: AlertTriangle,
          color: "text-orange-500",
          visible: !hiddenReports.includes("expiry"),
          href: route("store.reports.expiry", {
            store_slug: store.slug
          })
        },
        {
          title: "Point-In-Time Inventory",
          description: "Historical inventory valuation",
          longDescription: "Go back in time and view the exact quantity and asset value of your inventory as of any specific date. Crucial for matching past accounting balances and financial reconciliation.",
          icon: History,
          color: "text-brand-400",
          visible: !hiddenReports.includes("point-in-time-inventory"),
          href: route("store.reports.point-in-time-inventory", {
            store_slug: store.slug
          })
        }
      ]
    },
    {
      title: "Finance & Tax",
      description: "Financial statements, taxes, and ledgers",
      reports: [
        {
          title: "Balance Sheet",
          description: "Assets vs Liabilities",
          longDescription: "Your primary financial position snapshot. View your assets, liabilities, and equity at a specific point in time to understand the overall financial stability and net worth of your business.",
          icon: Scale,
          color: "text-brand-500",
          visible: !hiddenReports.includes("balance-sheet"),
          href: route("store.reports.balance-sheet", {
            store_slug: store.slug
          })
        },
        {
          title: "Trial Balance",
          description: "Ledger summary",
          longDescription: "A summary of all ledger account balances to ensure debits equal credits. This is a fundamental accounting report used to verify the mathematical accuracy of your bookkeeping before creating financial statements.",
          icon: Scale,
          color: "text-blue-500",
          visible: !hiddenReports.includes("trial-balance"),
          href: route("store.reports.trial-balance", {
            store_slug: store.slug
          })
        },
        {
          title: "Cash Flow",
          description: "Liquidity analysis",
          longDescription: "Track the actual movement of cash in and out of your business. This report is vital for understanding your liquidity and ensuring you have enough cash on hand to meet immediate obligations.",
          icon: RefreshCw,
          color: "text-emerald-500",
          visible: !hiddenReports.includes("cash-flow"),
          href: route("store.reports.cash-flow", {
            store_slug: store.slug
          })
        },
        {
          title: "Bank Statement",
          description: "Transaction reconciliation",
          longDescription: "View all recorded bank transactions to match with your actual bank feed. Regular reconciliation ensures your system records match the bank's records, catching errors or unauthorized transactions early.",
          icon: Landmark,
          color: "text-blue-400",
          visible: !hiddenReports.includes("bank-statement"),
          href: route("store.reports.bank-statement", {
            store_slug: store.slug
          })
        },
        {
          title: "Expense Report",
          description: "Spending tracker",
          longDescription: "A detailed list of all business expenses. Use this to audit your spending, find areas to cut costs, and ensure all tax-deductible expenses are correctly recorded for your filings.",
          icon: CreditCard,
          color: "text-rose-500",
          visible: !hiddenReports.includes("expenses"),
          href: route("store.reports.expenses", {
            store_slug: store.slug
          })
        },
        {
          title: "Expense Category",
          description: "Cost center analysis",
          longDescription: "A visual breakdown of where your money is going (e.g., Rent, Utilities, Salaries). This helps you identify which specific operational areas are consuming the most budget.",
          icon: PieChart,
          color: "text-rose-400",
          visible: !hiddenReports.includes("expense-by-category"),
          href: route("store.reports.expense-by-category", {
            store_slug: store.slug
          })
        },
        {
          title: "Tax Report",
          description: "Input vs Output Tax",
          longDescription: "Compare Total Output Tax (collected from sales) against Input Tax (paid on purchases) to accurately calculate your final tax liability. Essential for preparing your tax returns.",
          icon: Landmark,
          color: "text-amber-500",
          visible: !hiddenReports.includes("tax"),
          href: route("store.reports.tax", {
            store_slug: store.slug
          })
        },
        {
          title: "Tax Rate Report",
          description: "Tax breakdown",
          longDescription: "View sales and purchases grouped by specific tax percentages (e.g., 5%, 12%, 18%). This granular view helps you ensure you are applying the correct tax rates across different product lines.",
          icon: Hash,
          color: "text-amber-400",
          visible: !hiddenReports.includes("tax-rate"),
          href: route("store.reports.tax-rate", {
            store_slug: store.slug
          })
        },
        {
          title: "Owner's Daily Pulse",
          description: "Secure health dashboard",
          longDescription: "A secure vault displaying 7 vital daily store metrics (Sales, Purchases, Stock, Payables, Receivables, Cash, Expenses) with daily inline memos. Access is protected by an authorization passcode.",
          icon: Activity,
          color: "text-brand-500",
          visible: !hiddenReports.includes("owner-daily-pulse"),
          href: route("store.reports.owner-daily-pulse", {
            store_slug: store.slug
          })
        }
      ]
    },
    {
      title: "Accounting & Ledgers",
      description: "General journal, day book, and internal accounts",
      reports: [
        {
          title: "Chart of Accounts",
          description: "Financial backbone",
          longDescription: "Manage all your ledger accounts (Assets, Liabilities, Income, Expenses). This is the structural backbone of your accounting system, defining how every transaction is categorized.",
          icon: FileText,
          color: "text-brand-500",
          href: route("store.accounting.index", { store_slug: store.slug })
        },
        {
          title: "Journal Entries",
          // Account Ledger
          description: "General Ledger",
          longDescription: "View the raw double-entry accounting records for full transparency. This report allows accountants to inspect the debit and credit side of every single transaction in the system.",
          icon: BookOpen,
          color: "text-brand-500",
          visible: !hiddenReports.includes("account-ledger"),
          href: route("store.reports.account-ledger", {
            store_slug: store.slug
          })
        },
        {
          title: "Day Book",
          description: "Daily activity log",
          longDescription: "A chronological list of all transactions recorded on a specific day. Useful for verifying the day's work and ensuring all manual entries have been correctly logged before closing.",
          icon: Calendar,
          color: "text-cyan-500",
          visible: !hiddenReports.includes("day-book"),
          href: route("store.reports.day-book", {
            store_slug: store.slug
          })
        },
        {
          title: "All Transactions",
          description: "Global history",
          longDescription: "A complete master list of every financial event entered in the system. Use this when searching for a specific transaction across all modules, regardless of type or date.",
          icon: Activity,
          color: "text-ink-muted",
          visible: !hiddenReports.includes("transactions"),
          href: route("store.reports.transactions", {
            store_slug: store.slug
          })
        }
      ]
    },
    {
      title: "Parties & Relationships",
      description: tt("Customer and supplier analytics"),
      reports: [
        {
          title: "All Parties",
          description: "Contact directory",
          longDescription: "A complete directory list of all customers and suppliers with their contact info. Use this to manage your address book and quickly access details for any business partner.",
          icon: Users,
          color: "text-ink-muted",
          visible: !hiddenReports.includes("all-parties"),
          href: route("store.reports.all-parties", {
            store_slug: store.slug
          })
        },
        {
          title: "Party Statement",
          description: "Customer Ledger",
          longDescription: "A detailed statement of account transactions for any specific party. Send this to customers to show their opening balance, invoices, payments, and current outstanding dues.",
          icon: Users,
          color: "text-cyan-500",
          visible: !hiddenReports.includes("party-statement"),
          href: route("store.reports.party-statement", {
            store_slug: store.slug
          })
        },
        {
          title: "Party-wise P&L",
          description: "Client profitability",
          longDescription: "See which clients are generating the most profit for your business. This helps you identify your VIP customers and focus your relationship management efforts where they matter most.",
          icon: BarChart3,
          color: "text-emerald-500",
          visible: !hiddenReports.includes("party-wise-profit-loss"),
          href: route("store.reports.party-wise-profit-loss", {
            store_slug: store.slug
          })
        },
        {
          title: "Party Volume",
          description: "Turnover analysis",
          longDescription: "View the total turnover (sales and purchases) associated with each party. This metric helps you identify your largest trading partners by volume, unrelated to profitability.",
          icon: ArrowLeftRight,
          color: "text-blue-500",
          visible: !hiddenReports.includes("sale-purchase-by-party"),
          href: route("store.reports.sale-purchase-by-party", {
            store_slug: store.slug
          })
        },
        {
          title: "Item Report by Party",
          description: "Buying habits",
          longDescription: "Analyze what specific items a particular customer buys frequently. This insight allows you to create targeted offers and anticipate their needs before they even ask.",
          icon: UserPlus,
          color: "text-brand-500",
          visible: !hiddenReports.includes("item-report-by-party"),
          href: route("store.reports.item-report-by-party", {
            store_slug: store.slug
          })
        },
        {
          title: "Party Report by Item",
          description: "Product popularity",
          longDescription: "Reverse analysis to see which customers are buying a specific product. If you have a surplus of an item, use this report to find customers who have bought it before and offer a deal.",
          icon: PackageSearch,
          color: "text-brand-500",
          visible: !hiddenReports.includes("party-report-by-item"),
          href: route("store.reports.party-report-by-item", {
            store_slug: store.slug
          })
        },
        {
          title: "Loan Statement",
          description: "Liability tracker",
          longDescription: "Monitor outstanding loans and current balances. Keep track of principal and interest to ensure you are meeting your repayment obligations or collecting what is owed to you.",
          icon: Landmark,
          color: "text-red-500",
          visible: !hiddenReports.includes("loan-statement"),
          href: route("store.reports.loan-statement", {
            store_slug: store.slug
          })
        },
        {
          title: "Customer Insights",
          description: "Customer buying patterns",
          longDescription: "Deep dive into customer metrics, customer lifetime value, ordering frequency, average order values, and churn indicators to optimize your sales and marketing strategies.",
          icon: Users2,
          color: "text-emerald-500",
          visible: !hiddenReports.includes("customer-insights"),
          href: route("store.reports.customer-insights", {
            store_slug: store.slug
          })
        },
        {
          title: "Supplier Insights",
          description: "Procurement efficiency",
          longDescription: "Analyze supplier performance, purchase volumes, product costs, lead times, and outstanding payables to make informed procurement decisions and negotiate better terms.",
          icon: Landmark,
          color: "text-blue-500",
          visible: !hiddenReports.includes("supplier-insights"),
          href: route("store.reports.supplier-insights", {
            store_slug: store.slug
          })
        }
      ]
    }
  ], [store?.slug]);
  const visibleGroups = useMemo(() => {
    return reportGroups.map((group) => ({ ...group, reports: group.reports.filter((r) => r.visible !== false) })).filter((group) => group.reports.length > 0);
  }, [reportGroups]);
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return visibleGroups;
    const lowerSearch = searchTerm.toLowerCase();
    return visibleGroups.map((group) => {
      const matchingReports = group.reports.filter(
        (report) => report.title.toLowerCase().includes(lowerSearch) || report.description.toLowerCase().includes(lowerSearch) || report.longDescription?.toLowerCase().includes(lowerSearch)
      );
      return { ...group, reports: matchingReports };
    }).filter((group) => group.reports.length > 0);
  }, [searchTerm, visibleGroups]);
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Reports Hub", showSidebar: false, children: [
    /* @__PURE__ */ jsx(Head, { title: "Reports Hub" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-8 pb-10", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Reports Hub",
          subtitle: "Access all business reports and analytics",
          icon: FileText,
          breadcrumbs: [{ label: "Reports" }],
          actions: /* @__PURE__ */ jsxs("div", { className: "relative w-full md:w-auto", children: [
            /* @__PURE__ */ jsx(Search, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search reports...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "pl-10 pr-4 py-2 bg-surface border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 w-full md:w-64 shadow-sm outline-none transition-all placeholder:text-ink-muted"
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-10 px-4 sm:px-6", children: [
        filteredGroups.map((group, idx) => /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-end justify-between border-b border-line pb-2", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink uppercase tracking-widest", children: group.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: group.description })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: group.reports.map((report, rIdx) => /* @__PURE__ */ jsx(Card3D, { report }, rIdx)) })
        ] }, idx)),
        filteredGroups.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center py-20", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex p-4 rounded-full bg-sunken text-ink-muted mb-4", children: /* @__PURE__ */ jsx(FileText, { size: 48 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink-secondary", children: "No reports found" }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted", children: "Try adjusting your search terms" })
        ] })
      ] })
    ] })
  ] });
}
export {
  ReportsHub as default
};
