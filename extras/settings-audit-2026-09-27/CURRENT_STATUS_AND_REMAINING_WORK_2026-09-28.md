# Settings: current status and remaining work

**Checked against current source on 28 September 2026.** This is the current handoff document. Earlier audit files contain a chronological trail and some superseded findings; use this document for the present verdict. The 178-key binding ledger is a static inventory, not a count of verified working settings.

## Verdict

**Not complete.** Client/server section maps, the charity save route, several numbering and print paths, and plain-language labels have source fixes. The 178 settings have **not** each been saved, reloaded, and checked against their promised business effect. No trustworthy working/broken/placeholder counts exist yet. JavaScript tests passing and a Vite build do not validate Laravel, Blade rendering, database persistence, or a signed-in browser flow.

## Confirmed remaining defects

| Priority | Finding in current source | Required fix and proof |
| --- | --- | --- |
| P1 | **Print precision still crosses the wrong boundaries.** The new `SettingsHelper::getPrintDecimals()` is used in most named Blade print views, but `resources/views/pdf/labels.blade.php:2` chooses `$settings['decimal_places']` first and can ignore `print_amount_decimal=0`. Conversely, `SettingsHelper::formatCurrency()` now calls `getPrintDecimals()` and is used in ordinary Admin/Report/Fund controller messages, so changing a print-only setting can change non-print amounts. | Make print precision explicit only in print renderers; keep ordinary `formatCurrency()` on global display precision. Remove the label view's bypass. Render each active output with global 2 and print 0/1; assert ordinary report and fund messages remain at global precision. |
| P1 | **Print-logo section restriction is still ineffective.** `AdminController::updateSettings()` moved the upload after section/passcode checks, but `DB::transaction(function() use ($settingsData, $tenant) { ... })` does not capture `$saveSection`. Inside it, `empty($saveSection)` evaluates true for the undefined variable, allowing `print_logo_file` on other valid sections. A file-only wrong-section request can also pass the earlier nonempty check. File storage inside a DB transaction is not undone if the transaction later rolls back. | Capture and validate `$saveSection` before the closure; require `document_layouts` for the upload, reject it on other sections, and clean up stored files on DB failure. Test valid section, another valid section, invalid section, wrong passcode, and rollback. |
| P2 | **The lifecycle test bypasses the settings save action.** Its tenant fixture now matches the final numeric-ID/slug schema, and it checks two-tenant reads, helper print precision, and receipt rendering. It still directly writes `Setting` rows and manually calls `Cache::forget()`, so it does not prove form submission, server normalization, automatic cache eviction, reload, or the promised business effect. PHP execution has not been shown. | Run this test in the disposable PHP/MariaDB environment. Add HTTP feature tests through `store.settings.update` for representative fields, including `charity_enabled`, `decimal_places`, booleans, zero, uploads, and permission/passcode failures. Verify stored values and a fresh request after save. Then execute the real downstream scenario. |

## Fixed in source, still requiring runtime evidence

- **Charity:** client/server maps place `charity_enabled` in Checkout & Returns and the layout reads it. In a test store, turn it on, save, reload, and confirm the button appears; turn it off and confirm it disappears.
- **Global decimal formatting:** the Sales dashboard uses the shared formatter and the layout injects saved precision. Verify amounts on dashboard, sales list, invoice, returns, ledger and reports at 0, 1, 2 and 4 decimals. Separate display precision from accounting calculation precision.
- **Invoice numbering and quantity safety:** PHP helper and named receipt/PDF views have source fixes. Render real documents with setting absent/`0`/`1`, and quantities `10`, `100`, and fractional values. The PHP unit and feature files exist but were not executed in this review.
- **Quotation prefix:** the V3 quotation create path uses `QUO` mapped to `quotation_prefix`. Create a quotation after changing the prefix and check its assigned number.
- **Service reminders:** a daily schedule entry now exists for the command that emails store owners. Verify due/not-due logic, recipient, delivery, and duplicate prevention in a test tenant; do not describe it as automated customer WhatsApp/SMS.
- **User experience:** the consolidated settings page and some copy changes exist. The requested signed-in review of header height, print editor room, font/button consistency, and readability has not been completed in the current browser session.

## Intentionally unavailable or not proved operational

Multi-firm accounting, SAML sign-in, custom domains, and Stripe are marked in development/upcoming. Do not count them as working. Manual WhatsApp sharing must remain user-initiated under the user's no-paid-SMS/no-WhatsApp-API decision. Other integrations and all 178 setting effects need their own evidence before status counts are published.

## Completion checklist for the IDE

1. Fix the two P1 defects above and run the PHP feature test. Report actual Laravel test output, not only file creation or Vite output.
2. Add HTTP save/reload tests and real downstream checks for each editable setting. In the 178-key ledger record: control, submitted value, normalized/stored value, value after a fresh reload, actual business effect, test tenant, and evidence. Mark unavailable controls separately.
3. Test printing through every active renderer at global precisions 0/1/2/4 and with printed decimals on/off; verify currency, totals, quantity, invoice numbering, and logo behavior.
4. Recheck the two user-reproduced failures in a signed-in test tenant: Charity button after reload; Sales dashboard amounts after setting global decimals to one.
5. Review the settings page visually at desktop and narrow widths, including the print editor; measure usable content area and align typography/control sizes. Then publish counts from the completed ledger, not from code-reference totals.

**Separate cheque-page note:** the remaining native selects in `ChequeBooks/Show.jsx` and `ChequeBooks/ReceivedCheques.jsx` have now been replaced with `PremiumSelect` in source; a current scan found no `<select>` in ChequeBooks pages. This is code fixed, browser unverified, and is separate from settings bindings.

## Latest repair report verification

The zero-decimal legacy JavaScript helper is corrected in source. I independently reran the full Vitest suite: **269/269 passed across 18 files**. The revised Laravel test uses numeric tenant IDs assigned by the database and a unique `slug`. The pasted IDE report states the Vite build succeeded, but its visible log shows only that a build was launched and then repeated quota errors while checking status; I did not independently rerun the build for this review. PHP/Laravel tests were not run here. The print helper and upload changes require the remaining fixes in the table above.
