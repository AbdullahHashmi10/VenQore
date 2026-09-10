# VenQore — Canonical Pricing, Gating, Network & Packaging Specification (V8)

**Version 8 · 2026-09-08 · AUTHORITATIVE & FINAL. Formally supersedes V4, V5, V6, and V7.**
**Hand this file directly to any coding agent or IDE. It is written to be executed with zero ambiguity.**

---

## 0. Foundational Principles & Architecture Decisions

1. **Zero Vertical Discrimination**:
   - Every business vertical (Services & Appointments, Manufacturing & Multi-level BOM, Restaurant & Table Service, Retail & Wholesale) is **fully unlocked on the standard paid plan**.
   - No customer is ever penalized or charged extra simply because of their business model.
2. **Commercial Anti-Abuse (Plugging the Solo Service Leak)**:
   - Retail is gated on Solo by **500 SKUs**.
   - Services are gated on Solo by **20 completed service jobs / appointments per month**. (A commercial service technician clearing full-time revenue cannot camp on the free tier forever).
   - Solo history retention is strictly **30 days rolling visibility** (zero database deletion; records restore instantly upon upgrading).
   - Full technician scheduling calendar, required tools tracking, and production work orders are enabled on the **Core ($89/mo)** plan.
3. **Data Sovereignty (Google Drive Sync)**:
   - Automated Google Drive backup sync (`GoogleDriveService.php`) is unlocked for all paid merchants on Core and Scale.
4. **Future-Proofed Network Entitlements**:
   - **B2B Handshake Network**: Inter-tenant supplier catalog requests and auto PO <-> Invoice generation are unlocked for all paid tenants (up to 3 connections on Solo).
   - **B2C Consumer Marketplace**: Free automated storefront listing on the VenQore local discovery mobile app for all active merchants.
5. **Card-Captured Trial Funnel**:
   - Primary CTA: **14-day free trial on Core ($89/mo) with credit card required**.
   - Day-11 automated renewal reminder email.
   - Expired/cancelled trials land safely on the **Solo (Free)** tier instead of locking out the user or deleting their data.
6. **Marketplace Quarantine (AppSumo & Regional)**:
   - Zero LTD references and zero PKR pricing on the public website.
   - LTD is sold only via AppSumo with strict monthly transaction and AI limits.
   - Pakistani market is handled strictly via private, bespoke CNIC-verified quotation inquiries.

---

## 1. Canonical Plan Matrix

`config/pricing.php`, `config/plans.php`, and `PlanFeatureMatrixSeeder.php` must strictly agree with this table:

| Metric / Entitlement | solo (Free Forever) | core ($89 Standard) | scale ($349 Enterprise) | custom (Negotiated) |
|---|---|---|---|---|
| **Price Monthly** | **$0.00** | **$89.00** | **$349.00** | **From $800.00** |
| **Price Annual (per mo)** | — | **$79.00** ($948/yr) | **$299.00** ($3,588/yr) | Custom contract |
| **Physical Locations** | 1 | 1 | 10 | Negotiated |
| **Full Admin Seats** | 1 | 1 | 10 | Negotiated |
| **Registers (POS Devices)**| 1 | 2 | 20 | Negotiated |
| **Cashier Till PIN Logins**| Unlimited (Free) | Unlimited (Free) | Unlimited (Free) | Unlimited (Free) |
| **Devices Per Seat** | 2 | 3 | 5 | 5 |
| **Monthly Transactions** | Unlimited | Unlimited | Unlimited | Unlimited |
| **SKU / Product Limit** | **500** | **10,000** | **250,000** | Unlimited |
| **Service Jobs / Month** | **20** | **Unlimited** | **Unlimited** | Unlimited |
| **History Retention** | **30 days** | **Unlimited (Lifetime)**| **Unlimited (Lifetime)**| Unlimited |
| **Monthly AI Credits** | 30 (10 scans sub-cap)| 1,000 | 10,000 | Negotiated |
| **Lifetime AI Rebuilds** | 0 | 2 | Unlimited | Unlimited |
| **Google Drive Sync** | 0 | 1 | 1 | 1 |
| **Full Services Suite** | 0 (Counter POS only)| 1 (Dispatch + Tools) | 1 | 1 |
| **Manufacturing & BOM** | 0 (Simple recipes) | 1 (Multi-level BOM) | 1 | 1 |
| **Restaurant & Tables** | 1 | 1 | 1 | 1 |
| **All 43 Reports** | 1 | 1 | 1 | 1 |
| **Double-Entry Ledger** | 1 | 1 | 1 | 1 |
| **B2B Handshake Network**| 3 Connections | Unlimited Connections| Unlimited Connections| Unlimited |
| **B2C Consumer App** | Active | Active | Active | Active |
| **Multi-Branch Transfers**| 0 | 0 (Unlocked via Add-on)| 1 | 1 |
| **External E-Com Channels**| 0 | Add-on ($19/mo each) | **All Included** | All Included |
| **API & Webhooks** | 0 | Add-on ($25/mo) | 1 | 1 |
| **Governance & Roles** | 0 | 0 | 1 (Custom Roles + Logs)| 1 |
| **Support SLA** | None (Community) | Email (24h turnaround)| Dedicated Priority (4h)| Dedicated SLA |

