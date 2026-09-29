# IDE brief: prove and repair every settings binding

The user has reproduced two failures: switching on Charity did not stick after save/reload, and setting global decimal places to 1 left Sales screens showing two decimals. Treat these as examples of a systemic settings problem. Do **not** report “all settings fixed” from a green build or a save toast. The primary settings page currently has 178 keys in its section save contract; the companion [binding ledger](SETTING_BINDING_AUDIT_2026-09-27.md) lists every key and preliminary source references, and [decimal candidates](DECIMAL_FORMATTING_CANDIDATES.md) lists frontend fixed-two-decimal code sites.

## What has already been changed in this working tree

- The frontend and server per-section save maps have been aligned. Charity is now owned by Checkout & Returns, where its switch is displayed. An unrecognized section returns an error instead of silently saving nothing.
- The shared currency formatter now combines store identity with saved global precision, and print-only decimal format no longer overrides ordinary screen values. Layout initialization preserves a zero-decimal choice.
- The product-cost policy validator now accepts the options offered by the screen and implemented by the purchase engine.
- The print editor no longer offers an unsaved second business-name input or treats a print sub-tab change as an unsaved store setting.
- Prominent settings headings and explanations have been rewritten in plainer language. A misleading one-decimal rounding choice was removed because the stored value currently means whole-number rounding.
- A regression test checks client/server section contracts, visible direct controls, nested tax/print/AI editors, and currency precision. The JS suite passes all 267 tests, and the final production build passes.

These are source changes, **not** a verified database-backed or browser pass. PHP is unavailable in the current environment. The IDE must run Laravel tests and live scenarios in an environment with PHP and a disposable test tenant.

## Required work, in order

1. **Establish truthful results for all 178 keys.** For each ledger row, identify the rendered control, submitted payload, server allowlist/normalization, stored value after reload, and real consumer. Mark one of: verified working, save failure, behavior failure, unavailable integration, placeholder, or needs manual evidence. Attach a concrete before/after scenario; source references alone are insufficient. Include special upload, dynamic approval, user-level and device-level settings.
2. **Fix persistence first.** Run save/reload tests for every editable section, including navigation with unsaved changes, passcode-protected save, permissions, default values, booleans, zero, empty values, and file upload. Test both the main Save button and print-specific Save button. Make the success notice conditional on at least one requested supported field being accepted and persisted.
3. **Fix decimal presentation by domain.** Classify each fixed-two-decimal candidate as money display, calculation/storage precision, quantity, percentage, file size, styling, or external fixed currency. Use one shared, tenant-aware money formatter for customer-facing money on dashboards, sales, purchases, returns, accounts, reports, PDFs and print previews. Do not globally replace calculation rounding. Test 0, 1, 2 and 4 decimals on the user's Sales dashboard screenshot locations and across each module. Explain the difference between global screen decimals, printed-amount override, and final-bill rounding in the UI.
4. **Investigate likely disconnected controls.** `invoice_number_enabled`, `quotation_prefix`, `return_prefix`, `multi_firm_enabled` have no exact-key business consumer outside settings editors in the first source pass. Trace actual document generation and business switching. Either implement the promised effect with tests or remove/disable the control with honest copy. `stripe_enabled` is not an active connection. SSO configuration is explicitly incomplete on screen; do not present it as an active protection.
5. **Repair reminders and side effects.** The service reminder command is not scheduled and emails the store owner, while the previous wording promised customer follow-ups. Decide the intended product behavior before enabling automated delivery. Verify the scheduled daily sales, weekly summary, low-stock and payment reminder commands against each switch and recipient. Keep the user's no-paid-SMS/no-WhatsApp-API decision: WhatsApp sharing is a manual draft, never an automatic send.
6. **Finish the plain-language pass.** For every visible label, description, empty state, confirmation and error: state what changes, where users will see it, and when it takes effect. Expand or remove unexplained POS, FBR, SSO, SAML, IdP, B2B, FQDN, ESC/POS, NTN and similar abbreviations. Put technical IDs in an optional advanced explanation only where customers must enter them. Do not imply a placeholder works. Keep one editable home per key and consistently sized controls.

## Definition of done

- The binding ledger has a verified status and evidence for every key. The final counts of working, broken, placeholder, and unavailable features come from those results, not a text search.
- A setting changed in a test store survives reload and changes its promised downstream behavior. A setting that cannot deliver its promise is disabled or clearly marked unavailable.
- The two user examples have recorded proof: Charity stays on and its sales-screen button appears; global decimal places set to 1 show one decimal on Sales dashboard amounts after reload.
- Frontend tests, Laravel tests, build, and a manual browser smoke test pass. The browser pass covers ordinary admin, restricted staff, print preview, a narrow screen, and at least one existing store with non-default settings.
- The final report lists any exceptions honestly. Do not replace “unverified” with “working.”
