<?php

namespace App\Http\Controllers;

use App\Models\AiRecommendation;
use App\Models\CustomerAnalytics;
use App\Models\LoyaltyBalance;
use App\Models\GiftCard;
use App\Models\StoreCreditBalance;
use App\Models\Party;
use App\Models\Invoice;
use App\Services\PlanGate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class GrowthEngineController extends Controller
{
    /**
     * Get dashboard summary for "Today's Opportunities" widget
     */
    public function dashboard()
    {
        $recommendations = AiRecommendation::active()
            ->with(['party', 'product'])
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        // Group by type for summary
        $summary = [
            'retention' => $recommendations->where('type', 'retention'),
            'forecast' => $recommendations->where('type', 'forecast'),
            'churn' => $recommendations->where('type', 'churn'),
            'recovery' => $recommendations->where('type', 'recovery'),
        ];

        $stats = [
            'total_tips' => $recommendations->count(),
            'unread_count' => $recommendations->where('is_read', false)->count(),
            'potential_revenue' => $recommendations->sum('potential_revenue'),
            'urgent_count' => $recommendations->where('priority', 'urgent')->count(),
            'customers_due' => $summary['retention']->count(),
            'stock_risks' => $summary['forecast']->count(),
            'churn_risks' => $summary['churn']->count(),
            'overdue_invoices' => $summary['recovery']->count(),
        ];

        return response()->json([
            'recommendations' => $recommendations,
            'summary' => $summary,
            'stats' => $stats,
        ]);
    }

    /**
     * Trigger a refresh of the Growth Engine
     */
    public function refresh()
    {
        try {
            // This runs the console command growth:analyze
            Artisan::call('growth:analyze', ['--force' => true]);
            
            return response()->json([
                'success' => true, 
                'message' => 'Growth Engine refreshed successfully',
                'output' => Artisan::output()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh Growth Engine: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all recommendations (paginated)
     */
    public function index(Request $request)
    {
        // ── Phase 4.3: Growth Engine Feature Gate ──────────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('growth_engine');
        }
        $query = AiRecommendation::active()
            ->with(['party', 'product']);

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        $recommendations = $query
            ->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Get stats for the specific filtered query
        $stats = [
            'total_count' => $recommendations->total(),
            'potential_revenue' => $query->sum('potential_revenue'),
        ];

        return Inertia::render('GrowthEngine/GrowthDashboard', [
            'recommendations' => $recommendations,
            'stats' => $stats,
            'filters' => $request->only(['type', 'priority']),
        ]);
    }

    /**
     * Mark recommendation as read
     */
    public function markRead($id)
    {
        $rec = AiRecommendation::findOrFail($id);
        $rec->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Dismiss recommendation
     */
    public function dismiss($id)
    {
        $rec = AiRecommendation::findOrFail($id);
        $rec->update(['is_dismissed' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Generate WhatsApp message for customer
     */
    public function generateWhatsApp($id)
    {
        $rec = AiRecommendation::with('party')->findOrFail($id);

        if (!$rec->party || !$rec->party->phone) {
            return response()->json(['error' => 'No phone number available'], 400);
        }

        $name = explode(' ', $rec->party->name)[0]; // First name
        $message = urlencode("Salam {$name} sb, noticing you might be running low based on your usual order cycle. Should I book your order for delivery? - VenQore Store");

        $phone = preg_replace('/[^0-9]/', '', $rec->party->phone);
        if (strlen($phone) === 10) {
            $phone = '92' . $phone; // Pakistan code
        }

        $whatsappUrl = "https://wa.me/{$phone}?text={$message}";

        return response()->json([
            'success' => true,
            'url' => $whatsappUrl,
            'phone' => $phone,
            'message' => urldecode($message),
        ]);
    }

    /**
     * Get AI Settings
     */
    public function settings()
    {
        $tenantId = app('current.tenant')->id;
        $dbSettings = DB::table('ai_settings')
            ->where('tenant_id', $tenantId)
            ->pluck('value', 'key')
            ->toArray();

        $defaults = [
            'regular_customer_min_orders' => '3',
            'regular_customer_period_days' => '60',
            'min_order_value_filter' => '5000',
            'lookahead_days' => '7',
            'loyalty_points_per_amount' => '100',
            'loyalty_points_earned_per_unit' => '1',
            'loyalty_redemption_rate' => '10',
        ];

        $settings = array_merge($defaults, $dbSettings);

        return Inertia::render('GrowthEngine/Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update AI Settings
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'regular_customer_min_orders' => 'required|integer|min:1',
            'regular_customer_period_days' => 'required|integer|min:7',
            'min_order_value_filter' => 'required|numeric|min:0',
            'lookahead_days' => 'required|integer|min:1|max:30',
            'loyalty_points_per_amount' => 'required|integer|min:1',
            'loyalty_points_earned_per_unit' => 'required|integer|min:1',
            'loyalty_redemption_rate' => 'required|integer|min:1',
        ]);

        $tenantId = app('current.tenant')->id;

        foreach ($validated as $key => $value) {
            $exists = DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->where('key', $key)
                ->exists();

            if ($exists) {
                DB::table('ai_settings')
                    ->where('tenant_id', $tenantId)
                    ->where('key', $key)
                    ->update([
                        'value' => $value,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('ai_settings')->insert([
                    'id' => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id' => $tenantId,
                    'key' => $key,
                    'value' => $value,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return back()->with('success', 'AI Settings updated successfully!');
    }

    // ============ LOYALTY SYSTEM ============

    /**
     * Get customer loyalty info
     */
    public function customerLoyalty($partyId)
    {
        // Tenant-scoped existence check BEFORE the plan gate (Session-3 fix):
        // a party that doesn't belong to the current tenant must 404 regardless
        // of plan tier, matching this codebase's existing "no existence oracle"
        // pattern (see SuperAdminMiddleware). Checking the plan gate first leaked
        // a distinguishable 403 for cross-tenant requests on non-entitled plans.
        $party = Party::findOrFail($partyId);

        if (!\App\Services\PlanGate::check('loyalty_points')) {
            return response()->json(['error' => 'Loyalty points are available on the Enterprise plan.'], 403);
        }

        $balance = LoyaltyBalance::where('party_id', $party->id)->first();
        $storeCredit = StoreCreditBalance::where('party_id', $party->id)->first();

        return response()->json([
            'loyalty_points' => $balance?->balance ?? 0,
            'lifetime_earned' => $balance?->lifetime_earned ?? 0,
            'lifetime_redeemed' => $balance?->lifetime_redeemed ?? 0,
            'store_credit' => $storeCredit?->balance ?? 0,
        ]);
    }

    /**
     * Award loyalty points to customer
     */
    public function awardPoints(Request $request)
    {
        $validated = $request->validate([
            'party_id' => 'required|string',
            'points' => 'required|integer|min:1',
            'description' => 'nullable|string|max:255',
            'invoice_id' => 'nullable|string',
        ]);

        // Tenant-scoped existence check BEFORE the plan gate (Session-3 fix) —
        // see customerLoyalty() above for why the order matters.
        $party = Party::findOrFail($validated['party_id']);

        if (!empty($validated['invoice_id'])) {
            Invoice::findOrFail($validated['invoice_id']);
        }

        // Awarding NEW points is the Enterprise-tier feature being sold on the
        // pricing page — this gate stays. (Spending points a customer already
        // has is a different question; see redeemPoints() below.)
        if (!\App\Services\PlanGate::check('loyalty_points')) {
            return response()->json(['error' => 'Loyalty points are available on the Enterprise plan.'], 403);
        }

        $balance = LoyaltyBalance::awardPoints(
            $party->id,
            $validated['points'],
            $validated['description'] ?? null,
            $validated['invoice_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'new_balance' => $balance->balance,
        ]);
    }

    /**
     * Redeem loyalty points
     */
    public function redeemPoints(Request $request)
    {
        $validated = $request->validate([
            'party_id' => 'required|string',
            'points' => 'required|integer|min:1',
            'invoice_id' => 'nullable|string',
        ]);

        // Tenant-scoped existence check first (Session-3 fix) — see
        // customerLoyalty() above for why the order matters.
        $party = Party::findOrFail($validated['party_id']);

        $invoice = null;
        if (!empty($validated['invoice_id'])) {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
        }

        // No PlanGate check here (Session-3 fix, deliberate): earning NEW
        // points is the gated Enterprise feature (see awardPoints()), but a
        // balance that already exists — awarded before a downgrade, or by a
        // platform admin — is money the store already owes this customer.
        // Blocking its redemption doesn't recover anything for the business;
        // it just traps the customer's existing balance. This mirrors the
        // store-credit endpoints below, which have never gated useStoreCredit()
        // by plan for the same reason. The invoice-total cap directly below
        // is the real safety control for this endpoint, regardless of plan.

        try {
            // Calculate value (default: 10 points = 1 PKR)
            $tenantId = app('current.tenant')->id;
            $rate = DB::table('ai_settings')
                ->where('tenant_id', $tenantId)
                ->where('key', 'loyalty_redemption_rate')
                ->value('value') ?? 10;
            $value = $validated['points'] / $rate;

            if ($invoice && $value > $invoice->total_amount) {
                return response()->json(['error' => 'Redemption value cannot exceed the invoice total amount'], 400);
            }

            $balance = LoyaltyBalance::redeemPoints(
                $party->id,
                $validated['points'],
                'Points redeemed at checkout',
                $validated['invoice_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'new_balance' => $balance->balance,
                'discount_value' => $value,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // ============ GIFT CARDS ============

    /**
     * Create a gift card
     */
    public function createGiftCard(Request $request)
    {
        if (!\App\Services\PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }
        $validated = $request->validate([
            'value' => 'required|numeric|min:100',
            'purchased_by' => 'nullable|string',
            'assigned_to' => 'nullable|string',
            'expires_at' => 'nullable|date|after:today',
        ]);

        if (!empty($validated['purchased_by'])) {
            Party::findOrFail($validated['purchased_by']);
        }
        if (!empty($validated['assigned_to'])) {
            Party::findOrFail($validated['assigned_to']);
        }

        $card = GiftCard::create([
            'code' => GiftCard::generateCode(),
            'initial_value' => $validated['value'],
            'current_balance' => $validated['value'],
            'purchased_by' => $validated['purchased_by'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => 'active',
            'expires_at' => $validated['expires_at'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'gift_card' => $card,
        ]);
    }

    /**
     * Check gift card balance
     */
    public function checkGiftCard($code)
    {
        if (!\App\Services\PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }
        $card = GiftCard::where('code', $code)->first();

        if (!$card) {
            return response()->json(['error' => 'Gift card not found'], 404);
        }

        return response()->json([
            'code' => $card->code,
            'balance' => $card->current_balance,
            'status' => $card->status,
            'is_usable' => $card->isUsable(),
            'expires_at' => $card->expires_at?->format('Y-m-d'),
        ]);
    }

    /**
     * Use gift card balance
     */
    public function useGiftCard(Request $request)
    {
        if (!\App\Services\PlanGate::check('digital_gift_cards')) {
            return response()->json(['error' => 'Digital gift cards are available on the Enterprise plan.'], 403);
        }
        $validated = $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $card = GiftCard::where('code', $validated['code'])->first();

        if (!$card || !$card->isUsable()) {
            return response()->json(['error' => 'Gift card is not valid or has expired'], 400);
        }

        try {
            $card->deduct($validated['amount']);

            return response()->json([
                'success' => true,
                'remaining_balance' => $card->current_balance,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    // ============ STORE CREDIT ============

    /**
     * Add store credit
     */
    public function addStoreCredit(Request $request)
    {
        $validated = $request->validate([
            'party_id' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
            'invoice_id' => 'nullable|string',
        ]);

        $party = Party::findOrFail($validated['party_id']);

        if (!empty($validated['invoice_id'])) {
            Invoice::findOrFail($validated['invoice_id']);
        }

        $balance = StoreCreditBalance::addCredit(
            $party->id,
            $validated['amount'],
            $validated['reason'] ?? 'Store credit added',
            $validated['invoice_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'new_balance' => $balance->balance,
        ]);
    }

    /**
     * Use store credit
     */
    public function useStoreCredit(Request $request)
    {
        $validated = $request->validate([
            'party_id' => 'required|string',
            'amount' => 'required|numeric|min:0.01',
            'invoice_id' => 'nullable|string',
        ]);

        $party = Party::findOrFail($validated['party_id']);

        $invoice = null;
        if (!empty($validated['invoice_id'])) {
            $invoice = Invoice::findOrFail($validated['invoice_id']);
        }

        if ($invoice && $validated['amount'] > $invoice->total_amount) {
            return response()->json(['error' => 'Store credit amount cannot exceed the invoice total amount'], 400);
        }

        try {
            $balance = StoreCreditBalance::useCredit(
                $party->id,
                $validated['amount'],
                'Used at checkout',
                $validated['invoice_id'] ?? null
            );

            return response()->json([
                'success' => true,
                'new_balance' => $balance->balance,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
