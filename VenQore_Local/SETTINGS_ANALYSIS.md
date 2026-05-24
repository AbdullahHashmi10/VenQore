# Application Settings Deep Analysis

This document provides a comprehensive breakdown of the application settings managed within VenQore POS. It outlines which settings are fully actively functioning, which strings and configurations are only partially implemented, and which are completely placeholders waiting for future development.

## 🟢 **Actively Functioning Settings**
These settings are used by the application logic (Backend Controllers, Frontend React Components, Middleware, or Utilities) to modify behavior.

### **POS & Operations**
- `pos_auto_fill_cash`: Actively populates the cash given field automatically during checkout (`CreatePreSale`, `CreateInvoice`, `Pos.jsx`).
- `senior_mode`: Actively increases UI scaling and contrast accessibility specifically inside the POS.
- `fbr_integration`, `fbr_pos_id`, `fbr_usin`: Actively used to trigger invoice submission to FBR systems (`SaleController`, `receipt.blade.php`).
- `show_margin_percentage`: Determines if the gross margin profit % is shown alongside the total amount.
- `stop_sale_negative_stock` (Mapped from `allow_overselling` in UI): Explicitly gates whether an item with zero/negative stock can be processed in `SaleController`.
- `cash_sale_default`: Dictates if a walk-in-customer cash sale is selected by default instead of a named party.
- `barcode_scan_enabled`: Active in POS barcode listener constraints.
- `ui_scale`: Read by the `OneGlanceLayout.jsx` wrapper to inject custom CSS `zoom/transform` scaling to the entire application frontend.

### **Items, Inventory & Pricing**
- `stock_maintenance`: Used within logic to decrement/increment global stock upon transactions.
- `batch_tracking_enabled`: Controls whether `ProductModal` and POS forces batch selections (Mfg/Expiry).
- `wholesale_price_enabled`: Dynamically assigns wholesale rates vs retail rates automatically in `SettingsHelper` based on party or qty constraints.
- `default_tax_rate`: The baseline fallback percentage given to new transactions.
- `low_stock_threshold`: The numeric boundary used to flag low stock inventory.

### **Identity & Security**
- `business_name`, `business_phone`, `business_address`, `tax_number`, `currency`: Fed globally through Inertia middleware and actively injected into Print Templates and PDF views via `SettingsHelper`.
- `enable_passcode` & `admin_passcode`: Validated globally inside `PasscodeModal` components and security check states.
- `decimal_places`: Modifies the core `SettingsHelper::formatNumber()` method controlling rounding format.
- `sale_prefix`, `purchase_prefix`: Used during custom invoice ID generation.

### **AI Tools**
- `ai_provider`, `openai_api_key`, `ai_model`: Directly tested and consumed by the `AiController` to power the AI Assistant/Insights (e.g. Gemini, OpenAI requests).

### **Printing Rules**
- Thermal & Regular Invoice Flags (`print_header_all_pages`, `margin_top`, `print_show_mrp`, `thermal_show_sno`, etc.): Almost all print flags mapped in `SettingsHelper::getPrintSettings()` are actively consumed by the `PrintService.js` and Blade PDF engines to conditionally hide/show columns dynamically.

---

## 🟡 **Partially Functioning / State-Only Settings**
These settings might be loaded into memory or modify a minor frontend list but don't have deep architectural enforcement behind them.

- `enable_credit_limit`: Stored on `PartiesList.jsx`, but lacks a strict hard-gate block in `SaleController` when a user exceeds the limit (only warns).
- `party_grouping`: Modifies how `PartiesList.jsx` groups entities in the UI, but doesn't have strict backend accounting grouping logic in ledgers.

---

## 🔴 **Placeholder / Upcoming Features (Non-Functional)**
These settings exist purely in the UI Form (`Settings.jsx`, `SystemSettingsSection.jsx`, etc.) and the `SettingsHelper` array, but **do not execute any real logic** across the application. They are mockups/placeholders.

### **Communications & Messages**
- `whatsapp_enabled`, `whatsapp_api_url`, `whatsapp_access_token`, `whatsapp_phone_number_id`: No backend Meta API HTTP jobs or sending logics exist.
- `sms_to_party`, `auto_send_sales`: No SMS gateway or API integrations exist.

### **Notifications & Reminders**
- `email_notifications`: No listener/watcher evaluates this flag to stop/start Mailable dispatch.
- `low_stock_alerts`: Dummy toggle; actual active cron jobs/email drivers for automated stock alerts aren't implemented.
- `service_reminders`: Actively masked in UI with "Upcoming Feature" flag. The data model (`service_reminders` JSON) is saved but never executed.

### **Enterprise & Advanced Accounting**
- `multi_firm_enabled`: Toggle exists, but no genuine `tenant_id` scopes are present on models to isolate databases/records.
- `enable_double_entry`, `fiscal_year_start`: Placeholder toggles for future General Ledger development.
- `loyalty_enabled`: A helper method `isLoyaltyEnabled()` checks it, but the application currently doesn't award points on sale completions natively.

### **System Safety**
- `auto_backup`: Saves state, but there is no scheduled CRON command currently mapped to this switch for dumping MySQL automatically.
- `auto_logout`: Dummy integer setting; no session lifetime mutation occurs strictly based on this.
- `two_factor_auth`: Toggle exists in UI; no 2FA middleware or QR secret logic exists for the auth routes.
- `daily_sales_summary`: Dummy toggle.

### **Third-Party Integrations**
- `stripe_enabled`, `woocommerce_enabled`: Form structures exist for their keys, but there is no native webhook handler or sync process actively pushing products/fetching payments.

## **Conclusion**
The core functionality (POS, Sales, AI, Printing, Inventory Tracking, Safety constraints) is completely wired and functioning flawlessly. The settings pertaining to external outreach, push notifications, and enterprise-level multi-tenancy are the primary placeholders that provide a roadmap for future modules.
