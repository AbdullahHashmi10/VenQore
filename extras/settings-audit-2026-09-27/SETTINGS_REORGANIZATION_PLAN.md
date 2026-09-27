# Settings navigation and heading reorganization plan

Status: plan only. No settings, stored values, routes, or interface behavior were changed for this document. Based on the current `app-code/main-app/resources/js/Pages/Admin/Settings.jsx` and its settings components on 27 September 2026.

## What is confusing today

The page has 17 sections under Organization, Operations, Advanced, and Danger Zone. Several headings describe the implementation rather than the user's task. “Preferences” mixes passcode, multi-firm mode, number precision, display scale, language, and alerts. “AI & Integrations” mixes AI providers, FBR, Stripe, and WooCommerce. “Print & Templates” mixes document design with device actions. “Backup & Data” is a dead-end page that only links to the actual Data & Backup hub. “Messages” still promises WhatsApp and SMS notifications, although its current interface describes manual, no-cost WhatsApp sharing.

The settings ownership map also lists the same keys in multiple sections: `business_name` (Business and Messages), `loyalty_enabled` (Modules and Party), `stock_maintenance`, `barcode_scan_enabled`, `batch_tracking_enabled`, and `wholesale_price_enabled` (Modules and Item), `low_stock_alerts` and `low_stock_threshold` (Preferences and Item), `payment_reminder_days` (Messages and Party), and `shared_catalog_opt_out` and `ai_accuracy_opt_in` (Business and AI/Integrations). Some are only duplicated in the save map, while others have more than one visible control. Each must have one editable owner.

The decimal example needs particular care. `decimal_places` is edited as “Decimal Precision” in Preferences. `print_amount_decimal` appears as “Decimal Amounts” in both Regular and Thermal print panels and both controls edit the same key. `round_off_total` is a separate checkout rule. Backend `SettingsHelper::formatNumber()` uses `print_amount_decimal` to force zero decimals when off, whereas `formatCurrency()` reads `decimal_places`. Thus the names and actual formatting behavior need review before any control is moved or consolidated.

## Proposed navigation

Keep one `/settings` destination. Use five plain-language groups, with a short sidebar label and a precise page title. The right column should show one page title, a one-line explanation, and the controls. Avoid repeating large decorative headers inside the page.

| Group | Sidebar section | Contents and current source |
| --- | --- | --- |
| Business | Business profile | Name, address, contacts, branding, custom domain from Business Info. |
| Business | Region & numbers | Currency/code/symbol, timezone, language, date format, and **global money decimal places** from Business Info, Preferences, and GeneralSettingsSection. |
| Business | Display preferences | Interface scale, dark mode, senior mode, header calculator. Show whether each choice applies to this user or the whole store. |
| Selling | Checkout & returns | Cash defaults, negative stock sale policy, POS return policy/window, and total rounding from Sales & Invoicing. |
| Selling | Documents & numbering | Invoice fields and sale/purchase/quotation/return prefixes. Name it for all document types, since purchase numbering is not a sales-only choice. |
| Selling | Taxes | Existing tax rates, basis, and default tax. |
| Selling | Customers & suppliers | Party grouping, loyalty, credit limit, and relevant customer/supplier behavior. |
| Inventory | Stock & items | Stock maintenance, batch, barcode, wholesale/MRP, low-stock threshold and alert behavior. |
| Printing & sharing | Document layouts | Regular, thermal, and B2B layouts with a single common “Amounts on printed documents” explanation/control, followed by layout-specific options. |
| Printing & sharing | Printer & device | Default print type, thermal page size and hardware actions. Clearly mark browser/device-local choices if that is how they work. |
| Printing & sharing | Manual sharing | WhatsApp draft templates, document/PDF sharing, and manual reminder text. Explicitly say that opening a draft does not send a message. Do not advertise SMS or automated WhatsApp delivery. |
| Operations | Reminders & alerts | Service reminder rules, payment reminder days, low-stock notifications, email notifications, daily summaries. Distinguish a reminder rule from actual scheduled sending. |
| Operations | Accounting | Fiscal year and accounting-specific options. |
| Operations | Features & connections | One module-management entry linking to System Builder; separate provider cards for AI, FBR, Stripe, WooCommerce. Keep connection statuses and setup links in this section. |
| Access & data | Security | Passcode, automatic logout, 2FA and SSO, with scope and prerequisites stated. |
| Access & data | Approvals | Current approval policies and thresholds. |
| Access & data | Terminals | Pairing and revocation. |
| Access & data | Data & backup | Direct link to the actual hub; remove the intermediary settings page. |
| Access & data | Factory reset | Retain an isolated, permission-gated destructive action at the bottom. |

