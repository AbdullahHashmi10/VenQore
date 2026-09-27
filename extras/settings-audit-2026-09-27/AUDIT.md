# Settings audit and IDE handoff

Date: 27 September 2026. Application inspected: `app-code/main-app`, including the user's signed-in local store at `http://127.0.0.1:8000/s/golden-co/settings`.

Additional communication-path audit: [WHATSAPP_FEASIBILITY.md](WHATSAPP_FEASIBILITY.md). It traces the sale share button, invoice reminders, scheduled email reminders, Vyapar's public workflow, and WhatsApp's current policy. It identifies success messages for simulated/unsent WhatsApp attempts and an `email` option that routes to SMS.

## Verdict

The settings experience is partially consolidated, but it is not yet a trustworthy single settings center. There are genuine implementations, disconnected controls, obsolete form fields, competing defaults, missing configuration screens, and significant printing inconsistencies. Fix the binding and policy problems alongside the layout; a visual redesign alone would conceal the same defects.

**Highest-priority discovery: FBR reporting is simulated.** The service returns fabricated success/receipt values with the real HTTP request commented out, and SaleController can mark the sale as reported. See S19. This is a code finding; no live reporting was attempted.

This was an audit only. No application source, tests, saved settings, business records, credentials, or printer configuration were changed. Only audit documents were created. Existing frontend tests were run. No printer jobs, destructive actions, test API calls, emails, or integration connections were triggered.

## What was counted

| Item | Result | Interpretation |
|---|---:|---|
| Current main settings sections | 16 | Confirmed in source and all 16 inspected in the signed-in browser |
| Main form initialized entries | 145 | Includes inactive entries and an upload field; not 145 working features |
| Additional keys written by composed controls | 6 | Two privacy flags, three print options, one printer-tab UI state |
| Main-form inventory total | 151 | Every entry is listed in FIELD_INVENTORY.md |
| Entries with consumer/reference evidence | 116 | Source trace exists; **not** a count of fully working settings |
| Entries with no operational consumer found | 15 | Some have helpers or billing references, but no traced implementation of their promise |
| Entries with confirmed binding/output defects | 10 | Five missing initializations, cutter option, B2B template selector and three FBR entries feeding a mock implementation |
| Inactive/legacy entries retained in main form | 8 | Four Stripe entries, three old WooCommerce credentials, old two-factor flag |
| Upload/UI-only entries | 2 | Logo file and printer subtab |
| Existing frontend tests executed | 123 passed, 0 failed | Five files; these do not certify the main form or printing |
| New implementation tests added | 0 | Audit-only request; required tests are specified below |

The five inventory categories sum to 151 and are mutually exclusive triage labels. A field can still have several defects: for example, a referenced print option may work in one theme and fail in another. Counts are deliberately not advertised as “119 working / 32 broken.” End-to-end working counts require save/reload/behavior tests on an isolated fixture, which were not performed on the user's store.

I could not substantiate “23 settings pages” as a current, unique count. The old `Settings/SettingsPanel.jsx` has six sections, while the active `Admin/Settings.jsx` has 16. Adding old and current files would double-count features. The main route already renders Admin/Settings, and old admin GET URLs redirect to it. Separate configuration surfaces still exist and are listed below.

## Scope and evidence limits

- Source review covered the active settings route/controller, all composed settings sections, settings helpers, selected behavioral consumers, printing renderer/service/hardware adapter, related configuration surfaces, and related tests.
- Browser review covered all 16 hub sections, business and print screenshots, fullscreen print, accessibility-tree output, and DOM geometry. Browser viewport changed during inspection: screenshots were observed at approximately 1054×612 and 1408×612.
- No settings were saved to prove persistence. No physical printer or Station device was paired. Printer conclusions are code findings, not claims of hardware certification.
- Backend tests were reviewed but not executed: `phpunit.xml` targets `amd_pos_test_current_0d33d5b0`, and the feature base uses RefreshDatabase and can invoke `migrate:fresh`. An audit-only run must not silently reset that database. The IDE should run them against a confirmed disposable test database.
- Secondary surfaces are mapped and their main persistence boundaries reviewed; their entire per-field behavior is not certified by this report. Platform administration, external providers, every device layout, and every role were not exercised live.
- The workspace already contained substantial uncommitted work. Findings refer to the inspected working tree, not a released build or a clean commit. Recheck line anchors when implementing.

## Existing consolidation and remaining surfaces

All paths in the tables below are relative to `app-code/main-app` unless stated otherwise.

