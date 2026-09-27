# Missing settings and consolidation assessment

Date: 27 September 2026. Companion to AUDIT.md and FIELD_INVENTORY.md. **Audit and recommendations only; nothing implemented.**

## Main conclusion

Yes: important settings are missing from the main hub. The most urgent additions are the approval-policy editor, an explicit default-tax control, real printer/device selection, usable invoice/PDF options, and a clear view of which store/device policy is actually in effect.

Do not add a new toggle whenever a feature sounds useful. First determine whether the behavior already has an authoritative setting elsewhere, whether the engine supports it, and whether users actually need a choice. A setting is complete only when its scope, default, permissions, persistence, consumer and tests are defined.

This review identifies **22 candidate groups**:

- **8 existing surfaces to bring into the settings center** — consolidation, not new features.
- **6 supported or partially supported controls to expose/complete** — backend or consumer evidence exists, but the main hub is incomplete.
- **8 new product capabilities to consider** — no complete main-hub implementation established; these require specifications, not just form fields.

These are groups of controls, not additional counts of defects or individual settings. Some overlap findings in AUDIT.md. Absence from the hub was inspected; absence from every possible application extension is not claimed.

## A. Existing settings to make discoverable in one place

| ID | Group to include | Evidence / present location | Proposed home and scope | Priority and acceptance |
|---|---|---|---|---|
| M01 | **Approvals and transaction governance** | Old `Pages/Settings/SettingsPanel.jsx` has the editor; ApprovalPolicyResolver consumes global/per-document/per-user policy and thresholds. Active main hub omits it. | Security & access → Approvals; store policy, restricted permission. | **P1.** Restore actual controls for supported document types, default employee mode, thresholds and owner separation. Display effective policy. Validate against engine keys rather than copying old names blindly. |
| M02 | **Personal account security and real 2FA setup** | Profile routes and `Auth/TwoFactorController.php`; main hub instead shows 2FA Coming Soon. | Security & access → My account; user scope. | **P1.** Reuse enrollment/challenge/recovery workflow. Do not represent personal enrollment as a store-wide enforcement policy. |
| M03 | **Appearance and accessibility preferences** | `Pages/Settings/Appearance.jsx`, AppearanceContext, header preferences, POS/document drawers. Main hub contains scale/senior/dark controls as well. | Appearance; explicit user, store-default and device scopes. | **P2.** One editor per underlying preference, clear inherited/default value. Avoid adding another font-size control before reconciling existing ones. |
| M04 | **Backup automation and retention** | `Pages/Admin/DataManagement.jsx`: local auto_backup, Google backup enablement and retention. Main hub only links out. | Data & advanced → Backups; store scope. | **P1 discoverability.** Show automation state, provider and retention alongside existing controls in a consistent shell. Reuse existing restore authorization. |
| M05 | **Growth Engine and loyalty configuration** | `Pages/GrowthEngine/Settings.jsx`: seven fields for analysis windows and loyalty earning/redemption. Hub only has a loyalty enable flag. | Customers → Loyalty; Insights → Analysis rules. | **P2.** Connect enablement to actual earning/redemption behavior, then share the real editor and explain when analysis updates. |
| M06 | **Provider configuration by purpose** | Main AI keys, store/global chatbot settings, SmartCapture settings and their controllers; FBR fields exist but feed a simulated service. | Integrations & AI → Assistant / extraction / customer chatbot / FBR; appropriate tenant/platform ownership. | **P1 clarity.** Show provider/key source, configured status and model per AI purpose, without disclosing secrets. FBR needs real readiness, sandbox/live distinction and acknowledgment status before being offered as operational. A connection test must test the same consumer. |
| M07 | **Sales-channel connections and online store** | VenSynQ Settings, WooSync per-connection settings, OnlineStoreController. Old WooCommerce credentials linger in the main form. | Integrations → Channels; per-store/per-connection scope. | **P2.** Reuse connected account, mapping and sync settings; remove duplicate credential entry paths. |
| M08 | **Roles, discount limits and financial period locks** | User management, V3 role discount-limit endpoint and fiscal-year/lock endpoints in routes/web.php. | Security → Roles/limits; Finance → Periods and locks. | **P1 discovery.** Link or embed actual managers with current authorization; no broad “disable checks” switch. |

