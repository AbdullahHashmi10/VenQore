import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import "./OneGlanceLayout-C-94hBqK.js";
import "lucide-react";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
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
