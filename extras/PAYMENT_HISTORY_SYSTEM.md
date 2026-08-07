# Payment History System — Complete Flow

## What Was Built

A **Payment History tab** on the billing page that shows customers exactly when they paid, what period each payment covered (in actual days), and when their access expires. This gives complete transparency and proves the trial-credit system is working.

---

## The Complete Flow (Step-by-Step)

### 1. USER OPENS BILLING PAGE
- Customer goes to `/s/{store-slug}/billing`
- Page loads with subscription overview (current plan, renewal date, etc.)
- No payment history is loaded yet — keeps page fast

### 2. USER CLICKS THE "PAYMENTS" TAB
- Frontend JavaScript sees the tab changed to `activeTab === 'payments'`
- A `useEffect` hook fires: if this is the first time opening the tab AND we haven't loaded history yet, fetch it

### 3. FETCH PAYMENT HISTORY (Frontend)
**File:** `resources/js/Pages/Billing/Index.jsx`

```javascript
const loadHistory = async (fresh = false) => {
    const res = await fetch(
        route('store.billing.payment-history', { fresh: 1 }) // adds ?fresh=1 for cache bypass
    );
    const data = await res.json();
    setHistory(data); // store in React state
};
```

**Route hit:** `/s/{store-slug}/billing/payment-history`

### 4. BACKEND RECEIVES REQUEST (Laravel Controller)
**File:** `app/Http/Controllers/BillingController.php`

```php
public function paymentHistory(Request $request)
{
    $fresh = $request->boolean('fresh'); // check for ?fresh=1
    
    $history = app(BillingHistoryService::class)->forTenant(
        $this->tenant(),
        $fresh
    );
    
    // Include local Venqore DB state for diagnostics
    $history['local'] = [
        'status' => $this->tenant()->status,
        'subscription_ends_at' => $this->tenant()->subscription_ends_at,
        'has_subscription_id' => !!$this->tenant()->lemon_squeezy_subscription_id,
    ];
    
    return response()->json($history);
}
```

### 5. SERVICE FETCHES FROM LEMON SQUEEZY
**File:** `app/Services/BillingHistoryService.php`

This is the core of the system. Here's what it does:

#### Step 5a: Resolve the Subscription
```
Try to find Lemon Squeezy subscription ID for this tenant:
  ↓
  Option 1: Use stored ID → app/Services/BillingHistoryService.php line 153
            GET /v1/subscriptions/{subscription_id}
  ↓
  If not found, fallback:
  Option 2: Look up by owner email → line 166
            GET /v1/subscriptions?filter[user_email]={owner_email}
  ↓
  Returns: subscription object with id, status, renews_at, ends_at, created_at
```

#### Step 5b: Fetch All Invoices for This Subscription
```
GET /v1/subscription-invoices?filter[subscription_id]={id}&filter[store_id]={store_id}
  ↓
  Returns: array of invoices
  Each invoice has:
    - id, created_at (when paid)
    - discount_total (proof of trial credit)
    - subtotal_formatted, total_formatted
    - status (paid, refunded, etc.)
    - user_email (for security check)
```

#### Step 5c: Derive Billing Periods
**This is the critical part.** Lemon Squeezy does NOT tell us what date range each payment covered, so we calculate it:

```
For each invoice:
  period_start = invoice.created_at (when they paid)
  period_end = next_invoice.created_at (OR subscription.renews_at for the newest)
  period_days = ceil((period_end - period_start) / 86400 seconds)
```

**Example:**
- Invoice 1 created: Jun 9, 2026
- Invoice 2 created: Jul 9, 2026
- Invoice 1 period = Jun 9 → Jul 9 = **30 days**

This is what proves a "30-day plan" actually billed for 30 days.

#### Step 5d: Filter & Format
```
Security check: verify each invoice's user_email matches the tenant's owner
  ↓
Build the response envelope with:
  - subscription summary (status, expires_at, days_until_expiry, card)
  - invoices array (newest first) with period, amount, discount, status
  - lifetime_usd (sum of paid, non-refunded invoices)
  - message (if trial or error)
```

