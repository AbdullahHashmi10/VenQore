import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Eye } from "lucide-react";
function PrivacyPolicy() {
  const lastUpdated = "April 2025";
  const Section = ({ title, children }) => /* @__PURE__ */ jsxs("section", { className: "mb-10", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-3 pb-2 border-b border-white/10", children: title }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 text-slate-300 leading-relaxed", children })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#020010] text-white font-sans", children: [
    /* @__PURE__ */ jsxs(Head, { children: [
      /* @__PURE__ */ jsx("title", { children: "Privacy Policy — VenQore" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: "VenQore Privacy Policy. How we collect, use, and protect your data." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 pointer-events-none", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-1/3 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 mix-blend-overlay" })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-5 sm:py-6 border-b border-white/5", children: [
      /* @__PURE__ */ jsxs(Link, { href: "/", className: "flex items-center gap-2 sm:gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "VenQore", className: "h-8 sm:h-9 object-contain shrink-0" }),
        /* @__PURE__ */ jsxs("span", { className: "font-black text-base sm:text-lg truncate", children: [
          "VenQore",
          /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Link, { href: "/", className: "flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white transition-colors shrink-0", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { size: 14, className: "shrink-0" }),
        " ",
        /* @__PURE__ */ jsx("span", { className: "hidden xs:inline", children: "Back to Home" }),
        /* @__PURE__ */ jsx("span", { className: "xs:hidden", children: "Home" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 sm:gap-4 mb-10", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx(Eye, { size: 26, className: "text-purple-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-black tracking-tight", children: "Privacy Policy" }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-sm mt-1", children: [
            "Last updated: ",
            lastUpdated
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-300 mb-10 p-4 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed", children: "Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, and how you can control it. We do not sell your data." }),
      /* @__PURE__ */ jsxs(Section, { title: "1. What Data We Collect", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Account Data:" }),
          " Name, email address, business name, and password (hashed — we never store plain-text passwords)."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Business Data:" }),
          " Products, customers, sales records, invoices, accounting entries, and other data you create within the Service. This data belongs to you."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Usage Data:" }),
          " IP address, browser type, pages visited, and timestamps. Used for security monitoring and improving the Service."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Payment Data:" }),
          " Payment processing is handled entirely by Lemon Squeezy",
          ". We never see or store your full card number. We receive only a customer ID and subscription status."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Communication Data:" }),
          " Email addresses and your support ticket history if you contact us."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "2. How We Use Your Data", children: [
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-2 text-slate-400", children: [
          /* @__PURE__ */ jsx("li", { children: "To provide, maintain, and improve the Service" }),
          /* @__PURE__ */ jsx("li", { children: "To send transactional emails (welcome, invoices, trial reminders)" }),
          /* @__PURE__ */ jsx("li", { children: "To respond to support requests" }),
          /* @__PURE__ */ jsx("li", { children: "To detect and prevent fraud or abuse" }),
          /* @__PURE__ */ jsx("li", { children: "To comply with legal obligations" }),
          /* @__PURE__ */ jsx("li", { children: "To send product updates (you can unsubscribe at any time)" })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We do ",
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "not" }),
          " use your business data (products, customers, sales) for any purpose other than providing the Service to you."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "3. Data Sharing", children: [
        /* @__PURE__ */ jsx("p", { children: "We share your data with the following third-party service providers, only to the extent necessary to operate the Service:" }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm mt-3", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-slate-500 text-left border-b border-white/10", children: [
            /* @__PURE__ */ jsx("th", { className: "pb-2 pr-4", children: "Provider" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 pr-4", children: "Purpose" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Data Shared" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "text-slate-400", children: [
            ["Cloudflare", "CDN, DDoS protection", "IP address, request data"],
            ["DigitalOcean", "Server hosting", "All data (encrypted at rest)"],
            ["Cloudflare R2", "File storage", "Uploaded files (images, logos)"],
            ["Postmark", "Transactional email", "Email address, email content"],
            ["Lemon Squeezy", "Payment processing", "Email, subscription status"]
            // ['AppSumo', 'LTD distribution', 'Email, license redemption'],
          ].map(([provider, purpose, data], i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-white/5", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2.5 pr-4 text-white font-medium", children: provider }),
            /* @__PURE__ */ jsx("td", { className: "py-2.5 pr-4", children: purpose }),
            /* @__PURE__ */ jsx("td", { className: "py-2.5", children: data })
          ] }, i)) })
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "mt-3", children: "We do not sell, rent, or trade your data with third parties for marketing or advertising purposes." })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "4. Data Retention", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Active accounts:" }),
          " Data retained for the duration of your subscription."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Cancelled/expired accounts:" }),
          " Data retained for 30 days after cancellation to allow data export, then permanently deleted."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Trial accounts (not converted):" }),
          " Data retained for 30 days after trial expiry, then permanently deleted."
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Backups:" }),
          " Backup snapshots may persist for up to 7 days after deletion for disaster recovery purposes."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "5. Your Rights (GDPR)", children: [
        /* @__PURE__ */ jsx("p", { children: "If you are in the European Economic Area (EEA), you have the following rights:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-2 text-slate-400", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Access:" }),
            " Request a copy of all data we hold about you"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Rectification:" }),
            " Correct inaccurate data"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Erasure:" }),
            ' Request deletion of your data ("right to be forgotten")'
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Portability:" }),
            " Export your data in a machine-readable format"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Object:" }),
            " Object to data processing for direct marketing"
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Right to Restrict Processing:" }),
            " Request that we limit how we use your data"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "To exercise any of these rights, email ",
          /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", className: "text-indigo-400 hover:underline", children: "privacy@venqore.com" }),
          ". We will respond within 30 days."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "6. Security", children: [
        /* @__PURE__ */ jsx("p", { children: "We implement industry-standard security measures including:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-slate-400", children: [
          /* @__PURE__ */ jsx("li", { children: "All data transmitted over HTTPS (TLS 1.2+)" }),
          /* @__PURE__ */ jsx("li", { children: "Passwords hashed with bcrypt (cost factor 12)" }),
          /* @__PURE__ */ jsx("li", { children: "Data encrypted at rest on DigitalOcean servers" }),
          /* @__PURE__ */ jsx("li", { children: "Logical data isolation between tenants (separate namespaced data per business)" }),
          /* @__PURE__ */ jsx("li", { children: "Regular security patching of server infrastructure" }),
          /* @__PURE__ */ jsx("li", { children: "Access to production systems limited to authorized personnel" })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Despite these measures, no system is 100% secure. If you discover a security vulnerability, please disclose it responsibly to ",
          /* @__PURE__ */ jsx("a", { href: "mailto:security@venqore.com", className: "text-indigo-400 hover:underline", children: "security@venqore.com" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Section, { title: "7. Cookies", children: [
        /* @__PURE__ */ jsx("p", { children: "We use only essential cookies:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-slate-400", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Session cookie:" }),
            " Keeps you logged in. Required for the Service to function."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { className: "text-white", children: "CSRF token:" }),
            " Protects against cross-site request forgery attacks."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "We do not use tracking cookies, advertising cookies, or third-party analytics cookies. Cloudflare may set cookies for security purposes — see ",
          /* @__PURE__ */ jsx("a", { href: "https://www.cloudflare.com/privacypolicy/", target: "_blank", className: "text-indigo-400 hover:underline", children: "Cloudflare's Privacy Policy" }),
          "."
        ] })
      ] }),
      /* @__PURE__ */ jsx(Section, { title: "8. Children's Privacy", children: /* @__PURE__ */ jsx("p", { children: "The Service is intended for business use only and is not directed at individuals under 16 years of age. If you believe a minor has created an account, contact us immediately." }) }),
      /* @__PURE__ */ jsx(Section, { title: "9. Changes to This Policy", children: /* @__PURE__ */ jsx("p", { children: 'We may update this Privacy Policy. We will notify you via email at least 14 days before significant changes take effect. The "Last updated" date at the top reflects the most recent revision.' }) }),
      /* @__PURE__ */ jsxs(Section, { title: "10. Contact", children: [
        /* @__PURE__ */ jsx("p", { children: "For privacy-related inquiries:" }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", className: "text-indigo-400 hover:underline", children: "privacy@venqore.com" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-sm text-slate-600", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "© ",
          (/* @__PURE__ */ new Date()).getFullYear(),
          " VenQore. All rights reserved."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsx(Link, { href: "/terms", className: "hover:text-slate-400 transition-colors", children: "Terms of Service" }) })
      ] })
    ] })
  ] });
}
export {
  PrivacyPolicy as default
};