| Surface | Current ownership / evidence | Consolidation action |
|---|---|---|
| Main store settings | `routes/web.php:486`; `Pages/Admin/Settings.jsx:31` | Canonical settings center |
| `/admin/settings` and legacy `/admin-panel/settings` | GET redirects at `routes/web.php:573,2141`; POST aliases remain | Preserve redirects and bookmarks; converge POST contract |
| Old normal settings panel | `Pages/Settings/SettingsPanel.jsx:35`; no active render reference found | Migrate approval controls before retiring the old component |
| Business Info | Main hub | Keep identity, region and cost policy here |
| Modules & Features | Hub is a link to System Builder | Embed a shared module-settings surface or present it within the same settings shell |
| Preferences | Main hub; separate appearance systems also exist | Merge discoverability and distinguish personal vs store defaults |
| Sales & Invoicing | Main hub; POS drawers also own overlapping behavior | Store policies must win over personal presentation preferences |
| Taxes | Main hub; New POS reparses these rates | One rate model including type and stable identity |
| Print & Templates | Main hub, plus three independent output families | One printing center with explicit output targets |
| Messages | Main hub, several controls disconnected | Mark unsupported functionality and connect real provider workflows |
| Party / loyalty | Main hub plus `Pages/GrowthEngine/Settings.jsx` | One loyalty section, one enable flag and configuration model |
| Item | Main hub plus module/attribute/product controls | Separate defaults from product-specific values; remove duplicate feature switches |
| Reminders | Main hub plus invoice reminders/recurring invoices | Explain owner service alerts vs customer invoice reminders |
| Accounting | Main hub currently only fiscal-year date | Link/embed fiscal periods and locks; remove misleading depreciation description |
| Security & SSO | Main hub; profile owns actual account security | Clearly separate personal login security and organization policy |
| Terminals | Embedded `Components/Settings/TerminalPairingSection.jsx` | Good consolidation pattern; independent action state, no generic Save |
| AI & Integrations | Main hub; AI/chatbot/SmartCapture have separate stores | Explicit provider/key ownership and purpose, avoid competing configuration |
| Backup & Data | Main hub links out to `Pages/Admin/DataManagement.jsx` | Shared shell with backup configuration and operations; no duplicate forms |
| Factory Reset | Main hub, dedicated reset controller | Restricted advanced operations; no generic Save button |
| Appearance page and header preferences | `routes/web.php:1239`; `Pages/Settings/Appearance.jsx`; AppearanceContext | One shared editor reachable from settings and contextual shortcut |
| Profile / personal security | `routes/web.php:2179`; `Pages/Profile/Edit.jsx`; `Auth/TwoFactorController.php` | Personal tab in settings center, same underlying editor |
| Chatbot / store chatbot | `routes/web.php:616,683`; `Pages/Settings/ChatbotSettings.jsx` | Reconcile settings controllers and overlapping `ai.test` route names |
| SmartCapture AI | `routes/web.php:501`; SmartCaptureController | Integrations → AI → document extraction; retain its purpose-specific model |
| Growth Engine settings | `routes/web.php:1589`; seven initialized tuning/loyalty fields | Insights and loyalty groups within center |
| VenSynQ / WooSync connections | `routes/web.php:1678,1901`; `Pages/VenSynQ/Settings.jsx` | Integrations → Channels; retain per-connection scope |
| POS / invoice / document drawers | `NewPos/SettingsDrawer.jsx`, `NewInvoice/SettingsDrawer.jsx`, `Documents/DocumentSettings.jsx` | Shared editors; local layout preferences stay contextual, policies link to store settings |
| Online store configuration | `routes/web.php:2261`; OnlineStoreController | Sales channels → Online store |
| Reckoner definitions/settings | `app/Reckoner/ReckonerSettings.php`, related tests | Advanced reporting configuration; retain distinct semantics |
| Platform-owner configuration | SuperAdminController/settings save route | Separate privileged scope within a consistent shell; never expose it to store users |

“One place” should mean one discoverable settings center and one owner per setting. It should not mean a single giant form or mixing platform secrets, store policy, personal preferences and device configuration in the same save operation.

## Findings requiring implementation

P1 = high priority correctness/security/trust problem. P2 = important functionality/usability gap. P3 = cleanup. Estimates are focused engineering time including targeted tests, assuming familiarity with this codebase; they are not commitments and overlapping work should not be summed blindly.

### Binding, permissions and persistence

