# 06 — V1 Business Catalogue

**48 business types.** Every one of them backed by capabilities that either exist today or are built in `03_SERVICES_AND_FIELD_WORK.md`. Nothing on this list is aspirational.

**Rule for this document:** a business appears here only when **every capability on its must-have list either exists in the code today or is in the V1 build.** If it needs the Scheduling family, it is in §05 (Not V1) and must not appear in any marketing material.

---

## 01 — Readiness key

| Mark | Meaning |
|---|---|
| 🟢 **Ready** | Sellable today. Needs composition + terminology only. Zero new engine. |
| 🟡 **V1 build** | Needs the Work Order engine and/or the service product type from §03. |
| 🔵 **V1 build +** | Needs §03 plus one small addition noted in the row. |

---

## 02 — Tier A · Ready now (30)

Composition and naming only. These can be sold the day the capability registry and terminology land.

### Retail & trade — 22

| Business | Key capabilities | Notable terminology |
|---|---|---|
| 🟢 Grocery / karyana | products, inventory, fifo, pos, khata, weighted items | Stock → Maal |
| 🟢 Supermarket | + locations, stock_take, loyalty | — |
| 🟢 General store | baseline | — |
| 🟢 Apparel | + product_variants (size/colour) | Product → Article |
| 🟢 Footwear | + product_variants | Product → Pair |
| 🟢 Electronics | + serial_lifecycle, warranty | Serial → IMEI |
| 🟢 Mobile accessories | + serial_lifecycle | — |
| 🟢 Computer shop | + serial_lifecycle, composition (builds) | Composition → Build |
| 🟢 Hardware | + multi_unit | — |
| 🟢 Auto parts | + supplier catalogue, cross-reference | Product → Spare |
| 🟢 Tyre shop | + serial_lifecycle | Serial → DOT code |
| 🟢 Paint | + variants, multi_unit | Variant → Shade |
| 🟢 Building materials | + multi_unit, delivery charges, van sales | Location → Yard |
| 🟢 Furniture | + variants, quotations, delivery | — |
| 🟢 Cosmetics | + batch_tracking, batch_expiry | — |
| 🟢 Sports goods | + variants | — |
| 🟢 Toys | baseline | — |
| 🟢 Optical | + variants, serial_lifecycle | Product → Frame / Lens |
| 🟢 Pet shop | + batch_expiry (feed) | — |
| 🟢 Jewellery | + weighted items, making charge, serial | Ad-hoc line → Making charge |
| 🟢 Bookstore | + ISBN as barcode | Product → Title |
| 🟢 Stationery | baseline | — |
| 🟢 Agri inputs | + batch_tracking, batch_expiry | Location → Godown |

### Food — 6

All covered by composition + occupancy + work orders (kitchen) + POS.

| Business | Key capabilities | Notable terminology |
|---|---|---|
| 🟢 Restaurant | composition, occupancy, work_orders(kitchen), qr_menu | Customer → Guest · Position → Table |
| 🟢 Café | as above | Position → Table |
| 🟢 Bakery | composition, production, batch_expiry | Composition → Recipe |
| 🟢 Sweet shop | composition, weighted items, batch_expiry | — |
| 🟢 Juice bar | composition, pos | — |
| 🟢 Cloud kitchen | composition, work_orders(kitchen), channel integration | Position → — (none) |
| 🟢 Caterer | composition, quotations, sales_orders, ad_hoc_lines | Order → Event |

### Regulated & B2B — 4

| Business | Key capabilities | Notable terminology |
|---|---|---|
| 🟢 Pharmacy | batch_tracking, batch_expiry, serial, FBR, occupancy (held Rx) | Customer → Patient · Occupancy → Held prescription |
| 🟢 Wholesale | quotations → sales_orders → invoices, khata, ageing, multi-location, landing cost | Customer → Party |
| 🟢 Distribution | + locations, stock_transfer, van stock | Location → Van |
| 🟢 Van / route sales | + van stock, offline POS, daily cash audit | Location → Van |

---

## 03 — Tier B · V1 build — needs the Work Order engine (11)

Everything here needs `work_orders` (the generalised `kitchen_orders`) plus most of the job children from §03.

