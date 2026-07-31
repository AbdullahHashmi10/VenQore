---
tags: [testing, dev-workflow, commands]
updated: 2026-08-01
---

# Test Suite Dashboard

Part of [[VenQore POS - Home]] → [[Key Commands]]

> [!tip] PHP path on this machine
> `E:\Software\Xampp\php\php.exe artisan test ...`
> Always run from `E:\AMD POS\AMD POS\` as working directory.

---

## ▶ Run Everything At Once

```powershell
# Full suite — all 209 test files
E:\Software\Xampp\php\php.exe artisan test Tester/tests/ --compact
```

---

## 🛠 Free Tools — All Tests

```powershell
# All tools tests at once (19 tool test files + coverage + rate limit + lead capture + unit)
E:\Software\Xampp\php\php.exe artisan test `
  Tester/tests/Feature/Tools/BarcodeToolTest.php `
  Tester/tests/Feature/Tools/BarcodeValidatorTest.php `
  Tester/tests/Feature/Tools/BarcodeSheetTest.php `
  Tester/tests/Feature/Tools/BarcodeTextRenderingTest.php `
  Tester/tests/Feature/Tools/BarcodeLabelSheetToolTest.php `
  Tester/tests/Feature/Tools/InvoiceToolTest.php `
  Tester/tests/Feature/Tools/ReceiptToolTest.php `
  Tester/tests/Feature/Tools/PriceTagToolTest.php `
  Tester/tests/Feature/Tools/LabelSheetToolTest.php `
  Tester/tests/Feature/Tools/QuoteToolTest.php `
  Tester/tests/Feature/Tools/PackingSlipToolTest.php `
  Tester/tests/Feature/Tools/CreditNoteToolTest.php `
  Tester/tests/Feature/Tools/PurchaseOrderToolTest.php `
  Tester/tests/Feature/Tools/StockCountSheetToolTest.php `
  Tester/tests/Feature/Tools/MarginCalculatorToolTest.php `
  Tester/tests/Feature/Tools/QrCodeToolTest.php `
  Tester/tests/Feature/Tools/QrMenuToolTest.php `
  Tester/tests/Feature/Tools/SkuGeneratorToolTest.php `
  Tester/tests/Feature/Tools/ProductCsvCleanerToolTest.php `
  Tester/tests/Feature/Tools/CashDrawerToolTest.php `
  Tester/tests/Feature/Tools/InventoryHealthToolTest.php `
  Tester/tests/Feature/Tools/PosRoiToolTest.php `
  Tester/tests/Feature/Tools/PaymentFeeToolTest.php `
  Tester/tests/Feature/Tools/FoodCostToolTest.php `
  Tester/tests/Feature/Tools/ToolSeoCoverageTest.php `
  Tester/tests/Feature/Tools/ToolLeadCaptureTest.php `
  Tester/tests/Feature/Tools/RateLimitTest.php `
  Tester/tests/Unit/Tools/CheckDigitTest.php `
  --compact 2>&1
```

### Or use the folder shortcut:
```powershell
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Tools/ Tester/tests/Unit/Tools/ --compact
```

---

## 📋 Tools Tests — File by File

### Barcode Group
| Test File | What It Covers |
|---|---|
| `BarcodeToolTest.php` | Page load, 9 format renders, check-digit math, rate limit |
| `BarcodeValidatorTest.php` | EAN/UPC/GTIN check-digit validation logic |
| `BarcodeSheetTest.php` | Multi-label PDF sheets (thermal + A4 grid presets) |
| `BarcodeTextRenderingTest.php` | SVG text decoration in `BarcodeService::decorateSvg()` |
| `BarcodeLabelSheetToolTest.php` | Label Sheet Generator: all presets, bulk paste, PDF output |
| `CheckDigitTest.php` (Unit) | Pure math: all 9 symbologies' check-digit algorithms |

### Document / PDF Group
| Test File | What It Covers |
|---|---|
| `InvoiceToolTest.php` | Invoice PDF: themes, multi-currency, per-line tax/discount |
| `ReceiptToolTest.php` | Receipt PDF: 80mm thermal + A4, cash change calc, discount modes |
| `QuoteToolTest.php` | Quotation PDF: expiry date, deposit terms, themes |
| `PackingSlipToolTest.php` | Packing Slip PDF: ship-to/bill-to, carrier, SKU listing |
| `CreditNoteToolTest.php` | Credit Note PDF: original invoice ref, reason, refund lines |
| `PurchaseOrderToolTest.php` | PO PDF: vendor info, delivery date, freight/tax, themes |

