# VenQore — The Plan (V3)

**The business document. Decisions, pricing, positioning, and the reasoning behind each.**
Companion file: `VENQORE_V3_TECHNICAL_BUILD_PLAN.md` — every task, file and fix.

**Written 2026-08-04 · supersedes V1 and V2 · no code has been changed**

---

## Contents

- [0. Two things that change the plan](#s0)
- [1. How AI Scan should actually work](#s1)
- [2. The shared product knowledge base](#s2)
- [3. Voice: use the browser, not the API](#s3)
- [4. Pages, images and what we count](#s4)
- [5. Base plans](#s5)
- [6. AI add-ons](#s6)
- [7. Bring Your Own Key](#s7)
- [8. Product descriptions & listing content](#s8)
- [9. The free public tool](#s9)
- [10. Vena on public pages — the open door](#s10)
- [11. AppSumo](#s11)
- [12. Hosting, database and storage](#s12)
- [13. What "budget for support" means](#s13)
- [14. Everything you need to create in Lemon Squeezy](#s14)
- [15. Order of work](#s15)
- [16. Open questions](#s16)

---

<a name="s0"></a>
## 0. Two things that change the plan

### 0.1 Your Lemon Squeezy research confirms it — and it's worth real money

You found it: **5% + $0.50 per checkout session, not per product.** One cart with the base plan and the AI add-on = **one** $0.50 fee. Two separate checkout links = **two.**

This is worth **11 percentage points of margin** on the $3 AI tier for zero product change. Every number in this document assumes **single-cart checkout**, which means one specific technical change: stop using single-product checkout links and start building carts through the Lemon Squeezy API with multiple variants in one session. It's in the technical file as task **P0-6**.

### 0.2 The October 2026 deprecation breaks the tiers — so we price around it now

`gemini-2.5-flash` is scheduled to disappear on **16 October 2026**. The successors cost more:

| Model | Handwritten page | Printed page |
|---|---:|---:|
| Gemini 2.5 Flash *(today)* | $0.00392 | $0.00328 |
| Gemini 2.5 Flash-Lite *(today)* | $0.00076 | $0.00066 |
| Gemini 3 Flash *(successor)* | $0.00507 | $0.00430 |
| Gemini 3.1 Flash-Lite *(successor)* | $0.00253 | $0.00215 |

The blended cost goes from **$0.00213 to $0.00346 per page — a 1.6× increase.**

If I priced the tiers off today's cost, your margins would collapse from 44% to **23%** the week the model is retired, and you'd have to raise prices on existing customers. Nobody forgives that.

**So the quotas below are set against $0.0050 per page**, which survives the migration. Today that gives you ~72% margin; after October it gives you ~42%. **You set the price once and never touch it again.** That's worth more than the extra quota you'd get from optimistic pricing.

> ⚠️ The successor prices come from published 2026 rate cards, not from your own bill. Confirm them before the migration. The telemetry table (task **P0-1**) will tell you your real numbers within a week of going live.

---

<a name="s1"></a>
## 1. How AI Scan should actually work

You pushed back on my three-layer design and you were right to. Here's the corrected version, built around what you actually said.

### 1.1 What you got right

**"If the user has to select everything, why not just search the POS?"** — Correct. The whole value is that they *don't* have to type. My layer 1 read like "the AI reads it, then you do the work." That's a worse product.

**"Who realises how much data is already there? That needs AI, another request."** — This is the one thing I explained badly, so let me be precise:

> **Matching costs zero API calls.** When the model returns `"col 1.5"`, matching that to `Coca Cola 1.5L` happens in **PHP and SQL on your own server** — the same code path as your existing product search box. No network call, no token, no cost. `FuzzyMatchService` already does exactly this for customer and supplier names today, on every single scan, and you've never paid a cent for it.

So the pipeline is not "AI → AI". It's **AI → free local matching → (rarely) one tiny AI call for leftovers.**

### 1.2 Your adaptive idea is right, but the trigger is catalog size, not scan count

You suggested: use the "send everything" approach early when there's no history, then switch to the cheaper approach once data accumulates. The instinct is correct. The trigger should be **how big the catalog is**, because that's what actually costs money:

| Catalog | Cost to send it inline |
|---:|---:|
| 50 SKUs | $0.00021 |
| 100 SKUs | $0.00042 |
| 200 SKUs | $0.00084 |
| 400 SKUs | $0.00168 |
| 800 SKUs | $0.00336 |
| 2,000 SKUs | $0.00840 |
| 20,000 SKUs | $0.08400 |

A brand-new store with 60 products: sending the whole catalog costs **a fifth of a cent** and gives the best possible accuracy. There is no reason not to.

A three-year-old store with 12,000 products: sending it costs **fifty times more than the scan itself**.

**So: send the catalog inline when it's under 300 products. Above that, use retrieval.** Same code, one `if`. New stores get maximum accuracy for free; big stores get a flat $0.0002 regardless of size. This is your idea, with the switch on the right variable.

### 1.3 The full flow

**Before the scan — three questions, asked once, remembered:**

1. **What are you making?** Purchase bill · Sales invoice · Expense · Return
   *(This alone decides what context gets sent. An expense never needs the product catalog.)*
2. **Who is it from/to?** — searchable dropdown of their existing parties, or "new"
   *(Kills the 300 party names, ~$0.00045/scan, and it's more accurate than the AI guessing from a letterhead.)*
3. **Is it handwritten?** — with an honest hint:
   > *Tick this if any part is handwritten. It uses our most accurate reading engine. If you leave it unticked and the result is wrong, re-scanning will use another page from your allowance.*

For expenses, one extra: **which category?** — dropdown. Kills the 200 category names.

**During the scan:**

| Step | What happens | Cost |
|---|---|---:|
| 1 | Send image(s) + short prompt + ≤25 learned aliases. Catalog included **only if under 300 products** | $0.0039 handwritten / $0.0007 printed |
| 2 | Model returns item names exactly as written | — |
| 3 | **Local matching, on your server, no API:** barcode → exact SKU → exact name → learned alias book → supplier's own item code → normalised text → phonetic (`pani`/`paani`) → trigram similarity | **$0** |
| 4 | Anything still unmatched (usually 2–5 lines): one Flash-Lite call with just those names plus a locally-retrieved shortlist of 10 candidates each | $0.0002 per document |
| 5 | Review screen. Every correction the user makes is written to the alias book **and** to the supplier code map | $0 |

**Step 5 is the compounding engine.** Every correction makes the next scan smarter and cheaper. After a few weeks step 4 barely fires. This is exactly the "costs us nearly nothing in the long run" outcome you described.

### 1.4 Supplier item codes — your idea, and it's the best one in this section

You spotted that printed supplier invoices carry the **supplier's own product code**, and that it's stable. That's a much stronger matching key than a name, because it never changes and never has a spelling variant.

**`supplier_sku_mapping` already exists as a feature key in your seeder — with zero implementation.** Build it:

- Table: `party_id` + `supplier_code` → `product_id`, with a hit counter
- Populated automatically from every confirmed scan
- Checked **first** in local matching, before any name comparison
- Result: after one confirmed invoice from Karim Traders, every future Karim Traders invoice matches on codes alone. **Step 4 stops firing entirely for that supplier.**

Your prefix/suffix pattern idea is real too, but do it after the exact-code map — the exact map handles 90% of it and can't be wrong.

### 1.5 Embeddings, in plain language

You said you don't know what an embedding is. Here it is without jargon:

> An embedding turns a piece of text into a list of about 256 numbers that describe its *meaning*. Similar meanings produce similar numbers. `"pani"`, `"water"` and `"Water Bottle 500ml"` land close together; `"Water Bottle"` and `"Car Battery"` land far apart. You compare them with ordinary arithmetic — no AI call.

Why it matters: fuzzy text matching can't connect `pani` to `Water Bottle 500ml` — the letters share nothing. An embedding can, because it works on meaning rather than spelling.

The economics are almost free:

- Embedding a **50,000-product catalog costs about $0.08, one time**
- A new product costs **$0.0000015**
- Matching afterwards is free, forever, and works offline

**This is phase 2, not phase 1.** Build local matching first (that gets you 70–85%), then add embeddings to close most of the remaining gap. Once embeddings are in, step 4 is nearly dead and your per-document cost is basically just the image.

---

<a name="s2"></a>
## 2. The shared product knowledge base

This is the strongest strategic idea you've had in these three rounds, and I want to be careful with it because it's also the one with the sharpest edge.

### 2.1 What it is

A platform-wide catalog of **product identity** — barcode, canonical name, category, description, pack size, brand. Built from what stores confirm during scans and imports. Used to:

- Pre-populate a new store's catalog by industry (grocery, pharmacy, hardware, café) so day one isn't an empty database
- Suggest the canonical name when a store adds a product ("Google search for products")
- Make matching better for everyone, because the alias book becomes shared for common items
- **Become a genuine moat.** Every competitor can copy your features. Nobody can copy a catalog of what Pakistani shops actually stock, contributed by thousands of shops.

You're right that it's small — it's text. A million products with descriptions is a few hundred megabytes.

### 2.2 The one thing you must not share: prices

You said *"we will be providing just the sale price and product description, their product name."*

**Do not share sale prices. Ever.** Three reasons, in order of severity:

1. **It's the fastest way to lose every customer you have.** A shop owner discovering that the software they pay for is showing their selling prices to the shop across the road will not file a support ticket. They will tell every shopkeeper they know. In a market where your entire growth thesis is "the whole city uses one software," word travels in exactly the direction you don't want.
2. **Price signalling between competitors is a competition-law problem**, not a grey area. A platform that aggregates and redistributes competitor pricing in the same local market is doing something regulators have specific names for. You're targeting the EU/UK inside 12 months — this is squarely in scope there.
3. **It's your customers' single most commercially sensitive number.** Margin is the whole business. It is the last thing they'd consent to sharing, and consent buried in a ToS won't protect you when it surfaces.

**Share product identity. Never share price, quantity, supplier, customer, or anything a competitor could use.**

| Share | Never share |
|---|---|
| Barcode / EAN | Sale price, cost price, margin |
| Canonical product name | Quantities, stock levels |
| Brand, pack size, unit | Supplier names or terms |
| Category | Customer names or any party data |
| Generic description | Which store contributed what |
| Product image *(only if the store uploaded it and opted in)* | Sales volumes |

This still delivers ~90% of the value. "Scan this barcode and we'll fill in the name, brand, size and category" is the feature people actually want. Nobody asked for their neighbour's prices.

### 2.3 How to do it honestly

- **Opt-in, off by default**, in Settings → Data:
  > ☐ **Help build the shared product catalog.** When on, product names and barcodes you confirm are added to VenQore's shared catalog, which helps every store identify products faster. **We never share your prices, stock levels, customers or suppliers — only public product identity.** You can turn this off any time.
- **Contribution is anonymous.** No store is ever identifiable as the source.
- **Only after N stores confirm.** A product enters the shared catalog once at least 3 different stores have confirmed the same barcode-to-name mapping. Prevents one typo becoming everyone's problem.
- **Barcode-keyed only** at first. Free-text names are messy; barcodes are unambiguous. Expand later.
- **Give something back immediately.** The moment they opt in, they get the lookup. Reciprocity, not extraction.
- **Say it on the pricing page**, not just in the ToS. It's a feature, not a confession.

### 2.4 The industry starter catalogs

You already have `industry_seeding` and `industry_templates_count: 16` in your plan matrix. Wire the shared catalog into it:

> **"Choose your business type."** → Grocery / Pharmacy / Hardware / Café / Restaurant / Mobile shop / Garments
> → New store opens with 200–500 of the most common products for that type, already named, categorised and barcoded. **Prices blank — you set your own.**

That is a genuinely great first-run experience and it's the single best argument for the shared catalog existing at all.

---

<a name="s3"></a>
## 3. Voice: use the browser, not the API

Your instinct here is exactly right and it saves you the entire audio cost line.

### 3.1 The two paths

| | **Browser dictation** *(default)* | **Audio upload** *(fallback)* |
|---|---|---|
| How | Web Speech API — the same thing your phone keyboard uses. Runs in Chrome/Edge/Android/iOS Safari | Record or upload, send to Gemini |
| Speech-to-text cost | **$0** | included in the API cost |
| Then | Text → transaction, on the cheap model | Audio → transaction, on the expensive model |
| Total cost | **$0.0004** | **$0.0073** for 2 minutes |
| User can edit before sending | **Yes** — big accuracy win | No |
| Works offline | No | No |
| Urdu / Pashto / Arabic | Supported, quality varies by browser | Better |

**Browser dictation is 18× cheaper and more accurate**, because the user sees the transcript and fixes "500" that came out as "5000" *before* it becomes a transaction. The edit step is the real win, not the money.

### 3.2 How to present it

> 🎤 **Speak your entry** — free, unlimited, works in most browsers
> 📎 *Or upload an audio file* — uses 1 page per 30 seconds

Make dictation the obvious default. Keep upload for noisy shops, older browsers, and forwarded WhatsApp voice notes (which is a real use case — a supplier sends a voice note, the shopkeeper forwards it).

**Caps on the upload path stay as agreed:** recorder stops at 120 seconds, server rejects over 180 seconds, 1 page-credit per 30 seconds started.

---

<a name="s4"></a>
## 4. Pages, images and what we count

### 4.1 The unit is a page

Confirmed: **per page, no free first page.**

- 1 page = 1 credit. A 3-photo invoice = 3 credits.
- **Maximum 5 pages per document, on every plan.** Locked, as you asked — the differentiation lives elsewhere.
- 1 credit per 30 seconds of uploaded audio.
- Browser dictation: free, unmetered.
- The UI states it before submit: *"3 photos — this will use 3 of your 300 pages."*

### 4.2 Your PDF question, answered

**Is one call with 5 pages cheaper than five calls with 1 page each?** Slightly — you save the shared prompt overhead, about **$0.0016 per document**. Not much.

**But it's 1 request instead of 5**, and requests-per-minute is your binding constraint, not money. So: **keep multi-page in a single call, capped at 5.**

**PDFs over 5 pages:** split server-side into documents of 5, show it plainly before charging:

> *This PDF has 14 pages. It will be processed as 3 documents and use 14 of your 300 pages. Continue?*

Never silently truncate and never silently charge. Show the number, ask once.

### 4.3 The photo guidance you asked for — and it saves real money

You're right that a tighter crop is both more accurate and cheaper. Gemini charges by image tiles, so a photo of a whole A4 page with one line of text on it costs the same as a dense invoice — and reads worse.

**Build this into the capture screen:**

- A live framing guide with the message: *"Fill the frame with the bill. Closer = more accurate."*
- **Automatic document edge detection and crop** before upload — client-side, free, and it removes the table, the floor and the shopkeeper's hand
- Auto-deskew and auto-contrast
- Downscale to 1,568px on the longest edge, JPEG quality 80
- A blur check: if the image is too blurry, say so **before** spending a page
- Three small example images: ✅ tight and straight · ⚠️ too far away · ❌ blurry

The blur check alone will save more pages than any other single change, because a rejected scan today costs a page and produces nothing.

---

<a name="s5"></a>
## 5. Base plans

### 5.1 The four tiers

| | **Counter** | **Starter** | **Growth** | **Business** |
|---|---|---|---|---|
| **Monthly** | **$18** | **$36** | **$63** | **$129** |
| **Annual** *(2 months free)* | $180 | $360 | $630 | $1,290 |
| For | Café, restaurant, kiosk, single till | Small retail shop | Multi-counter, multi-branch retail | Chain, wholesale, distribution |
| **Product SKUs** | **500** | **5,000** | **20,000** | **50,000** |
| Transactions / month | Unlimited | Unlimited | Unlimited | Unlimited |
| Locations | 1 | 1 | 3 | 10 |
| Staff accounts | 2 | 3 | 10 | 50 |
| **AI pages included** | **10 / mo** | **20 / mo** | **60 / mo** | **150 / mo** |
| AI queries included | 50 | 100 | 400 | 1,000 |
| BYOK unlock | $19 | $19 | $19 | $19 |
| — | | | | |
| POS, offline mode, barcode, receipts | ✓ | ✓ | ✓ | ✓ |
| Sales invoices, basic stock, low-stock alerts | ✓ | ✓ | ✓ | ✓ |
| Customer list (name + phone) | ✓ | ✓ | ✓ | ✓ |
| **Cookbook / recipes** | ✓ *(café & restaurant types)* | ✓ | ✓ | ✓ |
| **Customer & supplier ledger (khata)** | ✗ | ✓ | ✓ | ✓ |
| **Receivables, payables, aging** | ✗ | ✓ | ✓ | ✓ |
| **Purchase orders, supplier management** | ✗ | ✓ | ✓ | ✓ |
| **Double-entry accounting, P&L, trial balance** | ✗ | ✓ | ✓ | ✓ |
| **Expense manager** | ✗ | ✓ | ✓ | ✓ |
| Reports | 4 basic | full (~45) | full | full |
| Multi-branch, stock transfer | ✗ | ✗ | ✓ | ✓ |
| Production / BOM | ✗ | ✗ | ✓ | ✓ |
| Loyalty, gift cards, campaigns | ✗ | ✗ | ✗ | ✓ |
| API access, white-label | ✗ | ✗ | ✗ | ✓ |
| WooCommerce / Amazon sync | $10/mo each | $10/mo each | $10/mo each | $10/mo each |

**The 10 free AI pages on Counter cost you $0.05/month.** You were hesitant, and I'd push once: a café owner who photographs one supplier bill and watches it become a purchase entry is the cheapest advertisement you will ever buy for the AI add-on. Nobody buys AI they've never seen work. Five cents.

**Cookbook on Counter:** yes, for café and restaurant business types, as you said. It's the reason that segment picks you.

### 5.2 The value badges you asked for

You wanted each plan card to show how much more economical the bigger plan is. Using cost per SKU:

| Plan | Price | SKUs | **Per SKU** | Badge on the card |
|---|---:|---:|---:|---|
| Counter | $18 | 500 | $0.036 | — |
| Starter | $36 | 5,000 | $0.0072 | **5× better value per product** |
| Growth | $63 | 20,000 | $0.0032 | **11× better value per product** |
| Business | $129 | 50,000 | $0.0026 | **14× better value per product** |

Every number is arithmetic on your own published prices. Nothing invented.

Second badge, the "bought separately" stack — again, only real prices from your own site:

> **Growth — $63/month**
> · 2 extra locations — **$20/mo** at our add-on price
> · 7 extra staff seats — **$35/mo** at our add-on price
> · 60 AI pages + 400 queries — **$1/mo**
> **Buying these on Starter: $92/month. Growth is $63.**

### 5.3 Cannibalisation — your call, and it's the right one

You said if a customer fits in Counter and saves money, that's fine, they're still a customer. I agree, with one guard: **the wall between Counter and Starter must be the ledger, not the SKU count.**

> **Counter = sell things. Starter = run a business.**
> The moment you need to know who owes you money, what you owe your supplier, or what your actual profit was — that's Starter.

At 500 SKUs, a café (60 items) is comfortable and a small grocery (800+ items) is pushed up naturally. The boundary works on both axes.

### 5.4 Downgrades — the policy, in writing

Agreed as you said, stated properly so it can be built:

- **Nothing is ever deleted on downgrade.** Data becomes read-only and hidden.
- Banner in the hidden area: *"You have 214 supplier bills and Rs 840,000 of recorded payables archived. Upgrade to Starter to reopen them."*
- **Block the downgrade** if there are open payables or receivables above zero, and say why. Offer "settle or archive" first.
- **SKU overage:** if they have 3,000 products and downgrade to Counter's 500, nothing is deleted. New product creation is frozen and a banner explains it.
- 30-day grace before anything is hidden, so an accidental downgrade is recoverable.

---

<a name="s6"></a>
## 6. AI add-ons

### 6.1 The tiers

Priced against **$0.0050/page** so they survive the October model migration without a price change.

| | **AI Spark** | **AI Shop** | **AI Pro** | **AI Max** |
|---|---|---|---|---|
| **Price / month** | **$3** | **$6** | **$12** | **$24** |
| **Pages / month** | **300** | **600** | **1,200** | **2,400** |
| AI queries / month | 1,500 | 3,000 | 6,000 | 12,000 |
| Your cost at full cap *(post-Oct)* | $1.65 | $3.30 | $6.60 | $13.20 |
| Net after 5% *(single cart)* | $2.85 | $5.70 | $11.40 | $22.80 |
| **Margin at full cap, post-October** | **42%** | **42%** | **42%** | **42%** |
| *Margin at today's model prices* | *72%* | *72%* | *72%* | *72%* |
| *Margin at realistic 30% usage* | *~83%* | *~83%* | *~83%* | *~83%* |

**300 pages for $3 covers essentially every small shop with 4× headroom** — a busy shop receives 20–80 supplier pages a month. That's the "can't live without it" feeling you wanted, at 42% worst-case margin.

### 6.2 The capability ladder — simplified after your feedback

You didn't like some of my rungs. Fair — two of them were bad.

**Removed: "custom extraction fields."** You were right to question it. It meant tenant-defined extra fields (a pharmacy wanting batch number and expiry pulled out automatically). Since the review screen already lets users edit everything, the value is thin and it complicates the ladder. Drop it. Revisit only if pharmacy customers actually ask.

**Kept, but it needs building: bulk folder upload.** You're right that it doesn't exist. It's genuinely valuable for a wholesaler with 40 bills at month-end, and it's a clean Pro-tier reason. It goes in the pipeline, not the first release.

| | Spark $3 | Shop $6 | Pro $12 | Max $24 |
|---|---|---|---|---|
| Image scan, handwritten + printed | ✓ | ✓ | ✓ | ✓ |
| **Pages per document** | **5** | **5** | **5** | **5** |
| Browser dictation | ✓ | ✓ | ✓ | ✓ |
| AI assistant queries | ✓ | ✓ | ✓ | ✓ |
| **Audio file upload** | ✗ | ✓ | ✓ | ✓ |
| **Multi-page PDF** | ✗ | ✓ | ✓ | ✓ |
| **Bulk folder upload** *(build later)* | ✗ | ✗ | ✓ | ✓ |
| **Priority queue at peak** | ✗ | ✗ | ✓ | ✓ |
| **Growth Engine AI signals** | ✗ | ✗ | ✓ | ✓ |
| **Scan API endpoint** | ✗ | ✗ | ✗ | ✓ |

Pages per document stays at 5 everywhere, as you asked.

### 6.3 Rules

- **Hard stop at the cap.** Never auto-bill overage.
- At 80%: email + in-app warning with both options — upgrade, or attach your own key.
- **Top-up: 200 extra pages for $2.** One-time, doesn't change the subscription.
- **Credits don't roll over.**
- The word "unlimited" appears **nowhere** in the AI product.

---

<a name="s7"></a>
## 7. Bring Your Own Key

**$19 one-time. Paid on every plan, including Counter. Never given away free.**

That's your instinct and it's the right one — it's real revenue for something that costs you nothing, and free things get valued at what they cost.

**On the discount framing**, you gave me the call, so: **no permanent strike-through.** You told me you're a person of truth and don't want a single false line — a crossed-out $50 you never charged is that same false line in number form, and it's specifically illegal under the EU Omnibus Directive and UK CMA rules, which matter to you inside 12 months.

**Do this instead — real urgency, real deadline:**

> **Use your own AI key — free forever after a one-time unlock.**
> **$9 until 30 September. $19 from 1 October.**
> Managed AI starts at $3/month. If you already have a Google or OpenAI key, this pays for itself in three months and then costs you nothing for as long as you use VenQore.

Then **actually raise it on 1 October.** Real scarcity converts better than permanent fake scarcity, because customers can tell the difference and the ones who can are the ones who tell other people about you.

**Trial:** BYOK is free during the 14-day trial, capped at 50 pages. After that they buy the unlock or buy an AI tier. Costs you nothing and converts the technical, price-sensitive shop owner who is otherwise your hardest sale.

---

<a name="s8"></a>
## 8. Product descriptions & listing content

Confirmed: **keep it visible, not hidden.** You're right that it's not an Amazon-only feature — anyone building a WooCommerce store or a web catalog needs it.

### 8.1 Three products, one screen

| | **AI Generate** | **Human Written** | **List → Catalog** |
|---|---|---|---|
| What | AI writes title, short + long description, tags, category | A person writes it properly | Photo/PDF/text list of products → clean importable file |
| Speed | Seconds | 2–5 working days | Minutes |
| Price | **From $0.019/product** | **$1/product**, +$0.50 per variant | **1 page credit per page of list** |
| Free allowance | **50 free** on any paid plan | — | included in AI pages |
| Best for | Bulk catalogs, first setup, "good enough" | Amazon listings, hero products, competitive categories | Migrating from paper or a competitor |

Both paths on the same screen, with an honest comparison. Some customers will use AI for 400 products and human for their 20 best sellers — that's the ideal outcome and the UI should make it obvious.

### 8.2 AI credit packs

| Pack | Price | Per product |
|---|---:|---:|
| **50 free** on any paid plan | $0 | — |
| 200 descriptions | **$6** | $0.030 |
| 500 descriptions | **$12** | $0.024 |
| 2,000 descriptions | **$39** | $0.019 |

Credits **never expire** — they cost you nothing to hold, and non-expiring credits are a trust signal in a market full of expiring ones.

The margin here is very high, and that's fine: the customer's alternative is paying a person hundreds of dollars over several weeks. $39 and ten minutes is a genuine bargain even so. Rare case where a big margin and great value coexist.

**Ask the target before generating** — WooCommerce, Amazon, generic web, or in-store only. Each needs different length, tone and structure. Same cost, much better output.

### 8.3 "List → Catalog" — the feature you described and I missed

You asked: what if someone hands us a handwritten list, or a PDF, or a WhatsApp message, and wants their products created? That's a distinct feature and it's arguably the **best onboarding tool you could build**:

1. Upload photos of a handwritten stock list, a supplier PDF, a competitor's export, or paste WhatsApp text
2. AI extracts name / pack size / cost / price / barcode into a table
3. Lands in your **existing** import review screen (`ImportMappingController` + `DataImportService` already exist)
4. User fixes anything wrong, hits import
5. Optionally chain into AI Generate for descriptions

**Why this matters more than descriptions:** the number one reason a shop abandons a new POS is that setting up the catalog is a week of typing. This turns that week into an afternoon. It is a *sales* feature, not a convenience feature, and it should be prominent in onboarding and in the trial.

Meter it at **1 page credit per page of list.** A 3-page stock list = 3 credits, same as any scan. Simple and consistent.

### 8.4 AI product images — my honest recommendation is don't

You raised this yourself and your instinct is right. As someone who's done Amazon VA work you already know the problem; here it is written down:

- **Amazon's main image rules are strict**: pure white RGB(255,255,255), product filling 85% of frame, no text, no watermark, no props, and it must be **an actual photograph of the actual product**. Generating an image of a product you're selling is misrepresentation, and Amazon suspends accounts for it.
- **AI can't reliably produce a specific real product.** It produces something that looks like the category. For a listing, that's worse than useless.
- The watermarking you mentioned is a real and growing constraint across providers.

**Offer this instead — it's deterministic, compliant, and cheap:**

| Feature | How | Amazon-safe? |
|---|---|---|
| **Background removal → pure white** | Segmentation on the seller's own photo | ✅ Yes, this is the standard workflow |
| Auto-crop to 85% fill | Deterministic image maths | ✅ Yes |
| Resize to 2000×2000, sRGB | Image library | ✅ Yes |
| Infographic overlays (dimensions, features) | Template + their text | ✅ Yes, for secondary images |
| Lifestyle scene generation | AI | ⚠️ Grey — only for secondary images, never main |
| Generating the product itself | AI | ❌ **No. Don't offer it.** |

*"Upload your phone photo, get seven Amazon-ready images"* is a real, sellable, compliant product. It's also mostly not AI, which makes it cheaper and more reliable. **Price it as a pack: 7 images for $4, or $0.80 per image.** Build it after the sync work.

---

<a name="s9"></a>
## 9. The free public tool

**My opinion: yes, do it. It fits your existing strategy perfectly — and it needs hard guardrails from day one.**

You already have **27 free marketing tools** (`Marketing/Tools/`) — invoice makers, barcode generators, price tags, a CSV cleaner, ROI calculators. A "photograph a bill → get a clean invoice" tool is the natural flagship of that set, and it's the only one that demonstrates the thing that actually differentiates you.

### 9.1 Why it works here specifically

- The scan **needs no database and no catalog** — which is exactly the cheap path. $0.0039 a use.
- It's the perfect demo. Nobody understands "AI Scan" from a feature bullet. Everybody understands watching their own handwritten bill turn into a clean invoice in eight seconds.
- It **feeds the shared product knowledge base** (§2), so it makes your moat deeper while it markets you.
- It has a natural, honest upgrade line: *"Want this to update your stock and post to your ledger automatically? That's VenQore."*
- `ProductCsvCleaner.jsx` already exists — you've built this shape before.

### 9.2 The cost exposure, and why guardrails aren't optional

| Uses / day | Cost / day | Cost / month |
|---:|---:|---:|
| 100 | $0.39 | $12 |
| 500 | $1.95 | $59 |
| 2,000 | $7.80 | $234 |
| 10,000 | $39.00 | **$1,170** |

If it works, it goes to the top of the second column overnight. If someone scripts it, it goes there in an hour.

### 9.3 The guardrails — all of them, not some

1. **Email required** before the first result. Not a signup — one field. This is the whole point of the tool: it's a lead magnet.
2. **3 documents per day per email**, **10 per day per IP**, **1 page per document** on the free tool.
3. **Cloudflare Turnstile** on submit. Free, invisible to real users, stops scripts.
4. **A global daily budget cap** — e.g. $10/day — that switches the tool to a waitlist form when hit. Not a rate limit; an actual spending kill-switch.
5. **Output is watermarked** with a small VenQore mark, removable by signing up.
6. **Nothing is stored** beyond 24 hours unless they opt in to the shared catalog.
7. **No catalog, no database, no account context** — keeps it cheap and keeps it safe.
8. **A real cost dashboard** so you see spend per day without checking Google.

With guardrails: 500 emails/month for $59 is **12 cents a lead**, and they're pre-qualified — they own a shop and they have paper bills. That's excellent. Without guardrails it's an unbounded liability.

---

<a name="s10"></a>
## 10. Vena on public pages — the open door

You were right to worry, and it's worse than you thought. **This is the most urgent security item in any of these three documents.**

### 10.1 What I found

`routes/api.php` lines 78–80:

```
POST /api/{store_slug}/chatbot/session
POST /api/{store_slug}/chatbot/session/{uuid}/message
POST /api/{store_slug}/chatbot/session/{uuid}/typing
```

- **No authentication**
- **No throttle middleware — none at all**
- Message body limit: `max:10000` characters — roughly 2,500 tokens per message
- **No limit on messages per session, sessions per IP, or total spend**

That is a **free, public, unmetered LLM endpoint on your API key.** Anyone who finds it can use your Gemini billing as their own. A trivial script sending 10,000-character messages in a loop could run up hundreds of dollars in a night, and you'd find out from the invoice.

**This is live now, before you've even put the widget on public pages.** It is task **P0-0** in the technical file — before anything else in this entire plan.

### 10.2 What it needs before it goes on public pages

1. **Rate limits at three levels**: per session (20 messages), per IP (40/hour, 100/day), per store (500/day)
2. **Shorten the input** — 10,000 characters is absurd for a support chat. **500 characters** is generous.
3. **Cloudflare Turnstile** on session start
4. **A global daily spend cap** with automatic shutoff and an alert to you
5. **Topic restriction** — a system instruction that refuses anything not about this store or VenQore, plus an output check. Otherwise you are running a free general-purpose chatbot for the internet.
6. **Prompt-injection guard** — strip instruction-like patterns, never let visitor text override the system prompt
7. **Flash-Lite, `maxOutputTokens` capped at 300.** A support answer doesn't need 8,192 tokens.
8. **Cache common answers.** "What are your prices?" should be a stored answer, not an API call. Realistically 60–70% of visitor questions are the same 20 questions.
9. **Log every call** to `ai_usage_events` with `feature = 'visitor_chat'` so you can actually see it
10. **A kill switch** in the platform admin that disables it instantly without a deploy

Points 8 and 10 are the ones people skip and regret.

---

<a name="s11"></a>
## 11. AppSumo

You want short-term cash and early customers, and you're willing to lose a little for good reviews and volume. That's a legitimate strategy. Here's how to do it without bleeding.

### 11.1 The economics

AppSumo's split is negotiated per partner and isn't published; partner reports put it at **65–80%** to AppSumo. **Confirm your actual number before committing.**

| List price | You keep 30% | You keep 35% | Minus 2yr hosting (~$24) @30% |
|---:|---:|---:|---:|
| $69 | $20.70 | $24.15 | **−$3.30** |
| $89 | $26.70 | $31.15 | +$2.70 |
| **$99** | **$29.70** | **$34.65** | **+$5.70** |
| $149 | $44.70 | $52.15 | +$20.70 |
| **$199** | **$59.70** | **$69.65** | **+$35.70** |
| $299 | $89.70 | $104.65 | +$65.70 |
| **$349** | **$104.70** | **$122.15** | **+$80.70** |

**At $69 you lose money before a single support ticket.** That's the number that matters.

### 11.2 Recommended tiers

**$99 / $199 / $349**, three stacking codes.

| | **1 code — $99** | **2 codes — $199** | **3 codes — $349** |
|---|---|---|---|
| Equivalent to | Starter | Growth | Business |
| Locations | 1 | 3 | 10 |
| Staff | 3 | 10 | 25 |
| **Product SKUs** | 5,000 | 20,000 | 50,000 |
| **Transactions / month** | **1,000** | **3,000** | **8,000** |
| Ledger, payables, receivables, P&L | ✓ | ✓ | ✓ |
| Multi-branch, production/BOM | ✗ | ✓ | ✓ |
| Loyalty, gift cards, campaigns | ✗ | ✗ | ✓ |
| **BYOK unlock ($19 value)** | **✓ included** | **✓ included** | **✓ included** |
| **Managed AI** | **✗ never** | **✗ never** | **✗ never** |
| **AI pages included** | 20/mo | 60/mo | 150/mo |
| WooCommerce / Amazon sync | paid add-on | paid add-on | paid add-on |
| API, white-label | ✗ | ✗ | ✓ |
| Hosting | 2 years, then $9/mo | 2 years, then $9/mo | 2 years, then $9/mo |

**Your net at a 30% split: +$5.70 / +$35.70 / +$80.70 per code, after two years of hosting.** Positive at every tier. If you negotiate 35%, add roughly $5 / $10 / $17.

At 1,500 codes with a typical AppSumo mix (roughly 50/35/15 across tiers), that's around **$45,000 net** plus a few hundred public reviews and a live user base to build on. That's the launchpad you're after.

### 11.3 The five rules

1. **Managed AI is never included in a lifetime deal.** A one-time payment against a recurring per-token cost has no ceiling. LTD buyers get the **BYOK unlock free** — genuinely attractive, $19 of stated value, costs you exactly zero. The 20/60/150 included pages are the same tiny allowance the paid plans get, and they're bounded.
2. **Keep the transaction caps.** 1,000 / 3,000 / 8,000 per month. Subscriptions get unlimited; lifetime deals don't. Buyers accept this — it's standard on AppSumo — but it must be stated plainly on the listing, not in a footnote.
3. **Enforce the hosting window in code.** `hosted_until` is currently a config string with nothing acting on it. You need the expiry job, the 60/30/7-day emails, and the $9/mo continuation checkout **live before launch.** In two years you'll have thousands of these and no way to bill them.
4. **Sync add-ons stay paid.** WooCommerce and Amazon carry real per-tenant cost. Never bundle.
5. **Write the fair-use clause before you sell**, not when someone abuses it.

### 11.4 Before you apply

- **Fix the false claims first** (§10 of V2 / task **P1-9**). AppSumo's review process and its extremely vocal buyers will find "99.2% accuracy" and "99.9% SLA", and a bad launch there is public and permanent.
- Confirm your real revenue split.
- Have transaction-cap enforcement and the `hosted_until` job **live**.
- Have a help centre with 20–30 articles before day one.

---

<a name="s12"></a>
## 12. Hosting, database and storage

### 12.1 Don't move to PostgreSQL. Not now.

Someone told you to move and it's not bad advice in the abstract, but it's wrong for you today:

- Your `CLAUDE.md` documents a **strict MySQL policy**, and your codebase leans on it — **MySQL triggers** guarding journal-entry integrity, `updateOrInsert`, MySQL-specific JSON functions, `whereRaw('LOWER(name) = ?')`, MySQL full-text search.
- Migrating is **3–6 weeks of work and meaningful risk** to an accounting system where a subtle bug means wrong money.
- At **2 users**, it buys you nothing measurable.
- Your immediate priorities — AI Scan, WooCommerce, Amazon — are all blocked by it and none of them are helped by it.

**Revisit at 500+ active tenants**, when the real reasons appear: JSONB, table partitioning, and `pgvector` for the embedding work in §1.5. Note that MySQL 9 has a native `VECTOR` type too, so even that isn't decisive. At your scale, brute-force cosine similarity in Redis is fine and needs no migration at all.

**One thing to check now:** confirm you're on **MySQL 8.0+** (not 5.7 — end of life, and its JSON and CTE support is weak).

### 12.2 Storage — you're not paying for S3, and that's a problem waiting

`FILESYSTEM_DISK=local`. Your scanned invoices, backups and uploads are on **Hostinger's 200GB disk**, not S3. So there's no S3 bill — but:

- A scanned page after downscaling is ~200KB. **1,000 tenants × 50 pages/month = 10GB/month.** You'd fill 200GB in about 18 months, and that disk also holds your database and backups.
- Local disk means **no redundancy**. If that VPS dies, the invoice images die with it.
- Backups on the same disk as the data is not a backup.

**Recommendation:**

1. **Move file storage to Cloudflare R2** — your `config/filesystems.php` line 77 already has an R2 disk defined, so the plumbing exists. R2 charges **$0.015/GB/month and zero egress**. 100GB = **$1.50/month**. S3 would charge you for every download.
2. **Retention policy:** keep the original scan image for **90 days**, then delete and keep only the extracted JSON. The image has no value after the transaction is confirmed. This caps growth permanently.
3. **Backups to a different provider than hosting.** Non-negotiable for an accounting system.
4. **Instrument it** — you don't know your storage usage today. Add it to the platform dashboard.

### 12.3 Hosting

Hostinger cloud, prepaid, is fine for now and through the AppSumo launch if you use queues properly. Two things to plan:

- **Redis** for the rate limiter, cache and queues. Confirm it's available; if not, that's the first hosting upgrade you need — the token bucket in the technical file depends on it.
- **Before AppSumo**, load-test with 500 concurrent tenants. An AppSumo launch is not gradual.

### 12.4 SMS, WhatsApp and email — the audit you need

You said SMS/WhatsApp don't work and you don't know where email goes. That's three unknown cost and reliability lines in a product you're about to sell. `whatsapp_reminders`, `sms_debt_alerts`, `sms_gateway` and `invoice_reminders` are all advertised feature keys.

**Either make them work or remove them from the pricing page.** Selling a feature that doesn't function is the same problem as the fabricated tech specs, just less obvious. Task **P1-11** in the technical file is a full audit: what's configured, what's live, what it costs per message, what it should cost the customer.

---

<a name="s13"></a>
## 13. What "budget for support" means

You asked, and it wasn't about hiring staff. Concretely:

**An AppSumo launch delivers 1,000–3,000 tenants in about two weeks.** Not gradually — all at once, on day one, and they are technical, curious, impatient buyers who paid once and expect everything.

What that looks like in practice:

- **Ticket volume:** industry norm is 20–40% of new users file at least one ticket in the first month. At 1,500 users that's **300–600 tickets in weeks 1–4**, concentrated in the first five days.
- **They are public.** AppSumo has a review section and a Q&A on the deal page. Slow replies in week one become permanent 2-star reviews that suppress sales for the entire campaign.
- **They find every bug.** 1,500 shops using your product in ways you never imagined, simultaneously. Expect a rough first fortnight.
- **AppSumo expects a response-time commitment** as part of the partner agreement.

**What actually reduces it — do these before launch, not after:**

| | Impact |
|---|---|
| **20–30 help centre articles** covering setup, import, POS basics, plan limits | Deflects 40–60% of tickets |
| **In-app onboarding checklist** for the first session | Deflects the "where do I start" wave |
| **Vena widget** answering from those articles (with §10 guardrails) | Deflects another chunk, 24/7 |
| **A public status page** | Kills "is it down?" tickets instantly |
| **A known-issues page** updated daily during launch week | Stops the same bug generating 50 tickets |

Your one or two helpers plus that groundwork is enough. **Without the groundwork it isn't**, and no amount of people fixes it in week one.

---

<a name="s14"></a>
## 14. Everything you need to create in Lemon Squeezy

**Critical:** all recurring items must go into **one cart per checkout** so the $0.50 fixed fee is charged once. See task **P0-6**.

### Subscriptions — monthly and annual variants each

| Product | Monthly | Annual |
|---|---:|---:|
| VenQore Counter | $18 | $180 |
| VenQore Starter | $36 | $360 |
| VenQore Growth | $63 | $630 |
| VenQore Business | $129 | $1,290 |

### AI add-ons — monthly, subscription

| Product | Price |
|---|---:|
| AI Spark | $3/mo |
| AI Shop | $6/mo |
| AI Pro | $12/mo |
| AI Max | $24/mo |

### Quantity-based subscription add-ons

| Product | Price |
|---|---:|
| Extra staff seat | $5/mo each |
| Extra location | $10/mo each |

### Sync add-ons — monthly

| Product | Price |
|---|---:|
| WooCommerce sync | $10/mo |
| Amazon sync | $10/mo |

### One-time purchases

| Product | Price | Notes |
|---|---:|---|
| BYOK unlock | **$9** launch → **$19** from 1 Oct | Real price change, honour the date |
| AI page top-up — 200 pages | $2 | Repeatable |
| AI descriptions — 200 | $6 | Credits never expire |
| AI descriptions — 500 | $12 | |
| AI descriptions — 2,000 | $39 | |
| Human description — per product | $1 | Quantity-based |
| Human description — extra variant | $0.50 | Quantity-based |
| Listing image pack — 7 images | $4 | *Build later* |

### Existing products to retire or hide

- All four current AI tiers (Core / Lite / Pro / Ultimate) — replaced
- Any direct-site LTD variants — hidden, AppSumo only
- Verify old Starter/Growth/Business variants at $19/$39/$79 aren't still live anywhere

---

<a name="s15"></a>
## 15. Order of work

Matching your stated priorities: **don't lose money → nobody can abuse it → AI live → sync live.**

| Phase | What | Days | Why here |
|---|---|---:|---|
| **0** | **Stop the bleeding** — lock the open Vena endpoint, add telemetry, kill the catalog dump | 6–7 | You cannot price or launch anything until spend is bounded and visible |
| **1** | **Make AI Scan correct and cheap** — pre-scan questions, local matching, supplier codes, image handling, model routing | 8–10 | The product you want live first |
| **2** | **Metering & enforcement** — pages unit, quotas, rate limiter, async, single-cart checkout | 6–7 | Required before charging anyone |
| **3** | **Feature gates wired properly** — the enforcement layer, all keys, not just Counter's | 8–10 | You asked for all of them; every future tier is free afterwards |
| **4** | **New pricing live** — 4 base plans, 4 AI tiers, add-ons, BYOK, value badges | 5–6 | |
| **5** | **Truth & trust** — remove false claims, status page, privacy, opt-ins | 3 | Must be done before AppSumo |
| **6** | **WooCommerce + Amazon live** | — | Your stated next priority |
| **7** | **Growth** — free public tool, shared catalog, List→Catalog, descriptions | — | |
| **8** | **AppSumo readiness** — caps, hosting expiry, help centre, load test | — | |
| **9** | **Later** — embeddings, bulk upload, listing images, restaurant dashboard, model migration before 16 Oct | — | |

**Roughly 7–8 weeks to "new pricing live with AI".** Full task-by-task breakdown with file paths is in the technical file.

---

<a name="s16"></a>
## 16. Open questions

**Q1. Is your MySQL 8.0 or higher?** If it's 5.7, that's an upgrade before anything else — it's end-of-life and several things in the plan assume 8.0.

**Q2. Do you have Redis on the Hostinger plan?** The rate limiter, the queue and the spend kill-switch all need it. If not, that's your first infrastructure change.

**Q3. What's your real per-tenant hosting cost?** Prepaid isn't free — divide what you paid by the term and by realistic tenant count. It changes the AppSumo tier-1 decision by a few dollars per code.

**Q4. Are SMS/WhatsApp/email meant to ship at launch, or come off the pricing page?** Three advertised features currently in unknown states.

**Q5. Do you want the shared product catalog opt-in shown during onboarding, or buried in settings?** Onboarding gets far higher opt-in rates and is arguably more transparent — but it's one more step in a first-run flow you want short.

**Q6. Grandfathering.** When the new prices go live, do your existing users keep their price forever, for 12 months, or move immediately? You have 2 users so it's cheap to be generous — but write it down now, before you have 200.

**Q7. Which business types get Cookbook on Counter?** You said café and restaurant. What about bakery, juice bar, food truck, cloud kitchen? Draw the line now or it becomes a support argument.

**Q8. The free public tool — do you want it live before or after AppSumo?** Before means more traffic and more shared-catalog data at launch. After means one less thing to support during the worst two weeks.

---

**Sources**

- [Gemini API — Billing](https://ai.google.dev/gemini-api/docs/billing)
- [Gemini pricing 2026 — every model, and the thinking tokens](https://www.cloudzero.com/blog/gemini-pricing/)
- [Gemini 2.5 Flash API pricing](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash)
- [AppSumo — Partner Payments Policy](https://appsumo.com/partner-terms/payment-policy/)
- [How does AppSumo calculate revenue share?](https://appsumo.com/blog/breaking-down-appsumo-revenue-share)
