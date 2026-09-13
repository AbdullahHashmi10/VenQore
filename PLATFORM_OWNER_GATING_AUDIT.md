# VenQore — Platform Owner Dashboard: Gating Audit

**Date:** 2026-09-13
**Scope:** `/VenQore` (Platform Owner) surfaces only — Plans matrix, Tenant Overrides, Access Grants, Coupons, Platforms, store feature flags.
**Purpose:** Bring the Platform Owner dashboard in line with the **current** (V11 "universal") gating model, remove dead controls, and make it possible for the owner to grant *anything* — limits, capabilities, add-ons — to any tenant.
**This document is instructions for the IDE. Do not guess: every finding lists the file, the evidence, the fix and the acceptance test.**

---

## 0. Ground truth (read before touching anything)

There are **three** competing definitions of "the plan matrix" in this repo. They disagree.

| # | Source | Keys | Status |
|---|--------|------|--------|
| 1 | `database/seeders/PlanFeatureMatrixSeeder.php` → `plan_limits` table | **227** | **CANONICAL at runtime** — `PlanRepository::getLimits()` reads the DB first |
| 2 | `config/plans.php` | **93** (solo block) | Fallback only, used when a slug was never seeded. Values contradict #1 |
| 3 | `resources/js/Pages/SuperAdmin/Plans/featureGroups.js` | **258** | What the owner sees and edits. Overlaps #1 by only 170 keys |

Resolution order — `PlanRepository::getEffectiveLimit()`:
`tenant_plan_overrides` → `plan_limits` table → `tenants.plan_limits` JSON → `config/plans.php` → **fail-closed `false`**

Canonical plan slugs: `trial, solo, starter, core, scale, custom, ltd_1, ltd_2, ltd_3` (legacy aliases `growth`→`core`, `business`→`scale`, `counter`→`solo` normalised in `PlanRepository::normalizePlanSlug()`).

**Rule for every fix below: the seeder + `plan_limits` table is the source of truth. The owner UI must be generated from it, never from a hand-maintained parallel list.**

---

## 1. WRONG — must fix

### F1 — The owner cannot assign the plans that actually exist :red_circle: BLOCKER
`app/Http/Controllers/SuperAdmin/TenantOverrideController.php:90`

```php
'plan' => 'sometimes|string|in:trial,starter,growth,business,ltd,ltd_1,ltd_2,ltd_3',
```

`resources/js/Pages/SuperAdmin/Tenants/OverrideDetail.jsx:174-182` — dropdown offers Trial / Starter / Growth / Business / LTD 1-3.

`solo`, `core`, `scale` and `custom` are missing from **both**. Three of the four live subscription tiers cannot be assigned from the dashboard; `growth` and `business` are dead legacy slugs.

**Fix:** derive the validation rule *and* the dropdown from `Plan::whereNull('archived_at')->orderBy('sort_order')->get(['slug','name'])`. No hardcoded slug list anywhere in the owner UI. Keep `growth`/`business` accepted by the validator (existing rows) but do not offer them.
**Accept:** owner moves a tenant to Solo, Core, Scale and Custom; the page reloads showing the new effective limits.

---

### F2 — 88 toggles in the Plans matrix are ghosts :red_circle: BLOCKER
`featureGroups.js` exposes 88 keys that **no plan is ever seeded with and no code reads**. `PlanGate` fails closed on unknown keys, so these toggles do nothing — except that saving them writes junk rows into `plan_limits`, which then leak into the tenant-override key list.

Full list: **Appendix A**. The bulk is reports: the UI has **40** `report_*` keys, the seeder has **22**, and the naming differs (`report_sales_summary` vs `report_sales_records`).

**Fix:** delete every Appendix A key from `featureGroups.js`, then a one-off cleanup:
```sql
DELETE FROM plan_limits WHERE `key` IN (/* Appendix A */);
```
**Accept:** every key rendered in the matrix exists in the seeder matrix; `plan_limits` holds no key outside the canonical set.

---

### F3 — 57 real, enforced keys are invisible to the owner :red_circle: BLOCKER
Seeded and enforced, but absent from `featureGroups.js` — including exactly the ones the owner wants to hand out:

