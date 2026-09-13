# Addendum — the mobile nav across all 90 business types

Read with `SPEC_MOBILE_BOTTOM_NAV.md`. This replaces Part C of that document.

---

## The principle: do not build 90 navs. Do not build 20.

`config/business_types.php` has **90 types** across 5 sectors, resolving to **20 presets**.
Hand-authoring a nav per type is unmaintainable and would be stale the day someone adds
type 91.

`config/modules.php` already carries the answer. **46 modules declare a `nav` entry** with
`route`, `icon`, `term` and `order` — the same metadata the sidebar uses. The mobile bar
must read that, not a new list. One source of truth means a new business type is covered
automatically, and it closes the frontend/backend split that R09 and R16 complained about.

### The algorithm

1. **Home** — always, slot 1.
2. Take every module the tenant has enabled that declares a `nav` entry, sort by `order`
   ascending, and take the **first three**.
3. **More** — always, slot 5.

Labels come from the entry's `term` through the terminology helper, so the same slot reads
"Sales" in a shop, "Jobs" for a plumber and "Repair Jobs" in a phone shop, with no extra
configuration.

Never more than 5 slots. If fewer than 3 resolve, render nothing.

---

## The problem: the current `order` is tuned for retail and food

Worked through against the real registry values:

| Business | Enabled nav modules (order) | Result | Verdict |
|---|---|---|---|
| Retail shop | POS 10, Inventory 20, Customers 25 | Home · POS · Stock · Customers · More | correct |
| Restaurant | POS 10, Tables 12, Inventory 20 | Home · POS · Tables · Stock · More | correct |
| **Plumber** | Invoices 15, Customers 25, **Service Jobs 47** | Home · Invoices · Clients · Jobs · More | **wrong** — the job list is the daily screen, not invoices |
| **Manufacturer** | Invoices 15, Inventory 20, Inventory dash 30, **Production 51** | Home · Invoices · Stock · Stock · More | **wrong** — Production misses entirely, and Stock appears twice |
| Wholesaler | Invoices 15, Purchases 20, Suppliers 22, Khata 26 | Home · Invoices · Purchases · Suppliers · More | debatable — khata is the wholesaler's daily screen |

Two real defects fall out of this: **services and manufacturing lose their primary
action**, and a business with both `inventory` nav entries (order 20 and 30) gets
**duplicate Stock slots**.

---

## The fix

### 1. De-duplicate by destination
Before taking the top three, drop entries whose resolved route is already taken. Two
`inventory` entries must never both appear.

### 2. Add `nav_pin` to the presets
Presets live in `config/ai_builder.php`. Add an optional `nav_pin` — an ordered list of
module keys pulled to the front before the `order` sort. Twelve of the twenty presets need
nothing; these eight do:

| Preset | `nav_pin` |
|---|---|
| `field_service` | `['services']` |
| `repair_workshop` | `['services']` |
| `salon` | `['services']` |
| `tailoring` | `['services']` |
| `rental_hire` | `['services']` |
| `membership_studio` | `['services']` |
| `light_manufacturing` | `['production']` |
| `wholesale` | `['khata_credit']` |

A pinned module only appears if the tenant actually has it enabled — a pin is a priority
hint, never an override of the module gate.

After the pins: `retail_shop`, `clothing`, `grocery`, `pharmacy`, `hardware_store`,
`mobile_electronics`, `restaurant`, `cafe`, `food_counter`, `bakery`, `catering` and
`professional_services` all resolve correctly on the existing `order` values alone. Do not
add pins they do not need.

### 3. Do not change the `order` values in `config/modules.php`
They drive the sidebar. Changing them to fix the phone would reorder the desktop for
everyone. The pin mechanism exists precisely so you don't have to touch them.

---

## The test — this is what "caters for all 90" actually means

Add `tests/tests/Feature/Plan/MobileNavCoverageTest.php`. **Loop
`config('business_types.types')` — do not hand-list.** For every one of the 90:

1. Provision a tenant of that type through `StoreProvisioner`.
2. Resolve the mobile nav for it.
3. Assert **3 to 5 items** — never 0, never more than 5.
4. Assert **no duplicate routes**.
5. Assert **every route is registered** in Laravel (this is the one that catches a typo in
   a `nav` entry).
6. Assert **every item's module is actually enabled** for that tenant.
7. Assert the **sector's primary action is present**: `services` types include the services
   entry, `food` types with `table_service` include tables, `retail` types with `pos`
   include POS, `manufacturing` types with `production` include production.

The test must name the failing business type in its message. A single assertion that
"it works" across 90 types is worthless; a failure that says `light_manufacturing:
production missing from nav` is the whole point.

Report the count of types the test actually iterated — if it is not 90, the loop is wrong.

---

## One more thing

`store.restaurant.dashboard`, `store.service-jobs.index`, `store.production.index` and the
rest must all be in `ziggy.js`, or the bar throws in the browser for exactly the businesses
it was added to serve. Run `php artisan ziggy:generate` and `npm run build` after this, and
let `FullRouteSweepTest` confirm it.
