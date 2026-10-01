# Printing and customer PDF audit

## Completed fixes

- Thermal printing now stops with a visible error when VenQore Station is unavailable or the selected printer is unavailable. It does not silently fall back to a PDF job.
- A saved Station printer is preserved. The app no longer replaces it with the Windows default or Microsoft Print to PDF on page load.
- Station validates the selected installed printer, the paper width, and the printer result before reporting success.
- Native receipt text and table cells are escaped before `electron-pos-printer` renders them. Browser KOT and Z-report output is escaped as well.
- KOT, receipt, and Z-report browser jobs use separate print frames and wait for document resources before printing.
- Receipt totals use recorded invoice totals, line net amounts, tax, payments, balance due, service charge, tip, delivery, and round-off fields. Zero quantities, prices, and payments are preserved.
- Reprints use the selected sale directly instead of printing the previous React state.
- Z-reports pass structured printer rows instead of raw ESC/POS control bytes.
- Drawer controls no longer claim success from a blank print job. A driver-configured drawer action is reported honestly; standalone drawer pulsing still requires a verified printer-driver or serial implementation.
- Customer receipt, email, public receipt, V3 invoice, sales order, proposal, and label output now use tenant-specific settings, safe filenames, missing-product fallbacks, correct unpaid balances, and no customer-visible margin on the customer invoice route.
- Customer PDFs do not invent FBR verification numbers and do not call a remote QR service. A QR is embedded locally only when an actual FBR report and invoice number exist.
- Public receipt tokens use URL-safe base64 and responses are private/no-store/noindex.
- WhatsApp sharing resets the recipient for each document, ignores late responses from a previous document, validates PDF responses, and avoids false popup-blocked results.

## Verification

- `npx vitest run`: 21 files, 283 tests passed.
- `php vendor/bin/phpunit tests/Feature/ReceiptDocumentRenderingTest.php`: 7 tests, 23 assertions passed. This includes a 65-line, 3-page PDF with repeated table headers.
- PHP syntax checks passed for all touched controllers, the receipt service, and mail.
- `node --test print-payload.test.cjs`: 2 tests passed.
- `node --check main.js` and Windows Station `package.json` validation passed.
- A rendered 3-page receipt was inspected: columns align, page headers repeat, and totals show paid 0.00 and the correct balance.

## Required live check for Chrome/Edge + Black Copper

1. Upload the website build containing these changes and clear Laravel/Vite caches.
2. In Chrome or Edge, print one thermal test receipt and select the exact Black Copper printer in the system print dialog. Confirm paper width (58mm or 80mm) and that the result is a physical receipt, not “Save to PDF.”
3. Print one unpaid customer receipt and one paid receipt. Confirm subtotal, discount, tax, total, paid, balance, currency, and item names.
4. Download the same customer PDF through WhatsApp/email and confirm it opens as a PDF, contains the same totals, and does not expose margin or an invented FBR number.
5. If silent printing or automatic cutting/drawer opening is required, install/run the updated VenQore Station build and select the Black Copper printer there. Browser mode cannot silently select hardware.

The code cannot verify the physical Black Copper model or driver from this workstation. The live test above is the final hardware gate.