`locations` / `location_limit`, `registers`, `devices_per_seat`, `till_logins`, `visible_history_days`, `ai_credits_monthly`, `ai_scans_monthly`, `service_jobs_per_month`, `api_webhooks`, `webhooks`, `audit_trail`, `custom_roles`, `serial_tracking`, `production`, `manufacturing`, `marketing_campaigns`, `fund_management`, `e_invoicing`, `recurring_invoices`, `invoice_reminders`, `amazon_sync`, `ebay_sync`, `tiktok_sync`, `consolidated_reporting`, `network_basic`, `network_unlimited`, `adviser_seat`, `google_drive_backup`, `services`, `service_jobs`, `service_contracts`, `work_orders`, plus all 22 canonical `report_*` keys.

Full list: **Appendix B**.

**Fix:** stop hand-maintaining the list. `PlanController::index()` returns the canonical key registry (distinct `plan_limits.key` ∪ seeder matrix); the page renders any key with no group entry into an **"Ungrouped / New"** section so a key can never go missing again. Then write proper groups and labels for these 57.
**Accept:** rendered key count == canonical key count; adding a key to the seeder makes it appear in the UI with zero JS edits.

---

### F4 — Reports are gated in three places that contradict each other :red_circle: BLOCKER
- `app/Services/ReportTierGate.php:13-16` **hardcodes `return 'scale'`** — every report is universal on every plan. This is current V11 behaviour and is deliberate.
- `config/plans.php` still marks all 23 `report_*` keys `false` on Solo and 13 of them `false` on Starter.
- The owner UI still shows 40 per-report toggles as though they gate something.

The owner can switch a report off, see "saved", and the tenant keeps full access. A silent lie in the control panel.

**Pick one, then make all three layers agree:**
- **(a) Reports stay universal — recommended, matches V11 §1.1:** delete the report group from `featureGroups.js`, delete `report_*` from `config/plans.php`, keep `config/report_tiers.php` as a catalogue only, and replace the UI group with one read-only line: *"All reports are included on every plan (V11 §1.1)."*
- **(b) Reports become gated again:** remove the hardcoded `return 'scale'`, restore real tier resolution from the tenant's plan, and cut the UI to the 22 canonical keys.

**Accept:** a report toggled off in the owner UI is genuinely inaccessible to that tenant — or the toggle does not exist. No third state.

---

### F5 — `config/plans.php` contradicts the seeder :orange_circle: HIGH
Examples: `security_activity_log` and `custom_roles` are `false` on Core/Scale in config but `1` in the seeder. `recurring_invoices` is `true` on Solo in config while the seeder ships `recurring_invoicing`. The config file is missing **134** keys the seeder writes (**Appendix C**), and has no `custom` or `trial` block at all.

Any tenant on an unseeded slug — fresh install, new custom plan, restore taken before the seeder runs — silently loses 134 features, one warning log per key.

**Fix:** make `config/plans.php` **generated**, not hand-written: add `php artisan venqore:dump-plan-matrix` that writes it from the seeder matrix, and assert equality in CI. Regenerate once now, including `custom` and `trial`.
**Accept:** CI diff of seeder-matrix vs `config/plans.php` is empty for every slug.

---

### F6 — `Tenant::getLimit()` falls back to a plan that doesn't exist :orange_circle: HIGH
`app/Models/Tenant.php:374`

```php
$configVal = config("plans.solo.{$key}", config("plans.business.{$key}"));
```

`plans.business` does not exist in `config/plans.php` (the slug is `scale`). The boolean-coercion fallback never fires for keys absent from the `solo` block, so those values come back as raw strings — and `'0'` is truthy in a loose check.

**Fix:** `config("plans.solo.{$key}", config("plans.scale.{$key}"))`, and coerce `'0'`/`'1'` explicitly regardless of the config lookup.
**Accept:** unit test — a key present only on Scale returns a real boolean for a Scale tenant.

---

### F7 — "Feature flags" on a store are a silent no-op :orange_circle: HIGH
`app/Http/Controllers/Admin/SupportController.php:104-134`, route `platform.store.feature-flag`, writes to `tenants.plan_limits` JSON.

That column is **priority 3** in the resolution chain — *below* the `plan_limits` table. Every canonical key is now seeded into that table, so the JSON is never consulted: turning a flag on there changes nothing. It also whitelists `advanced_reports` and `api_access`, neither of which is canonical (`api_webhooks` is), and it never calls `PlanRepository::invalidateTenantCache()`.

**Fix:** delete the endpoint and its route. Per-tenant grants go through `TenantPlanOverride` (`platform.tenants.overrides.apply`) — the only path with priority, audit trail, expiry and notification. Repoint any caller.
**Accept:** grep shows no caller; route gone; the same grant made via overrides visibly changes the tenant's effective limit.

---

