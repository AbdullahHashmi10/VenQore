# VenQore Production Testing - Issue & Fix Log

This document tracks all issues found during the systematic testing of VenQore SaaS V1.

## 🔴 Immediate Blockers (Must fix before Live)
*Issues that compromise data integrity, security, or primary UX flows.*

| Issue ID | Section | Description | Status | Fix Details |
| :--- | :--- | :--- | :--- | :--- |
| 001 | A | `php artisan tenants:audit` fails because it checks `users.tenant_id` which was removed in SaaS refactor. | ✅ FIXED | Updated TenantAudit.php to exclude users and model trait Check. |
| 002 | A | `TenantAudit.php` fails because it queries `tenants.subdomain` which was renamed to `tenants.slug`. | ✅ FIXED | Updated TenantAudit.php and SubdomainGenerator.php to use 'slug' column. |
| 004 | Setup | 419 Status on Wizard Submit | ✅ FIXED | Resolved by aligning paths and ensuring synchronous settings hydration. |
| 005 | Dashboard | Currency Sync (Rs vs $) | ✅ FIXED | Aligned settings keys and moved window.amdSettings population to synchronous render. |
| 006 | Settings | Business Info not reflecting | ✅ FIXED | Aligned property names between SetupController and BusinessSettingsSection. |
| 007 | Dashboard | ResponsiveContainer sizing warnings | ✅ FIXED | Added explicit min-height to chart container in Dashboard.jsx. |
| 008 | Platform HQ | Hardcoded `/admin/` paths in Dashboard causing 500 errors. | ✅ FIXED | Standardized all URLs to use `route('platform.*')` helper. |
| 009 | Platform HQ | Sidebar buttons not navigating (Link vs onClick conflict). | ✅ FIXED | Refactored SidebarItem.jsx to use standard Inertia Link logic. |
| 010 | Platform HQ | `/VenQore/tickets` showing dashboard overview instead of support tab. | ✅ FIXED | Added `tab` state synchronization between Controller and Dashboard component. |
| 011 | Platform HQ | Sidebar unreadable in Light Mode. | ✅ FIXED | Refined Tailwind colors and opacity in OneGlanceLayout and SidebarItem. |

## 🟡 Post-Launch Updates (Phase 2 / V1.1)
*Improvements, non-critical bugs, or "nice-to-have" features.*

| Issue ID | Section | Description | Priority |
| :--- | :--- | :--- | :--- |
| | | *(No updates logged yet)* | | |

## ✅ Completed Tests & Audit Log
| Section | Test Name | Result | Notes |
| :--- | :--- | :--- | :--- |
| A | Environment Check | PENDING | Running system-level diagnostics... |
