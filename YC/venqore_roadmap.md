# VenQore — Product Roadmap

*Internal planning document. Sequencing only — no pitch language.*

---

## Phase 0 — Foundation (Built)

This is what exists today and is live in production use.

- **Core accounting engine** — single-source-of-truth calculation core; all modules read/write through it so no feature can introduce a parallel, inconsistent number. Verified with 1000+ automated tests, mathematical correctness to 20 decimal places.
- **Multi-tenant ERP/POS** — multi-tenant architecture, 7-role permission system, 226+ features, 40+ reports.
- **Cookbook / recipe-costing module** — handles businesses that sell raw materials and manufactured/bundled products from the same inventory (e.g. selling loose garam masala and packaged garam masala from one stock pool). Live and solving a real problem for cafes, restaurants, and bundle-sellers.
- **Live usage** — running in your father's shop (2 months) plus two additional small businesses.
- **VenSynQ architecture** — multi-channel order sync module designed; Amazon SP-API (UK marketplace) approved.
- **SmartCapture (early)** — Gemini-powered multimodal input, in progress.

**Status: this phase is essentially done. Everything below is what comes next, and in what order.**

---

## Phase 1 — Deepen the wedge you already have

**Goal: make the core product something your *current* type of user (small, offline-first, cash/local businesses) can't imagine running without.**

1. **Finish SmartCapture → "AI Scan"**
   Convert handwritten notes, screenshots, text, and voice notes from customers directly into system sales. This is the highest-leverage next step because:
   - It's already partly built — least new engineering.
   - It solves the exact problem your current live users have (orders arrive informally, not through a store system).
   - It's a strong freemium hook: it's the single most "magic" feature for a first-time user, and it doesn't require any other business to already be online.

2. **Freemium tier definition**
   Decide which pain points are "free forever" (likely: basic POS + AI Scan + core reports) vs. paid (VenSynQ, Growth Intelligence, advanced AI tiers). This should be locked before you scale user acquisition, not after.

3. **Continue hardening the core**
   Keep expanding the 1000+ test suite as new modules ship. The core engine is your differentiator — every new feature should still route through it, never around it.

---

## Phase 2 — Turn on multi-channel (once Phase 1 users are stable)

**Goal: capture businesses that sell on more than one channel — the natural upgrade path from Phase 1 users.**

4. **Ship VenSynQ**
   Multi-channel sync (Amazon, TikTok, eBay, Etsy, WooCommerce, own storefront). Architecture is already done and SP-API is approved — this is largely execution, not design. This also unlocks:
   - Real inventory-across-channels visibility (prevents overselling out-of-stock items — your own pain point from the virtual-assistant job).
   - The clearest B2B upsell: "manage all your stores from one place."

5. **AI Listing Transposer**
   Build on top of VenSynQ (it needs channels to already be connected). One listing → auto-formatted for every connected platform. Sequenced after VenSynQ specifically because it has no standalone value without multi-channel already working.

---

## Phase 3 — Intelligence layer (runs in parallel, matures with data)

**Goal: use the data now flowing through Phases 1–2 to create insights competitors can't, without gating other work on it.**

6. **Growth Intelligence / churn signals**
   Early-stage today; needs more usage data to be reliable. Don't treat this as a "phase gate" — let it keep improving in the background as Phase 1–2 users generate data. Useful especially for:
   - Wholesalers tracking whether retail buyers are drifting away.
   - Subscription/recurring-delivery businesses tracking churn risk.
   - This becomes a stronger paid-tier feature the more data you have — don't rush it to market before it's accurate, since a wrong churn prediction actively damages trust in your "mathematical correctness" positioning.

---

## Phase 4 — Expansion plays (running in parallel with Phases 1–2, not sequentially)

**These don't require new core engineering — they're GTM/rebranding decisions using what you've already built.**

7. **Domain/vertical expansion (gyms, cafes, restaurants, parking-style businesses)**
   You already have the underlying features (multi-tab POS, cookbook, tab/table management). This is a positioning and marketing exercise — package and market the existing system for a new vertical, rather than a new build phase. **Decision made: this runs in parallel with Phases 1–2**, trading a bit of engineering focus for more market data sooner. Since it's GTM work rather than core engineering, it can proceed without pulling attention off AI Scan or VenSynQ.

---

## Phase 5 — Platform network effects (later, ambitious, dependent on scale)

**These make sense only once you have enough businesses on the platform that connecting them to each other has value.**

8. **One-click storefronts**
   Let any business spin up their own branded storefront/domain on top of VenQore. Higher priority than B2B network (#9) because it only requires your own users, not a critical mass of both buyers and sellers.

9. **B2B wholesale network**
   Businesses buying/selling from each other directly through the platform, with purchases/invoices auto-generated on both sides. This needs real network density to work (a marketplace with no supply or no demand is dead on arrival) — sequence it after you have enough businesses live that a real "who sells what near me" graph exists.

---

## Phase 6 — Infrastructure-driven (build only when forced to)

10. **Local-first / offline mode for POS**
    Needed for reliability in areas with unstable internet/electricity — a real problem, but reactive: build it when infrastructure failures actually start costing your live users sales, not preemptively.

---

## Sequencing logic, summarized

| Phase | What | Why here and not elsewhere |
|---|---|---|
| 1 | AI Scan, freemium tier | Already partly built, solves current users' actual problem, cheapest path to a wedge |
| 2 | VenSynQ, Listing Transposer | Architecture already done; Listing Transposer literally depends on VenSynQ existing first |
| 3 | Growth Intelligence | Needs data volume from Phases 1–2 to be trustworthy; runs in background, not a gate |
| 4 | Vertical rebranding | Zero new engineering — a GTM decision; runs in parallel with Phases 1–2 |
| 5 | Storefronts, B2B network | Needs platform scale/density to have any value at all |
| 6 | Local-first/offline | Reactive — build when infra failures actually cost you sales |

**Locked:** Phase 4 runs in parallel with Phases 1–2.