### F8 — There is no add-on concept anywhere :orange_circle: HIGH — *this is the "give someone an add-on" gap*
`config/pricing.php:142-233` defines 12 add-ons: `extra_location`, `extra_seat`, `extra_register`, `extra_catalogue`, `channel_sync`, `api_webhooks`, `audit_roles`, `white_label`, `ai_topup`, `ai_rebuilds`, `byok`, `setup_migration`.

There is **no `Addon` model, no `tenant_addons` table, no owner UI, and no mapping from an add-on to the keys it unlocks.** The only way to grant one today is for the owner to know that "Audit Roles" secretly means `audit_trail` + `custom_roles` + `security_activity_log`, and to type each key by hand into the override form.

**Fix (no new table needed) — add `config/addon_entitlements.php`:**
```php
return [
    'audit_roles'     => ['audit_trail' => '1', 'custom_roles' => '1', 'security_activity_log' => '1'],
    'api_webhooks'    => ['api_webhooks' => '1', 'webhooks' => '1'],
    'white_label'     => ['white_label' => '1'],
    'channel_sync'    => ['woocommerce' => '1', 'amazon_sync' => '1', 'ebay_sync' => '1', 'tiktok_sync' => '1'],
    'byok'            => ['hypersearch_byok' => '1'],
    // quantity add-ons: '+key' => increment applied to the current effective value
    'extra_location'  => ['+locations' => 1, '+location_limit' => 1],
    'extra_seat'      => ['+staff_limit' => 1],
    'extra_register'  => ['+registers' => 1],
    'extra_catalogue' => ['+sku_limit' => 50000],
    'ai_topup'        => ['+ai_credits_monthly' => 1000],
];
```
Then add a **"Grant add-on"** panel to `Tenants/OverrideDetail.jsx`: pick add-on → quantity → optional expiry → optional reason. It writes the matching `TenantPlanOverride` rows in one transaction (quantity add-ons resolve the current effective value and add `n × step`), each tagged `reason = "add-on: <slug> x<qty>"` so the set can be revoked as a unit. Respect `purchasable_on` / `included_on` from `config/pricing.php` — warn, don't block, when the owner grants something already included.
**Accept:** grant "2 × Extra Location" to a Core tenant → effective `locations` becomes 5 → the tenant can create a 4th and 5th branch; revoking the add-on removes both rows and the branches go back over-limit into the normal grace path.

---

### F9 — `bulkUpdate` corrupts `reset_period` :yellow_circle: MEDIUM
`app/Http/Controllers/SuperAdmin/PlanController.php:109` — only `transactions_per_month` gets `'monthly'`. Editing `ai_credits_monthly` or `service_jobs_per_month` through the matrix rewrites their `reset_period` to `'never'` and the monthly reset stops.
**Fix:** one shared helper with the seeder: `in_array($key, ['transactions_per_month','service_jobs_per_month','ai_credits_monthly'], true) ? 'monthly' : 'never'`.
**Accept:** editing AI credits in the matrix leaves `reset_period = monthly`.

---

### F10 — `bulkUpdate` accepts any key and never validates :yellow_circle: MEDIUM
Same method: `'changes.*' => 'array'` and nothing more. A typo or a stale UI key creates a permanent junk row in `plan_limits` — this is how F2 perpetuates itself. It also skips the `PlanPricingService::flush()` that `update()` performs.
**Fix:** validate every key against the canonical registry, reject unknown keys with 422, flush the pricing cache.
**Accept:** posting an unknown key returns 422 and writes nothing.

---

### F11 — Override delete is not scoped to the tenant :yellow_circle: MEDIUM (security)
`routes/web.php:812` + `TenantOverrideController::remove()` — `{override}` resolves by implicit binding with no check that it belongs to `{tenant}`. One tenant's URL can delete another tenant's override row.
**Fix:** `abort_unless($override->tenant_id === $tenant->id, 404);` or `->scopeBindings()` on the route group.

---

### F12 — Override key entry is free text :yellow_circle: MEDIUM
`apply()` validates `override_key` as `string|max:100` only. `available_keys` is already passed to the page (`TenantOverrideController.php:79`), but a typo still saves a dead override that does nothing and looks applied.
**Fix:** `Rule::in($canonicalKeys)` server-side; make the field a searchable select showing each key's plan default and type (boolean / number / unlimited).

---