## B. Controls supported in part but missing or incomplete in the hub

| ID | Missing control/group | Source evidence and gap | Required implementation contract | Priority / rough effort |
|---|---|---|---|---|
| M09 | **Default tax and pricing tax basis** | default_tax_rate is loaded into Admin/Settings but has no setData control there. NewPos reads it and tax_type, while the Taxes section edits only the list. | Choose a stable existing tax ID or explicit no-tax default; show inclusive/exclusive basis where supported. Preserve fixed-vs-percent type. Explain whether changes affect new documents only. Test exact amounts. | **P1**, 0.5–2 days depending on tax-model correction. |
| M10 | **Numbering and invoice field defaults** | sale_prefix, purchase_prefix, billing_type and print_payment_mode are in main state; not all have active editors. Purchase-prefix helper has no traced operational caller. | Expose only supported document display/numbering defaults. Separate display prefix from actual immutable number generation. Do not add a “reset sequence” control without collision/concurrency rules. | **P2**, 0.5–1 day to expose valid fields; numbering engine work extra. |
| M11 | **Printer selection, capability and routing** | AMDStation supports get/set default printer and printerName; KitchenPrintService accepts printerName; main print tab selects regular/thermal format, not the physical device. | Device-scoped named receipt printer, optional kitchen printer where module exists, connection/capability status, supported widths, drawer association. Store template and device hardware selection must remain distinct. | **P1**, 1–3 days plus actual device verification. |
| M12 | **Consistent print job defaults** | NewPos drawer has autoPrint/openDrawerOnCash; hub has thermal_open_drawer/thermal_copies; test handler reads print_copies but main form has no regular-copy field. | One effective auto-print rule; cash-only drawer policy; supported regular/thermal copy counts; preview of inherited setting. Test output must use chosen transport. Add regular copies only after implementing the live browser path. | **P1**, 1–2 days, overlaps printing audit fixes. |
| M13 | **Reachable invoice/PDF configuration** | B2B theme/color/margin controls exist beneath clipped print editor. Theme is passed but unused by PDF template. | Put invoice/PDF controls in their own reachable tab. Wire every supported selection before exposing it. Explain which documents use each preset. | **P1**, 0.5–2 days. |
| M14 | **Advanced reporting thresholds** | `app/Reckoner/ReckonerSettings.php` owns typed/default values such as heavy discount, dormancy, overstock, aging buckets and expiry warning. No corresponding settings UI reference found in the searched routes/frontend. | Optional Advanced → Reporting thresholds; show current default and why; use ReckonerSettings::set so its dedicated cache is invalidated. Limit range and permissions; changing definitions must not alter historical postings. | **P2**, 1–2 days with existing engine tests. |

## C. New capabilities worth specifying before adding fields

These are proposals based on the observed problems, not claims that the code already supports them. Each needs consumer behavior and tests alongside its editor.

