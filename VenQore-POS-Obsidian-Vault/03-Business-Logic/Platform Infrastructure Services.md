---
tags: [services, platform, infrastructure]
---

# Platform Infrastructure Services

Part of [[VenQore POS - Home]]

## Demo / Multi-Tenant Bootstrap
| Service | Purpose |
|---|---|
| `DemoStoreService` | Single source of truth for resolving/bootstrapping the Golden Master demo tenant — self-healing so Demo Reset/Login buttons never 404 |
| `DemoSessionService` | Spins up a new demo session by cloning the Golden Master |
| `DemoDateHelper` | Translates "today" in the demo's shifted timeline back to actual seeded `DEMO_EPOCH` dates for query filters |
| `TenantCloner` | Deep-clones the Golden Master tenant, remapping all relational UUIDs (single-DB, shared-table, UUID architecture) |
| `SubdomainGenerator` | Slugifies + de-duplicates business names against a reserved-word list |
| `SequenceService` | `generateTransactionNumber()` — format `[PREFIX]-[REGISTER]-[DDMMYY]-[SEQUENCE]`, used by both V3 SaleService and PurchaseService |

## Storage & Backups
| Service | Purpose |
|---|---|
| `StorageService` | Single point of truth for file storage — swaps local disk for Cloudflare R2 via one env var. Path convention: `tenants/{tenant_id}/{context}/{filename}` |
| `BackupService` | Refuses to run if tenant context is bound ("only Platform Administrator"). Pure-PHP MySQL dumper (`dumpDatabase()`, chunked reads), `restoreBackup()` disables/re-enables FK checks around `DB::unprepared($sql)` |
| `GoogleDriveService` | Per-tenant Google Drive backup integration with token refresh |

## AI / Chat
| Service | Purpose |
|---|---|
| `AiRetentionService` | Computes average days-between-orders, predicts next order date, classifies active/at_risk/churned, generates `AiRecommendation` alerts (tenant-scoped throughout, WOUND 3 FIX) |
| `ChatAIService` | Calls Gemini AI model for the visitor chat widget |
| `ChatRoutingService` | Human/AI handoff state machine for support chat, session isolated by `session_uuid + tenant_id` |
| `KnowledgeLearningService` | Passive background learning pipeline triggered on every agent chat reply |

## Data Import
| Service | Purpose |
|---|---|
| `DataImportService` | 1205 lines. Dispatches by extension: `.vyb`/`.vyp` → Vyapar SQLite import (~67-table schema migration), CSV/XLSX/XLS/TXT → generic import. Self-heals a missing default Warehouse |

## Order Fulfillment (VenSynQ)
| Service | Purpose |
|---|---|
| `SmartFulfillmentService` | "VenSynQ Core Engine." `previewOrderItems()` — resolves product by SKU, determines fulfillment action: `fba` (revenue only), `jit` (auto-creates purchase draft), `fbm` (deduct from warehouse, partial JIT fallback if short) |

## Security & Misc
| Service | Purpose |
|---|---|
| `TwoFactorService` | TOTP secret generation, QR code URL, code verification |
| `GeoPricingService` | IP-based geo pricing/currency resolution |
| `FbrService` | Reports sales to Pakistan's FBR tax authority |
| `OwnerDailyPulseService` | Computes/upserts a daily business snapshot for owner dashboards |

## Related
- [[Jobs & Queue Workers]]
- [[WooCommerce Sync Engine]]