| Business | Beyond baseline | Notable terminology |
|---|---|---|
| 🟡 Mobile repair | work_orders, job_parts_issue, serial_lifecycle (IMEI in/out), positions (bench) | Job → Repair · Position → Bench |
| 🟡 Auto workshop | work_orders, job_parts_issue, job_technicians, positions (bay), quotations | Job → Repair order · Technician → Mechanic |
| 🟡 Appliance repair | work_orders, job_site_address, van_stock | Job → Service call |
| 🟡 Tailoring | work_orders, job with measurements (custom fields), composition (fabric + labour) | Job → Order · Position → — |
| 🟡 Printing press | work_orders, quotations, composition (material + labour), job_photos | Job → Print job |
| 🟡 Laundry & dry cleaning | work_orders, occupancy (tagged bundles), positions (rack) | Job → Ticket · Position → Rack |
| 🟡 Furniture making | work_orders, composition, quotations, landing cost | Job → Work order |
| 🟡 Small manufacturing | composition, production, work_orders, stock_take | Job → Production order |
| 🟡 Food processing | composition, production, batch_tracking, batch_expiry, work_orders | Job → Batch run |
| 🟡 Solar installation | work_orders, job_site_address, quotations, van_stock, service_contracts | Job → Installation |
| 🟡 IT services & AMC | services, work_orders, service_contracts, recurring billing | Job → Ticket · Technician → Engineer |

---

## 04 — Tier S · V1 build — the Services addition (7)

**The new market this programme opens.** These need the service product type, the Job engine, technicians, van stock and contracts — all in `03_SERVICES_AND_FIELD_WORK.md`.

| Business | Capability set | Terminology | What sells it |
|---|---|---|---|
| 🟡 **Electrician** | services, work_orders, job_technicians, job_site_address, van_stock, quotations, service_contracts | Job · Electrician · Material · Van · Client | Quote → job → parts off the van → invoice, with the parts cost actually correct |
| 🟡 **Plumber** | same | Job · Plumber · Material · Van | Same, plus recurring maintenance |
| 🟡 **AC / HVAC technician** | same + service_contracts prominent | Service call · Technician · Part · AMC | AMC contracts are the whole business model here |
| 🟡 **Appliance repair** | same, van optional | Service call · Technician | Parts + labour on one bill |
| 🟡 **Handyman / general trades** | services, work_orders, ad_hoc_lines | Job · Worker | Simplest configuration — service lines + a job |
| 🔵 **Pest control** | + service_contracts, batch_tracking (chemicals) | Treatment · Technician · Chemical | Chemical batch tracking already exists |
| 🔵 **Cleaning services** | + service_contracts, job_technicians, recurring | Visit · Cleaner · Contract | Recurring visits under contract |

> **Honest limit for all seven:** jobs have a **date** and an **assigned technician**. They do not have calendar slots, availability checking or conflict detection. For a business with two to six technicians that is sufficient and is how most of them work today. Say it plainly; do not imply a calendar.

### Consulting-shaped, service lines only — no job engine needed

| Business | Capability set |
|---|---|
| 🟡 Consultant / freelancer | services (hourly), quotations, invoices, recurring_invoices, expenses |
| 🟡 Training provider | services, quotations, invoices, recurring_invoices |

**Total: 30 (A) + 11 (B) + 7 (S) = 48.**

---

## 05 — Explicitly NOT V1 — do not market these

| Tier | Businesses | Blocker | When |
|---|---|---|---|
| **C** | gym · fitness studio · salon · barber · spa · clinic · dental · physiotherapy · diagnostic lab · veterinary · tuition centre · driving school · equipment rental · car rental · event rental · photography studio · coworking | **Scheduling + Non-stock Resource + Period family** (~52–73 days, one build) | Next build after V1 — **highest-leverage build in the company: 16 businesses from one engine family** |
| **D** | construction · interior design · engineering consultancy · marketing agency · law firm · accounting practice · property management | Relationship (projects) + Work engine, on top of C | After C |
| **E** | hotel · guest house · travel agency | C + D + rate calendars + channel integration | Last. **Worst possible early target** — three engine families deep. |

**Discipline note.** Every one of these is tempting because they are visible, high-value verticals. Marketing them before the engine exists produces the single worst outcome available: refunds from customers who bought a promise, plus the reputation damage that follows. `VENQORE_AUDIT_II` names this as a Critical risk. It has not stopped being one.