| ID | Priority | Finding and evidence | Fix and acceptance | Estimate |
|---|---|---|---|---|
| S01 | P1 | **Privacy controls can misrepresent or overwrite saved consent.** `AiSettingsSection.jsx:196–224` reads form fields not initialized by Admin/Settings. Each immediate POST sends both flags, coercing the untouched undefined flag to false. General Save can then persist duplicate settings-table keys, while the dedicated endpoint writes Tenant columns. | Initialize from tenant booleans; separate privacy state; use one endpoint; change one flag without resetting the other; reload must show actual saved consent. Trace the AI accuracy opt-in to a real consumer or label its limits. | 0.5–1 day |
| S02 | P1 | **Read permission receives the full settings collection.** AdminController `settings():382` directly plucks all settings, including API credentials and passcode hash. GET permits settings_view OR settings_manage (`web.php:486`). Shared middleware sanitization is bypassed by this page-specific props object. | Return a public DTO; show “configured” status for secrets, blank replacement fields, separately authorized secret mutations. A view-only account must never receive secrets or a hash. | 1 day |
| S03 | P1 | **Active write route has almost no schema.** AdminController `updateSettings():408` validates the calculator flag and logo, then persists arbitrary request keys. The richer SettingsController validator is not the active update handler. Invalid enums, malformed tax/reminder JSON, arbitrary UI keys and invalid numeric limits can persist. Writes and tenant metadata changes are not atomic. | Typed allowlist per section, bounds/enums, nested array schemas, transaction and cache invalidation. Reject unknown keys. Use the same contract for all aliases. | 2–3 days |
| S04 | P1 | **Passcode challenge is inconsistent and client-only for settings saves.** Main submit opens a modal, but `saveSettings(code)` ignores code. Print Save and Save-and-switch call POST directly (`Admin/Settings.jsx:329–391`, `PrintSettingsSection.jsx:224`). Controller does not verify the challenge. Route permission still applies; this is not an anonymous access bypass. | Decide whether reauthentication is required; if yes enforce it server-side for every mutation path using a verified short-lived authorization. Never trust modal completion alone. | 1 day |
| S05 | P1 | **Approval configuration was lost during consolidation.** Old SettingsPanel contains approval flags, thresholds and policies; active Admin/Settings has no approvals section or fields. Backend approval gate and engine remain. | Move the real policy editor into Security → Approvals; preserve dedicated permission and owner behavior. Verify all policy keys against the engine before migration. | 1–2 days |
| S06 | P1 | **Enabled-looking SSO has no traced authentication implementation.** Four SSO fields are saved, but source search found them in settings forms/validation and no consuming SAML login/callback flow. | Hide or explicitly disable until implemented. Do not allow “enabled” to imply protected login. Full SAML work requires metadata, signatures, tenant binding and login tests. | 1–2 h to label; multiple days to implement |
| S07 | P2 | **Disconnected controls are mixed with working controls.** Inventory flags 15 entries with no operational consumer found, including Multi-Firm, Show Invoice Number, barcode enablement, SMS flags, WhatsApp configuration and SSO. Some are helper-only or billing-only references. | For each, connect the real business behavior, redirect to its authoritative owner, or remove/mark unavailable. Do not equate generic key persistence with implementation. | 1–2 h per label/removal; implementation varies |
| S08 | P2 | **Messaging actions are misleading.** Connect Account has no handler. Customize Template has no handler and no `type="button"`, so inside the form it submits settings instead of editing a template (`Admin/Settings.jsx:691,706`). | Implement or disable both; give every non-save action explicit button type. Verify clicking template customization makes no settings mutation. | 1–2 h for safe correction |
| S09 | P1 | **Fixed tax type is silently lost by New POS.** Tax settings offer percentage/fixed, but NewPos maps every entry to `{id: idx+1, label: ...%, rate}` and ignores `type` (`NewPos.jsx:154–172`). | Preserve type and stable tax ID end to end; either implement fixed taxes in calculation or prevent unsupported choices. Assert exact amounts in POS and invoices. | 1–2 days |
| S10 | P2 | **Every save posts the entire form, including hidden and legacy fields.** Defaults for unrelated sections may be written while editing one section, and concurrent editors can overwrite each other. Printer Save does not save just printing. | Section-specific PATCH/POST DTOs and dirty-key updates; optimistic version/conflict handling where appropriate. Hide generic Save on redirect/action-only sections. | 1–2 days |
| S11 | P2 | **Valid zero values can be replaced on reload.** `parseInt(settings.margin_*) || 20`, `thermal_extra_lines || 3`, `print_min_item_rows || 5` discard zero (`Admin/Settings.jsx:181–231`). Helper formatting also uses `parseInt(decimal_places) || 2`. | Nullish/NaN fallback, not truthiness. Save zero, reopen, then verify actual output remains zero. | 1–2 h plus tests |
| S12 | P1 | **Malformed saved lists can crash settings.** Unprotected JSON.parse for tax_rates and service_reminders (`Admin/Settings.jsx:319–323`), combined with generic backend writes. | Validate server-side, parse safely, surface recoverable error without silently overwriting malformed data. | 2–4 h |
| S13 | P2 | **Main save errors are not surfaced at the controls.** useForm omits errors; handlers show success but provide no section error summary or field feedback. Dirty protection handles sidebar section changes only. | Render errors, focus first invalid field, retain draft on failure; cover route departure/reload and action links. Confirm successful save resets the correct baseline. | 0.5–1 day |
| S14 | P2 | **Duplicate controls remain.** Negative-stock permission appears in Preferences and Sales; FBR toggle appears in Sales and AI/Integrations. Store appearance overlaps separate appearance/header editors. | One canonical control per policy; contextual links to that control; explicit scope and inherited value. | 1–2 h for duplicate removal |
| S15 | P1 | **Operational preferences can cross store boundaries.** NewPos and NewInvoice localStorage keys include user and device but not tenant (`NewPos/settings.js:204`, `NewInvoice/settings.js:133`). Stored ops include financial/return defaults, not just geometry. | Tenant-scope operational preferences; decide which purely visual preferences may be shared. Migration must not copy business policies between stores. | 0.5–1 day |
| S16 | P1 | **New POS policy source competes with the hub.** NewPos initializes prefs using loadPrefs(userId); totals use local roundOff, return UI uses local returnPolicy/windowDays. Central round_off_total and pos_return_* do not initialize those values (`NewPos.jsx:263,453,1633`). | Server-authoritative store policy resolution; local drawers may change presentation, not weaken policy. Test legacy POS, new POS, invoice editor and server consistently. | 1–2 days |
| S17 | P2 | **Reminder search is inert; delete can submit.** Search input has no state/filter handler; reminder delete button omits type inside the settings form (`Admin/Settings.jsx:877,945`). | Wire search; add accessible delete name and button type; deletion must remain a draft until intended Save. | 1–2 h |
| S18 | P2 | **Availability and descriptions conflict.** Hub says 2FA Coming Soon even though account TwoFactorController exists. Accounting advertises ledgers/depreciation but shows one date. Email Summaries says daily while its consumer is weekly; Daily Sales Report says push while the consumer sends email. | Reuse account security editor, distinguish store enforcement from personal setup, and align descriptions with actual consumers. | 2–4 h |
| S19 | P1 | **FBR integration simulates success and marks transactions reported.** `app/Services/FbrService.php:57–81` comments out the network request and returns generated invoice/QR values; `SaleController.php:668–672` accepts Code 100 and sets is_fbr_reported=true. Payload construction also uses example 17% item tax calculations. | Disable any production-ready claim until a real integration exists. Separate sandbox/live mode, validate provider credentials and payload from posted tax values, store actual acknowledgment, expose pending/failed/retry states and test with an HTTP fake that fails unless a real request is made. Existing “reported” records require a separately authorized reconciliation review; do not silently rewrite them. | 1–2 h to label/gate; integration and reconciliation require a separate estimate |