---

## 2. Expansion Add-Ons Matrix

Add-ons allow merchants on **Core** to scale modularly without being forced to jump to the enterprise tier:

| Add-On | Price | Purchasable On | Effect on Tenant Limits |
|---|---|---|---|
| **Extra Location** | **$35 / month** | Core, Scale | Increments `locations`; automatically enables `multi_branch` when location count > 1 |
| **Extra Full Admin Seat** | **$15 / month** | Core, Scale | Increments `staff_limit` |
| **Extra POS Register** | **$20 / month** | Core, Scale | Increments `registers` |
| **E-Commerce Channel Sync**| **$19 / month each** | Core | Real-time 2-way sync for WooCommerce, Shopify, etc. (Included free on Scale) |
| **SKU Booster (+50,000)** | **$20 / month** | Core | Increments `sku_limit` by 50,000 |
| **API & Webhooks Unlock** | **$25 / month** | Core | Unlocks `api_access` and webhook dispatch (Included free on Scale) |
| **AI System Rebuild Pack** | **$10 one-time** | Core, Scale | Grants 5 additional AI system rebuilds (Never expires) |
| **AI Credit Booster** | **$9 one-time** | Core, Scale | Grants 1,000 additional AI compute credits |

*Rule*: **Solo cannot purchase add-ons.** Upgrading to Core is required to add locations, seats, or channels.

---

## 3. AppSumo Lifetime Deals (LTD) Structure (Marketplace Only)

To protect server margins and prevent bankruptcy while generating upfront marketing capital:

| AppSumo Tier | Price (One-Time) | Locations | Seats | Registers | SKUs | Monthly Sales Transactions | Monthly AI Credits |
|---|---|---|---|---|---|---|---|
| **Tier 1 (1 Code)** | **$99** | 1 | 1 | 1 | 2,500 | **1,000** | 300 |
| **Tier 2 (2 Codes)** | **$199** | 2 | 2 | 3 | 15,000 | **5,000** | 1,000 |
| **Tier 3 (3 Codes)** | **$349** | 5 | 5 | 8 | 50,000 | **20,000** | 3,000 |

* **LTD Governance**:
  * Transactions are strictly metered per month (unlike subscription plans which are unlimited).
  * E-commerce channel sync is **not included**; sold as standard **$19/month add-on**.
  * After Year 2, an optional **Cloud Maintenance & Backup Fee ($49/year)** is introduced for ongoing hosting and Google Drive API maintenance.

---

## 4. History Retention Implementation (30 Days for Solo)

1. **Zero Data Deletion**: Historical transactions, invoices, sales, and customer ledgers older than 30 days are **never deleted**.
2. **Query Scoping**:
   ```php
   if ($tenant->plan === 'solo' && $tenant->history_retention_days) {
       $query->where('created_at', '>=', now()->subDays($tenant->history_retention_days));
   }
   ```
3. **Instant Re-hydration**: Upgrading to Core immediately removes the query boundary, restoring all historical data instantly.
4. **Lock Banner**: When viewing lists where older records exist, display:
   > *"Displaying last 30 days of activity. Upgrade to Core to access your full lifetime business records and tax archives."*

---

## 5. Public Marketing Anchor Copy

The canonical comparison copy on the homepage and pricing page:

> **"AI-native ERP starts around $20,000 a year. VenQore starts at $79 a month — or free."**
>
> *Footnote: Enterprise platforms like SAP Business One, NetSuite, and Katana MRP charge thousands in upfront implementation and monthly licensing. VenQore includes full accounting, manufacturing BOM, field service scheduling, and automated Google Drive cloud backups in one unified operating system.*