### F13 — `available_keys` is derived from the tenant's own plan :yellow_circle: MEDIUM
`TenantOverrideController::show()` builds `$effectiveLimits` and `available_keys` from `PlanRepository::getLimits($planSlug)`. A key the tenant's plan isn't seeded with cannot be granted — which is precisely the "give this one Solo customer multi-branch" case.
**Fix:** build from the **union of all canonical keys**, showing the tenant's plan default (or "not in plan") beside each.
**Accept:** owner grants `multi_branch` to a Solo tenant without changing their plan.

---

### F14 — Gift links can't grant Custom / enterprise plans :green_circle: LOW
`AccessGrantController::index()` filters `is_ltd = false` **and** `type = 'subscription'`, which also excludes the `custom` plan and anything typed `enterprise`.
**Fix:** keep excluding `trial`; allow `custom` and `enterprise`. Leave LTD excluded unless gifted LTD is wanted.

---

### F15 — LTD tier detection guesses from numbers :green_circle: LOW
`app/Models/Tenant.php:431-467` — `effectivePlan()` infers the LTD tier from `sku_limit` / `ai_credits_annual` / `transactions_per_month`. An owner override of `sku_limit` on an LTD tenant can silently reclassify them into a different tier and change every other entitlement.
**Fix:** always rely on `plan_limits['ltd_tier']` (already written by `setPlanAttribute`); make numeric inference a logged last resort, and warn in the override UI when overriding `sku_limit` on an LTD tenant.

---

### F16 — "Set all" writes infrastructure keys :green_circle: LOW
`resources/js/Pages/SuperAdmin/Plans/Index.jsx` — `handleBulkSet` stages every boolean in the filtered groups, including `multitenant_isolation`, `redis_plan_gates`, `subscription_enforcement`, `three_zone_security`. Those aren't commercial gates; one stray "all off" writes 0 to them.
**Fix:** mark infrastructure keys `type: 'system'`, render read-only, exclude from bulk actions. (Most are in Appendix A and disappear anyway.)

---

## 2. CORRECT — leave alone

- **Resolution order** (`PlanRepository::getEffectiveLimit`): override → plan_limits → tenant JSON → config → fail closed. Correct, and cached with sane TTLs.
- **Fail-closed on unknown keys** in `PlanGate::check()` with a warning log. Right posture.
- **Platform-admin bypass** (`PlanGate::isPlatformContext()`) — owner and platform staff are never gated.
- **The override model itself**: expiry, `original_value` / `applied_by` / `reason` audit, `PlanChangeNotifier`, cache invalidation on apply and remove. This is the right mechanism — everything per-tenant should route through it (see F7).
- **Plan CRUD safety**: `destroy()` blocks deletion while tenants are on the plan; `duplicate()` starts inactive; archive/unarchive; `invalidatePlanCache()` + `PlanPricingService::flush()` on every write.
- **Authorization**: `SuperAdminMiddleware` + `NoIndexMiddleware` on the whole `/VenQore` group, plus `isPlatformSuperAdmin()` on every mutating plan action.
- **Access Grants**: token generation, max redemptions, expiry, revoke-vs-delete with redemption history preserved. Complete.
- **Coupons**: plan restrictions, per-user caps, validity window, public validation endpoint. Complete.
- **LTD fences in the seeder** (`api_access`, `webhooks`, `white_label`, `audit_trail`, `custom_roles`, `consolidated_reporting`, `network_unlimited` forced to `0` on every LTD tier) — matches the abuse-prevention rule in `docs/PRICING.md`. Keep, and warn if the matrix UI tries to override it.
- **Plan slug normalisation** (`growth`→`core`, `business`→`scale`, `counter`→`solo`).
- **Tenant profile editing** (status, trial / subscription end dates, timezone, currency, industry) on the override page — correct apart from the plan list (F1).

## 3. PARTIALLY correct

- `config/report_tiers.php` is a good catalogue, but `ReportTierGate` ignores it completely (F4). Keep it as a catalogue; stop describing it as a tier gate.
- `tenants.feature_variants / feature_serials / feature_batches / feature_manufacturing` on the override page do work — but they are a **fourth** entitlement channel running parallel to `product_variants` / `serial_tracking` / `batch_tracking` / `manufacturing` in `plan_limits`. Decide which wins and delete the other; today the owner can enable a feature in one place and have it denied by the other.
- `PlanController::index()` is readable by any platform staff (the middleware exempts `index`) while everything else needs super-admin. Looks intentional, but the matrix exposes the entire pricing strategy — confirm that is wanted.

---

## 4. Fix order