### Printing: output behavior

| ID | Priority | Finding and evidence | Fix and acceptance | Estimate |
|---|---|---|---|---|
| P01 | P1 | **Three print controls do not initialize from saved values:** print_qr_code, print_show_delivery_charge, print_show_extra_charge. They are set by PrintSettingsSection but absent from useForm. QR also lacks normalized boolean conversion in PrintService. | Include all schema fields in loading/serialization; test true/false, strings and missing defaults through save/reload. | 1–2 h |
| P02 | P1 | **Custom paper size does not produce valid physical page CSS.** Both test print and PrintService interpolate `size: Custom portrait` instead of explicit dimensions (`PrintSettingsSection.jsx:124`, `PrintService.jsx:73`). | Emit physical width/height in mm; apply orientation consistently for every named/custom size; verify PDF page dimensions. | 0.5–1 day |
| P03 | P2 | **Copy count differs by path.** Settings Test Print repeats markup; Station receives thermal_copies; normal browser PrintService._buildHtml emits previewHtml once. | Use one job model and consistent copy handling. Test 1/2/3 copies in test/live browser and adapter payload. | 0.5 day |
| P04 | P2 | **Extra top space affects preview but not print.** Screen marginTop adds print_extra_space_top; forPrint uses only data.margin_top (`PrintPreview.jsx:80,279`). | Share physical geometry calculation between preview and output. | 1–2 h |
| P05 | P2 | **Character width is a preview-only geometry change.** thermal_custom_chars changes screen width but forPrint forces 58/80/100mm. | Separate character count/font metrics from roll width; same wrapping in preview and output. | 0.5 day |
| P06 | P2 | **Thermal receipts always request 297mm page height.** PrintService has a measurement helper and documentation about exact content height but does not call it from printInvoice; Test Print also fixes 297mm. | Define roll/page behavior and implement it consistently; test very short and multi-page receipts. Exact physical waste/clipping still needs hardware verification. | 0.5–1 day |
| P07 | P1 | **Auto-cut has no wired command path.** thermal_auto_cut is normalized but not passed to AMDStation. 4-inch is offered by preview but Station mapping is only 58/80mm (`PrintService.jsx:131–139`). | Capability-aware adapter job schema for roll size and cut; disable unsupported options with an explanation. | 1–2 days |
| P08 | P1 | **Station output is not the preview.** _formatForStation emits a small fixed receipt structure, omitting many visual/column options; Test Print always uses browser PrintPreview. Its paidAmount uses `sale.paid || sale.amount_paid || sale.total`, so zero paid can be replaced by total. | Test through selected transport; map supported settings explicitly; use nullish values for amounts; verify unpaid/part-paid receipts against authoritative totals. | 1–2 days |
| P09 | P2 | **B2B template selector is a no-op.** InvoicePdfController reads invoice_theme and passes $theme, but `resources/views/v3/invoices/pdf.blade.php` never uses it. PDF is hard-coded A4 portrait. | Implement the selectable templates or remove selector; clearly distinguish output presets and apply supported page geometry. | 0.5–1 day |
| P10 | P1 | **Verification QR can encode a sample URL for real sales.** `PrintPreview.jsx:542` uses data.id, while data is settings and sale is a separate prop. No matching verification route was found in this app. | Use a real sale-bound signed verification URL and real endpoint, or remove “verification” claim. Verify QR decodes to the intended sale without disclosing unnecessary information. | 0.5–1 day, endpoint extra |
| P11 | P2 | **PDF color default is incompatible.** invoice_primary_color defaults to `rgb(var(--vq-indigo-600))`; browser color input showed black alongside that raw string. PDF uses this value without supplying the app variable. | Store validated portable hex/RGB; use the same normalized color in picker, preview and PDF. | 1–2 h |
| P12 | P2 | **Printed indicator reports invocation, not success.** PrintButton.handlePrint does not await printInvoice, sets lastPrinted immediately and calls onPrint immediately. quickPrint also does not await its final printInvoice call. AMDStation.print returns `{success:false}` on failure; PrintService's exception-only fallback can miss that failure result. | Model queued/opened/failed states; do not claim paper was printed from browser dialog invocation. Handle unsuccessful adapter results as well as exceptions and expose fallback. | 0.5 day |
| P13 | P2 | **Print output inherits app CSS and timing risks.** Test/live browser print collects all app styles, ignores unreadable sheets, and prints after fixed timers. Fullscreen preview visibly has weak white-on-pale column headings under the active theme. | Isolate print CSS/tokens; await images and fonts; use print lifecycle cleanup. Test light/dark/app themes independently of document branding. Contrast failure was visually observed; no numeric ratio certification was made. | 1 day |
| P14 | P2 | **Three output families do not share a settings contract.** Browser React renderer, `pdf.receipt` server template, and v3 B2B PDF support different subsets. Some thermal-named keys also control regular output. | Define a support matrix per output target; share normalization and job data; make unsupported fields explicit. Do not claim preview guarantees identical output across all paths. | 1–3 days |

