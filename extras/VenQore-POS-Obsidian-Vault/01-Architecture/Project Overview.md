---
tags: [architecture, overview]
---

# Project Overview

Part of [[VenQore POS - Home]]

**VenQore POS** is a multi-tenant SaaS Point-of-Sale and ERP system built for small-to-medium retail and food businesses. It is a Laravel 12 + React 18 (Inertia.js) monolith with offline-capable POS, full accounting, inventory management, WooCommerce integration, and a platform/superadmin layer.

## Codebase Scale
| Layer | Count |
|---|---|
| Eloquent Models | 128 |
| Controllers | 185 |
| Services | ~40 |
| Frontend Pages (.jsx) | 238 |
| Migrations | 265+ |
| `routes/web.php` | 1735 lines |
| `routes/api.php` | 94 lines |

## Architecture Pillars
1. **Multi-tenancy** — every Store is a `Tenant`; almost all data scoped by `tenant_id`. See [[Multi-Tenancy Architecture]].
2. **Double-entry accounting** — the V3 engine (`V3\AccountingService`) is the single source of financial truth. See [[V3 Accounting Engine]].
3. **FIFO inventory** — `InventoryBatch`/`SaleItemBatch` form an immutable cost-lot ledger. See [[FIFO Inventory System]].
4. **Offline-first POS** — Dexie.js/IndexedDB caches products and queues sales when offline. See [[Offline Sync - Dexie & IndexedDB]].
5. **Two parallel generations of business logic** — legacy services and a newer, hardened V3 layer coexist. See [[Two Generations - Legacy vs V3]].
6. **Three distinct admin surfaces** — store-level, platform-level (`VenQore/*`), and a separate `/superadmin/*`. See [[Three Admin Surfaces]].

## Related
- [[Tech Stack]]
- [[Directory Structure]]
- [[Code Conventions]]
