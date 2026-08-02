import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout, v as vq } from "./marketing-pages-DYgr6x02.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { Eye, Lock, BarChart2, Layers, TrendingUp, FileText } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ReportLink({ icon: Icon, label, sub, route: routeName, storeSlug }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: () => router.visit(window.route(routeName, { store_slug: storeSlug })),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: "14px 18px",
        borderRadius: 14,
        textAlign: "left",
        background: "var(--card-bg,#fff)",
        border: "1px solid var(--card-border,#f1f5f9)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s"
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.borderColor = vq.indigo[300];
        e.currentTarget.style.transform = "translateY(-1px)";
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.borderColor = "var(--card-border, #f1f5f9)";
        e.currentTarget.style.transform = "none";
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { width: 36, height: 36, borderRadius: 10, background: vq.violet[100], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { size: 17, color: vq.indigo[500] }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--text-main,#0f172a)" }, children: label }),
          sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], marginTop: 2 }, children: sub })
        ] })
      ]
    }
  );
}
function ViewerDashboard({ plSummary, inventoryValue }) {
  const { store } = usePage().props;
  const storeSlug = store?.slug;
  const sym = store?.currency_symbol ?? "$ ";
  const fmt = (v) => formatCurrency ? formatCurrency(parseFloat(v || 0), store) : sym + Number(v || 0).toLocaleString();
  const pl = plSummary || { income: 0, expense: 0, profit: 0 };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { activeMenu: "Dashboard", children: [
    /* @__PURE__ */ jsx(Head, { title: "Reports — Read Only" }),
    /* @__PURE__ */ jsxs("div", { style: { maxWidth: 700, margin: "0 auto", padding: "32px 24px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { marginBottom: 28 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }, children: [
          /* @__PURE__ */ jsx(Eye, { size: 20, color: vq.indigo[500] }),
          /* @__PURE__ */ jsx("h1", { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main,#0f172a)", margin: 0 }, children: "Read-Only Reports" })
        ] }),
        /* @__PURE__ */ jsxs("p", { style: { fontSize: 13, color: vq.slate[500], margin: 0 }, children: [
          store?.name,
          " · You have view-only access. No transactions can be created."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: vq.sky[50], border: "1px solid #bae6fd", marginBottom: 28, fontSize: 13, color: vq.sky[700] }, children: [
        /* @__PURE__ */ jsx(Lock, { size: 14 }),
        "Viewer access — you can see financial summaries but cannot create, edit, or delete records."
      ] }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }, children: [
        { label: "Income (Month)", value: fmt(pl.income), color: vq.emerald[500] },
        { label: "Expenses (Month)", value: fmt(pl.expense), color: vq.amber[500] },
        { label: "Net Profit", value: fmt(pl.profit), color: pl.profit >= 0 ? vq.indigo[500] : vq.red[500] }
      ].map((t) => /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 20, fontWeight: 800, color: t.color }, children: t.value }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[500], marginTop: 6, fontWeight: 600 }, children: t.label })
      ] }, t.label)) }),
      /* @__PURE__ */ jsxs("div", { style: { background: "var(--card-bg,#fff)", border: "1px solid var(--card-border,#f1f5f9)", borderRadius: 20, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", marginBottom: 28 }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--text-main,#0f172a)" }, children: "Total Inventory Value (FIFO)" }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[400], marginTop: 3 }, children: "Current cost-based valuation" })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 800, color: vq.indigo[500] }, children: fmt(inventoryValue ?? 0) })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--text-main,#0f172a)", marginBottom: 12 }, children: "Available Reports" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
        /* @__PURE__ */ jsx(ReportLink, { icon: BarChart2, label: "Profit & Loss Statement", sub: "Income, expenses, and net profit", route: "reports.profit-loss", storeSlug }),
        /* @__PURE__ */ jsx(ReportLink, { icon: Layers, label: "Balance Sheet", sub: "Assets, liabilities, and equity", route: "reports.balance-sheet", storeSlug }),
        /* @__PURE__ */ jsx(ReportLink, { icon: TrendingUp, label: "Inventory Valuation", sub: "FIFO cost-based stock value", route: "reports.inventory-valuation", storeSlug }),
        /* @__PURE__ */ jsx(ReportLink, { icon: FileText, label: "Trial Balance", sub: "Account-level debit/credit summary", route: "reports.trial-balance", storeSlug })
      ] })
    ] })
  ] });
}
export {
  ViewerDashboard as default
};