### Layout, consistency and accessibility

| ID | Priority | Finding and evidence | Fix and acceptance | Estimate |
|---|---|---|---|---|
| U01 | P1 | **Print editor and B2B settings are clipped.** Outer form content has overflow-hidden; inner print editor has `h-[calc(100vh-12rem)]`; the B2B panel follows it. At measured 1408×612, visible content region was 346px high while print editor was 420px high, and its wrapper extended to y=1007 against container bottom y=588. | One height owner; flex/grid children with min-height:0 and defined scroll regions. Put B2B in a reachable tab. Nothing should require fullscreen to become accessible. | 0.5–1 day |
| U02 | P2 | **Header and sidebar consume working space.** `Admin/Settings.jsx:979,1092`: fixed 320px category rail, 40px header padding, 32px heading, large Save. Narrow screenshot header was approximately 218px on Print, plus print's own toolbar. | Compact token-based title row; search/category rail that collapses responsively; small-screen category selector; preserve touch targets and text zoom. | 0.5–1 day |
| U03 | P2 | **Competing type/control scales.** GeneralSettings uses another 32px hero and 18px toggle labels; generic Toggle uses 14px labels; printing uses tiny uppercase labels and smaller controls; multiple rounded cards, shadows and duplicate headings. | Shared SettingsSection/SettingRow/Field/SaveBar components backed by existing design tokens. One hierarchy, one control sizing policy. | 1–2 days |
| U04 | P2 | **Controls lack accessible names/states.** Generic Toggle renders an unlabeled button with no role=switch or aria-checked; General/Print implement their own versions. Browser tree showed unnamed buttons. Many labels are not associated with inputs. | Use shared semantic switch, label IDs, focus styling; named icon buttons; keyboard-operable sections and error announcements. | 1 day |
| U05 | P2 | **Fullscreen printing lacks modal semantics.** Portal changes body overflow, but no explicit dialog role, focus trap/restoration, or Escape handling is present; background content stays in the accessibility tree. | Prefer a full-page route or an accessible dialog with managed focus and inert background. | 0.5 day |
| U06 | P2 | **Navigation is incomplete.** No settings search, no clear scope badge, active section stored in a global localStorage key, hash is read initially but no hashchange listener is used. Long descriptions truncate while consuming vertical space. | Search by setting label/aliases, stable deep links, browser back/forward support and scope labels. Use concise category names. | 0.5–1 day |

