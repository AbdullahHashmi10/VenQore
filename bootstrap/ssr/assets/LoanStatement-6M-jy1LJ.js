import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-DIT-Hv4K.js";
import { Landmark } from "lucide-react";
import "@inertiajs/react";
import "./ReportsLayout-Dg4OWYWu.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./PageHeader-CyOCUwIe.js";
import "./FilterPanel-CJpcDBXD.js";
function LoanStatement({ loans }) {
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Loan Statement",
      subtitle: "Overview of all active loans and liabilities",
      icon: Landmark,
      children: /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Landmark, { size: 40, className: "text-slate-300" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white mb-2", children: "No Loan Data Available" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 max-w-sm mx-auto", children: "You don't have any active loans or loan accounts recorded in the system yet." })
      ] })
    }
  );
}
export {
  LoanStatement as default
};
