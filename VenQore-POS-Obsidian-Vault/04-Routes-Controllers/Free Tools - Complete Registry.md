---
tags: [tools, marketing, free-tools, seo, routes]
updated: 2026-08-01
---

# Free Tools — Complete Registry

Part of [[VenQore POS - Home]] → [[Route Map Overview]]

All tools live under `Route::prefix('tools')->name('tools.')->group(...)` in `routes/web.php`.
Every tool has a `ToolSeo.php` entry (required by `ToolSeoCoverageTest`), a `ToolRegistry.php` entry (drives the sidebar nav), and a feature test.

> [!important] Architecture Rule
> Every GET route under `tools.*` MUST have a matching entry in `ToolSeo::pages()` or the CI test `ToolSeoCoverageTest` will fail. Every POST/action route MUST be listed in `EXCLUDED_ROUTE_SUFFIXES` in that test.

---

## Document & Invoice Tools

| Tool | Route | URL | Controller | Service | PDF View | Test |
|---|---|---|---|---|---|---|
| **Invoice Generator** | `tools.invoice` | `/tools/invoice-generator` | `InvoiceToolController` | `InvoiceService` | `invoice.blade.php` | `InvoiceToolTest` |
| **Receipt Generator** | `tools.receipt` | `/tools/receipt-generator` | `ReceiptToolController` | `ReceiptService` | `receipt.blade.php` | `ReceiptToolTest` |
| **Quotation Generator** | `tools.quote` | `/tools/quote-generator` | `QuoteToolController` | `QuoteService` | `quote.blade.php` | `QuoteToolTest` |
| **Packing Slip Generator** | `tools.packing-slip` | `/tools/packing-slip-generator` | `PackingSlipToolController` | `PackingSlipService` | `packing-slip.blade.php` | `PackingSlipToolTest` |
| **Credit Note Generator** | `tools.credit-note` | `/tools/credit-note-generator` | `CreditNoteToolController` | `CreditNoteService` | `credit-note.blade.php` | `CreditNoteToolTest` |
| **Purchase Order Generator** | `tools.purchase-order` | `/tools/purchase-order-generator` | `PurchaseOrderToolController` | `PurchaseOrderService` | `purchase-order.blade.php` | `PurchaseOrderToolTest` |

### Document Tool Pattern
```
GET  /tools/{slug}         → index()  → Inertia::render('Marketing/Tools/{Page}')
POST /tools/{slug}/render  → render() → PDF response (dompdf)
```
All support: company profile saved to `localStorage`, dompdf PDF download, 2-4 visual themes, ToolUsageRecorder metrics.

---

## Barcode & Label Tools

| Tool | Route | URL | Controller | Service | Test |
|---|---|---|---|---|---|
| **Barcode Generator** | `tools.barcode` | `/tools/barcode-generator` | `BarcodeToolController` | `BarcodeService` | `BarcodeToolTest` |
| **Barcode Validator** | `tools.barcode-validator` | `/tools/barcode-validator` | `BarcodeToolController` | — | `BarcodeValidatorTest` |
| **Barcode Print Sheet** | `tools.barcode.sheet` | POST `/tools/barcode-generator/sheet` | `BarcodeToolController` | `BarcodeSheetService` | `BarcodeSheetTest` |
| **Price Tag Generator** | `tools.price-tag` | `/tools/price-tag-generator` | `PriceTagToolController` | `PriceTagService` | `PriceTagToolTest` |
| **Label Sheet Generator** | `tools.label-sheet` | `/tools/barcode-label-generator` | `LabelSheetToolController` | `LabelSheetService` | `LabelSheetToolTest` |

### Label Tool Pattern
```
GET  /tools/{slug}        → index() → Inertia page
POST /tools/{slug}/sheet  → sheet() → PDF via dompdf (mmToPt() helper, thermal + A4 grid presets)
```

---

## Stock & Inventory Tools

| Tool | Route | URL | Controller | Service | Test |
|---|---|---|---|---|---|
| **Stock Count Sheet** | `tools.stock-count` | `/tools/stock-count-sheet` | `StockCountSheetToolController` | `StockCountSheetService` | `StockCountSheetToolTest` |
| **Inventory Health Toolkit** | `tools.inventory-health` | `/tools/inventory-health` | `InventoryHealthToolController` | _(client-side)_ | `InventoryHealthToolTest` |