This is an information architecture proposal, not a demand for 19 full-size sidebar entries. Related pages can be nested or shown as compact sub-tabs. Keep the most common sections visible and put specialist integrations and destructive actions lower in the navigation. Do not recreate duplicate full pages behind different menu labels.

## One owner for each overlapping control

| Control/key | Proposed editable home | Other appearances |
| --- | --- | --- |
| `decimal_places` | Region & numbers | Print page shows the effective global setting as read-only context with a link. |
| `print_amount_decimal` | Document layouts > Amount display, once | Regular and Thermal both use the same shared setting; remove the second editable toggle. Explain the effect with a live amount example. |
| `round_off_total` | Checkout & returns > Total rounding | Explain that it changes the final payable total, not the number of decimal places. |
| `business_name` | Business profile | Sharing template shows a preview or link to Business profile, not another editor. |
| `loyalty_enabled` | Customers & suppliers | Module management may link to the setting or show status. |
| Stock, barcode, batch, wholesale keys | Stock & items | System Builder controls module availability; avoid a second field editor. |
| Low-stock threshold and alert keys | Stock & items for threshold; Reminders & alerts for notification delivery | If the two controls must be together for comprehension, keep both in Stock & items and link from alerts. Choose one editor per key. |
| `payment_reminder_days` | Reminders & alerts | Manual sharing displays the configured timing as context, with a link. |
| AI catalog participation keys | Features & connections > AI | Business profile can show a link if needed. |
| `auto_backup` | Data & backup hub | Remove from Security; backup is a data policy. |

The implementation must decide whether `print_amount_decimal` should remain a store-wide print override or be replaced by an explicit “Use global precision / Whole numbers” choice. Do not silently reinterpret the existing saved boolean. First verify every formatting path, including receipts, invoices, B2B PDFs, returns, and thermal output; then migrate existing values if the data model changes. Show an example such as `Rs. 1,234.50` versus `Rs. 1,235` next to the controls.

## Page and heading rules

Use the same text scale for all sections: one page title, section headings, field labels, help text, and button labels. Primary save buttons should have the same size and placement. Reserve large banners for errors or connection states, not ordinary settings. On print pages, give the editor and preview enough horizontal room; use a sticky, compact preview toolbar rather than a tall page header. Put a visible “Save changes” action and dirty-state indicator near the page title or in a consistent footer. Each field needs one sentence stating what changes and, where relevant, whether it applies to the store, user, device, or a connected service.

Replace vague headings such as “Item”, “Party”, “Preferences”, and “Advanced” with task-based names. Replace stale descriptions such as “WhatsApp & SMS notifications” and “Backup & Data” with accurate copy. Search should index both the new labels and familiar old terms (for example “party”, “item”, “decimal”, “receipt”, “thermal”, “WhatsApp”, and “SMS”), including field labels rather than just section names/descriptions.

## Implementation sequence for the IDE

1. Inventory every rendered input, underlying key, section save map, backend allowlist, and actual consumer. Confirm whether duplicate keys also mean duplicate visible editors. Record the current values and defaults before making changes.
2. Establish the new section/field ownership table in one configuration source. Move UI controls, not stored values, where possible. Align section save payloads with ownership; no moved field should stop saving because its old section was removed.
3. Correct the decimal model and copy after tracing all formatter consumers. Use a shared amount-display component in the print layouts so Regular and Thermal cannot diverge.
4. Replace old sidebar labels and headings; remove the backup intermediary; retain redirects or hash aliases for existing links such as `#preferences`, `#print`, `#item`, and `#ai_integrations`. Preserve unsaved-change behavior when navigating.
5. Tighten the visual layout and responsive behavior on desktop and mobile, especially printing. Keep preview visible without shrinking the controls to an unreadable width.
6. Test from a clean store and a store with existing settings. Verify changing and saving one field in each section, reload persistence, permission restrictions, old bookmarked hashes, search aliases, unsaved-change prompts, print previews, and printed/PDF output. Add meaningful automated coverage for field ownership and formatting behavior, plus a focused visual check at common screen widths.

## Acceptance criteria

- Every editable setting has exactly one clear home and the same saved value remains available after reorganization.
- Searching “decimal” shows global precision, printed amount display, and total rounding with clear distinctions, and takes the user to the correct control.
- Regular and Thermal print views cannot show conflicting values for their shared amount-format option.
- The Messages heading describes manual sharing accurately and does not promise an SMS or automated WhatsApp service.
- Existing settings URLs/bookmarks still land at the relevant new section.
- A typical desktop print view shows readable controls and a useful preview without an oversized header; mobile controls remain legible.
- Tests cover navigation, save/reload behavior, formatting consequences, and the role/permission boundary for sensitive settings.

## Scope boundary

This plan reorganizes and clarifies settings. It should be implemented after the separate functional audit findings are triaged. A moved control must not be called “working” merely because it renders or saves; its actual downstream behavior still needs verification.
