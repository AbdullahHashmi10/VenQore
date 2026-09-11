<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\VenaKnowledgeBase;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRequest;
use App\Services\ChatAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VenaAssistController extends Controller
{
    private ChatAIService $aiService;

    public function __construct(ChatAIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Co-pilot assist suggestion.
     * Returns AI suggestion, similar KB entries, and confidence.
     *
     * Reached from two kinds of route:
     *  - authenticated agent routes (routes/web.php, store chatbot inbox), and
     *  - the PUBLIC POST /api/{store_slug}/vena/assist (plan.feature:ai_assistant
     *    + throttle:10,1 + visitor.chat.guard). For an unauthenticated caller:
     *    the store is resolved ONLY from the URL slug (never from the session
     *    UUID), the session must belong to that store, and the platform-wide
     *    knowledge base (VenaKnowledgeBase is not tenant-scoped) is never
     *    returned.
     *
     * Every visitor message fed to the model is screened through
     * AiGateway::screen() first; an off-purpose one skips both model calls.
     * Rate limit / spend are the gateway's (feature visitor_chat).
     */
    public function assist(Request $request, ?string $slug = null)
    {
        $request->validate([
            'session_uuid' => 'nullable|string|max:64',
            'uuid'         => 'nullable|string|max:64',
        ]);

        $isPublic = !auth()->check();

        $uuid = $request->input('session_uuid') ?? $request->input('uuid') ?? $request->route('uuid');
        if (!$uuid && !$isPublic) {
            $uuid = $slug; // legacy positional binding on agent routes
        }
        if (!$uuid || !is_string($uuid)) {
            return response()->json(['error' => 'session_uuid is required'], 422);
        }

        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if ($tenant && is_null($tenant->id)) {
            $tenant = null;
        }

        if ($isPublic) {
            // Public: the URL slug is the only authority for the store.
            $storeSlug = $request->route('store_slug');
            $slugTenant = $storeSlug
                ? \App\Models\Tenant::withoutGlobalScopes()->where('slug', $storeSlug)->first()
                : null;
            if (!$slugTenant || ($tenant && (string) $tenant->id !== (string) $slugTenant->id)) {
                return response()->json(['error' => 'Store context not resolved.'], 400);
            }
            $tenant = $slugTenant;
            app()->instance('current.tenant', $tenant);
        } elseif (!$tenant) {
            // Resolve and bind tenant context if not already bound (e.g. in test envs)
            $storeSlug = $request->route('store_slug');
            if ($storeSlug) {
                $tenant = \App\Models\Tenant::where('slug', $storeSlug)->first();
            }
            if (!$tenant) {
                // Try to find the tenant from the session UUID
                $tempSession = ChatSession::withoutTenantScope()->where('session_uuid', $uuid)->first();
                if ($tempSession) {
                    $tenant = \App\Models\Tenant::find($tempSession->tenant_id);
                }
            }
            if ($tenant) {
                app()->instance('current.tenant', $tenant);
            } else {
                return response()->json(['error' => 'Store context not resolved.'], 400);
            }
        }

        // The session must belong to the resolved store — explicit, not only
        // via the HasTenant global scope.
        $session = ChatSession::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('session_uuid', $uuid)
            ->first();
        if (!$session) {
            return response()->json(['error' => 'Session not found.'], 404);
        }

        try {
            // 1. Get recent messages context
            $history = $session->messages()
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->toArray();

            // Find last visitor question
            $lastVisitorMsg = $session->messages()
                ->where('sender_type', ChatMessage::SENDER_VISITOR)
                ->orderBy('created_at', 'desc')
                ->first();

            $questionText = $lastVisitorMsg ? (string) $lastVisitorMsg->body : '';

            // 1b. Scope screen BEFORE any model call: every visitor message that
            //     reaches the model (history window + the question) is checked.
            //     Deterministic and free; an off-purpose turn skips both calls.
            $gateway = app(AiGateway::class);
            $visitorTexts = [];
            foreach ($history as $msg) {
                if (($msg['sender_type'] ?? null) === ChatMessage::SENDER_VISITOR && trim((string) ($msg['body'] ?? '')) !== '') {
                    $visitorTexts[] = (string) $msg['body'];
                }
            }
            if ($questionText !== '') {
                $visitorTexts[] = $questionText;
            }
            foreach (array_unique($visitorTexts) as $text) {
                $rejected = $gateway->screen(AiRequest::for('visitor_chat')->tenant($tenant)->userText($text));
                if ($rejected !== null) {
                    return response()->json([
                        'success'      => true,
                        'suggestion'   => '',
                        'similar_kb'   => [],
                        'confidence'   => 'low',
                        'out_of_scope' => true,
                        'message'      => (string) $rejected->errorMessage,
                    ]);
                }
            }

            // 2. Draft AI response (AiGateway, feature visitor_chat)
            $suggestedReplyResult = $this->aiService->respond($history, "[System: Assist Draft Request]", [], true);
            $suggestedReply = $suggestedReplyResult['text'] ?? '';

            // 3. Search Similar KB Entries — agents only. The KB is platform-wide
            //    (not tenant-scoped), so it is never exposed to a public caller.
            $similarKb = [];
            if (!$isPublic && !empty($questionText)) {
                $category = $this->aiService->classifyCategory($questionText);

                // Fetch similar verified answers
                $similarKb = VenaKnowledgeBase::where('category', $category)
                    ->orderBy('times_seen', 'desc')
                    ->limit(3)
                    ->get(['question', 'agent_answer', 'times_seen', 'ai_autonomous'])
                    ->toArray();
            }

            // 4. Compute confidence based on exact matches or times_seen
            $confidence = 'medium';
            if (count($similarKb) > 0) {
                $highestSeen = $similarKb[0]['times_seen'] ?? 1;
                if ($highestSeen > 3 || ($similarKb[0]['ai_autonomous'] ?? false)) {
                    $confidence = 'high';
                }
            } else {
                $confidence = 'low';
            }

            return response()->json([
                'success' => true,
                'suggestion' => $suggestedReply,
                'similar_kb' => $similarKb,
                'confidence' => $confidence,
            ]);

        } catch (\Exception $e) {
            Log::error("Vena Assist co-pilot failed: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $isPublic
                    ? 'Failed to generate assistance.'
                    : 'Failed to generate assistance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Autonomy Dashboard stats for Platform Owners and Platform Admins.
     */
    public function autonomyStats(Request $request)
    {
        $user = auth()->user();
        if (!$user->isPlatformAdmin() && $user->platform_role !== 'platform_owner') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // 1. Resolution over time (Recharts Stacked Bar Chart format)
        // Group ChatSession resolutions by date
        $resolutions = ChatSession::where('status', 'resolved')
            ->whereNotNull('resolved_at')
            ->select(
                DB::raw("DATE(resolved_at) as date"),
                DB::raw("COUNT(CASE WHEN ai_disabled = 0 THEN 1 END) as ai_resolutions"),
                DB::raw("COUNT(CASE WHEN ai_disabled = 1 THEN 1 END) as human_resolutions")
            )
            ->groupBy(DB::raw("DATE(resolved_at)"))
            ->orderBy('date', 'asc')
            ->limit(14)
            ->get();

        // 2. Category breakdowns with handle rates and autonomy settings
        $categories = ['general', 'billing', 'checkout', 'features', 'bug'];
        $breakdown = [];

        foreach ($categories as $cat) {
            $total = VenaKnowledgeBase::where('category', $cat)->sum('times_seen');
            $aiHandled = VenaKnowledgeBase::where('category', $cat)->where('was_edited', false)->sum('times_seen');
            $isAutonomous = VenaKnowledgeBase::where('category', $cat)->where('ai_autonomous', true)->exists();

            $aiRate = $total > 0 ? round(($aiHandled / $total) * 100) : 100;

            $breakdown[] = [
                'category' => $cat,
                'total_chats' => (int) $total,
                'ai_handled_count' => (int) $aiHandled,
                'human_handled_count' => (int) ($total - $aiHandled),
                'ai_handled_rate' => $aiRate,
                'ai_autonomous' => $isAutonomous,
            ];
        }

        return response()->json([
            'success' => true,
            'stats' => $resolutions->map(fn($r) => [
                'date' => $r->date,
                'AI' => (int) $r->ai_resolutions,
                'Human' => (int) $r->human_resolutions,
            ]),
            'categories' => $breakdown,
        ]);
    }

    /**
     * Promote a category to let AI handle it autonomously.
     */
    public function promoteCategory(Request $request)
    {
        $user = auth()->user();
        if (!$user->isPlatformAdmin() && $user->platform_role !== 'platform_owner') {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $request->validate([
            'category' => 'required|string|in:general,billing,checkout,features,bug',
            'autonomous' => 'required|boolean'
        ]);

        $category = $request->input('category');
        $autonomous = $request->boolean('autonomous');

        VenaKnowledgeBase::where('category', $category)->update([
            'ai_autonomous' => $autonomous
        ]);

        return response()->json([
            'success' => true,
            'message' => "Category '{$category}' autonomy set to: " . ($autonomous ? 'Autonomous' : 'Manual Escalation')
        ]);
    }
}