---

## 06 — Templates

A template is **a row set, not code**: a capability set + a terminology map + an industry preset + a default dashboard layout + a seeded chart of accounts + optional sample data.

```json
{
  "key": "electrician",
  "label": "Electrical contractor",
  "extends": "field_service_base",
  "capabilities": {
    "on":  ["services","work_orders","job_technicians","job_site_address",
            "job_parts_issue","van_stock","quotations","service_contracts",
            "job_photos_signature"],
    "off": ["batch_tracking","product_variants","loyalty","qr_menu",
            "occupancy","composition"]
  },
  "terminology": {
    "customer":   {"singular":"Client","plural":"Clients"},
    "product":    {"singular":"Material","plural":"Materials"},
    "job":        {"singular":"Job","plural":"Jobs"},
    "technician": {"singular":"Electrician","plural":"Electricians"},
    "location":   {"singular":"Van","plural":"Vans"},
    "contract":   {"singular":"Contract","plural":"Contracts"}
  },
  "industry_preset": "Electrical",
  "dashboard": ["open_jobs","receivables_ageing","todays_takings",
                "expiring_contracts","van_stock_low"],
  "accounts": ["service_income","materials_cogs","labour_cost","vehicle_expense"]
}
```

**Ship 12 templates in V1**, not 48. Each one must be walked through end to end by a human before it is offered — a template that has never been used produces a broken first impression at exactly the worst moment.

| # | Template | Covers |
|---|---|---|
| 1 | Retail store | grocery, general store, stationery, toys, sports, pet, books |
| 2 | Fashion & variants | apparel, footwear, cosmetics |
| 3 | Electronics & serials | electronics, mobile accessories, computer, tyre |
| 4 | Hardware & materials | hardware, paint, building materials, auto parts, agri |
| 5 | Restaurant & café | restaurant, café, juice bar, cloud kitchen |
| 6 | Bakery & production | bakery, sweet shop, food processing |
| 7 | Pharmacy | pharmacy |
| 8 | Wholesale & distribution | wholesale, distribution, van sales |
| 9 | **Field service** | electrician, plumber, HVAC, appliance repair, handyman |
| 10 | **Repair shop** | mobile repair, auto workshop, laundry |
| 11 | **Workshop & making** | tailoring, printing, furniture making, small manufacturing |
| 12 | **Services & contracts** | IT/AMC, consultant, training, cleaning, pest control |

The remaining 36 business types are reachable from these 12 by changing terminology and toggling two or three capabilities — which is exactly the story: *your software is assembled, not chosen off a shelf.*

The four service-shaped presets already in `config/industries.php` — **MobileRepair, Solar, IT, Consulting** — map onto templates 10, 9, 12 and 12. They currently ship with no engine behind them; V1 is what makes them true.

---

## 07 — What we can honestly claim

**Say this:**

> "VenQore serves 48 business types today, from a grocery store to an electrical contractor. Each one is assembled from components that have been running in production for two years — inventory, double-entry accounting, FIFO costing, work orders, contracts. We don't generate your software. We compose it from parts that already work, then you rename and colour it until it's yours."

**Do not say:**

- "Any business" — Scheduling, projects and hospitality are genuinely not there
- "AI builds your software" — it composes tested components, which is the stronger and truer claim
- "Scheduling", "appointments", "bookings", "calendar" — none exist in V1
- Any Tier C, D or E vertical by name

**Every marketing claim must be enforceable in code.** `FEATURE_GATING_AUDIT.md` lists four Critical false promises still open. Close them before the reveal, not after.

---

## 08 — Sales qualification questions

Four questions place a prospect on this catalogue in under a minute:

1. **Do you hold stock?** No → services-only configuration. Yes → continue.
2. **Does your work happen at the customer's place, or at yours?** Theirs → `job_site_address` + `van_stock`. Yours → `positions`.
3. **Do you quote before you work?** Yes → `quotations` → job flow.
4. **Do customers pay you on a repeating cycle?** Yes → `service_contracts` + `recurring_invoices`.

If the answer to *"do you need to book customers into time slots?"* is yes — **that prospect is not V1.** Log them, and tell them honestly when Scheduling lands. A logged waiting list is a real asset for the next build; an oversold customer is a liability.
