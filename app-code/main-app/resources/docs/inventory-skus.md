---
title: Inventory & SKU Management
description: Frequently asked questions about catalog listing, barcode printing, size/color variant configurations, and FIFO valuation.
category: Inventory & SKUs
order: 3
---

# Inventory & SKU Management

Find answers on adding products, printing barcodes, managing variants, and FIFO valuations.

## Questions & Answers

### Q: How do I add a new product and generate barcode labels?
**A:** List products and print labels from your inventory menu:
- **Manual entry:** Go to Inventory > Add Product. Fill in the title, cost, retail price, and initial stock.
- **Generating Barcodes:** Scan a product's barcode directly using a barcode scanner, or click "Generate Barcode" to let VenQore create a unique Code128 value.
- **Printing Labels:** Use the built-in [Barcode Generator](/tools/barcode-generator) tool to download and print label sheets formatted for standard Avery sheets or thermal labels.

### Q: How do I configure color, size, or material variants for a product?
**A:** You can create product options easily:
1. When adding or editing a product, check the "This product has variants" box.
2. Enter the option names and attributes (e.g., `Size` = `S, M, L` and `Color` = `Red, Blue`).
3. Click "Generate Grid".
4. The system creates rows for each combination. Set specific cost, retail pricing, SKUs, and stock quantities for each variant row.

### Q: How does the FIFO (First-In, First-Out) stock depletion work?
**A:** VenQore automatically manages stock valuation using a FIFO model:
- **Stock Batches:** Every purchase order creates a stock batch with its specific unit cost and date.
- **Sale Depletion:** When a sale occurs, VenQore automatically deducts stock from the oldest available batch first.
- **COGS Calculations:** Cost of Goods Sold (COGS) is computed based on the exact purchase cost of the batch being depleted. This ensures your Profit & Loss statement reflects true margins even during fluctuating supplier costs.
