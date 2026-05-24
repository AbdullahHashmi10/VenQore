# Vyapar Printing Templates and Settings

This document details the printing templates, mechanisms, and settings used in the Vyapar application.

## Overview

Vyapar uses two distinct mechanisms for printing:
1.  **Regular Printers**: Uses dynamically generated HTML with CSS styling.
2.  **Thermal Printers**: Uses ESC/POS commands sent directly to the printer, often structured via JSON themes.

---

## 1. Regular Printer Templates (HTML/CSS)

Regular reports and invoices are generated as HTML strings.

*   **Logic Location**: `printing-ReportHTMLGenerator_AccountStatementHTML_ts-ReportHTMLGenerator_StockTransferDetails-2a537f.bundle.js` and `printing-ReportHTMLGenerator_CustomReportHTMLGenerator_js.bundle.js`.
*   **Mechanism**: JavaScript functions (e.g., `getHTML`, `getCompanyHeaderHtml`) concatenate HTML strings based on data and theme settings.
*   **Styling**:
    *   **Classes**: Uses theme-specific class names like `theme14HeaderBackground`, `theme14Color`, `theme14BigTextSize`.
    *   **Global Styles**: `styles/invoicePreview.css` contains layout styles for the preview container.
    *   **Variables**: Global color/theme variables are defined in `default-styles_scss__themes_scss.css`.

---

## 2. Thermal Printer Templates (ESC/POS)

Thermal printing logic is handled by converting transaction data into a series of ESC/POS commands.

*   **Logic Location**: `thermalPrinter-ThermalPrinter_ThermalPrinterJSON_js-ThermalPrinter_ThermalPrinterJSONTheme2_j-92401a.bundle.js`.
*   **Mechanism**: A JSON structure is created representing the print job, which is then translated into raw bytes for the printer.

### ESC/POS Commands

| Command Name | Bytes (Hex) | Description |
| :--- | :--- | :--- |
| `INIT` | `1B 40` | Initialize printer |
| `FEED_LINE` | `0A` | Line feed |
| `FEED_PAPER_AND_CUT` | `1D 56 00` | Feed paper and cut (Partial cut) |
| `OPEN_DRAWER_KICK_2` | `1B 70 00` | Pulse pin 2 (Open Drawer) |
| `OPEN_DRAWER_KICK_5` | `1B 70 01` | Pulse pin 5 (Open Drawer) |
| `TXT_NORMAL` | `1B 21 00` | Normal text size |
| `TXT_2HEIGHT` | `1B 21 10` | Double height text |
| `TXT_2WIDTH` | `1B 21 20` | Double width text |
| `TXT_BOLD_ON` | `1B 45 01` | Turn bold mode on |
| `TXT_BOLD_OFF` | `1B 45 00` | Turn bold mode off |
| `ESC_ALIGN_LEFT` | `1B 61 00` | Align Left |
| `ESC_ALIGN_CENTER` | `1B 61 01` | Align Center |
| `ESC_ALIGN_RIGHT` | `1B 61 02` | Align Right |

---

## 3. Barcode Templates

Barcodes are generated as HTML for printing.

*   **Logic Location**: `printing-ReportHTMLGenerator_BarcodeHTMLGenerator_js.bundle.js`.
*   **Functions**: `getBarcodeHTMLThermalPrinter` and `getBarcodeHTMLRegularPrinter`.

---

## 4. Printing Settings (Complete List)

Settings are configured in the app's settings panel and control the behavior and content of print output.

---

### Regular Printer Settings

#### Print Company Info / Header
| Setting | Type | Description |
| :--- | :--- | :--- |
| Make Regular Printer Default | Toggle | Sets regular (A4/Letter) printer as the primary printing method. |
| Print repeat header in all pages | Toggle | Repeats the invoice header on every page of a multi-page document. |
| Company Name | Text | The business name printed on invoices. |
| Company Logo | Image | Logo image displayed on invoices. |
| Address | Text | Business address. |
| Email | Text | Business email. |
| Phone Number | Text | Business phone number. |
| Paper Size | Dropdown | Paper format (e.g., A4, Letter). Value `1` = A4. |
| Orientation | Dropdown | Portrait or Landscape. Value `1` = Portrait. |
| Company Name Text Size | Dropdown | Font size for company name. Value `4` = specific size mapping. |
| Invoice Text Size | Dropdown | General font size for invoice content. Value `3` = specific size mapping. |
| Print Original/Duplicate | Toggle | Prints "Original", "Duplicate", "Triplicate" labels on copies. |
| Extra space on Top of PDF | Number | Adds extra margin (in units) at the top. `0` = no extra space. |
| Change Transaction Names | Action | Opens modal to customize transaction header names. |

#### Item Table
| Setting | Type | Description |
| :--- | :--- | :--- |
| Min No. of Rows in Item Table | Number | Minimum number of rows to display in item table (for formatting). |
| Item Table Customization | Action | Opens modal for column visibility and order. |