### 6. CACHE THE RESULT
**TTL: 120 seconds**

```php
Cache::remember(
    "billing_history:{$tenant->id}",
    now()->addSeconds(120),
    fn () => $this->build($tenant, $apiKey, $storeId)
);
```

So if they refresh the tab 30 seconds later → instant. After 2 minutes → fresh API call.

Bypass: `?fresh=1` clears cache and refetches.

### 7. FRONTEND RENDERS THE TAB
**File:** `resources/js/Pages/Billing/Index.jsx` (lines 450+)

```
┌─────────────────────────────────────────────────────────┐
│ ⏱ BILLING PERIOD & PAYMENTS            [🔄 Refresh]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┬───────────────┬───────────┬─────────┐ │
│  │ Status:      │ Next Charge:  │ Card:     │ Paid:   │ │
│  │ Active       │ Aug 8, 2026   │ Visa      │ $24.00  │ │
│  │              │ 14 days left  │ ••••1234  │ 1 inv   │ │
│  └──────────────┴───────────────┴───────────┴─────────┘ │
│                                                          │
│  ⚠️ Renewal date mismatch warning (if dates disagree)   │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Paid On       │ Period Covered  │ Days │ Amount │...││
│  ├──────────────┼─────────────────┼──────┼────────┤...││
│  │ Jul 9, 2026  │ Jul 9 → Aug 8   │ 30   │ $24.00 │...││
│  │ Renewal      │ days            │      │ ⚡-$6  │...││
│  │              │                 │      │ Paid   │PDF││
│  └──────────────┴─────────────────┴──────┴────────┘...│
│                                                          │
│  Read live from Lemon Squeezy · Updated 2:34 PM        │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files and Their Paths

| File | Purpose |
|------|---------|
| `app/Services/BillingHistoryService.php` | Core logic: fetches LS API, derives periods, filters |
| `app/Http/Controllers/BillingController.php` | HTTP endpoint: calls service, adds diagnostics |
| `routes/web.php` | Route: `billing.payment-history` |
| `resources/js/Pages/Billing/Index.jsx` | Frontend: tab, fetch, render, state management |
| `tests/Feature/Billing/PaymentHistoryTest.php` | 10 tests covering edge cases |

---

## The Diagnostics Feature (Why It Matters)

The response includes TWO sets of dates:

```javascript
{
  "subscription": {
    "expires_at": "2026-08-08T10:00:00Z"  // ← Lemon Squeezy's truth
  },
  "local": {
    "subscription_ends_at": "2026-07-15"   // ← Venqore DB's cache
  }
}
```

**If they disagree:**
- A warning badge appears on the tab: *"Renewal date mismatch — Lemon Squeezy is correct. Use Already Paid? to re-sync."*
- This catches webhook misses (webhook never arrived to update our DB)
- Or local simulator bugs (store was set active manually without real payment)

---

## Trial Credits Proof

When a trial credit is applied (TrialCreditService), it shows as a discount on the Lemon Squeezy invoice:

```javascript
{
  "total_formatted": "$24.00",
  "subtotal_formatted": "$30.00",
  "discount_total_formatted": "$6.00",
  "has_discount": true  // ← Displays ⚡ -$6.00 badge
}
```

This is the end-to-end proof that the credit system works.

---

## The Header Countdown (New)

On the billing page header, paid stores now show:

```
Renews on August 8, 2026
[14 days left] [View payment history]
```

The countdown color-codes:
- 🟢 Green: 8+ days
- 🟡 Yellow: 3–7 days
- 🔴 Red: ≤3 days

---

## System Architecture

```
User opens /billing
    ↓
[Subscription tab loaded instantly]
    ↓
User clicks "Payments" tab
    ↓
Frontend calls GET /billing/payment-history
    ↓
BillingController.paymentHistory()
    ↓
BillingHistoryService.forTenant()
    ↓