| ID | Candidate capability | Why it is useful here | Scope, defaults and boundaries | Priority |
|---|---|---|---|---|
| M15 | **Effective-value and inheritance viewer** | Store settings and local POS/document preferences conflict today. Users cannot tell which value wins. | Show “Store default”, “My override”, “This device” and effective value. Policies cannot be weakened locally. Provide Reset to inherited value for presentation only. | **P1 architecture**, before adding overlapping controls. |
| M16 | **Settings change history and safe section reset** | Current generic save gives no settings-specific before/after trail or conflict visibility. | Record actor, time, scope and non-secret before/after values. Redact secrets. Reset only documented reversible defaults; security credentials and financial history are not reset by a generic button. | **P1 reliability**. |
| M17 | **Printer diagnostics and failure behavior** | Test Print bypasses Station; live buttons claim success too early; hardware can silently fall back. | Show selected path, last job status/error and reprint action. Offer an explicit fallback preference where supported, defaulting to a visible failure/choice rather than silent success. Avoid automatic duplicate receipt jobs. | **P1 printing**. |
| M18 | **Template assignment by document kind** | Receipts, invoice PDFs, kitchen dockets and other documents use different renderers with unclear ownership. | Assign supported templates to receipt/invoice/return/kitchen targets; keep kitchen price suppression invariant. Use module visibility and explain unsupported choices. | **P2** after output contracts are unified. |
| M19 | **Reminder recipient, timing and delivery status** | Main service reminders email the owner, while copy can suggest customer service notifications; summary descriptions also mismatch consumers. | Show recipient class and schedule/timezone; add recipient/schedule choices only with scheduler support. Surface last delivery/failure without exposing other tenants' details. | **P2**; fix descriptions first. |
| M20 | **Backup health and restore-verification visibility** | A backup-enabled toggle alone cannot demonstrate recoverability. Existing operations belong in the same center. | Read-only last successful backup, recent failure, destination and retention summary; separately authorized restore verification on disposable data. Do not imply a restore was tested if it was not. | **P1 operational visibility**. |
| M21 | **Safe settings export/import for another store or device** | Useful once consolidation removes scattered local preferences, but unsafe with today's arbitrary keys. | Versioned allowlisted non-secret template; explicit target scope; preview diff; exclude credentials, tenant IDs, history and unsupported policies. Permission-check every imported field. | **P3**, only after schema and scoping. |
| M22 | **Module-aware availability and searchable setting catalog** | Users encounter placeholders, duplicate paths and settings irrelevant to their enabled business modules. | Search by label and common aliases. State Available / Needs connection / Restricted / Not implemented with a real reason. Never offer a toggle whose consumer is absent. Keep a route for managers to discover disabled modules. | **P2**; part of the settings-center build. |

## What should not become another setting

- Double-entry balancing, tenant isolation, authorization enforcement and duplicate-post prevention are invariants, not preferences.
- A per-user drawer must not override store refund policy, financial period locks or role permissions.
- A “trust saved settings” option would not solve missing bindings or test coverage.
- More arbitrary font-size sliders would worsen the current inconsistency. Use existing appearance/density tokens and accessible presets.
- Do not add a second backup-retention, loyalty, theme, AI-key or WooCommerce form when an authoritative editor already exists.
- Do not offer auto-cut, cash drawer, silent printing or roll sizes without checking transport/device capabilities.
- Do not add legal/tax compliance promises based solely on a switch. Provider-specific integration requirements need their own verified specification.
- Avoid putting business entities such as every tax rate, warehouse, product attribute or role into one enormous scalar settings form; embed or link their actual managers under the common shell.

## Required specification for each addition

Before implementation, record:

1. User problem and exact observable behavior.
2. Existing authoritative owner, or justification for a new key.
3. Scope: platform, store, user, device or connection.
4. Default, inheritance and whether existing records are affected.
5. Valid values, bounds and dependencies.
6. Read and write permissions; secret handling if relevant.
7. Save endpoint, consumer and cache invalidation.
8. Failure behavior and unavailable/unsupported presentation.
9. Save/reload test and at least one behavioral test that would fail if the setting were ignored.
10. Migration/rollback approach and a single navigation/search entry.

## Recommended first additions

Prioritize **M01 approvals**, **M09 default tax**, **M11/M12 printer/device/job defaults**, and **M13 usable invoice/PDF controls**. Bring existing account security, appearance, backups, loyalty and integration editors into the same navigation next. Build M15 effective-value resolution and M16 change tracking as shared infrastructure so future settings do not repeat today's mistakes.

Treat **M06 FBR readiness** as an immediate trust issue: the current service returns simulated success and can cause sales to be marked reported. Adding credentials or a status badge alone will not repair it. The underlying request/acknowledgment workflow must be implemented and tested, or the feature must be clearly unavailable.

Do not implement all 22 groups merely because they are listed. A final product decision should approve genuinely new capabilities; the consolidation and confirmed missing bindings can be handled as correctness work. This document is the audit handoff, not an instruction to change the running application during this session.