1. **F5 + F6** — make the fallback truthful first; everything else reads through it.
2. **F1** — dynamic plan list; unblocks day-to-day owner work immediately.
3. **F4** — decide the report policy, then make all three layers agree.
4. **F2 + F3 + F10** — regenerate the matrix UI from the canonical registry, delete ghosts, clean the DB.
5. **F13 + F12 + F11 + F9** — harden the override panel.
6. **F8** — add-on grant panel.
7. **F7** — delete the dead feature-flag endpoint.
8. **F14 / F15 / F16** — polish.

**Global acceptance test — run at the end.**
Create a throwaway tenant on **Solo**. Using only `/VenQore`: move it to **Core**; grant **multi_branch**; grant **2 × Extra Location**; grant the **Audit Roles** add-on; set **ai_credits_monthly = 9999** with a 30-day expiry; then move it to **Custom**. After each step, log in as that tenant and confirm the capability is really there. Then revoke everything and confirm each capability disappears. No step may require SQL, tinker, or a code change.

---

## Appendix A — Ghost keys in the owner UI (not seeded, not enforced) — 88

- `agent_referral`
- `ai_bot_handoff`
- `ai_churn_predictions`
- `ai_copilot_suggestions`
- `ai_outreach_copy`
- `ai_outreach_limit`
- `ai_queries_limit`
- `ai_revenue_forecasting`
- `auto_assembly_recipes`
- `balanced_reversals`
- `barcode_pattern_recognition`
- `bulk_tracking_sync`
- `canned_responses`
- `cashier_inactivity_logout`
- `commission_isolation`
- `custom_tax_rates`
- `customer_credit_limits_cfg`
- `customer_insights`
- `demo_sandbox_cloner`
- `double_entry_account_maps`
- `dropshipping`
- `email_support`
- `hard_lock_negative_stock`
- `imei_lifecycle`
- `immutable_db_locks`
- `industry_templates_count`
- `invitation_codes`
- `jit_procurement`
- `limit_override_manager`
- `low_stock_threshold_cfg`
- `marketplace_oauth`
- `module_toggles`
- `multi_currency`
- `multichannel_expense_alloc`
- `multitenant_isolation`
- `passcode_security_controls`
- `passive_learning_engine`
- `payables_grid`
- `phone_support`
- `point_in_time_inventory`
- `priority_support`
- `redis_plan_gates`
- `report_account_ledger`
- `report_all_parties_credit`
- `report_bank_statements`
- `report_bill_profitability`
- `report_category_pl`
- `report_daily_sales_trend`
- `report_expense_by_category`
- `report_expense_by_item`
- `report_expenses_directory`
- `report_expiring_soon`
- `report_general_discount`
- `report_graph_analytics`
- `report_item_by_party`
- `report_item_discounting`
- `report_item_profit`
- `report_loan_statement`
- `report_low_stock`
- `report_party_by_item`
- `report_party_profitability`
- `report_party_statement`
- `report_purchases`
- `report_sales_aging`
- `report_sales_by_category`
- `report_sales_by_party`
- `report_sales_order_items`
- `report_sales_orders_status`
- `report_sales_party_group`
- `report_sales_summary`
- `report_stock_aging`
- `report_stock_by_category`
- `report_stock_movement`
- `report_tax_compliance`
- `report_tax_rate_breakdown`
- `report_transactions_history`
- `report_trial_balance`
- `sandbox_expiration`
- `sandbox_time_shift`
- `smart_capture_limit`
- `sms_debt_alerts`
- `soft_delete_trash`
- `stock_reservation_rules`
- `subscription_enforcement`
- `superadmin_command_center`
- `supplier_insights`
- `three_zone_security`
- `white_glove_onboarding`

## Appendix B — Canonical keys missing from the owner UI — 57

- `adviser_seat`
- `ai_credits_monthly`
- `ai_scans_monthly`
- `ai_system_builder`
- `amazon_sync`
- `api_webhooks`
- `audit_trail`
- `bulk_upload`
- `consolidated_reporting`
- `custom_roles`
- `devices_per_seat`
- `e_invoicing`
- `ebay_sync`
- `fund_management`
- `google_drive_backup`
- `growth_signals`
- `invoice_reminders`
- `jewelry_metal_rates`
- `location_limit`
- `ltd`
- `manufacturing`
- `marketing_campaigns`
- `network_basic`
- `network_unlimited`
- `optical_prescription`
- `pos`
- `production`
- `recurring_invoices`
- `registers`
- `report_aging`
- `report_cross_party`
- `report_discounts`
- `report_expense_analysis`
- `report_expenses`
- `report_export`
- `report_ledger`
- `report_loans`
- `report_party_insights`
- `report_party_records`
- `report_point_in_time`
- `report_profitability`
- `report_purchase_records`
- `report_sales_analytics`
- `report_sales_records`
- `report_stock_records`
- `report_tax`
- `serial_tracking`
- `service_contracts`
- `service_jobs`
- `service_jobs_per_month`
- `services`
- `tailor_measurements`
- `tiktok_sync`
- `till_logins`
- `visible_history_days`
- `webhooks`
- `work_orders`