#### Totals & Taxes
| Setting | Type | Description |
| :--- | :--- | :--- |
| Total Item Quantity | Toggle | Displays total quantity of all items. |
| Amount with Decimal e.g. 0.00 | Toggle | Shows amounts with decimal places. |
| Received Amount | Toggle | Displays received amount. |
| Balance Amount | Toggle | Displays balance/due amount. |
| Current Balance of Party | Toggle | Shows the party's current account balance. |
| Tax Details | Toggle | Displays tax breakdown (CGST, SGST, IGST, etc.). |
| You Saved | Toggle | Displays "You Saved" discount summary. |
| Print Amount with Grouping | Toggle | Formats numbers with comma separators (e.g., 1,00,000). |
| Amount in Words | Dropdown | Shows amount in words. Value `0` = disabled/default. |

#### Footer
| Setting | Type | Description |
| :--- | :--- | :--- |
| Print Description | Toggle | Prints transaction/invoice description. |
| Terms and Conditions | Action | Opens modal to edit T&C text. |
| Print Received by details | Toggle | Adds "Received By" signature block. |
| Print Delivered by details | Toggle | Adds "Delivered By" details (for Delivery Challans). |
| Print Signature Text | Text | Custom text for signature label (e.g., "Authorized Signatory"). |
| Change Signature | Action | Upload/change signature image. |
| Payment Mode | Toggle | Prints payment mode used (Cash, UPI, Cheque, etc.). |
| Print Acknowledgement | Toggle | Adds an acknowledgement section. |

---

### Thermal Printer Settings

#### General
| Setting | Type | Description |
| :--- | :--- | :--- |
| Make Thermal Printer Default | Toggle | Sets thermal printer as the primary printing method. |
| Page Size | Radio | Paper width: `2 Inch (58mm)`, `3 Inch (68mm)`, `4 Inch (88mm)`, `Custom`. |
| Custom Characters | Number | Character width for custom page size (e.g., 48 chars). |
| Printing Type | Dropdown | Value `0` = default type. |
| Use Text Styling (Bold) | Toggle | Enables bold text for headers/important fields. |
| **Auto Cut Paper After Printing** | Toggle | **Sends ESC/POS cut command (`1D 56 00`) after print job.** |
| **Open Cash Drawer After Printing** | Toggle | **Sends ESC/POS drawer kick command (`1B 70 00`).** |
| Extra lines at the end | Number | Adds blank lines before cut. `0` = none. |
| Number of copies | Number | How many copies to print. `1` = single copy. |

#### Print Company Info / Header
| Setting | Type | Description |
| :--- | :--- | :--- |
| Company Name | Text | Business name for thermal receipts. |
| Company Logo | Image | Logo (if thermal printer supports graphics). |
| Address | Text | Business address. |
| Email | Text | Business email. |
| Phone Number | Text | Business phone number. |
| Change Transaction Names | Action | Opens modal to customize transaction header names. |

#### Item Table
| Setting | Type | Description |
| :--- | :--- | :--- |
| S.No | Toggle | Print serial number column. |
| Units of Measurement | Toggle | Print unit column (e.g., Pcs, Kg). |
| MRP | Toggle | Print Maximum Retail Price column. |
| Description | Toggle | Print item description. |

#### Additional Item Details
| Setting | Type | Description |
| :--- | :--- | :--- |
| Batch No. | Toggle | Print batch number. |
| Exp. Date | Toggle | Print expiry date. |
| Mfg. Date | Toggle | Print manufacturing date. |
| Size | Toggle | Print size attribute. |
| Model No. | Toggle | Print model number. |
| Serial No. | Toggle | Print serial number. |

#### Totals & Taxes
| Setting | Type | Description |
| :--- | :--- | :--- |
| Total Item Quantity | Toggle | Displays total quantity of all items. |
| Amount with Decimal e.g. 0.00 | Toggle | Shows amounts with decimal places. |
| Received Amount | Toggle | Displays received amount. |
| Balance Amount | Toggle | Displays balance/due amount. |
| Current Balance of Party | Toggle | Shows the party's current account balance. |
| Tax Details | Toggle | Displays tax breakdown. |
| You Saved | Toggle | Displays "You Saved" discount summary. |
| Print Amount with Grouping | Toggle | Formats numbers with comma separators. |
| Amount in Words | Dropdown | Shows amount in words. Value `0` = disabled/default. |

#### Footer
| Setting | Type | Description |
| :--- | :--- | :--- |
| Print Description | Toggle | Prints transaction/invoice description. |
| Terms and Conditions | Action | Opens modal to edit T&C text. |

---

## 5. Settings Key Mapping

These are the internal setting keys used in the application code:

