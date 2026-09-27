# Header Calculator Implementation & Multi-Tenant Verification Document

## Overview & Behavior
The Header Calculator is a general-purpose, store-wide utility calculator embedded directly into the main application header (`OneGlanceLayout.jsx`). It allows staff across all roles to perform quick calculations without leaving their current workflow or opening external tools.

### Key Rules & Constraints
- **Tenant Scope**: Controlled by store setting `header_calculator_enabled` (`'0'` or `'1'`). Default is `'0'` (off) for existing and newly created stores so headers do not change unexpectedly.
- **Role Access**: When enabled by an authorized administrator (`admin.settings_manage`), **all** store user roles (owner, admin, manager, cashier, accountant, purchasing officer, viewer, franchise admin, custom employees) can see and use the calculator.
- **Permission Authority**: Employees can use the calculator without needing a separate role permission. Non-admin employees **cannot** change the store-wide `header_calculator_enabled` setting.
- **Utility Only**: The calculator is purely client-side. It does not auto-fill form fields, submit transactions, access private financial records, or write calculations to the server.
- **Responsive & Accessible**: Works across desktop, tablet, and mobile screens (`aria-haspopup="dialog"`, accessible button labels, focus return on transition from open to closed, focus movement into the popover on open, live region status announcements).

---

## Setting Type Alignment & Form Payload Handling
- **Setting Key**: `header_calculator_enabled`
- **Representation**: String `'0'` or `'1'`. Default is `'0'`.
- **Form Defaults**: `resources/js/Pages/Admin/Settings.jsx` initializes `header_calculator_enabled: settings.header_calculator_enabled === '1' ? '1' : '0'`.
- **Validation**: `AdminController::updateSettings` validates both flat `header_calculator_enabled` and nested `settings.header_calculator_enabled` as `nullable|string|in:0,1`.
- **Form Payload Support**: Both nested `['settings' => ['header_calculator_enabled' => '1']]` and flat payloads submit cleanly. Submitting settings forms without modifying the calculator toggle preserves existing settings without validation errors.

---

## Hardened Parser & Supported Operations

### Hardened Malformed Input Checking
The calculator parser strictly rejects malformed inputs with `"Malformed expression"`:
- Numbers with multiple decimal points (e.g. `1.2.3`, `2..5`) or standalone decimal `.`
- Implicit numbers separated by whitespace without operators (e.g. `3 4`)
- Implicit multiplication such as `2(3)` or `(2)3`
- Empty parentheses `()`
- Mismatched parentheses (e.g. `(2+3`, `2+3)`)
- Trailing operators (e.g. `2+`, `5*`)
- Malformed percentage operators (e.g. `100%%`)

### Percentage Semantics
- `A + B%` => `A + (A * B / 100)` (e.g. `100 + 10%` = `110`, `-100 + 10%` = `-110`, `100 + 5.5%` = `105.5`)
- `A - B%` => `A - (A * B / 100)` (e.g. `100 - 10%` = `90`)
- `A * B%` => `A * (B / 100)` (e.g. `200 * 15%` = `30`)
- `A / B%` => `A / (B / 100)` (e.g. `50 / 10%` = `500`)
- Standalone `X%` => `X / 100` (e.g. `50%` = `0.5`, `(50%)` = `0.5`)

---

## Focus, Timers & Listener Lifetime Management
1. **Focus Return**: Trigger focus is restored **only** when `isOpen` transitions from `true` to `false` (avoiding stealing focus on initial page load). Focus moves into the calculator (first interactive button `AC`) when opened.
2. **Inertia Navigation**: Listens to Inertia `router.on('start', ...)` and closes the popover immediately upon navigation start. Unbind callback is called on component unmount.
3. **Timer Ref Cleanup**: `copyTimeoutRef` is stored in a ref and cleared prior to reset and on component unmount.
4. **Mount Guard**: Callbacks check `isMountedRef.current` to prevent updating state after unmount.

---

## Files Changed & Created

