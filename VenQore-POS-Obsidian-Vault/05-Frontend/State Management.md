---
tags: [frontend, state]
---

# State Management

Part of [[VenQore POS - Home]] · [[Frontend Architecture]]

No Redux/Zustand/Recoil. State management is **React Context + component-local `useState`**, with `localStorage`/`sessionStorage` for cross-reload persistence and Dexie/IndexedDB for the POS offline queue specifically.

## Context Providers (`resources/js/Contexts/`)
| Context | Purpose |
|---|---|
| `WorkspaceContext.jsx` | The largest — manages POS sessions (`posSessions`, `currentPosId`, add/update/remove), a parallel invoice-workspace system (`activeInvoices`, `invoiceCounter` persisted to `localStorage`), and an isolated pre-sale invoice workspace (`activePreSaleInvoices`, persisted to `sessionStorage`). Generates sequential invoice numbers from a tenant-configurable prefix (`settings.sale_prefix`) |
| `ThemeContext.jsx` | Theme/settings-driven theming, wraps the entire app |
| `AttendanceContext.jsx` | Staff attendance/clock-in state |
| `AlertContext.jsx` | Global toast/alert dispatcher |

All four are composed once, app-wide, inside `GlobalProviderLayout.jsx`, invoked from `app.jsx`'s Inertia `resolve()`. Every page gets wrapped in this provider stack unless on marketing/public/installer routes (explicitly excluded by path-prefix checks like `/gift/`, `/blog/`, `/invitation/`, `/join/`).

`GlobalProviderLayout.jsx` also: boots `SyncService`, renders `OfflineLockScreen`, `PasscodeModal`, `KeyboardShortcutsModal`, `ChatWidget`; polls `/up` to detect server recovery during update overlays.

## Related
- [[POS Terminal Deep Dive]]
- [[Offline Sync - Dexie & IndexedDB]]
