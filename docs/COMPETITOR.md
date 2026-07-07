# COMPETITOR.md — Competitive Landscape & How We Win

> Sources: July 2026 web research (pricing links in footer) + product knowledge. Prices are list, USD unless noted; verify at deal time.

## Category map
VenQore straddles four categories on purpose. That's the strategy: nobody else covers all four affordably.

| Category | Leaders | Their gap vs VenQore |
|---|---|---|
| Cloud POS | Square, Lightspeed, Loyverse, Hike | Reports ≠ real accounting; weak/no double-entry; offline modes limited; multi-channel costs extra |
| SMB accounting | QuickBooks, Xero, Zoho Books, Wave | No POS; inventory shallow (no FIFO batches/serials/manufacturing at SMB tiers) |
| South-Asia desktop ERP | Vyapar, Marg, Tally, Busy | Dated UX; weak SaaS/multi-store; no AI; POS secondary; but: deep local trust + GST/FBR fit + huge installed base |
| Open-source ERP | Odoo, ERPNext | Powerful but implementation-heavy; SMB retailers need consultants; POS+accounting integration is assembly-required |

## Head-to-head

### Square (POS) — free + $29/mo plans, ~2.6–2.9% processing
- **Strengths:** brand, free tier, hardware ecosystem, payments built-in.
- **Weaknesses:** US/Western-centric; no true ledger; not available/practical in Pakistan; fees replace subscription.
- **We win:** markets Square ignores (PK/MENA/SEA), businesses needing books + inventory depth, offline-heavy environments, no-processing-fee economics.
- **We lose:** integrated card payments + hardware. **Response:** local rails integrations (JazzCash/Easypaisa) + BYO card machine.

### Loyverse — free POS, Advanced Inventory $29/mo/store
- **Strengths:** free, simple, popular in emerging markets — the closest behavioral competitor for our beachhead.
- **Weaknesses:** accounting nonexistent (exports to others); inventory add-on paywall; no manufacturing/serials; no marketplace sync.
- **We win:** "graduate from Loyverse" story — one import wizard away. Build the Loyverse CSV importer (FEATURES #7) and target its communities.

### Lightspeed Retail — $89–$289/mo
- **Strengths:** deep retail inventory, multi-location, ecosystem.
- **Weaknesses:** price (3–10× ours), complexity, still not an accounting system.
- **We win:** price/value at SMB, accounting included, LTD offer. **We lose:** enterprise retail RFPs — don't chase them yet.

### QuickBooks Online / Zoho Books — $30–$90 / $15–$60/mo
- **Strengths:** accountant network effects (QBO), suite breadth (Zoho).
- **Weaknesses:** POS gap (QBO POS discontinued history; Zoho POS is bolt-on), inventory ceilings, per-app pricing creep.
- **We win:** single-system story for retail: "your cashier and your accountant see the same numbers." Accountant-acceptance requires a Tally/QBO export bridge eventually (FEATURES later-list).

### Vyapar (₹699+/yr) / Marg (₹8–25k one-time +AMC) / Tally
- **Strengths:** price-fit, local compliance (GST), offline desktop trust, dealer networks — the incumbents in our beachhead's mental model. VYAPAR_REVERSE_ENGINEERING_NOTES.md shows we consciously matched their transaction breadth.
- **Weaknesses:** single-device mindsets, clunky multi-store, no real SaaS platform layer, no AI capture, no marketplace sync, weak web POS.
- **We win:** modern web UX + true multi-store + FBR e-invoicing + AI + WooCommerce/marketplaces, at a monthly price cheaper than Marg's AMC. **We lose:** pure-offline desktop buyers (our self-hosted/DRM channel is precisely the counter — sell it deliberately) and their dealer distribution (build a reseller program on the DRM licensing rails).

### Odoo ($25–38/user/mo cloud) / ERPNext (free self-host / Frappe Cloud)
- **Strengths:** breadth, price-per-capability, open ecosystems.
- **Weaknesses:** time-to-value; SMB retailers don't want implementation projects.
- **We win:** 10-minute setup wizard vs weeks of configuration; opinionated retail defaults. **We lose:** heavy customization deals — refer them out.

## Our durable advantages (rank-ordered)
1. **POS that posts real double-entry automatically** — architecturally hard to retrofit for POS-first rivals; culturally hard for accounting-first rivals.
2. **Offline-first + self-hosted option + DRM/updater channel** — matches emerging-market reality; SaaS-only rivals can't follow easily.
3. **FBR e-invoicing + PKR geo-pricing + local workflows** (kachha/pakka-style dual-mode analysis exists in repo) — regulatory moats compound.
4. **LTD-friendly cost structure** — one MySQL monolith, no per-seat COGS, AI metered separately: we can profitably sell LTDs that would bankrupt per-usage rivals.
5. **AI capture at SMB price** — receipt→books in one photo; incumbents in our beachhead have nothing comparable.

## Our real disadvantages (don't self-deceive)
Brand trust = zero · no payments residual revenue · no hardware story yet (FEATURES #4) · no accountant network · single-founder bus factor · support scale unproven · English-only UI in an Urdu-first beachhead.

## Positioning statement (recommended)
For small retail & food businesses that juggle a POS, a spreadsheet, and an accountant, **VenQore is the all-in-one POS + ERP whose books are always right** — every sale posts a balanced journal entry automatically, online or offline — unlike Square/Loyverse (no accounting), QuickBooks (no POS), or Tally-era desktop ERPs (no cloud, no AI).

**Category to own:** "Accounting-true POS" / retail OS for emerging markets. Do NOT position as generic "ERP" (procurement-speak, wrong buyer) nor as "POS app" (race to free).

## Sources
[Lightspeed pricing](https://www.lightspeedhq.com/pos/retail/pricing/) · [Loyverse pricing](https://www.itqlick.com/loyverse-pos/pricing) · [Lightspeed vs Square](https://koronapos.com/blog/lightspeed-vs-square-pos/) · [Vyapar pricing](https://vyaparapp.in/pricing) · [Marg price list](https://margcompusoft.com/marg-price-list.html) · [Marg ERP TCO India 2026](https://aidukan.in/marg-erp-price-india/) · [ERPNext vs Odoo 2026](https://www.cudio.com/blog/erpnext-vs-odoo) · [Odoo vs Zoho One 2026](https://theintechgroup.com/blog/odoo-vs-zoho-one-pricing-features-erp-comparison/)