The tables contain **39 implementation findings**: 19 settings/persistence, 14 printing and 6 layout/accessibility. They are issue groups, not the count of defective individual fields. Some are confirmed code defects; S07 is explicitly a consumer-search finding requiring final dynamic-path confirmation.

## Placeholder accounting

Confirmed visible placeholders/actions in the hub, counted as individual UI affordances:

1. Two-Factor Authentication “Coming Soon” (even though personal 2FA exists elsewhere).
2. Stripe “Upcoming”.
3. Custom Item Fields “Upcoming”.
4. Spanish disabled option.
5. French disabled option.
6. WhatsApp Connect Account button without handler.
7. Customize Template button without template behavior (also accidental submit).
8. Reminder search field without filtering behavior.

These **8 UI affordances** overlap the field/issue inventory and must not be added to it. SSO, SMS and other no-consumer fields are a separate category: they look configurable rather than being honestly marked as placeholders. Old unused component branches such as automatic local backup “Coming Soon” are not counted as visible hub placeholders.

Separately, the FBR service is a **confirmed mock backend**, despite being presented as a real integration. This is more serious than a visibly disabled placeholder and is counted in S19 and the defective-field classification.

## What is genuinely implemented in source

Examples with actual consumer chains, rather than just forms:

- Negative-stock control: SettingsHelper → SaleController/FifoService; JS helper → legacy POS/cart. New POS reconciliation is still required.
- Cost update policy: SettingsHelper → PurchaseService.
- Wholesale pricing: helper → API POS search and JS cart pricing.
- Store identity/currency/timezone: controller sync to Tenant, plus formatting/receipt consumers. Conflicting old store_* and business_* precedence needs migration checks.
- Payment/service reminders and summaries: real commands, mail classes and schedules exist. Scheduler/delivery were not exercised.
- Fiscal-year start: FiscalPeriodResolver reads it.
- Most regular/thermal formatting controls: PrintPreview and PrintService contain consumers. This does not prove theme/transport parity.
- Terminal pairing: dedicated routes, permissions and embedded component exist; browser displayed an empty paired-device state.
- Approval engine and dedicated authorization exist; the consolidated editor is missing.
- Personal 2FA exists outside the main settings placeholder.

Do not remove working engines because their control discovery is poor. Connect them to one accurate interface.

## Proposed single settings center

Use one Settings entry point with scope selector/badge: **This store / My preferences / This device**, plus **Platform** only for authorized platform operators. Never let the scope change silently.