## Appendix C — Seeded keys missing from the `config/plans.php` fallback — 134

- `a4_invoice_pdf`
- `advance_allocation`
- `adviser_seat`
- `aged_payables`
- `aged_receivables`
- `amazon_sync`
- `amount_to_words`
- `anniversary_tracker`
- `api_webhooks`
- `audit_trail`
- `auto_assembly_checkout`
- `auto_assembly_logic`
- `auto_cash_rounding`
- `auto_cost_adjuster`
- `auto_customer_discounts`
- `auto_po_generation`
- `auto_vat_gst`
- `b2b_invoice_designer`
- `b2b_margin_displayer`
- `barcode_label_factory`
- `branded_receipt_sync`
- `bulk_supplier_payments`
- `cart_session_protection`
- `cart_tabs_limit`
- `cash_account_reconciliation`
- `cashier_change_helper`
- `cashier_pin_login`
- `category_management`
- `charity_engine`
- `consolidated_reporting`
- `contextual_qty_modifiers`
- `cost_price_fluctuator`
- `coupon_stacking`
- `credit_limit_rules`
- `custom_charge_toggle`
- `custom_payment_terms`
- `custom_thermal_widths`
- `customer_address_book`
- `customer_ltv_score`
- `customer_payment_alloc`
- `customer_payments_log`
- `customer_wallet`
- `dark_theme`
- `delayed_supplier_payments`
- `demo_store`
- `device_adaptive`
- `disaster_claim`
- `dynamic_accent_colors`
- `ebay_sync`
- `fifo_costing`
- `free_trial_days`
- `fuzzy_customer_lookup`
- `fuzzy_product_finder`
- `google_drive_backup`
- `growth_signals`
- `guided_setup_tour`
- `high_contrast_colors`
- `inbound_expiry_tracking`
- `industry_seeding`
- `inflight_product_creation`
- `inflight_session_recovery`
- `installment_payments`
- `instant_store_creator`
- `inter_register_transfers`
- `invoice_column_toggles`
- `jewelry_metal_rates`
- `label_qr_codes`
- `landing_costs`
- `letter_size_invoice`
- `light_theme`
- `loan_ledger`
- `low_stock_alerts`
- `ltd`
- `lump_sum_payments`
- `manufacturing`
- `multi_payment_invoices`
- `multi_store_hub`
- `multi_store_roles`
- `negative_stock_lock`
- `network_basic`
- `network_unlimited`
- `one_click_system_wipe`
- `optical_prescription`
- `overdue_highlights`
- `owner_profile_card`
- `partial_payment_indicator`
- `partial_shipments`
- `payment_due_dates`
- `petty_cash`
- `platform_status_badge`
- `pos`
- `pos_negative_stock_alert`
- `product_history_timeline`
- `product_variants`
- `production_simulator`
- `purchase_pdf_upload`
- `pwa_install`
- `quotation_conversion`
- `receipt_cutline_padding`
- `receipt_qr_code`
- `recent_invoices_panel`
- `recipe_history_archival`
- `reconciled_bank_payments`
- `refund_reason_analysis`
- `sales_return_vouchers`
- `service_contracts`
- `service_fee_additions`
- `service_jobs`
- `service_jobs_per_month`
- `services`
- `silent_webusb_printing`
- `sms_gateway`
- `smtp_mail`
- `stock_levels_view`
- `stock_take_audit`
- `stock_transfer`
- `supplier_debit_notes`
- `supplier_lead_time`
- `supplier_outstanding_alerts`
- `supplier_refund_tracker`
- `supplier_sku_mapping`
- `system_cache_refresher`
- `tailor_measurements`
- `tax_exempt_customers`
- `tax_inclusive_exclusive`
- `tax_inclusive_procurement`
- `tax_summary_engine`
- `tiktok_sync`
- `uom_converter`
- `web_catalog_toggles`
- `webhooks`
- `woocommerce_customer_reg`
- `woocommerce_orders_bridge`
- `woocommerce_stock_sync`