Check cache (120-second TTL)
    ├─ Hit → return cached data (instant)
    └─ Miss → fetch from Lemon Squeezy API
        ↓
    Resolve subscription (by stored ID or email lookup)
        ↓
    Fetch invoices from LS API
        ↓
    Derive period for each invoice (created_at → next created_at)
        ↓
    Security filter (verify user_email)
        ↓
    Format response
        ↓
    Cache for 120 seconds
        ↓
    Return JSON to frontend
        ↓
Frontend renders table + summary cards
        ↓
User sees: when paid, what period covered, days remaining
```

---

## What the Tab Shows (Exactly)

### Top Section: Current Status
Four cards:
1. **Status** — Active / Cancelled
2. **Next Charge / Access Ends** — Date + days remaining
3. **Payment Method** — Visa ••••1234
4. **Total Paid** — $24.00 (2 invoices)

### Warnings (if applicable)
- 🟡 Renewal date mismatch (local date ≠ Lemon Squeezy date)
- 🟡 No real subscription ID (store is simulated)

### Invoice Table (newest first)
Columns:
- **Paid On** — Date + reason (First payment / Renewal / Plan change)
- **Period Covered** — Start → End dates
- **Days** — Billing period in actual days (critical proof)
- **Amount** — Subtotal, then total (discount shown as strikethrough)
- **Credit Applied** — Badge if discount_total > 0 (trial credit proof)
- **Status** — Paid / Pending / Refunded / etc.
- **Link** — PDF invoice download

### Footer
- Timestamp: "Read live from Lemon Squeezy · Updated 2:34 PM"
- Refresh button (bypasses 120-second cache with ?fresh=1)

---

## Before It Works: Deployment Steps

```bash
# 1. Generate Ziggy routes (because routes changed)
php artisan ziggy:generate

# 2. Rebuild frontend
npm run build

# 3. Run tests
php artisan test --filter=PaymentHistoryTest

# 4. Upload to Hostinger (public/build/ folder)
```

---

## Why This Works

1. **Transparency** — Shows the exact date range each payment covered, proving billing accuracy
2. **Trial Credit Proof** — The `discount_total` column shows trial credits actually reached the invoice
3. **Diagnostics** — Compares Lemon Squeezy dates to local DB, catches misconfigurations
4. **Performance** — Lazy-loaded, cached 120 seconds, doesn't slow main billing page
5. **Graceful** — If Lemon Squeezy is down, shows message instead of error
6. **Security** — Email verification local + API filtering prevents cross-tenant data leaks

---

## Test Coverage

File: `tests/Feature/Billing/PaymentHistoryTest.php`

10 tests covering:
- ✅ Period derivation (30 days = Jun 9 → Jul 9)
- ✅ Multiple invoices (each ends where next begins)
- ✅ Cancelled subscriptions (shows grace period end date)
- ✅ Trial credits visible (discount_total badge)
- ✅ Cross-customer invoices rejected (email verification)
- ✅ Refunds excluded from lifetime total
- ✅ Trials get "no payments" message
- ✅ API failure degrades gracefully
- ✅ Missing credentials caught early
- ✅ HTTP endpoint returns correct shape

---

## How Users Experience It

**Scenario: Customer bought a 30-day plan on Jul 9**

1. They click the "Payments" tab
2. Wait 1 second (API call)
3. See:
   ```
   Paid On: Jul 9, 2026 (First payment)
   Period: Jul 9 → Aug 8 (30 days) ← proves it's a 30-day plan
   Amount: $24.00 (with ⚡ -$6.00 trial credit badge)
   Status: Paid
   ```
4. At the top: "Next charge: Aug 8, 2026 · 14 days left"
5. Click "View payment history" from the header → jumps to Payments tab

**If they have a mismatch (webhook miss):**
- Warning badge: "Your saved renewal date doesn't match Lemon Squeezy. Use Already Paid? to re-sync."

This tells them everything is working correctly (or what's broken).
