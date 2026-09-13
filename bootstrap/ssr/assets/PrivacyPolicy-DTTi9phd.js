import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { Link } from "@inertiajs/react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import "lucide-react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
const Section = ({ id, title, children }) => /* @__PURE__ */ jsxs("section", { id, style: { scrollMarginTop: "112px" }, children: [
  /* @__PURE__ */ jsx("h2", { children: title }),
  children
] });
function PrivacyPolicy() {
  const lastUpdated = "September 2026";
  return /* @__PURE__ */ jsxs(
    MarketingLayout,
    {
      title: "Privacy Policy — VenQore",
      description: "VenQore Privacy Policy. How we collect, use, and protect your data, including AI processing and subprocessor disclosures.",
      children: [
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-top vq-mc-top--flush", children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-head", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "Legal" }),
          /* @__PURE__ */ jsx("h1", { className: "vq-h1 vq-mt-4", children: "Privacy Policy" }),
          /* @__PURE__ */ jsx("div", { className: "vq-mc-meta vq-mt-4", children: /* @__PURE__ */ jsxs("span", { className: "vq-mc-meta__item", children: [
            "Last updated: ",
            lastUpdated
          ] }) }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede vq-mt-6", children: "Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, how our AI features process data under zero-training commitments, and how you can exercise full control over your business and personal records. We do not sell your data." })
        ] }) }) }),
        /* @__PURE__ */ jsx("section", { className: "vq-section vq-mc-body", style: { paddingTop: "var(--vq-space-8)" }, children: /* @__PURE__ */ jsx("div", { className: "vq-container", children: /* @__PURE__ */ jsxs("div", { className: "vq-mc-doc vq-mc-doc--toc", style: { borderTop: "1px solid var(--vq-line)", paddingTop: "var(--vq-space-12)" }, children: [
          /* @__PURE__ */ jsxs("nav", { className: "vq-mc-rail vq-mc-toc", "aria-label": "On this page", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-mc-rail__label vq-mc-toc__title", children: "On this page" }),
            [
              ["data-we-collect", "1. What Data We Collect"],
              ["how-we-use-data", "2. How We Use Your Data"],
              ["ai-processing", "3. Artificial Intelligence & Machine Learning Processing"],
              ["data-sharing", "4. Subprocessors & Third-Party Service Providers"],
              ["data-retention", "5. Data Retention"],
              ["your-rights", "6. Your Rights (GDPR & Data Protection)"],
              ["security", "7. Security"],
              ["cookies", "8. Cookies"],
              ["dpa", "9. Data Processing Addendum (DPA)"],
              ["childrens-privacy", "10. Children's Privacy"],
              ["policy-changes", "11. Changes to This Policy"],
              ["contact", "12. Contact"]
            ].map(([id, label]) => /* @__PURE__ */ jsx("a", { href: `#${id}`, className: "vq-mc-rail__link", children: label }, id))
          ] }),
          /* @__PURE__ */ jsxs("article", { className: "vq-read vq-mc-legal", children: [
            /* @__PURE__ */ jsxs(Section, { id: "data-we-collect", title: "1. What Data We Collect", children: [
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Account Data:" }),
                " Name, email address, business name, and password (hashed with bcrypt — we never store plain-text passwords)."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Business Data:" }),
                " Products, customers, sales records, invoices, accounting entries, and other data you create within the Service. This data belongs strictly to you."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "AI Input & Document Data:" }),
                " Business prompts entered into the Conversational Workspace Builder, documents or invoices uploaded to SmartCapture for optical character recognition, and queries submitted to the Vena assistant."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Usage & Technical Data:" }),
                " IP address, browser type, device identifiers, pages visited, and timestamps. Used exclusively for security monitoring, fraud prevention, and session integrity."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Payment Data:" }),
                " Payment processing and global merchant-of-record services are handled by Lemon Squeezy. We never see, process, or store full credit card numbers or CVVs. We receive only tokenized customer identifiers and transaction status."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Communication Data:" }),
                " Inbound contact inquiries, support tickets, and email correspondence."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "how-we-use-data", title: "2. How We Use Your Data", children: [
              /* @__PURE__ */ jsxs("ul", { children: [
                /* @__PURE__ */ jsx("li", { children: "To provide, maintain, and deliver the core POS and ERP Service" }),
                /* @__PURE__ */ jsx("li", { children: "To assemble workspace configurations dynamically and parse uploaded invoices via SmartCapture" }),
                /* @__PURE__ */ jsx("li", { children: "To send essential transactional notifications (account provisioning, invoices, payment notices, password resets)" }),
                /* @__PURE__ */ jsx("li", { children: "To respond to technical support and customer care inquiries" }),
                /* @__PURE__ */ jsx("li", { children: "To detect, investigate, and prevent fraud, abuse, or unauthorized access" }),
                /* @__PURE__ */ jsx("li", { children: "To comply with statutory financial, accounting, and legal obligations" })
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                "We do ",
                /* @__PURE__ */ jsx("strong", { children: "not" }),
                " use your business data (products, customers, financial ledgers, or sales) for advertising or any purpose other than providing the Service to you."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "ai-processing", title: "3. Artificial Intelligence & Machine Learning Processing", children: [
              /* @__PURE__ */ jsx("p", { children: "VenQore incorporates AI capabilities (including the Conversational Workspace Builder, SmartCapture document ingestion, and Vena assistant). We adhere to strict data-protection principles regarding AI processing:" }),
              /* @__PURE__ */ jsxs("ul", { children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Zero Model Training:" }),
                  " Your business data, uploaded supplier invoices, ledger records, customer names, and chat prompts are ",
                  /* @__PURE__ */ jsx("strong", { children: "NEVER used to train, retrain, or improve foundational AI models" }),
                  " (whether by VenQore or third-party AI providers)."
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Stateless Processing:" }),
                  " Data transmitted to AI providers via enterprise API endpoints is processed ephemerally and discarded once the immediate structured response is generated."
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Bring Your Own Key (BYOK):" }),
                  " VenQore supports BYOK configuration, allowing enterprise merchants to supply their own API keys directly to Google Gemini or OpenAI with their own direct contractual enterprise protections."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "data-sharing", title: "4. Subprocessors & Third-Party Service Providers", children: [
              /* @__PURE__ */ jsx("p", { children: "We share data with vetted third-party subprocessors strictly to the extent necessary to deliver the Service:" }),
              /* @__PURE__ */ jsx("div", { className: "vq-mc-tablewrap", children: /* @__PURE__ */ jsxs("table", { children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { children: "Provider / Entity" }),
                  /* @__PURE__ */ jsx("th", { children: "Role & Purpose" }),
                  /* @__PURE__ */ jsx("th", { children: "Data Transferred" }),
                  /* @__PURE__ */ jsx("th", { children: "Location" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { children: [
                  ["Google LLC", "Gemini AI API (Conversational builder & OCR analysis)", "Prompt text, document scan text", "United States"],
                  ["Lemon Squeezy, LLC", "Merchant of Record, payment gateway & tax compliance", "Billing details, email, subscription tier", "United States"],
                  ["Cloudflare, Inc.", "Edge CDN, DDoS mitigation & Turnstile bot defense", "IP address, HTTP request headers, security token", "Global / US"],
                  ["Functional Software, Inc. (Sentry)", "Application performance & crash diagnostics", "Error stack traces, anonymized tenant/user ID", "United States"],
                  ["Postmark / Resend", "Transactional email delivery", "Recipient email address, transactional message body", "United States"]
                ].map(([provider, purpose, data, location], i) => /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("td", { children: provider }),
                  /* @__PURE__ */ jsx("td", { children: purpose }),
                  /* @__PURE__ */ jsx("td", { children: data }),
                  /* @__PURE__ */ jsx("td", { children: location })
                ] }, i)) })
              ] }) }),
              /* @__PURE__ */ jsx("p", { children: "All international transfers from the UK/EEA to third countries are governed by European Commission Standard Contractual Clauses (SCCs) and International Data Transfer Addenda." })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "data-retention", title: "5. Data Retention", children: [
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Active accounts:" }),
                " Data retained for the duration of your subscription."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Cancelled/expired accounts:" }),
                " Data retained for 30 days after cancellation to allow data export, then permanently deleted."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Trial accounts (not converted):" }),
                " Data retained for 30 days after trial expiry, then permanently deleted."
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Backups:" }),
                " Backup snapshots may persist for up to 7 days after deletion for disaster recovery purposes."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "your-rights", title: "6. Your Rights (GDPR & Data Protection)", children: [
              /* @__PURE__ */ jsx("p", { children: "If you are in the European Economic Area (EEA), UK, or applicable jurisdictions, you have the following rights:" }),
              /* @__PURE__ */ jsxs("ul", { children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Access:" }),
                  " Request a copy of all data we hold about you"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Rectification:" }),
                  " Correct inaccurate data"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Erasure:" }),
                  ' Request deletion of your data ("right to be forgotten")'
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Portability:" }),
                  " Export your data in a machine-readable format"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Object:" }),
                  " Object to data processing for direct marketing"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Right to Restrict Processing:" }),
                  " Request that we limit how we use your data"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                "To exercise any of these rights, email ",
                /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", children: "privacy@venqore.com" }),
                ". We will respond within 30 days."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "security", title: "7. Security", children: [
              /* @__PURE__ */ jsx("p", { children: "We implement industry-standard security measures including:" }),
              /* @__PURE__ */ jsxs("ul", { children: [
                /* @__PURE__ */ jsx("li", { children: "All data transmitted over HTTPS (TLS 1.2+)" }),
                /* @__PURE__ */ jsx("li", { children: "Passwords hashed with bcrypt (cost factor 12)" }),
                /* @__PURE__ */ jsx("li", { children: "Data encrypted at rest on production servers" }),
                /* @__PURE__ */ jsx("li", { children: "Logical data isolation between tenants (separate namespaced data per business via strict multi-tenant scopes)" }),
                /* @__PURE__ */ jsx("li", { children: "Regular security patching of server infrastructure" }),
                /* @__PURE__ */ jsx("li", { children: "Access to production systems limited strictly to authorized personnel" })
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                "Despite these measures, no system is 100% secure. If you discover a security vulnerability, please disclose it responsibly to ",
                /* @__PURE__ */ jsx("a", { href: "mailto:security@venqore.com", children: "security@venqore.com" }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs(Section, { id: "cookies", title: "8. Cookies", children: [
              /* @__PURE__ */ jsx("p", { children: "We use only essential cookies:" }),
              /* @__PURE__ */ jsxs("ul", { children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Session cookie:" }),
                  " Keeps you logged in. Required for the Service to function."
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "CSRF token:" }),
                  " Protects against cross-site request forgery attacks."
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { children: "We do not use tracking cookies, advertising cookies, or third-party behavioral analytics cookies." })
            ] }),
            /* @__PURE__ */ jsx(Section, { id: "dpa", title: "9. Data Processing Addendum (DPA)", children: /* @__PURE__ */ jsxs("p", { children: [
              "For merchants operating in the European Union, European Economic Area, or United Kingdom who act as Data Controllers under GDPR Art. 28, VenQore offers a standard Data Processing Addendum (DPA) incorporating European Commission Standard Contractual Clauses (SCCs). To execute a DPA, please contact ",
              /* @__PURE__ */ jsx("a", { href: "mailto:legal@venqore.com", children: "legal@venqore.com" }),
              "."
            ] }) }),
            /* @__PURE__ */ jsx(Section, { id: "childrens-privacy", title: "10. Children's Privacy", children: /* @__PURE__ */ jsx("p", { children: "The Service is intended for business use only and is not directed at individuals under 16 years of age. If you believe a minor has created an account, contact us immediately." }) }),
            /* @__PURE__ */ jsx(Section, { id: "policy-changes", title: "11. Changes to This Policy", children: /* @__PURE__ */ jsx("p", { children: 'We may update this Privacy Policy. We will notify you via email at least 14 days before significant changes take effect. The "Last updated" date at the top reflects the most recent revision.' }) }),
            /* @__PURE__ */ jsxs(Section, { id: "contact", title: "12. Contact", children: [
              /* @__PURE__ */ jsx("p", { children: "For privacy-related inquiries or data subject access requests:" }),
              /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", { href: "mailto:privacy@venqore.com", children: "privacy@venqore.com" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mc-related", children: [
              /* @__PURE__ */ jsxs("p", { children: [
                "Related: read our",
                " ",
                /* @__PURE__ */ jsx(Link, { href: "/terms", children: "Terms of Service" }),
                " ",
                "and",
                " ",
                /* @__PURE__ */ jsx(Link, { href: "/refund-policy", children: "Refund Policy" }),
                "."
              ] }),
              /* @__PURE__ */ jsx(Link, { href: "/contact", children: "Questions? Contact us →" })
            ] })
          ] })
        ] }) }) })
      ]
    }
  );
}
export {
  PrivacyPolicy as default
};