### Label / Print Sheet Group
| Test File | What It Covers |
|---|---|
| `PriceTagToolTest.php` | Price tag sheets: manual + CSV bulk, sale strikethrough, barcode embed |
| `LabelSheetToolTest.php` | General text label sheets: Avery + thermal, quantity, bulk paste |
| `StockCountSheetToolTest.php` | Stock count PDF: blind count mode, CSV import, signature block |
| `CashDrawerToolTest.php` | Cash drawer audit PDF: denomination breakdown, over/short calc |

### Calculator Group (Client-Side, page-load + SEO checks)
| Test File | What It Covers |
|---|---|
| `MarginCalculatorToolTest.php` | Page loads, SEO metadata present |
| `QrCodeToolTest.php` | URL/WiFi/vCard QR render, SVG validity, 422 on empty |
| `QrMenuToolTest.php` | Table tent card PDF: layout presets, URL encoding |
| `SkuGeneratorToolTest.php` | Page loads, SEO metadata present |
| `ProductCsvCleanerToolTest.php` | Page loads, SEO metadata present |
| `InventoryHealthToolTest.php` | Page loads, SEO metadata present |
| `PosRoiToolTest.php` | Page loads, SEO metadata present |
| `PaymentFeeToolTest.php` | Page loads, SEO metadata present |
| `FoodCostToolTest.php` | Page loads, SEO metadata present |

### Infrastructure
| Test File | What It Covers |
|---|---|
| `ToolSeoCoverageTest.php` | Every GET tools route has a `ToolSeo` entry; every POST is excluded |
| `ToolLeadCaptureTest.php` | Lead capture, email consent, suppression list |
| `RateLimitTest.php` | `throttle:tools` middleware triggers correctly |

---

## 🏦 Core Business Logic Tests

```powershell
# Money / Accounting integrity
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Money/ --compact

# V3 engine scenarios
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/V3/ --compact

# Production pinning tests
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Production/ --compact
```

---

## 💨 Smoke Tests

```powershell
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Smoke/ --compact
```

| File | What It Covers |
|---|---|
| `InertiaPageRenderTest.php` | All Inertia pages return 200 (no missing props) |
| `ProductionSmokeTest.php` | Key production flows don't 500 |
| `SerializationDragnetTest.php` | No un-serializable values in API responses |

---

## 🏢 Module Tests (21 modules)

```powershell
# All 21 module tests
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Module01/ `
  Tester/tests/Feature/Module02/ `
  Tester/tests/Feature/Module03/ `
  Tester/tests/Feature/Module04/ `
  Tester/tests/Feature/Module05/ `
  Tester/tests/Feature/Module06/ `
  Tester/tests/Feature/Module07/ `
  Tester/tests/Feature/Module08/ `
  Tester/tests/Feature/Module09/ `
  Tester/tests/Feature/Module10/ `
  Tester/tests/Feature/Module11/ `
  Tester/tests/Feature/Module12/ `
  Tester/tests/Feature/Module13/ `
  Tester/tests/Feature/Module14/ `
  Tester/tests/Feature/Module15/ `
  Tester/tests/Feature/Module16/ `
  Tester/tests/Feature/Module17/ `
  Tester/tests/Feature/Module18/ `
  Tester/tests/Feature/Module19/ `
  Tester/tests/Feature/Module20/ `
  Tester/tests/Feature/Module21/ `
  --compact
```

---

## 📊 Test Count Summary

| Suite | Test Files | Approx Tests |
|---|---|---|
| **Free Tools** | 28 files | ~200+ |
| **Money / Accounting** | 18 files | ~150+ |
| **V3 Engine** | 11 files | ~90+ |
| **Module Tests (M01–M21)** | 55+ files | ~400+ |
| **Smoke / Production** | 6 files | ~50+ |
| **Reports / Security** | 3 files | ~20+ |
| **Performance** | 1 file | ~5 |
| **Unit** | 2 files | ~20 |
| **TOTAL** | **~209 files** | **~935+ assertions** |

> [!note] Exact assertion count
> Run `E:\Software\Xampp\php\php.exe artisan test Tester/tests/ --compact 2>&1 | Select-String "assertions"` to get the live count after any changes.

---

## 🚀 Pre-Deploy Checklist

```powershell
# 1. Clear all caches
E:\Software\Xampp\php\php.exe artisan optimize:clear

# 2. Run migrations (if any new)
E:\Software\Xampp\php\php.exe artisan migrate

# 3. Regenerate Ziggy routes
E:\Software\Xampp\php\php.exe artisan ziggy:generate

# 4. Build frontend
npm run build

# 5. Run full tools suite
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Tools/ Tester/tests/Unit/Tools/ --compact

# 6. Run smoke tests
E:\Software\Xampp\php\php.exe artisan test Tester/tests/Feature/Smoke/ --compact
```

---

## Related
- [[Free Tools - Complete Registry]]
- [[Key Commands]]
- [[Code Conventions]]
