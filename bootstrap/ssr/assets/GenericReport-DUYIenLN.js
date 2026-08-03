import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { M as MasterReport } from "./MasterReport-DW_Px1Kd.js";
import "./marketing-pages-CTBAvetE.js";
import "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
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
