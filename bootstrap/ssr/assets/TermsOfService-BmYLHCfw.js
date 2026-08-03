import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import { Scale } from "lucide-react";
import { a as MarketingLayout } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function TermsOfService() {
  const lastUpdated = "April 2025";
  const Section = ({ title, children }) => /* @__PURE__ */ jsxs("section", { className: "mb-10", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-900/[0.08] dark:border-white/10", children: title }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 text-slate-600 dark:text-slate-300 leading-relaxed", children })
  ] });
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "Terms of Service — VenQore",
      description: "VenQore Terms of Service. Read our terms before signing up.",
      children: /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-32 md:pt-36 pb-14", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 sm:gap-4 mb-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Scale, { size: 26, className: "text-indigo-600 dark:text-indigo-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-black tracking-tight", children: "Terms of Service" }),
            /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-sm mt-1", children: [
              "Last updated: ",
              lastUpdated
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-300 mb-10 p-4 rounded-xl bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/[0.08] dark:border-white/10 text-sm leading-relaxed", children: "Please read these Terms of Service carefully before using VenQore. By creating an account or using any part of the Service, you agree to be bound by these terms." }),
        /* @__PURE__ */ jsxs(Section, { title: "1. Acceptance of Terms", children: [
          /* @__PURE__ */ jsx("p", { children: 'By accessing or using VenQore ("the Service"), operated by VenQore ("we," "us," or "our"), you agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not use the Service.' }),
          /* @__PURE__ */ jsxs("p", { children: [
            "These terms apply to all users, including free trial users, paid subscribers",
            "."
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "2. Description of Service", children: [
          /* @__PURE__ */ jsx("p", { children: "VenQore is a cloud-based Point of Sale (POS) and ERP platform designed for retail businesses. The Service includes inventory management, sales tracking, accounting, reporting, and related features." }),
          /* @__PURE__ */ jsx("p", { children: "We reserve the right to modify, suspend, or discontinue any part of the Service at any time. We will provide reasonable notice of material changes." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "3. Account Registration", children: [
          /* @__PURE__ */ jsx("p", { children: "You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the security of your account credentials." }),
          /* @__PURE__ */ jsxs("p", { children: [
            "You are responsible for all activity that occurs under your account. Notify us immediately at ",
            /* @__PURE__ */ jsx("a", { href: "mailto:support@venqore.com", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "support@venqore.com" }),
            " if you suspect unauthorized access."
          ] }),
          /* @__PURE__ */ jsx("p", { children: "One account per business entity. Sharing accounts between unrelated businesses is not permitted." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "4. Subscription & Payment", children: [
          /* @__PURE__ */ jsx("p", { children: "Paid subscriptions are billed monthly or annually through Lemon Squeezy. By subscribing, you authorize recurring charges to your payment method." }),
          /* @__PURE__ */ jsx("p", { children: "All prices are in USD unless otherwise stated. Taxes may apply depending on your jurisdiction." }),
          /* @__PURE__ */ jsx("p", { children: "You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide prorated refunds for partial billing periods, except as required by applicable law." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "5. Free Trial", children: [
          /* @__PURE__ */ jsx("p", { children: "New accounts receive a 14-day free trial with full access to the Service. No credit card is required during the trial period. At the end of the trial, you must subscribe to continue using the Service." }),
          /* @__PURE__ */ jsx("p", { children: "Trial accounts that are not converted will have their data retained for 30 days, after which it will be permanently deleted." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "6. Data Ownership & Privacy", children: [
          /* @__PURE__ */ jsx("p", { children: "You own your data. We do not claim any ownership over the business data you store in VenQore (products, customers, sales records, etc.)." }),
          /* @__PURE__ */ jsx("p", { children: "We will not sell, rent, or share your business data with third parties except as required to operate the Service (e.g., cloud storage providers) or as required by law." }),
          /* @__PURE__ */ jsxs("p", { children: [
            "See our ",
            /* @__PURE__ */ jsx(Link, { href: "/privacy", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "Privacy Policy" }),
            " for full details on data handling."
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "7. Acceptable Use", children: [
          /* @__PURE__ */ jsx("p", { children: "You agree not to use the Service to:" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: "Violate any applicable law or regulation" }),
            /* @__PURE__ */ jsx("li", { children: "Store or transmit illegal, harmful, or fraudulent content" }),
            /* @__PURE__ */ jsx("li", { children: "Attempt to gain unauthorized access to the Service or other accounts" }),
            /* @__PURE__ */ jsx("li", { children: "Reverse engineer, decompile, or create derivative works of the Service" }),
            /* @__PURE__ */ jsx("li", { children: "Use automated tools to scrape or stress-test the Service without permission" }),
            /* @__PURE__ */ jsx("li", { children: "Interfere with other tenants' use of the Service" })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "We reserve the right to suspend or terminate accounts that violate these terms immediately and without notice." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "8. Multi-Tenant Architecture & Data Isolation", children: [
          /* @__PURE__ */ jsx("p", { children: "VenQore uses a shared-infrastructure multi-tenant architecture. Your data is logically isolated from other tenants through application-level controls. We implement technical measures to prevent cross-tenant data access." }),
          /* @__PURE__ */ jsx("p", { children: "However, you acknowledge that no system is infallible. You are responsible for maintaining appropriate backups of critical business data." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "9. Uptime & Service Levels", children: [
          /* @__PURE__ */ jsx("p", { children: "We target 99.5% monthly uptime for the Service. Scheduled maintenance windows will be announced at least 24 hours in advance via email." }),
          /* @__PURE__ */ jsx("p", { children: "We are not responsible for downtime caused by: Cloudflare outages, DigitalOcean infrastructure failures, your internet service provider, or force majeure events." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "10. Limitation of Liability", children: [
          /* @__PURE__ */ jsx("p", { children: "To the maximum extent permitted by applicable law, VenQore's total liability for any claims relating to the Service shall not exceed the amount you paid us in the 3 months preceding the claim." }),
          /* @__PURE__ */ jsx("p", { children: "We are not liable for indirect, incidental, consequential, or punitive damages, including lost profits, data loss, or business interruption." })
        ] }),
        /* @__PURE__ */ jsxs(Section, { title: "11. Termination", children: [
          /* @__PURE__ */ jsx("p", { children: "Either party may terminate this agreement at any time. Upon termination:" }),
          /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: "Your access to the Service will be revoked" }),
            /* @__PURE__ */ jsx("li", { children: "Your data will be retained for 30 days to allow export" }),
            /* @__PURE__ */ jsx("li", { children: "After 30 days, all data will be permanently deleted" })
          ] }),
          /* @__PURE__ */ jsx("p", { children: "You can export your data at any time from the Settings → Data Export section." })
        ] }),
        /* @__PURE__ */ jsx(Section, { title: "12. Changes to Terms", children: /* @__PURE__ */ jsx("p", { children: "We may update these Terms of Service from time to time. We will notify you of significant changes via email at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated terms." }) }),
        /* @__PURE__ */ jsx(Section, { title: "13. Governing Law", children: /* @__PURE__ */ jsx("p", { children: "These Terms of Service shall be governed by and construed in accordance with applicable international commercial law. Any disputes shall be resolved through binding arbitration." }) }),
        /* @__PURE__ */ jsxs(Section, { title: "14. Contact", children: [
          /* @__PURE__ */ jsx("p", { children: "For questions about these Terms of Service:" }),
          /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", { href: "mailto:legal@venqore.com", className: "text-indigo-600 dark:text-indigo-400 hover:underline", children: "legal@venqore.com" }) }),
          /* @__PURE__ */ jsx("p", { children: "VenQore · support@venqore.com" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-8 border-t border-slate-900/[0.06] dark:border-white/5 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            "Related: read our",
            " ",
            /* @__PURE__ */ jsx(Link, { href: "/privacy", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "Privacy Policy" }),
            " ",
            "and",
            " ",
            /* @__PURE__ */ jsx(Link, { href: "/refund-policy", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "Refund Policy" }),
            "."
          ] }),
          /* @__PURE__ */ jsx(Link, { href: "/pricing", className: "font-semibold text-indigo-600 dark:text-indigo-300 hover:underline", children: "See plans & pricing →" })
        ] })
      ] })
    }
  );
}
export {
  TermsOfService as default
};