Suggested navigation:

| Group | Contents |
|---|---|
| Business | Identity, region, modules, locations and business defaults |
| Sales & inventory | Checkout policy, returns, stock rules, pricing, taxes |
| Printing | Receipt/invoice templates, paper, fields, hardware, test output |
| Customers & communications | Party options, loyalty, messages, reminders |
| Finance | Fiscal periods, accounting preferences, document numbering |
| Security & access | Personal login security, store permissions, approvals, terminals |
| Integrations & AI | AI by purpose, SmartCapture, channels, FBR and provider connections |
| Appearance | Personal presentation, store defaults, device layout |
| Data & advanced | Backups, import/export, privacy and restricted reset actions |

Implement a shared registry describing key, scope, owner, type, default, validation, permission, availability, consumer and tests. It should drive navigation/search and the request schema. It must not become a second list competing with existing module/plan catalogs.

Keep old URLs as redirects to canonical section deep links. Contextual drawers can remain convenient shortcuts **to the same controls/components**, not independent business-policy stores. Store policies are server-authoritative; users may override only presentation fields explicitly allowed by the schema.

## Printing layout proposal

Use the current fullscreen arrangement as evidence that more room helps, but make the normal view usable:

```text
Settings / Printing               This store     Unsaved changes  Save
Receipt | Invoice/PDF | Hardware | Test output
┌───────────────────────┬──────────────────────────────────────────┐
│ Search print options  │ Preview         Fit page | 100% | Expand  │
│ Paper & layout        │                                          │
│ Branding              │             document canvas              │
│ Columns               │                                          │
│ Totals & footer       │                                          │
│ Advanced              │                                          │
└───────────────────────┴──────────────────────────────────────────┘
```

- One compact header; remove decorative “Section” badge and duplicate hero cards.
- On wide layouts, options and preview have independent, intentional scrolling. The parent owns remaining height; children use min-height:0.
- On narrow layouts, use Options / Preview tabs rather than squeezing both alongside a 320px navigation rail. Keep full-width controls reachable with keyboard and touch.
- Invoice/PDF customization gets its own reachable tab, not a section underneath a clipped fixed-height editor.
- Use existing typography, spacing and control tokens from the project's design system; preserve the layout-law 24px gutter where applicable. Map one title, one section heading, one field label and one help-text style. Do not solve density by shrinking all text.
- Use one Save action per actual transaction. If “Save printer settings” is shown, it must save only printing. Show scope and dirty/error states explicitly.
- Test output must identify **browser / Station**, **sample / real document**, selected roll/paper, and unsupported hardware options. It must use the same output path as real printing.
- Validate at 1366×768, 1440×900, 1920×1080, tablet and phone widths, 200% text zoom and senior mode. These are required follow-up checks, not completed checks in this audit.

## Tests: results and gaps

Executed without touching the database:

| File under resources/js/tests | Result |
|---|---|
| appearance.test.js | Passed |
| headerCalculator.test.jsx | Passed |
| Domain/invoiceSchema.test.js | Passed |
| Domain/posApproval.test.js | Passed |
| frontend.test.js | Passed |

First four files: 64 tests. frontend.test.js: 59 tests. Total: **123 passed**.

Reviewed backend coverage includes eight Module17/SettingsTest cases, two PrintLogoUploadTest methods, and broader approval/Reckoner/tenant tests. They establish that this is **not a zero-test area**. They do not establish complete settings coverage.

Specific test defects/gaps:

- `currency_symbol_setting_appears_in_sale_receipts` only asserts nonempty PDF content, not the configured symbol. A wrong receipt can pass.
- The global-settings isolation case constructs a correctly scoped model update itself; it does not prove the production settings HTTP route enforces that scope.
- Logo-upload tests call the controller directly, so they do not verify route authorization, middleware, or the whole upload UI.
- No direct dedicated test reference for PrintService, PrintPreview, or PrintSettingsSection was found in the searched PHP and frontend test roots. Admin/Settings has render smoke coverage, not interactions/save semantics.
- No tested main-form round-trip matrix was found for all keys, zero values, booleans, missing defaults, malformed lists, privacy flags, unsupported options or cross-section save isolation.
- No evidence from this run certifies physical printers, screenshot regressions, keyboard semantics, or role-by-role visibility.

### Required tests for the IDE