### Calculator-Owned & Integration Files
1. `resources/js/Components/Calculator/calculatorEngine.js` - Hardened Shunting-Yard parser, strict malformed input checks, percentage preprocessor, and rounding helper.
2. `resources/js/Components/Calculator/HeaderCalculatorButton.jsx` - Header calculator button (`aria-haspopup="dialog"`, `aria-expanded`, forwardRef).
3. `resources/js/Components/Calculator/CalculatorPopover.jsx` - Popover dialog with keypad, focus return, Inertia navigation listener, copy timer ref cleanup, unmount guards, and live region announcements.
4. `resources/js/Layouts/OneGlanceLayout.jsx` - Integrated calculator button & popover into header right section, and added read-only status in Theme & Header Preferences menu.
5. `resources/js/Pages/Admin/Settings.jsx` - Aligned `header_calculator_enabled` form initialization as string `'1'` / `'0'`.
6. `resources/js/Components/SystemSettingsSection.jsx` - Rendered Header Calculator toggle under Appearance settings.
7. `app/Http/Controllers/AdminController.php` - Validates `header_calculator_enabled` and `settings.header_calculator_enabled` as `nullable|string|in:0,1`.
8. `resources/js/tests/calculatorEngine.test.js` - Vitest unit tests for engine, precedence, decimals, unary negatives, percentages, divide by zero, malformed input, and length limit.
9. `resources/js/tests/headerCalculator.test.jsx` - Vitest JSDOM browser-level interaction tests covering click open/close, outside click dismiss, Escape focus return, keypad entry, keyboard isolation, copy success/failure status, Inertia navigation close, store switch reactivity, and mobile rendering contract.
10. `tests/tests/Feature/HeaderCalculatorTest.php` - PHPUnit feature test for validation, nested form payloads, permissions, tenant isolation, and same-user store-switch Inertia shared settings verification.
11. `docs/header-calculator/01-implementation-and-verification.md` - Technical documentation.

---

## Verification & Test Execution Results

### 1. Engine Unit Tests
```bash
npx vitest run resources/js/tests/calculatorEngine.test.js
```
- **Results**: **12 / 12 tests passed**.
- Verifies arithmetic parser, operator precedence, decimal handling, unary negatives, percentage operations, rounding, backspace, clear, length limit, and strict malformed input rejections.

### 2. Browser-Level Runtime & DOM Interaction Tests
```bash
npx vitest run resources/js/tests/headerCalculator.test.jsx
```
- **Environment**: JSDOM runtime environment (`// @vitest-environment jsdom`).
- **Results**: **14 / 14 tests passed**.
- Verifies button visibility when enabled vs disabled, click toggle, outside-click popover dismiss, Escape key dismiss with focus restoration, keypad entry, keyboard event isolation when closed, Backspace/Delete/Clear, clipboard success announcement (`"Result copied to clipboard"`), clipboard rejection announcement (`"Failed to copy to clipboard"`), Inertia navigation close, store switch reactivity, and mobile layout accessibility contract.

### 3. Complete Frontend Unit Test Suite
```bash
npm test
```
- **Results**: **15 / 15 test files passed** (**229 / 229 tests passed** across all frontend modules).

### 4. Backend Multi-Tenant & Same-User Store-Switch Tests
```bash
& "E:\Software\xampp\php\php.exe" vendor/bin/phpunit tests/tests/Feature/HeaderCalculatorTest.php
```
- **Results**: **6 / 6 tests passed** (**27 assertions**).
- `test_authorized_admin_can_enable_and_disable_header_calculator_setting` PASSED
- `test_nested_settings_form_payload_submits_successfully` PASSED
- `test_submitting_settings_form_without_touching_calculator_key_works` PASSED
- `test_invalid_setting_values_are_rejected` PASSED
- `test_user_without_settings_manage_permission_cannot_change_setting` PASSED
- `test_same_user_store_switch_preserves_tenant_isolation_and_inertia_shared_setting` PASSED

---

## Post-Integration & Parallel Safety
- Unrelated and uncommitted changes across the repository were preserved.
- No chequebook, Reckoner, card-catalogue, build output, or financial-year files were modified.
- Full backend suite execution and production asset compilation remain deferred until the concurrent chequebook task completes.
