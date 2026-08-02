import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-DIT-Hv4K.js";
import { Users2 } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-Dg4OWYWu.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-CJpcDBXD.js";
function SalePurchaseByPartyGroup({ groups }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Sale & Purchase by Party Group",
      subtitle: "Transaction summary grouped by party types (Customer/Supplier)",
      icon: Users2,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Party Group" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center", children: "Party Count" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Total Sales" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Total Purchases" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Net Position" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: groups.map((group, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm", children: group.group }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center text-sm text-slate-500", children: group.party_count }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-emerald-600 dark:text-emerald-400", children: formatCurrency(group.sales) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-red-600 dark:text-red-400", children: formatCurrency(group.purchases) }),
          /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right text-sm font-black ${group.net >= 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(group.net) })
        ] }, idx)) })
      ] }) })
    }
  );
}
export {
  SalePurchaseByPartyGroup as default
};
