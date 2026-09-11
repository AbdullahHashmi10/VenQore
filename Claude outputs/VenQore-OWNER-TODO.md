# VenQore: your launch to-do list

11 September 2026. This combines everything Claude and Codex have asked you to do. Engineering work is listed separately at the end, and those items are not yours.

---

## 0. Score

| Measure | Score | Meaning |
|---|---|---|
| **Build readiness** (code, tests, security fixes) | **92 / 100** | Almost all of the code work is done. 2,651 backend tests, 126 frontend tests and 56 browser checks pass. Dependency audits are clean. The last 8 points are engineering items listed in section 6. |
| **Launch certification** (Codex's 20-gate rubric, 5 points per gate) | **10 / 100 today** | Only G02 (dependencies) and G03 (frontend tests) have been independently signed off. |
| After Codex checks the saved evidence (G01, G04, G06) | about 25 / 100 | Engineers can do this without you. |
| After your items below plus staging checks | 100 / 100 | The other 15 gates need your accounts, a staging server, your hardware or your decisions. |

The two numbers are different on purpose. The product is almost built. What's missing is proof on the real hosting setup, and most of that proof needs your access.

---

## 1. Email addresses

### 1a. Create these 10 addresses: 1 real inbox plus 9 forwards

All of these appear on the live site, in the legal pages or in app settings. A customer who writes to one and gets a bounce is a trust problem. They're also a legal problem for privacy@ and legal@.

| # | Address | Where it appears | Create as |
|---|---|---|---|
| 1 | **hello@venqore.com** | Contact page, site footer, sender of every app email (`MAIL_FROM_ADDRESS`), contact-form notifications (`CONTACT_NOTIFICATION_ADDRESS`), queue-failure alerts | **Real inbox**, and also the sending address in Resend |
| 2 | **support@venqore.com** | Terms of Service, Refund Policy, help docs | Forward → hello@ |
| 3 | **privacy@venqore.com** | Privacy Policy (data-rights requests, which you must answer within 30 days), Refund Policy | Forward → hello@ |
| 4 | **legal@venqore.com** | Terms of Service (twice), Privacy Policy (GDPR data-processing agreement requests) | Forward → hello@ |
| 5 | **security@venqore.com** | Terms, Privacy Policy (vulnerability reports) | Forward → hello@ |
| 6 | **partners@venqore.com** | Contact page (reselling, white-label and integration enquiries) | Forward → hello@ |
| 7 | **founder@venqore.com** | Contact page (enterprise enquiries), partner-form notifications (`PARTNER_NOTIFICATION_ADDRESS`) | Forward → your personal inbox |
| 8 | **billing@venqore.com** | The support team's canned reply for refunds tells customers to write here | Forward → hello@ |
| 9 | **dpo@venqore.com** | Data-processing inventory (listed as the data protection contact) | Forward → privacy@ / hello@ |
| 10 | **support-offline@venqore.com** | Used as the reply-to address on chat tickets when a visitor leaves no email, so a reply sent there must not bounce | Forward → support@ / hello@ |

**Cheapest setup (no new spending):**

1. **Receiving:** use Cloudflare Email Routing (free on all plans). Add venqore.com and create the 10 addresses as routes to your own Gmail, or one route to hello@ forwarded to Gmail. Cloudflare adds the MX records for you. Keep any existing mail DNS records if you already have a mailbox provider.
2. **Sending app emails** (sign-up codes, receipts, resets): use Resend's free plan, which allows **3,000 emails a month and 100 a day** (Pro is $20/month for 50,000). Verify venqore.com in Resend and add the SPF and DKIM records it gives you to Cloudflare DNS exactly as shown. Add a DMARC record starting with `v=DMARC1; p=none; rua=mailto:hello@venqore.com`. The production `.env` settings are in section 5. The daily sign-in code budget is already capped at 90 (`VQ_OTP_GLOBAL_DAILY_BUDGET`) so it stays under the 100/day limit.
3. **Replying as hello@ from Gmail (optional):** in Gmail, go to Settings → Accounts → "Send mail as" and add hello@venqore.com with SMTP `smtp.resend.com`, port 465, username `resend`, password = a Resend API key.
4. **Test:** send a sign-up code to a real Gmail and a real Outlook address. It must land in the inbox, not spam. Then check the email headers show SPF, DKIM and DMARC all passing.

Cloudflare Email Routing only receives mail; it can't send it. That's why Resend (or your host's SMTP) is still needed.

### 1b. Do not create these

They appear in the code but aren't real mailboxes:

| Address | What it is |
|---|---|
| admin@venqore.com | Fallback only. Scheduler failure emails actually go to `MAIL_FROM_ADDRESS` (hello@). Also an installer placeholder. |
| demo@venqore.com | Login for the demo store (password demo1234), not an inbox. Keep the demo account only if you want a public demo. |
| owner@ / you@venqore.com | Examples in the "create platform owner" command. Your platform owner login should be your own private email, not a guessable one. |
| platform@, god@, master@, test@, testpk@venqore.com | Local test and seed accounts. **None of them may exist in production.** Check with `SELECT email FROM users WHERE email LIKE '%@venqore.com';` and delete any that show up. |
| hashmi@venqore.com | Old testing-guide login for the Hashmi Dashboard. Retired. Don't recreate it. |
| business@, yourname@, system@venqore.com | Text shown inside the app (placeholders and a "From:" preview label). Nothing is sent to them. |

---

## 2. Lemon Squeezy

### What you have now

Your store (ID 352742) is in **test mode** and already holds **20 variants**; their IDs are in your local `.env`. The pricing changed after they were made (Starter $49, Core $99, Scale $299), so most of them only need a new name and price.

**Result:**
- 19 to rename and reprice
- 1 to retire
- **0 you must create from scratch** for launch
- 9 optional products, only if you want to sell add-ons that currently have no buy button (see 2c)

### 2a. Rename and reprice these 19 existing variants

Open each product in Lemon Squeezy (test mode), then set the name, price and billing exactly as below.

| # | `.env` key | Test ID now | New product / variant name | Price | Billing |
|---|---|---|---|---|---|
| 1 | LEMON_SQUEEZY_STARTER_VARIANT_ID | 1737232 | VenQore Starter — Monthly | $49 | Subscription, every 1 month |
| 2 | LEMON_SQUEEZY_STARTER_ANNUAL_VARIANT_ID | 1741332 | VenQore Starter — Yearly | $490 | Subscription, every 12 months |
| 3 | LEMON_SQUEEZY_GROWTH_VARIANT_ID | 1737435 | VenQore **Core** — Monthly (was Growth) | $99 | Subscription, monthly |
| 4 | LEMON_SQUEEZY_GROWTH_ANNUAL_VARIANT_ID | 1741330 | VenQore **Core** — Yearly | $990 | Subscription, yearly |
| 5 | LEMON_SQUEEZY_BUSINESS_VARIANT_ID | 1737662 | VenQore **Scale** — Monthly (was Business) | $299 | Subscription, monthly |
| 6 | LEMON_SQUEEZY_BUSINESS_ANNUAL_VARIANT_ID | 1741327 | VenQore **Scale** — Yearly | $2,990 | Subscription, yearly |
| 7 | LEMON_SQUEEZY_WOOCOMMERCE_ADDON_ID | 1740565 | Channel Sync — WooCommerce | $19 | Subscription, monthly |
| 8 | LEMON_SQUEEZY_AMAZON_ADDON_ID | 1740582 | Channel Sync — Amazon | $19 | Subscription, monthly |
| 9 | LEMON_SQUEEZY_EBAY_ADDON_ID | 1740593 | Channel Sync — eBay | $19 | Subscription, monthly |
| 10 | LEMON_SQUEEZY_TIKTOK_ADDON_ID | 1740607 | Channel Sync — TikTok Shop | $19 | Subscription, monthly |
| 11 | LEMON_SQUEEZY_AI_LITE_ADDON_ID | 1740631 | **AI Shop** — 2,000 credits/month | $15 | Subscription, monthly |
| 12 | LEMON_SQUEEZY_AI_PRO_ADDON_ID | 1740635 | **AI Pro** — 10,000 credits/month | $39 | Subscription, monthly |
| 13 | LEMON_SQUEEZY_AI_ULTIMATE_ADDON_ID | 1740642 | **AI Max** — 50,000 credits/month | $99 | Subscription, monthly |
| 14 | LEMON_SQUEEZY_AI_BYOK_ADDON_ID | 1740648 | Bring Your Own AI Key — Unlock | $19 | **Single payment** |
| 15 | LEMON_SQUEEZY_AI_TOPUP_ADDON_ID | 1740650 | 1,000 AI Credits Top-up | $10 | **Single payment** |
| 16 | LEMON_SQUEEZY_UPLOAD_SERVICE_VARIANT_ID | 1742450 | Product Upload Service | $1 (placeholder; the app sets the real price at checkout) | Single payment |
| 17 | LEMON_SQUEEZY_STARTER_LTD_VARIANT_ID | 1737679 | VenQore Lifetime — Tier 1 | $199 | Single payment |
| 18 | LEMON_SQUEEZY_GROWTH_LTD_VARIANT_ID | 1737703 | VenQore Lifetime — Tier 2 | $399 | Single payment |
| 19 | LEMON_SQUEEZY_BUSINESS_LTD_VARIANT_ID | 1737710 | VenQore Lifetime — Tier 3 | $699 | Single payment |

Notes on the table:
- **Monthly and yearly:** if they're two variants inside one product, rename the product once (e.g. "VenQore Core") and name the variants "Monthly" and "Yearly". If they're separate products, rename both.
- **The env keys still say GROWTH and BUSINESS.** That's fine. The code maps GROWTH to Core and BUSINESS to Scale. Only the names customers see change.
- **Lifetime deals (17–19):** keep "AppSumo" out of the names, because checkout shows the product name. If you won't sell lifetime deals directly at launch, don't copy these to live mode (step 2d).
- **Channel Sync:** the in-app Billing page only has buy buttons for WooCommerce and Amazon. eBay and TikTok still activate if bought, but there's no button for them yet.

### 2b. Retire 1 variant

| `.env` key | Test ID | Action |
|---|---|---|
| LEMON_SQUEEZY_AI_STARTER_ADDON_ID | 1740617 | "AI Spark" is the **free** allowance every store already gets. As of today the app no longer sells it; the $0 buy tile was removed. Archive this product and don't copy it to live. Leave the env key blank. |

`LEMON_SQUEEZY_COUNTER_VARIANT_ID` and `LEMON_SQUEEZY_COUNTER_ANNUAL_VARIANT_ID` belong to the retired $18 "Counter" plan. Leave both blank.

### 2c. Optional: 9 add-ons you would create from scratch

These nine appear with prices on the pricing page, but **the app has no buy button and nothing that switches them on after payment** (`purchasable => false` in `config/pricing.php`). Creating them in Lemon Squeezy does nothing until engineering wires them up.

| Add-on | Price | Billing |
|---|---|---|
| Extra store location | $45 | Monthly |
| Extra full staff seat | $15 | Monthly |
| Extra register (POS device) | $20 | Monthly |
| +50,000 catalogue items | $25 | Monthly |
| API + webhooks access | $29 | Monthly |
| Audit trail + custom roles | $39 | Monthly |
| White-label branding | $49 | Monthly |
| 5 AI structural rebuilds | $10 | Single payment |
| Standard setup & migration | $249 | Single payment |

**Decision for you:** either "sell on request" at launch (a customer emails hello@, you send a Lemon Squeezy payment link, and support switches the feature on), or wait for the engineering item in section 6 before creating them. In both cases, the pricing page should say "available on request" so it matches what the app actually does (gate G18).

### 2d. Store settings and going live (in this order)

1. **Test mode first.** Make the renames in 2a. Buy each item with the test card `4242 4242 4242 4242` and check it activates in the app: plans, one AI tier, BYOK, a top-up and Channel Sync.
2. **Activate the store.** Complete Lemon Squeezy's identity and business verification and add your payout details. Lemon Squeezy is the merchant of record, so it collects sales tax and VAT. The fee is **5% + 50¢ per transaction**, with no monthly fee.
3. **Copy to live mode.** Use "Copy to Live Mode" on each product you'll sell. **Live products get new IDs**, so every variant ID in the production `.env` must be the live one, not the test ones above.
4. **Live API key:** Settings → API → create a live key and put it in `LEMON_SQUEEZY_API_KEY`. Set `LEMON_SQUEEZY_TEST_MODE=false`.
5. **Live webhook:** Settings → Webhooks → add `https://venqore.com/api/webhooks/lemon-squeezy`.
   - Choose any signing secret and copy it into `LEMON_SQUEEZY_SIGNING_SECRET`.
   - Tick these events: `order_created`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_failed`, `subscription_payment_recovered`.
6. **Store ID:** put it in `LEMON_SQUEEZY_STORE_ID` (currently 352742 in test mode).
7. **Checkout look:** add your logo in the store settings. The button colour is `LEMON_SQUEEZY_CHECKOUT_BUTTON_COLOR` (currently purple `#7C3AED`). Change it to Qore Teal if you want it on-brand.
8. **Pakistan pricing:** leave the PKR variant keys blank. Checkout charges in USD and Lemon Squeezy shows the local-currency estimate. The pricing page's rupee figures are display only.
9. **Affiliates (optional, free):** turn on the Lemon Squeezy affiliate program if you want the planned 30%/20% partner commissions.
10. **Before any real-card test,** decide whether you'll refund it. Codex's plan asks for your explicit approval before any real charge.

---

## 3. AI keys in the Hashmi Dashboard

**Built today.** Sign in at `/VenQore-login`, then open **`/VenQore?view=settings`** (the dashboard's Settings screen) and find the **AI provider keys** panel. There are now two sets of keys side by side:

| Set | Used for | Key slots |
|---|---|---|
| **Free key** | Public website tools, free-plan stores, trials, staff previews | Gemini free-tier key, plus an optional model name |
| **Paid keys** | Paying stores on managed AI (AI Shop / Pro / Max) | Gemini, **Anthropic (Claude)**, OpenAI, DeepSeek. You pick which one is active, with an optional model name. |

What it does:
- **Each key goes where it belongs:** free usage always takes the free key and paid usage takes the active paid provider's key. A store's own key (BYOK) always wins over both.
- **Keys are protected:** they're stored encrypted with your `APP_KEY` and never shown again. The dashboard only shows "Saved · ends 1234". Only the platform **owner** can change them; other platform admins get "forbidden".
- **Switch:** "Use the paid key when no free key is set". It's **on** by default so nothing breaks today. **Turn it off once you've saved a free key**, so free usage can never spend the paid key.
- **Login bug fixed on the way:** after signing in at `/VenQore-login`, your first 2FA code used to bounce with "Your session has expired". The browser kept sending the pre-login security token. It now picks up the new token after every page change, and the first code works. This was checked in a real browser.
- **Claude requests get a Claude model** automatically (`claude-sonnet-4-5` unless you type another), never a Gemini model name.
- **Security fix found while building this:** any key saved in the dashboard used to be sent to every public page's HTML, and store API keys were sent to every cashier's browser. Both now strip keys, secrets, tokens and passcodes. Keys are also no longer written in plain text to the platform audit log. 7 new tests cover all of this.

Your steps:
1. **Free key:** get one from Google AI Studio (aistudio.google.com → Get API key) on a Google Cloud project **with billing turned off**. Paste it into "Gemini free-tier key".
2. **Paid Gemini key:** create a **separate** Google Cloud project with billing on and set a budget alert (Billing → Budgets & alerts). Paste its key into "Gemini paid key".
3. **Claude key:** console.anthropic.com → API keys. Anthropic uses prepaid credits; set a monthly spend limit under Limits. Paste it into "Anthropic (Claude) key". Set "Active paid provider" to Anthropic only if you want paid stores to run on Claude.
4. Turn **off** "Use the paid key when no free key is set".
5. Remove any old AI key from the server `.env` that you no longer want used.

**Privacy rule you must follow** (from Google's Gemini API terms):
- On the free tier, "Google uses the content you submit … to improve … Google products" and "human reviewers may read" it. Paid-tier data is not used that way.
- "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom."

So:
- **(a)** State in the privacy policy that free-plan AI features are processed by Google under its free-tier terms.
- **(b)** Don't serve EEA, Swiss or UK users from the free key. Point those regions at the paid key, or keep AI features off the free plan there. This is a business and legal decision for you (G18). I'm not a lawyer, so check with one if you serve those regions.

---

## 4. Everything else only you can do

This combines Claude's list and Codex's 7 personal actions, grouped and in order. "G" numbers refer to the gates in ROAD-TO-100.md.

### A. Accounts, access and decisions (do these first)

- [ ] **Access for the engineer (Codex's #1):** give it through the host's own user or SSH-key system, not in chat or report files. It needs hosting, Cloudflare, DNS and the email provider.
- [ ] **Core or Growth (G18):** the pricing page says Solo / Starter / **Core** / Scale; the in-app plan picker says **Growth**. Pick one name; engineering then changes the other.
- [ ] **Business facts (G18):** confirm the company name (SM & Co Chartered Accountants FZC-LLC or a VenQore trading name?), the real address (Okara or Lahore) and who answers support.
- [ ] **Trial wording (G18):** the site says "no credit card required". Confirm that's true for your checkout.
- [ ] **Add-ons without a buy button (2c):** "sell on request" or remove them from the pricing page.
- [ ] **Launch scope (G20):** how many stores in the pilot, a daily sign-up limit, and who is on call.
- [ ] **Recovery targets (G13):** how much data you can afford to lose (for example 24 hours) and how quickly you must be back up (for example 4 hours).

### B. Email (section 1)

- [ ] Create hello@ plus the 9 forwards (Cloudflare Email Routing).
- [ ] Set up a Resend account, verify the domain, and add SPF, DKIM and DMARC.
- [ ] Approve 2–3 test inboxes (Gmail and Outlook) that engineering may send codes to (Codex's #2).
- [ ] Real inbox test for a sign-up code, a password reset and a staff invite. They must arrive in under 60 seconds and not in spam (G08).

### C. Security of your own accounts (G10)

- [ ] Turn on MFA (an authenticator app, not SMS) for the domain registrar, Cloudflare, hosting, Resend, Lemon Squeezy, Google Cloud, Anthropic and GitHub.
- [ ] Create the platform owner on the server with your private email: `php artisan venqore:create-platform-owner <your-private-email> --name="Rehan"`.
- [ ] Sign in at `/VenQore-login`, enroll the authenticator, and **print or store the recovery codes offline** in two places.
- [ ] Remove every test account listed in 1b from production.

### D. Hosting and Cloudflare (G11, G12)

- [ ] Proxy venqore.com and its subdomains through Cloudflare (orange cloud). Keep the MX and email records unproxied.
- [ ] SSL/TLS set to **Full (strict)**, with an origin certificate on the server.
- [ ] Lock the origin so only Cloudflare can reach it: host firewall allow-list or Cloudflare Tunnel.
- [ ] The web root must be the Laravel `public/` folder. Confirm `/.env`, `/storage/logs/laravel.log` and `/composer.json` all return 404 on the live site.
- [ ] Production `.env`: fill every value in section 5, with `APP_ENV=production` and `APP_DEBUG=false`.
- [ ] Keep a queue worker running (`php artisan queue:work --tries=3`, supervised) and the scheduler cron (`* * * * * php artisan schedule:run`). Without the worker, no sign-in codes are sent.
- [ ] Give engineering a **staging** copy (same host type, separate database) for the rehearsals below.

### E. Sign-in providers

- [ ] **Google sign-in:** in Google Cloud → APIs & Services → Credentials, create an OAuth client (Web). Add **both** redirect URIs: `https://venqore.com/auth/google/callback` (sign-in) and `https://venqore.com/google/callback` (Drive backups). Put the values in `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and **`GOOGLE_REDIRECT_URL`**. The old example file said `…_URI`, which was the wrong name; it's fixed now.
- [ ] Publish the OAuth consent screen with the Privacy Policy and Terms URLs.
- [ ] **Turnstile (G09):** in Cloudflare → Turnstile, create a site for venqore.com and put the keys in `CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET_KEY`. Without them, public forms refuse requests in production. This is deliberate.

### F. Payments (section 2, G14)

- [ ] Rename and reprice the 19 items, retire AI Spark, run test purchases, then activate the store, copy to live, and set the live key, webhook and IDs.
- [ ] Approve (or refuse) a single real-card test.

### G. Data safety (G07, G13)

- [ ] On a **restored copy** of production, engineering runs `php artisan venqore:db-guards --check`. If it lists any stock batches, you decide the correct quantity or cost from your records. The tool never guesses. Then run `--install`.
- [ ] Set up an off-site backup the live server can't delete. Free options include a Cloudflare R2 bucket (10 GB free) or a Google Drive folder with a separate login.
- [ ] Do one timed restore drill on staging and write down how long it took.
- [ ] Keep `APP_KEY` in a password manager, separately from the backups. Without it, encrypted data (including the AI keys) can't be read.

### H. Hardware and devices (G16, G17)

- [ ] Provide one real till PC plus its printer, cash drawer, scanner and scale (Codex's #6). Install the Windows Station app and test printing, the drawer, scanning, weighing, the exit passcode, pairing, un-pairing and re-pairing, and the manager-PIN pop-up.
- [ ] **Re-pair every existing till once** with a code from Settings → Terminals. Tills paired before 10 September have no secret and will show the pairing box.
- [ ] Decide on Windows code signing. It's optional and costs money, so unsigned is acceptable for a pilot if you're explicit about it.
- [ ] One pass on a real phone (sign-up, code entry, POS checkout) and one in Safari or Firefox.

### I. Legal and discovery (G17, G18)

- [ ] Privacy Policy must list your real processors: Google Analytics (with consent), Resend, Cloudflare, Lemon Squeezy, Google Drive, Google Gemini and Anthropic, plus the free-tier AI note from section 3.
- [ ] Google Search Console: verify venqore.com and submit `https://venqore.com/sitemap.xml`.

### J. Final steps

- [ ] Sign the launch acceptance record in ROAD-TO-100 (G20).
- [ ] After you've reviewed and committed the changes, delete `scratch/_claude_transfer/` in the AMD POS folder. Until then it's the undo copy.

---

## 5. Production `.env` values you must fill

| Key | Value / where to get it |
|---|---|
| APP_KEY | `php artisan key:generate` once. Back it up in a password manager. |
| APP_ENV / APP_DEBUG | `production` / `false` |
| DB_PASSWORD | strong random value (`openssl rand -base64 32`) |
| MAIL_MAILER, MAIL_SCHEME, MAIL_HOST, MAIL_PORT, MAIL_USERNAME | `smtp`, `smtps`, `smtp.resend.com`, `465`, `resend` |
| MAIL_PASSWORD | Resend API key (sending access only) |
| MAIL_FROM_ADDRESS / MAIL_FROM_NAME | `hello@venqore.com` / `VenQore` |
| CONTACT_NOTIFICATION_ADDRESS / PARTNER_NOTIFICATION_ADDRESS | `hello@venqore.com` / `founder@venqore.com` |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URL | from Google Cloud; redirect = `https://venqore.com/auth/google/callback` |
| CLOUDFLARE_TURNSTILE_SITE_KEY / CLOUDFLARE_TURNSTILE_SECRET_KEY | Cloudflare → Turnstile |
| LEMON_SQUEEZY_API_KEY / STORE_ID / SIGNING_SECRET / TEST_MODE | live key / store ID / webhook secret / `false` |
| The 18 variant IDs from 2a (live IDs) | Lemon Squeezy live mode, after "Copy to Live Mode" |
| GEMINI_API_KEY, SMART_CAPTURE_FREE_API_KEY, ANTHROPIC_API_KEY | Optional fallbacks. Prefer entering AI keys in the Hashmi Dashboard (section 3). |
| VQ_EMAIL_OTP_REQUIRED / VQ_OTP_GLOBAL_DAILY_BUDGET | `true` / `90` (raise only when the mail plan allows) |
| SENTRY_LARAVEL_DSN | Optional. Leave blank unless you create a free Sentry project. |

An updated production template is at `docs/security-audit-2026-09-10/env.production.example.proposed`. It uses Resend instead of paid Postmark and has the correct Google redirect key name, the AI keys and `LEMON_SQUEEZY_TEST_MODE`. Copy it over `.env.production.example`; I can't write `.env` files on your computer remotely.

---

## 6. Still open for engineering (Claude or Codex, not you)

1. **AI credit grants don't match what's sold.** The pricing says AI Shop = 2,000 credits, Pro = 10,000 and Max = 50,000, and a top-up = 1,000 credits. The webhook grants query and scan counts instead (for example, a top-up adds 200 scans). This must be reconciled before AI add-ons are sold. It needs one decision: do credits map to scans or to queries?
2. **Refund events aren't handled.** The webhook doesn't process `order_refunded` or refunded subscription payments, so a refunded customer keeps access until the subscription expires. Add this and tick the event in Lemon Squeezy (G14).
3. **The 9 optional add-ons (2c):** checkout, activation and cancellation, if you choose to sell them in the app.
4. **Freeze the release (G01)** and have Codex independently verify the saved evidence in `docs/security-audit-2026-09-10/evidence-2026-09-11/` (G04, G05).
5. **Rename Core/Growth** across the app once you pick one (G18).
6. **Staging rehearsals** once access exists: migrations and DB guards (G07), browser journeys (G05), two tills selling the last unit at once (G15), Cloudflare and cache checks (G11), and the backup restore (G13).