### Inventory Health Calculators (all client-side)
- Safety Stock = `(Max Daily Sales × Max Lead Time) − (Avg Daily Sales × Avg Lead Time)`
- Reorder Point = `(Avg Daily Sales × Lead Time) + Safety Stock`
- EOQ = `√(2 × Demand × Ordering Cost / Holding Cost)`
- GMROI = `Gross Margin $ / Avg Inventory Cost`
- Turnover = `COGS / Avg Inventory`

---

## Calculator Tools (Pure Client-Side)

| Tool | Route | URL | Controller | Test |
|---|---|---|---|---|
| **Profit Margin Calculator** | `tools.margin-calculator` | `/tools/margin-calculator` | `MarginCalculatorToolController` | `MarginCalculatorToolTest` |
| **Payment Fee Calculator** | `tools.payment-fee` | `/tools/payment-fee-calculator` | `PaymentFeeCalculatorToolController` | `PaymentFeeToolTest` |
| **POS ROI Calculator** | `tools.pos-roi` | `/tools/pos-roi-calculator` | `PosRoiToolController` | `PosRoiToolTest` |
| **Recipe Costing Calculator** | `tools.food-cost` | `/tools/food-cost-calculator` | `FoodCostToolController` | `FoodCostToolTest` |

### Calculator Pattern
```
GET /tools/{slug} → index() → Inertia page (all math runs in React, no POST endpoint)
```

---

## QR Code Tools

| Tool | Route | URL | Controller | Service | Test |
|---|---|---|---|---|---|
| **QR Code Generator** | `tools.qr` | `/tools/qr-code-generator` | `QrCodeToolController` | `QrCodeService` | `QrCodeToolTest` |
| **QR Menu Generator** | `tools.qr-menu` | `/tools/qr-menu-generator` | `QrMenuToolController` | `QrMenuService` | `QrMenuToolTest` |

---

## SKU & CSV Tools

| Tool | Route | URL | Controller | Test |
|---|---|---|---|---|
| **Bulk SKU Generator** | `tools.sku-generator` | `/tools/sku-generator` | `SkuGeneratorToolController` | `SkuGeneratorToolTest` |
| **Product CSV Cleaner** | `tools.csv-cleaner` | `/tools/product-csv-cleaner` | `ProductCsvCleanerToolController` | `ProductCsvCleanerToolTest` |

---

## Cash Management Tools

| Tool | Route | URL | Controller | Service | Test |
|---|---|---|---|---|---|
| **Cash Drawer Count Sheet** | `tools.cash-drawer` | `/tools/cash-drawer-count-sheet` | `CashDrawerToolController` | `CashDrawerService` | `CashDrawerToolTest` |

---

## Lead Capture & Gating

| Route | Purpose |
|---|---|
| `tools.lead.store` | Captures email opt-in for gated bulk operations |
| `tools.lead.confirm` | Email confirmation token handler |

> [!note] Gating Policy
> Core tool output (single PDF download) is **always free and ungated** — no email required.
> Bulk generation (10+ barcodes, CSV exports) may prompt for email via `EmailGate.jsx`.
> Never gate: Margin Calculator, Inventory Health, POS ROI, Payment Fee, Food Cost (pure calculators).

---

## Shared Infrastructure

| File | Purpose |
|---|---|
| `app/Support/ToolRegistry.php` | All tool metadata: slug, name, group, status (LIVE/SOON), route |
| `app/Support/ToolSeo.php` | Server-rendered SEO HTML + JSON-LD for every tool page (GPTBot, ClaudeBot, PerplexityBot) |
| `app/Services/Tools/ToolUsageRecorder.php` | Writes `tool_usages` rows (numeric/enum metrics only, no PII) |
| `resources/js/Pages/Marketing/Tools/Shared/ToolShell.jsx` | Layout wrapper: sidebar + promo rail + main content |
| `resources/js/Pages/Marketing/Tools/Shared/HousePromo.jsx` | Right-side promotional rail (w-80 / 320px) |
| `resources/js/Pages/Marketing/Tools/Shared/Select.jsx` | Custom styled `<select>` dropdown component |

---

## Related
- [[Key Commands]]
- [[Test Suite Dashboard]]
- [[Route Map Overview]]
