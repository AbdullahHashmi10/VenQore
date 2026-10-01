import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-DFIbFfxn.js";
import { Landmark } from "lucide-react";
import "@inertiajs/react";
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
function LoanStatement({ loans }) {
  return /* @__PURE__ */ jsx(
    ReportPage,
    {
      title: "Loan Statement",
      subtitle: "Overview of all active loans and liabilities",
      icon: Landmark,
      children: /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-2xl bg-app flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsx(Landmark, { size: 40, className: "text-neutral-300" }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink mb-2", children: "No Loan Data Available" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted max-w-sm mx-auto", children: "You don't have any active loans or loan accounts recorded in the system yet." })
      ] })
    }
  );
}
export {
  LoanStatement as default
};
