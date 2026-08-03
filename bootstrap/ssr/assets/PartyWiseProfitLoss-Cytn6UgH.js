import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-kXIq83oc.js";
import { UserCheck } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./ReportsLayout-SZbN0U_-.js";
import "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-CJpcDBXD.js";
function PartyWiseProfitLoss({ parties }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Party-wise Profit & Loss",
      subtitle: "Profitability analysis per customer/supplier",
      icon: UserCheck,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Party Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Total Sales" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right", children: "Estimated Profit" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: parties.map((party, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-slate-800 dark:text-white", children: party.name }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400", children: formatCurrency(party.sales) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-black text-emerald-600 dark:text-emerald-400", children: formatCurrency(party.profit) })
        ] }, idx)) })
      ] }) })
    }
  );
}
export {
  PartyWiseProfitLoss as default
};
