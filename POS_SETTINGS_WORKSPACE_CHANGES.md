# POS settings workspace — what changed (6 Oct 2026)

The register's settings popup was rebuilt as a full-screen workspace, restaurant settings got their own pages, and kitchen tickets got real routing (one ticket, or one per station, with a safe fallback).

## What the user sees

**Full-screen workspace** (`Components/Pos/RegisterSettings.jsx`), rendered through a portal on `document.body`:

- **Header:** title, a search box that finds any setting by plain words (Ctrl + K), a live "All changes saved / Saving… / Not saved" indicator, and **Done**.
- **Left:** categories, grouped by *who the change affects*.
- **Middle:** the settings. Each row has a plain-English title, a one- or two-sentence explanation and, where useful, an example.
- **Right:** a live preview that changes with the category.
- **Ask Vena:** the island is hidden while settings are open. `body[data-vq-settings-open]` combines with `[data-vq-island]` on `IslandShell` and on the full-screen island wrapper in `OneGlanceLayout`.
- **Register shortcuts are paused** while settings are open. Before this change, F4 pressed inside settings removed a cart line.
- **Every change applies immediately.** "Done" only closes the workspace. A business-wide save that hits the admin passcode shows an inline passcode bar and then retries.

| Group | Pages | Saved where |
|---|---|---|
| This register | Screen layout · Product buttons · Text & display · Top bar buttons · Checkout & returns | This device (localStorage); return rules are business-wide |
| Restaurant & café *(only when the Table & Floor module is on and the business prepares orders or runs tables)* | Tables & floor · Kitchen tickets | Mixed, and each section is labelled |
| Whole business *(owner/manager can edit; everyone else sees it read-only)* | Receipts · Stock & prices · Tax & rounding · Cash & security | `store.settings.update`, one `_save_section` at a time. This is the same endpoint the main Settings page uses |
| Devices & keys | Hardware · Keyboard shortcuts | This device / VenQore Station |

### Previews (`Components/Pos/Settings/previews/`)

- **The register.** Drawn by `composeFor()` (new in `Layout/usePosLayout.js`), which asks the layout engine exactly the way the live register does. The drawing uses the store's real products and categories, the cart, the teal total panel, the Pay button and the top-bar buttons that are switched on. It has Phone, Tablet, Laptop and Big screen modes. When the engine demotes a pane, a plain-English note explains why. On the Product buttons page, a catalog that sits behind a button is drawn opened.
- **The floor:** the store's real tables, in the chosen view.
- **Kitchen tickets:** a sample order split exactly the way the server will split it.
- **Receipt:** the thermal receipt, drawn from the store's own name, address and phone.
- **Payment panel:** tax, rounding, service charge, tip and auto-fill cash.
- **Hardware:** a map of devices and their status.
- **Keyboard:** a key tester.

## Restaurant

- **Floor views** (device setting): Smart cards (the existing behaviour), By area, Seating chart and Simple list. There are also settings for sort order (needs attention first / table number), card size, and which details show (amount, time, waiter). Implemented in `Pos/Table/FloorPane.jsx` and `floor-views.css`. The engine's width rule still wins: a narrow column always shows the list view, except for the seating chart.
- **"This register shows: Counter / Restaurant screen":** each screen keeps its own layout (`pos_composition_v2` vs `pos_composition_table_v1`), so changing one never moves the other. On the restaurant screen, the Layout page edits only the restaurant layout and says so.
- Also on the Tables & floor page: tables beside the order or one at a time, Takeaway/Delivery lanes, service charge, a **tip box on/off** switch (new; `pos_tip_enabled`, default on), and **Edit tables** (opens the floor builder in a new tab).

## Kitchen routing

**Server.** `KitchenTicketService::normaliseRouting / routingFor / stationResolver`. One JSON settings row: `kitchen_routing`.

- `single` (default): **everything goes on one ticket** at the main kitchen.
- `stations`: an item goes to the first station that claims it, checked in this order: by product, then by category, then (optional) by the station name already typed on the product (`products.kitchen_station`). Anything unclaimed goes to the main kitchen. With no stations created, everything still goes to one place.
- Each station prints on the Kitchen printer, the Bar printer, the Receipt printer, or **Screen only** (no paper; it shows on the kitchen display only).
- The KOT payload now carries `printer_role`. `KitchenPrintService.roleFor` honours it, and `printKOT` skips paper for `none`.
- New routes:
  - `GET tables/kitchen/routing` (`store.tables.kitchen.routing`, `pos.checkout`)
  - `POST tables/kitchen/routing` (`store.tables.kitchen.routing.save`, `admin.settings_manage`)
- The GET also returns the station names already written on products, so an imported menu ("Grill", "Pasta Station"…) becomes stations in one tap.
- The kitchen display's station filter now ignores a remembered station that no longer exists. Without this fix, a screen filtered to the old `kitchen` station would go blank, with no tab to get back.

> **Behaviour change:** stores whose products carry free-text `kitchen_station` values used to get one ticket per value automatically. They now get **one ticket** until the owner turns on "A ticket for each station" and adds the stations. The Kitchen page offers to add them all in one tap.

## Keyboard

- `POS_KEYMAP` is now grouped and was checked against the handler in `Pages/Pos.jsx`.
- `Ctrl + 1…8` now selects line n, as the map always promised. Before, only 1 and 9 were wired. `Ctrl + 9` selects the last line.
- Added `Alt + T / Alt + W / Alt + N`, because browsers keep `Ctrl + T/W/N` for themselves.
- F6, F10, Ctrl+P, Ctrl+N, Ctrl+R and Ctrl+Tab were working but were not listed. They are listed now.

## Bugs found and fixed along the way

1. **`isWholesalePricingEnabled` was used in `Pages/Pos.jsx` but never imported.** That is a ReferenceError on the code path that recalculates a line's price when its quantity changes. Now imported.
2. **The POS page sent `Setting::all()` to the browser,** including the hashed admin passcode and saved API keys (OpenAI, Stripe secret, WooCommerce, WhatsApp, FBR token). `PosController` now strips those keys. The register never read them.
3. **`AdminController::updateSettings` always redirected.** It now returns JSON to plain JSON callers. Inertia requests still get the redirect.

## Not changed / worth knowing

- `Components/Pos/RegisterPreview.jsx` is no longer imported anywhere. It was left in place; delete it when convenient.
- `Pages/Restaurant/Settings.jsx` (untracked) saves `kot_enabled`, `kot_show_prices` and `kds_auto_print`, but **nothing reads them**. The register's settings do not show them for that reason. Either wire them up or remove those toggles.
- `cash_sale_default` and `barcode_scan_enabled` are not read by the register, so they are not offered there.
- Card terminals have no integration. The Hardware page says so plainly rather than showing a fake setting.

## To ship

1. `npm run build`. There is no migration: routing is a settings row, and `products.kitchen_station` already exists.
2. Test on a till:
   - Open settings (gear or Alt + L) and confirm Ask Vena is gone.
   - Search "drawer".
   - Kitchen tickets: switch to "A ticket for each station", add Bar with the Drinks category, then fire an order with a drink and a burger. You should get two tickets, and the burger should land at Kitchen.
   - Tables & floor: switch the view to Seating chart.
   - Receipts: change the footer, then print a test receipt from Hardware.