1. **Schema/data-provider contract tests:** for every editable key, save allowed values through HTTP, reload, assert normalized value and a real observable consumer effect. Include false, zero, blank, null, invalid type, invalid enum, unknown key and bound limits.
2. **Authorization matrix:** owner, settings manager, settings viewer, cashier, cross-tenant member and platform admin; read/write permissions separately. Assert no secrets/hashes in view-only responses; approval changes require their own permission.
3. **Privacy regressions:** initialize both existing true flags; change either; assert other unchanged; refresh confirms tenant values; failed autosave restores/displays error; general Save cannot write duplicate privacy settings.
4. **Save behavior:** saving print affects only print; unrelated fields untouched; concurrent edit conflict; failure keeps draft and shows errors; sidebar and route navigation protect drafts. Clicking Customize, delete, tabs and search must not submit.
5. **Policy precedence:** store policy wins in legacy POS, NewPos and document editor; switching stores on one device does not carry another store's return/tax/rounding defaults.
6. **Tax model:** fixed and percent rates, stable identifiers after reordering/deletion, zero rate, invalid rates and inclusive/exclusive modes; assert exact final amounts.
7. **Print normalization:** string/boolean true/false, zero margins, zero extra lines, QR disabled, delivery/extra charges false after reload; all supported fields included.
8. **Print renderer matrix:** each theme × regular/thermal; 58/80/100mm where supported, named/custom paper, portrait/landscape, long names, many lines, logo, non-Latin text, zero/partial/full payment, refunds, discounts, tax, previous balance and all selected columns. Assert values, not only nonempty HTML/PDF.
9. **Print transport contracts:** copies, cut, drawer, roll width and supported fields in Station payload; browser fallback/error state; Test Print same path; no false “printed” status.
10. **PDF assertions:** extracted text contains selected currency and correct totals; selected theme changes layout; page dimensions reflect supported configuration; QR decodes to correct sale URL.
11. **Layout/accessibility:** viewport matrix, zoom, keyboard-only, switch names/states, label association, error focus, B2B tab reachable, fullscreen Escape/focus restoration, no clipped controls.
12. **Navigation/availability:** every registered section reachable and searchable; redirects/deep links/back work; placeholders explicitly disabled; no orphan approval editor. Test expected controls per permission and enabled module.
13. **FBR truthfulness:** no acknowledgment means no reported flag; fake successful/failed/time-out responses; actual HTTP request asserted; posted tax values used; sandbox is visibly distinct. Never contact the real provider in automated regression tests.

## Prioritized implementation order

### Small fixes, usually 1–2 hours each

Eight identified fix groups can be started quickly (tests included where feasible): S08 messaging buttons, S11 zero fallback, S14 duplicate controls, S17 reminder search/button type, P01 print initialization, P04 top spacing, P11 portable color, and S06 honestly disabling/labeling SSO. The SSO estimate is only for truthful availability, not implementing SAML. Allow roughly 2–3 engineering days for this group including review and integration.

### Highest-risk fixes next

S19 simulated FBR reporting, S01 privacy, S02 secret exposure, S03 schema/atomic writes, S04 challenge enforcement, S05 approvals, S09 tax type, S15/S16 policy scoping, and P08/P10 output correctness. These should block calling settings “production-ready.” Coordinate them through the same schema to avoid separate one-off patches.

### Layout and printing consolidation

U01–U06 plus P02–P14 should be planned as a coherent printing/settings change. Initial usable shell and clipping fix: about 1–2 days. Full shared components, transport contracts and meaningful regression matrix: several additional days. Physical-printer time and external integration implementation are additional dependencies.

### Completion criteria

- One discoverable settings center; no lost approvals or competing policy editors.
- Every editable control has an identified scope, authorized save route, normalized read, actual consumer, and behavioral test.
- Unsupported features cannot look enabled or successfully configured.
- No secret/hash exposure through read-only settings responses.
- All fields round-trip correctly, including zero/false, without resetting unrelated values.
- Printing preview and real output have a documented, tested support contract for each transport; no inaccessible B2B controls.
- Existing tests pass, newly added regression tests catch the listed defects, and backend tests run only against a disposable fixture.

## IDE instruction

Use this audit and FIELD_INVENTORY.md as a checklist, not as permission to replace the architecture. Start with the privacy/permission/schema defects and the obvious broken bindings. Preserve the user's existing work, existing design-token and layout-law precedence, current routes through redirects, and real backend engines. Add failing behavioral regression tests before each material fix. Do not mark a field complete merely because it saves or has a helper. Report implemented finding IDs, test results, remaining runtime/hardware gaps, and the final per-field verified status.
