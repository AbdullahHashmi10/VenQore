---
tags: [frontend, pos]
---

# POS Terminal Deep Dive — `Pos.jsx`

Part of [[VenQore POS - Home]] · [[Offline Sync - Dexie & IndexedDB]]

`resources/js/Pages/Pos.jsx` — 3,612 lines, single large component `POSInterface`. Layout: `OneGlanceLayout`.

## Key Imports
React hooks, Inertia (`Head`, `usePage`, `router`), `axios`, `lucide-react` icons, `@/Utils/format`, `@/Utils/settings`, `@/Utils/PrintService`, `@/Utils/db` (Dexie instance), `@/Contexts/WorkspaceContext` (`useWorkspace`), `@/Hooks/useOfflineSync`, `PaymentModal`, `QuickPartyModal`, `ProductModal`, `SmartCombobox`, `AsyncProductCombobox`, `AsyncPartyCombobox`, `PosTourGuide`.

## Key State (30+ `useState` hooks)
- **Multi-tab sale sessions**: `sales` array of cart sessions, `activeSaleId` — backed by `WorkspaceContext`'s `posSessions`/`currentPosId` for cross-tab persistence.
- UI/modal state: toasts, alert/confirm/input modals, variant modal, quick party modal, product modal, payment modal.
- Search/catalog: `searchResults`, `isSearching`, `selectedWarehouseId`.
- Parked sales: `parkedSales`, `parkedDropdownOpen`, `parkingBill`.
- Customer search: `customerSearchTerm`, `customerResults`, `initialCustomers`, `customerDropdownOpen`.
- Payment: `paymentMethod`, `selectedBankAccountId`, `printOnComplete` (persisted `localStorage`), `seniorMode` (persisted `sessionStorage`, scales root font-size 125% for accessibility).
- Returns workflow: `returnMode`, `returnSaleRef`, `returnSaleId` — driven by `settings.pos_return_mode`/`pos_return_window`/`pos_return_window_behavior`.
- Discounts: item-level and global modals, presets persisted client-side, permission-gated via `hasDiscountPerm`.
- **Offline/sync state**: `isOnline` (mirrors `navigator.onLine`), `offlineSales`, `showSyncHub`.

## Sale-Session Recall
A `useEffect` watches a `recalledSale` prop (passed from the controller when editing/re-opening a sale) and maps server sale items back into the local cart shape.

## CSRF Handling
Listens for a custom `amd:csrf-mismatch` window event, surfacing a toast when the CSRF token refreshes — indicates a broader app-level Inertia/axios interceptor in `bootstrap.js`.

## Related
- [[Offline Sync - Dexie & IndexedDB]]
- [[State Management]]
- [[Store Context Routes]]
