import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { usePage } from "@inertiajs/react";
import { P as PlatformLayout } from "./PlatformLayout-CFRlnfbA.js";
import Overview from "./Overview-BS1KHtCa.js";
import { AppSumoView, FlagsView, StorageView, JobsView, SettingsView, PkVerificationsView, ImpersonationView, SupportView, DemoView, TestingView, GmvView, RevenueView } from "./Views-CpRkRe2g.js";
import "./marketing-pages-CTBAvetE.js";
import "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-CLtSftB2.js";
import "recharts";
const TITLES = {
  overview: "Overview",
  revenue: "Revenue",
  gmv: "Merchant GMV",
  testing: "Testing Center",
  demo: "Demo & Sandbox",
  support: "Support Inbox",
  impersonation: "Impersonation",
  "pk-verifications": "PK Verifications",
  settings: "Platform Settings",
  jobs: "Jobs & Queues",
  storage: "Storage",
  flags: "Feature Flags",
  appsumo: "AppSumo / LTD"
};
function viewFromUrl(url) {
  try {
    const qs = (url || (typeof window !== "undefined" ? window.location.search : "")).split("?")[1] || "";
    return new URLSearchParams(qs).get("view") || "overview";
  } catch {
    return "overview";
  }
}
function Dashboard(props) {
  const page = usePage();
  const view = useMemo(() => viewFromUrl(page.url), [page.url]);
  let content;
  switch (view) {
    case "revenue":
      content = /* @__PURE__ */ jsx(RevenueView, { ...props });
      break;
    case "gmv":
      content = /* @__PURE__ */ jsx(GmvView, { ...props });
      break;
    case "testing":
      content = /* @__PURE__ */ jsx(TestingView, { ...props });
      break;
    case "demo":
      content = /* @__PURE__ */ jsx(DemoView, { ...props });
      break;
    case "support":
      content = /* @__PURE__ */ jsx(SupportView, { ...props });
      break;
    case "impersonation":
      content = /* @__PURE__ */ jsx(ImpersonationView, { ...props });
      break;
    case "pk-verifications":
      content = /* @__PURE__ */ jsx(PkVerificationsView, { ...props });
      break;
    case "settings":
      content = /* @__PURE__ */ jsx(SettingsView, { ...props });
      break;
    case "jobs":
      content = /* @__PURE__ */ jsx(JobsView, { ...props });
      break;
    case "storage":
      content = /* @__PURE__ */ jsx(StorageView, { ...props });
      break;
    case "flags":
      content = /* @__PURE__ */ jsx(FlagsView, { ...props });
      break;
    case "appsumo":
      content = /* @__PURE__ */ jsx(AppSumoView, { ...props });
      break;
    default:
      content = /* @__PURE__ */ jsx(Overview, { ...props });
  }
  return /* @__PURE__ */ jsx(PlatformLayout, { title: TITLES[view] || "Overview", children: content });
}
export {
  Dashboard as default
};
