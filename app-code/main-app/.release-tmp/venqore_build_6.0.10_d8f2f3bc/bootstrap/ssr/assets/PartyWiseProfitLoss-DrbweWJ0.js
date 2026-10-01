import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-DFIbFfxn.js";
import { UserCheck } from "lucide-react";
import { usePage } from "@inertiajs/react";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
import "./ReportsLayout-B6Be5tOZ.js";
import "./OneGlanceLayout-B_nL-Bzp.js";
import "react-dom";
import "./plans-Dp89V3MJ.js";
import "./runtime-zM7XrUga.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-B_UmKR56.js";
import "./terms-BnWz3Igl.js";
import "./ThinkingOrb-CQCcf5-R.js";
import "./AiIsland-yXhEIy75.js";
import "motion/react";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "./PageHeader-qaWJfzfS.js";
function PartyWiseProfitLoss({ parties }) {
  const { store } = usePage().props;
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Party-wise Profit & Loss",
      subtitle: "Profitability analysis per customer/supplier",
      icon: UserCheck,
      children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Party Name" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Total Sales" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right", children: "Estimated Profit" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: parties.map((party, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: party.name }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm text-ink-secondary", children: formatCurrency(party.sales) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(party.profit) })
        ] }, idx)) })
      ] }) })
    }
  );
}
export {
  PartyWiseProfitLoss as default
};
