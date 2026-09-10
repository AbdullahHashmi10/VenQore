# Environment files

Two complete, drop-in `.env` files. Upload one as `.env` in the app root, then
run `php artisan config:clear`. Never run `config:cache` until you have
confirmed the live values are correct.

| File | When |
|---|---|
| `test-mode.env` | Now — verify plans, add-ons and limits are allotted correctly. No real charges. |
| `production.env` | After the test run passes. Real cards are charged. |

**Do not deploy these files themselves.** They contain secrets and are for
copying into `.env` only. Add `deploy/env/*.env` to `.gitignore` if it isn't
covered already.

---

## What changed vs your current server `.env`

1. **The duplicated Lemon Squeezy block is gone.** You had the entire block
   twice (sandbox, then production). Which one wins is an implementation detail
   of `vlucas/phpdotenv` — its `ImmutableWriter` skips only variables it did not
   set itself, so the *second* definition overwrites the first. That happened to
   give you the production values, but one stray OS-level env var flips the
   behaviour. One block per file now.

2. **`LEMON_SQUEEZY_UPLOAD_SERVICE_VARIANT_ID` was leaking across modes.** It was
   defined only in the sandbox half, so your live site was pointing the paid
   upload service at a test-mode variant.

3. **`LEMON_SQUEEZY_SIGNING_SECRET` replaced.** It was the literal string
   `Strong Password`. Both files now carry a generated 32-byte secret.

4. **Live checkout URLs removed from the test file.** They were the only static
   URLs you had, and they point at your real store. During testing, any path
   that fell back to them would take real money.

5. `LOG_STACK` → `daily` (a single unbounded file will hit your shared-hosting
   disk quota), `LOG_LEVEL` → `warning` in production, `DB_PASSWORD` single-quoted.

---

## Test-mode checklist

Register the webhook first — nothing is allotted without it.

**Lemon Squeezy → Settings → Webhooks**, with the **test mode** toggle ON:

- URL: `https://venqore.com/api/webhooks/lemon-squeezy`
- Signing secret: the exact value of `LEMON_SQUEEZY_SIGNING_SECRET` in `test-mode.env`
- Events: `order_created`, `subscription_created`, `subscription_updated`,
  `subscription_cancelled`, `subscription_expired`,
  `subscription_payment_failed`, `subscription_payment_recovered`

Then, watching the log:

```bash
tail -f storage/logs/laravel-*.log | grep -iE "lemon|Provision"
```

Work through:

- [ ] Monthly upgrade (Starter / Growth / Business) — overlay opens in-app, no redirect
- [ ] `Lemon Squeezy webhook received: subscription_created` appears in the log
- [ ] `ProvisionTenantJob: provisioned/updated tenant N` follows it
- [ ] Billing page shows the new plan; staff / SKU / location limits match the tier
- [ ] A gated feature that was locked on the old plan is now unlocked
- [ ] AI add-on purchase → `ai_status` set, Smart Capture unlocks
- [ ] WooCommerce add-on purchase → Woo routes stop returning 403
- [ ] **"Already Paid?"** button syncs correctly when you close the overlay early
- [ ] Annual toggle → expect *"checkout is not configured"*. That is intentional:
      you have no test-mode annual variants, and failing is safer than falling
      through to a live link.

A test card that always succeeds: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## Before switching to production

- [ ] Rotate `LEMON_SQUEEZY_API_KEY` (exposed) and paste the new live key
- [ ] Set `LEMON_SQUEEZY_SIGNING_SECRET` on the **live** webhook to match
- [ ] Rotate `GOOGLE_CLIENT_SECRET` in Google Cloud Console
- [ ] Rotate the database password
- [ ] Create a **live** variant for the upload service, or hide that tab
- [ ] Configure real SMTP — `MAIL_MAILER=log` means new owners never receive
      the generated password that `ProvisionTenantJob` mails them
- [ ] Decide on `APP_KEY`: it was exposed, but rotating invalidates all sessions
      and any `encrypted` cast columns. Check for encrypted columns first.

---

## Local vs production invariants

The production config guard enforces the safety-critical entries below. Values
shown as "vendor value" must be supplied on the server and must never be
committed. Placeholder values beginning with `REPLACE_ME` deliberately fail the
guard.

| Key | Local/development | Production |
|---|---|---|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | may be `true` | `false` |
| `APP_URL` | loopback URL | `https://venqore.com` |
| `DB_CONNECTION` | `mariadb` | `mariadb` |
| `QUEUE_CONNECTION` | `database` | `database`, with `venqore-queue.conf` installed |
| `CACHE_STORE` | `database` | `database` |
| `SESSION_DRIVER` | `database` | `database` |
| `SESSION_SECURE_COOKIE` | may be `false` on HTTP | `true` |
| `MAIL_MAILER` | `log` | real SMTP/provider transport, never `log` |
| SMTP/provider credential | optional | vendor value; verify SPF, DKIM and DMARC |
| `GEMINI_API_KEY` | optional | vendor value |
| `SENTRY_LARAVEL_DSN` | optional | vendor value |
| `LEMON_SQUEEZY_API_KEY` | test key or absent | rotated live vendor value |
| `LEMON_SQUEEZY_SIGNING_SECRET` | test value or absent | live webhook vendor value |
| `LEMON_SQUEEZY_TEST_MODE` | `true` while testing | `false` |
| Turnstile site/secret keys | optional | vendor values before public forms launch |
| AWS/R2 storage credentials | optional | vendor values if offsite object storage is enabled |

Before a production deploy, install the database queue worker, populate every
vendor value, then run:

```bash
php artisan optimize:clear
php artisan venqore:config-guard
```
