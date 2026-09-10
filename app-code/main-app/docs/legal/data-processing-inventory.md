# VenQore — Data Processing Inventory & Subprocessor Register

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Purpose:** Pre-launch factual inventory for legal counsel to draft/update VenQore's Privacy Policy, Data Processing Addendum (DPA), and Subprocessor Disclosures per GDPR Art. 13/14/28, UK GDPR, and CCPA/CPRA.

---

## 1. Subprocessor Inventory

| Subprocessor | Entity & Location | Purpose & Features Involved | Data Categories Transferred | Personal Data (PII) Present? | Retention / Lifecycle | Transfer Mechanism | Code / Config Reference |
|---|---|---|---|---|---|---|---|
| **Google LLC (Gemini API)** | Mountain View, CA, USA | AI Onboarding Discovery (`/workspace/converse/*`), SmartCapture invoice extraction, visitor chatbot (`/api/chat/visitor`), Vena assistant | Business profiles, prompt text, supplier invoices, receipts, chat messages, party names | **Yes** (Third-party supplier names, addresses, line items, visitor messages, phone numbers) | Transient processing per API terms; local prompts logged in `chat_messages` / `ai_requests` | EU Standard Contractual Clauses (SCCs) / Google Cloud DPA | `app/Services/Ai/Providers/GeminiProvider.php`, `config/services.php:gemini` |
| **Lemon Squeezy, LLC** | Salt Lake City, UT, USA | Merchant of Record, subscription billing, payment processing, invoice generation, tax compliance | Customer name, billing email, billing country/IP, subscription tier, transaction amounts, payment status | **Yes** (Customer identity, billing contact details) | Retained for lifetime of subscription + tax/statutory requirements (up to 7 years) | Merchant of Record terms / SCCs | `app/Services/LemonSqueezyCheckoutService.php`, `app/Http/Controllers/LemonSqueezyWebhookController.php` |
| **Cloudflare, Inc.** | San Francisco, CA, USA | CDN, DDoS mitigation, Bot management (Turnstile challenge), Geo-IP country header resolution | IP address, HTTP headers, request metadata, Turnstile verification tokens | **Yes** (Visitor IP addresses, country header) | Edge transient logs (retained 24h–72h per Cloudflare standard policy) | Cloudflare DPA / SCCs | `app/Http/Middleware/GeoPricingMiddleware.php`, `config/services.php:cloudflare` |
| **Transactional Email Provider (Postmark / Resend / Hostinger SMTP)** | USA / EU (depending on provider chosen) | Transactional emails (password reset, email verification, new tenant credentials, invoice notices, contact alerts) | Recipient name, email address, message subject and body content | **Yes** (User emails, invitees, contact form submitters) | 30-day delivery logs per provider standard | Provider DPA / SCCs | `config/mail.php`, `app/Mail/*` |
| **DigitalOcean / Hostinger VPS** | Primary DC: Frankfurt / Singapore / US (host-dependent) | Application hosting, MariaDB database, local application storage (`storage/app/public`) | Full application database: users, tenants, accounting ledgers, customers, sales, inventory, audit logs | **Yes** (All account, staff, customer, supplier data) | Active subscription duration; daily database snapshots retained 7–30 days | Hosting Data Processing Agreement | `deploy/env/production.env`, `config/database.php` |
| **AWS (Amazon Web Services - S3)** *(Configured, ready for offsite backups)* | eu-west-1 / us-east-1 | Offsite encrypted database backups and durable media storage | Encrypted SQL dumps, invoice attachments, media | **Yes** (Encrypted application backup archives) | 7 daily, 4 weekly, 12 monthly backup cycles | AWS GDPR DPA / SCCs | `config/filesystems.php`, `deploy/BACKUP.md` |

---

## 2. Categories of Data Subjects

1. **Merchant (Account Owner / Subscriber):**
   - Name, email address, password hash, phone number, business name, store slug, billing country, subscription status.
2. **Merchant Staff / Cashiers:**
   - Staff name, login email/PIN, role (`owner`, `manager`, `cashier`), POS action logs, clock-in records.
3. **Merchant Customers (End Consumers / B2B Clients):**
   - Customer name, phone number, email address, billing/shipping address, transaction daybook records, outstanding balance, credit limits.
4. **Suppliers & Vendors:**
   - Supplier company name, contact person, phone number, address, payment terms, raw purchase invoices scanned via SmartCapture.
5. **Website Visitors & Leads:**
   - IP address, referrer, user agent, submitted contact forms, free-tool lead captures, newsletter subscription email & consent IP.

---

## 3. Recommended Privacy Policy Structure (Skeleton for Legal Counsel)

- [ ] **1. Introduction & Entity Identification** (Full legal company name, registration number, registered office address, contact email).
- [ ] **2. Roles Under Data Protection Laws** (VenQore as Data Controller for merchant account data; VenQore as Data Processor for merchant store/customer ledger data).
- [ ] **3. Data We Collect & Legal Basis for Processing** (Contractual necessity, legitimate interests, consent for marketing).
- [ ] **4. Artificial Intelligence & Automated Processing** (Explicit disclosure of Google Gemini subprocessors; explanation that customer data is processed via API to extract invoice data and generate workspace templates; assertion that data is not used to train public foundation models without consent).
- [ ] **5. Subprocessors & International Data Transfers** (Exhaustive table of subprocessors with links to their privacy policies; transfer mechanisms including SCCs).
- [ ] **6. Data Retention & Deletion Policy** (Retention schedule during active subscription; 30-day grace period for export post-cancellation; automated backup purge lifecycle).
- [ ] **7. Data Subject Rights** (Access, rectification, erasure, data portability via JSON/CSV export, objection, restriction).
- [ ] **8. Security Measures** (Encryption in transit TLS 1.3, bcrypt password hashing, tenant data isolation via `HasTenant`, rate limiting, Turnstile bot protection).
- [ ] **9. Cookies & Tracking** (Clear statement: No tracking/advertising cookies used. Only strictly necessary session/XSRF tokens and cookieless privacy-first analytics).
- [ ] **10. Contact Information & Data Protection Officer** (`privacy@venqore.com`, `dpo@venqore.com`).
