<?php

namespace App\Http\Controllers;

use App\Models\AiRecommendation;
use App\Models\CustomerAnalytics;
use App\Models\LoyaltyBalance;
use App\Models\GiftCard;
use App\Models\StoreCreditBalance;
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
        $settings = DB::table('ai_settings')->pluck('value', 'key');

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

        foreach ($validated as $key => $value) {
            DB::table('ai_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        return back()->with('success', 'AI Settings updated successfully!');
    }

    // ============ LOYALTY SYSTEM ============

    /**
     * Get customer loyalty info
     */
    public function customerLoyalty($partyId)
    {
        $balance = LoyaltyBalance::where('party_id', $partyId)->first();
        $storeCredit = StoreCreditBalance::where('party_id', $partyId)->first();

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
            'party_id' => 'required|exists:parties,id',
            'points' => 'required|integer|min:1',
            'description' => 'nullable|string|max:255',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        $balance = LoyaltyBalance::awardPoints(
            $validated['party_id'],
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
            'party_id' => 'required|exists:parties,id',
            'points' => 'required|integer|min:1',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        try {
            $balance = LoyaltyBalance::redeemPoints(
                $validated['party_id'],
                $validated['points'],
                'Points redeemed at checkout',
                $validated['invoice_id'] ?? null
            );

            // Calculate value (default: 10 points = 1 PKR)
            $rate = DB::table('ai_settings')->where('key', 'loyalty_redemption_rate')->value('value') ?? 10;
            $value = $validated['points'] / $rate;

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
        $validated = $request->validate([
            'value' => 'required|numeric|min:100',
            'purchased_by' => 'nullable|exists:parties,id',
            'assigned_to' => 'nullable|exists:parties,id',
            'expires_at' => 'nullable|date|after:today',
        ]);

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
            'party_id' => 'required|exists:parties,id',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'nullable|string|max:255',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        $balance = StoreCreditBalance::addCredit(
            $validated['party_id'],
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
            'party_id' => 'required|exists:parties,id',
            'amount' => 'required|numeric|min:0.01',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        try {
            $balance = StoreCreditBalance::useCredit(
                $validated['party_id'],
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
