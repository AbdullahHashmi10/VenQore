import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-dgloQ3DH.js";
import { M as MasterReport } from "./MasterReport-DOp2LEUE.js";
import "./OneGlanceLayout-DVMZFL-a.js";
import "react-dom";
import "lucide-react";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-qlixTg74.js";
import "motion/react";
import "./ThinkingOrb-CQCcf5-R.js";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "recharts";
import "./format-B_ph0Qec.js";
function GenericReport(props) {
  const {
    title,
    meta,
    filters = {},
    ...reportProps
  } = props;
  const handleFilterChange = (newFilterValues) => {
    router.get(window.location.pathname, {
      start_date: newFilterValues.start_date,
      end_date: newFilterValues.end_date,
      range: "custom"
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: title || "Report", children: [
    /* @__PURE__ */ jsx(Head, { title: title || "Report" }),
    /* @__PURE__ */ jsx(
      MasterReport,
      {
        title,
        filterValues: { start_date: filters.start_date, end_date: filters.end_date },
        onFilterChange: handleFilterChange,
        ...reportProps
      }
    )
  ] });
}
export {
  GenericReport as default
};