| UI Label | Internal Setting Key |
| :--- | :--- |
| Make Regular Printer Default | `SETTING_DEFAULT_PRINTER` |
| Print repeat header in all pages | `SETTING_PRINT_REPEAT_HEADER_IN_ALL_PAGES` |
| Paper Size | `SETTING_PRINT_PAGE_SIZE` |
| Orientation | `SETTING_PRINT_ORIENTATION` |
| Company Name Text Size | `SETTING_PRINT_COMPANY_NAME_TEXT_SIZE` |
| Invoice Text Size | `SETTING_PRINT_TEXT_SIZE` |
| Print Original/Duplicate | `SETTING_PRINT_ORIGINAL_COPY_TEXT_ENABLED` |
| Extra space on Top | `SETTING_EXTRA_SPACE_ON_TXN_PDF` |
| Min Rows in Item Table | `SETTING_MIN_ITEM_ROWS_ON_TXN_PDF` |
| Total Item Quantity | `SETTING_PRINT_ITEM_QUANTITY_TOTAL_ON_TXN_PDF` |
| Tax Details | `SETTING_PRINT_TAX_DETAILS` |
| Print Description | `SETTING_PRINT_DESCRIPTION_ENABLED` |
| Print Received by | `SETTING_PRINT_RECEIVED_BY` |
| Print Delivered by | `SETTING_PRINT_DELIVERED_BY` |
| Payment Mode | `SETTING_PRINT_PAYMENT_MODE` |
| Print Acknowledgement | `SETTING_PRINT_ACKNOWLEDGEMENT` |
| Thermal Page Size | `SETTING_THERMAL_PRINTER_PAGE_SIZE` |
| Auto Cut Paper | `SETTING_ENABLE_AUTO_CUT_PAPER` |
| Open Cash Drawer | `SETTING_ENABLE_OPEN_DRAWER_COMMAND` |
| Extra lines at end | `SETTING_THERMAL_EXTRA_LINES` |
| Number of copies | `SETTING_PRINT_COPY_NUMBER` |
| Use Text Styling (Bold) | `SETTING_THERMAL_USE_BOLD` |

---

## 6. Theme Constants and CSS Classes

The application uses a comprehensive theming system for invoice templates. Themes are identified by numeric constants and applied via CSS classes.

### Theme Constant Identifiers

| Constant | Description |
| :--- | :--- |
| `THEME_1` | Default/Classic theme |
| `THEME_2` | Alternative classic theme |
| `THEME_3` | Theme 3 (displayed as "Theme 3" in UI) |
| `THEME_4` | Theme 4 (displayed as "Theme 4" in UI) |
| `THEME_5` | Theme 5 |
| `THEME_6` | Theme 6 |
| `THEME_7` | Theme 7 |
| `THEME_8` | Theme 8 |
| `THEME_9` | Theme 9 |
| `THEME_10` | Theme 10 |
| `THEME_11` | Theme 11 |
| `THEME_12` | Theme 12 |
| `THEME_13` | Theme 13 |
| `THEME_14` | Theme 14 |
| `THEME_15` | Theme 15 |
| `THEME_16` | Theme 16 |

### Special Theme Labels

| Theme ID | Display Label |
| :--- | :--- |
| `LANDSCAPE_THEME_1` | "Landscape Theme 1" |
| `THERMAL_THEME_6` | "Arabic Theme" |
| `FRENCH_ELITE` | "French Elite" |
| `SINGLE_COLOR_THEME` | Single color variant |

### Theme CSS Classes

Themes apply visual styles through CSS classes. Example classes for `theme14`:

| CSS Class | Purpose |
| :--- | :--- |
| `theme14HeaderBackground` | Background color for header sections |
| `theme14Color` | Primary text color |
| `theme14BorderBottom` | Bottom border styling |
| `theme14BorderTop` | Top border styling |
| `theme14BorderLeft` | Left border styling |
| `theme14BorderRight` | Right border styling |
| `theme14Header` | Header text styling |
| `theme14BigTextSize` | Large text sizing |

Similar patterns exist for other themes (e.g., `theme10ItemTablePadding`, `theme15HeaderBackground`).

### Thermal Printer Themes

Thermal printers have their own theme system:

| Constant | Description |
| :--- | :--- |
| `THERMAL_THEME_1` | Default thermal layout |
| `THERMAL_THEME_2` | Alternative thermal layout |
| `THERMAL_THEME_3` | Theme 3 for thermal |
| `THERMAL_THEME_4` | Theme 4 for thermal |
| `THERMAL_THEME_6` | Arabic theme for thermal (RTL support) |

### Theme Location in Codebase

| Component | File Location |
| :--- | :--- |
| Theme constants definition | `constants-Constants_ThemeConstants_js.bundle.js` |
| Theme CSS application | `default-styles_scss__themes_scss.css` |
| Theme image list | `settings-UIComponent_jsx_Settings_Settings_jsx...bundle.js` (property: `themesImagesList`) |
| Theme template generators | Functions like `getTheme11Template`, `getTheme2Template` in settings bundle |

### Theme SVG Assets

Theme preview images are stored as SVG files:
- `../inlineSVG/theme_1.svg`
- `../inlineSVG/theme_2.svg`
- (and similar for other themes)

---

## 7. Summary

- **Regular Printer**: HTML/CSS generation with theme classes, supports multi-page layouts.
- **Thermal Printer**: ESC/POS byte commands, supports paper cutting and cash drawer triggers.
- **Key Hardware Controls**: 
  - `Auto Cut Paper After Printing` → `FEED_PAPER_AND_CUT` (`1D 56 00`)
  - `Open Cash Drawer After Printing` → `OPEN_DRAWER_KICK_2` (`1B 70 00`)
