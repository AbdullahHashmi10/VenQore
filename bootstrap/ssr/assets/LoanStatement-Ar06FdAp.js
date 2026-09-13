import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import ReportPage from "./ReportPage-2DW3nAtZ.js";
import { Landmark } from "lucide-react";
import "@inertiajs/react";
import "./ReportsLayout-C08V7Mxf.js";
import "./OneGlanceLayout-D0x15wPs.js";
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
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
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
