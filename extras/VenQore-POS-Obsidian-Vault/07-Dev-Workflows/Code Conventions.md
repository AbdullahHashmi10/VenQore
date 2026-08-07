---
tags: [dev-workflow, conventions]
---

# Code Conventions

Part of [[VenQore POS - Home]]

- **Controllers are thin** — business logic lives in `app/Services/`.
- **Inertia responses** use `Inertia::render('PageName', [...data])`.
- **React components** use Tailwind utility classes (no separate CSS files).
- **All DB queries must include `tenant_id` scope** — never query cross-tenant. See [[Multi-Tenancy Architecture]].
- **PurchaseService Safety**: if you ever route or wire up the legacy `PurchaseService` in routes/controllers, ensure its double-entry payment allocation logic remains fully covered and correct — it must link `PaymentAllocation` to a valid `JournalEntry` ID, not a `Payment` ID, so the MySQL trigger passes. See [[PaymentAllocation Trigger]].
- **No Trailing NUL-Bytes**: never commit or save files ending with trailing NUL (`\x00`) bytes. CI runs a Python scan to block pushes with NUL-byte corruption.
- Route names follow `feature.action` convention (e.g., `sales.store`, `inventory.index`).
- Use `route()` Ziggy helper in React for named routes.
- **Ziggy Routes**: every time a route is added/renamed in `routes/web.php`, run `php artisan ziggy:generate` to regenerate `resources/js/ziggy.js` before building/committing, to prevent build guard failures.
- Prefer `php artisan optimize:clear` after config or route changes.

## Deliverable Format Preference (for AI agents working in this repo)
Default to Markdown (`.md`) for written deliverables (reports, plans, findings, summaries, audits, etc.). Do **not** produce `.docx` files by default. Only use a different format (`.docx`, `.pdf`, `.xlsx`, etc.) when explicitly requested.

## Related
- [[Database Policy]]
- [[PaymentAllocation Trigger]]
