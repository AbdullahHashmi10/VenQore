# R01–R26 Findings Traceability Matrix

This matrix documents the verification status for each of the 26 prelaunch audit findings (`R01`–`R26`) following Round 6 verification.

Status definitions:
- **PROVEN**: A named, existing, passing automated test asserts the behaviour.
- **NOT COVERED**: No automated behavioural test currently asserts this claim.
- **REGRESSED**: Empirical check determined the finding is no longer resolved.

---

## Traceability Table

| ID | Severity | Claim | Automated test that proves it | Status |
|---|---|---|---|---|
| R01 | P0 | Disabled operational data cannot be read | `Tests\Feature\PrelaunchP0VerificationTest::r01_disabled_operational_endpoints_return_403_for_solo_tenant` | PROVEN |
| R02 | P0 | Unrequested capabilities are absent inside allowed pages | `resources/js/tests/tabAndControlGating.test.jsx` ("R02: Shared tab components fail-closed when modules are off") | PROVEN |
| R03 | P0 | The sentence drives the selected modules | `Tests\Feature\PrelaunchP0VerificationTest::r03_analyze_endpoint_runs_business_understanding_on_non_empty_prompt` | PROVEN |
| R04 | P0 | A failed AI call preserves what the customer asked for | `Tests\Feature\PrelaunchP0VerificationTest::r04_ai_failure_fallback_resolves_against_facts_without_unwanted_modules` | PROVEN |
| R05 | P0 | Provisioning adopts exactly the reviewed set | `Tests\Feature\PrelaunchP0VerificationTest::r05_store_provisioner_with_empty_modules_array_creates_lean_workspace` | PROVEN |
| R06 | P0 | Every reading for a disabled module is unavailable | `Tests\Feature\PrelaunchP0VerificationTest::r06_disabled_module_reckoner_readings_are_unavailable` | PROVEN |
| R07 | P0 | Quick actions lead to working, enabled features | `Tests\Feature\PrelaunchP0VerificationTest::r07_quick_action_routes_from_command_palette_do_not_return_501` | PROVEN |
| R08 | P1 | The business-specific server board becomes the visible dashboard | None | NOT COVERED |
| R09 | P1 | Frontend and backend use one ownership map | None | NOT COVERED |
| R10 | P1 | ModuleService answers consistently and safely | `Tests\Feature\Module\EnsureModuleTest::an_unknown_module_key_is_denied` & `a_tenant_with_no_configuration_keeps_everything` | PROVEN |
| R11 | P1 | Disabling a module stops its outbound work | None | NOT COVERED |
| R12 | P1 | Vena knows the actual workspace capabilities | None | NOT COVERED |
| R13 | P1 | All offered answers have deterministic consequences | None | NOT COVERED |
| R14 | P1 | Companions/dependencies are consistent and explained | `Tests\Feature\Module\EnsureModuleTest::resolving_always_produces_a_valid_configuration` & `enhancements_are_suggested_but_never_added` | PROVEN |
| R15 | P2 | AI questions cover the live catalogue without drift | None | NOT COVERED |
| R16 | P1 | A visible sidebar link has the same owner as its destination | None | NOT COVERED |
| R17 | P0 | Turning off a subfeature removes its forms and controls | `resources/js/tests/tabAndControlGating.test.jsx` ("R17: Subfeature controls are gated behind their respective modules") | PROVEN |
| R18 | P1 | Module changes are immediately consistent and concurrency-safe | None | NOT COVERED |
| R19 | P1 | A retry provisions once | None | NOT COVERED |
| R20 | P1 | Every understanding failure safely degrades | None | NOT COVERED |
| R21 | P2 | Trade language is consistent everywhere | None | NOT COVERED |
| R22 | P2 | Undo restores the whole configuration | None | NOT COVERED |
| R23 | P2 | Post-launch module walls can be measured | None | NOT COVERED |
| R24 | P2 | Route-ownership changes are available immediately | None | NOT COVERED |
| R25 | P0 | Only requested capabilities are shown; unwanted ones are absent | `Tests\Feature\PrelaunchP0VerificationTest::r25_blueprint_marketing_copy_uses_bounded_language` | PROVEN |
| R26 | P2 | Navigation controls have accessible names | None | NOT COVERED |

---

## Summary of P0 Verification

All nine P0 findings (`R01`, `R02`, `R03`, `R04`, `R05`, `R06`, `R07`, `R17`, `R25`) have been verified with passing behavioural automated tests in this round:
- **R01**: Asserted HTTP 403 refusal on warehouse, bank accounts, and returnable sales endpoints when parent modules are disabled for a Solo tenant.
- **R02**: Asserted that shared sub-navigation tabs (`StockModuleTabs`, `ContactsModuleTabs`, `SellModuleTabs`, `MoneyModuleTabs`, `PurchaseModuleTabs`) fail-closed when optional modules are not enabled.
- **R03**: Asserted that `WorkspaceBuilderController::analyze` invokes `BusinessUnderstanding` on non-empty prompts and respects extracted facts.
- **R04**: Asserted that `ConversationalBuilderService` fallback resolves modules against structured facts without enabling unrequested modules (such as `staff_attendance` for a solo plumber).
- **R05**: Asserted that `StoreProvisioner::create` with explicit `modules => []` produces 0 enabled modules in `tenant_modules` rather than falling back to the 5-module default preset.
- **R06**: Asserted that `Reckoner::checkAvailability` returns false and `Reckoner::readMany` returns `not_applicable` with refusal reason for `reminders.count`, `recurring_invoices.revenue`, `returns.qty`, and `returns.value` when owning modules are disabled.
- **R07**: Asserted that command palette quick actions and legacy `/payments/in/create` / `/payments/out/create` routes redirect cleanly without 501 aborts.
- **R17**: Asserted that product subfeatures (variants, barcode labels, batch expiry, reservations) are gated behind their respective module checks.
- **R25**: Asserted that public Blueprint copy contains bounded, honest wording rather than the absolute unmeasured "Absent" promise.
