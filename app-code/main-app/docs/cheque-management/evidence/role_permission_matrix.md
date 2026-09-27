# Cheque Management — Role Permission Matrix

> Generated: 2026-09-26  
> Module version: Phase-Cheque (correction & final-verification pass)  
> Source truth: `config/permissions.php`, `resources/js/Pages/Admin/Users.jsx`

---

## Permission Definitions

| Permission Key | Description |
|---|---|
| `finance.cheque_books.view` | View chequebook list, leaf detail, and available-leaves dropdown |
| `finance.cheque_books.manage` | Register new chequebooks, update status, void unused books |
| `finance.cheques.clear` | Mark issued/deposited cheques as cleared or bounced |
| `finance.cheques.override_duplicate` | Authorize re-recording a cheque that matches an existing fingerprint |

---

## Role Matrix

| Role | `finance.cheque_books.view` | `finance.cheque_books.manage` | `finance.cheques.clear` | `finance.cheques.override_duplicate` |
|---|:---:|:---:|:---:|:---:|
| **Owner** | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Manager** | ✅ | ❌ | ❌ | ❌ |
| **Accountant** | ✅ | ✅ | ✅ | ❌ |
| **Cashier** | ❌ | ❌ | ❌ | ❌ |
| **Purchasing Officer** | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ |

---

## Rationale

### Owner & Admin
Full access to all cheque operations.  
Override duplicate is a high-trust action requiring explicit financial authority — restricted to Owner/Admin only.

### Manager
Read-only on chequebooks (needs visibility for reporting and approval decisions) but cannot register new books or perform financial lifecycle actions.

### Accountant
Can register and manage chequebooks (`manage`) and perform clearing operations (`clear`) as part of normal accounting duties.  
Cannot override duplicate detection — this requires management-level sign-off to preserve the audit trail integrity.

### Cashier
No access. Cashiers operate the POS and may select a cheque leaf at payment time, but the leaf selection UI uses the existing payment permissions (`payments.create`), not cheque-specific permissions. Cashiers cannot view the banking module.

### Purchasing Officer
No access. Purchasing operates in the procurement domain; cheque management is in the finance/banking domain.

### Viewer
Read-only access to chequebooks. Can see available leaves, book status, and leaf audit trail. Cannot perform any write operations.

---

## UI Behaviour by Permission

| UI Element / Action | Required Permission | Fallback when missing |
|---|---|---|
| "Banking → Chequebooks" tab visible | `finance.cheque_books.view` | Tab hidden |
| Chequebook list page | `finance.cheque_books.view` | 403 redirect |
| "Register Chequebook" button | `finance.cheque_books.manage` | Button hidden |
| Available-leaves dropdown in payments | `finance.cheque_books.view` | Selector hidden |
| "Mark as Cleared / Bounced" | `finance.cheques.clear` | Buttons hidden |
| Duplicate override checkbox | `finance.cheques.override_duplicate` | Checkbox hidden; request rejected at API |

---

## API Enforcement

All permissions are enforced server-side via Laravel `Gate::authorize()` in the relevant controllers:

- `ChequeBookController` — `finance.cheque_books.view` on `index/show`, `finance.cheque_books.manage` on `store/update/destroy`  
- `ChequeLeafController` — `finance.cheque_books.view` on available-leaves endpoint  
- `ChequeLifecycleController` — `finance.cheques.clear` on clear/bounce actions  
- `ReceivedChequeController` — `finance.cheque_books.manage` on store; `finance.cheques.override_duplicate` checked inside `ChequeDuplicateService::canOverride()`

> [!IMPORTANT]
> The `finance.cheques.override_duplicate` check is enforced **inside the service layer** (`ChequeDuplicateService::canOverride()`), not only at the controller level. This prevents bypasses through direct API calls.

---

## Default Role Seeder

The permissions are seeded by `database/seeders/RolePermissionSeeder.php`. The authoritative mapping is:

```php
'owner'     => [..., 'finance.cheque_books.view', 'finance.cheque_books.manage',
                     'finance.cheques.clear', 'finance.cheques.override_duplicate'],
'admin'     => [..., 'finance.cheque_books.view', 'finance.cheque_books.manage',
                     'finance.cheques.clear', 'finance.cheques.override_duplicate'],
'manager'   => [..., 'finance.cheque_books.view'],
'accountant'=> [..., 'finance.cheque_books.view', 'finance.cheque_books.manage',
                     'finance.cheques.clear'],
'viewer'    => [..., 'finance.cheque_books.view'],
// cashier, purchasing_officer: no cheque permissions
```
