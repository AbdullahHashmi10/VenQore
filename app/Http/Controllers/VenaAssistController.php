<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\VenaKnowledgeBase;
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
     */
    public function assist(Request $request, string $slug = null)
    {
        $uuid = $request->input('session_uuid') ?? $request->input('uuid');
        if (!$uuid) {
            return response()->json(['error' => 'session_uuid is required'], 422);
        }

        $session = ChatSession::where('session_uuid', $uuid)->firstOrFail();

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

            $questionText = $lastVisitorMsg ? $lastVisitorMsg->body : '';

            // 2. Draft AI response using Gemini
            $suggestionPrompt = "[System: You are acting as an internal Vena Assist co-pilot for a support agent. Analyze the context and draft a highly accurate response. Return ONLY the reply text, no notes.]";
            $suggestedReplyResult = $this->aiService->respond($history, "[System: Assist Draft Request]", []);
            $suggestedReply = $suggestedReplyResult['text'] ?? '';

            // 3. Search Similar KB Entries
            $similarKb = [];
            if (!empty($questionText)) {
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
                'message' => 'Failed to generate assistance: ' . $e->getMessage()
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
