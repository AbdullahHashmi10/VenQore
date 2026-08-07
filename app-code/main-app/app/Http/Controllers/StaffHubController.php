<?php

namespace App\Http\Controllers;

use App\Models\ChatSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StaffHubController extends Controller
{
    /**
     * Render the unified employee dashboard (Staff Hub).
     */
    public function index(): Response
    {
        $user = Auth::user();
        $staffRole = $user->staff_role ?? $user->platform_role ?? 'support';
        if ($user->isPlatformAdmin()) {
            $staffRole = 'owner';
        }

        // 1. Fetch support chat sessions referred to this support agent globally across the entire platform
        $referredChats = ChatSession::where('referred_to', $user->id)
            ->where('status', '!=', ChatSession::STATUS_RESOLVED)
            ->with(['tenant:id,name,slug'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'session_uuid' => $s->session_uuid,
                'visitor_name' => $s->visitor_name ?? 'Anonymous Visitor',
                'visitor_email' => $s->visitor_email ?? 'Not provided',
                'status' => $s->status,
                'sub_status' => $s->sub_status,
                'tenant_name' => $s->tenant?->name ?? 'Global Platform',
                'tenant_slug' => $s->tenant?->slug,
                'last_message_at' => $s->last_message_at ? $s->last_message_at->toIso8601String() : $s->updated_at->toIso8601String(),
                'url' => route('platform.chatbot.inbox') . '?session=' . $s->session_uuid,
            ]);

        // 2. Fetch queue stats for the Support Room cockpit card
        $unassignedChatsCount = ChatSession::whereNull('claimed_by')
            ->where('status', ChatSession::STATUS_HUMAN_REQUESTED)
            ->count();
        $activeChatsCount = ChatSession::where('status', ChatSession::STATUS_AGENT_ACTIVE)->count();
        $resolvedChatsCount = ChatSession::where('status', ChatSession::STATUS_RESOLVED)->count();

        // 3. Generate dynamic role-based task checklist
        $tasks = $this->generateRoleBasedTasks($staffRole);

        return Inertia::render('Staff/Hub', [
            'employee' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $staffRole,
            ],
            'referred_chats' => $referredChats,
            'tasks' => $tasks,
            'stats' => [
                'unassigned' => $unassignedChatsCount,
                'active' => $activeChatsCount,
                'resolved' => $resolvedChatsCount,
            ]
        ]);
    }

    /**
     * Helper to generate stunning, interactive mock tasks based on active platform roles.
     */
    private function generateRoleBasedTasks(string $role): array
    {
        $tasks = [];

        // Support roles
        if (str_contains($role, 'support') || str_contains($role, 'owner') || str_contains($role, 'manager')) {
            $tasks[] = ['id' => 1, 'text' => 'Review escalated chatbot sessions in the Support Queue', 'completed' => false, 'priority' => 'high'];
            $tasks[] = ['id' => 2, 'text' => 'Verify AI Learning Engine database mappings', 'completed' => false, 'priority' => 'medium'];
            $tasks[] = ['id' => 3, 'text' => 'Audit canned response shortcode templates', 'completed' => true, 'priority' => 'low'];
        }

        // Content / Writer roles
        if (str_contains($role, 'content') || str_contains($role, 'writer')) {
            $tasks[] = ['id' => 4, 'text' => 'Draft the quarterly VenQore operational product release blog', 'completed' => false, 'priority' => 'high'];
            $tasks[] = ['id' => 5, 'text' => 'Optimize help center SEO tags and index pages', 'completed' => true, 'priority' => 'medium'];
        }

        // Marketing / Sales roles
        if (str_contains($role, 'marketing') || str_contains($role, 'sales')) {
            $tasks[] = ['id' => 6, 'text' => 'Construct next month\'s customer email engagement sequences', 'completed' => false, 'priority' => 'high'];
            $tasks[] = ['id' => 7, 'text' => 'Review brand social reach analytics and share graphs', 'completed' => false, 'priority' => 'low'];
        }

        // Finance / Billing roles
        if (str_contains($role, 'finance') || str_contains($role, 'billing') || str_contains($role, 'accountant')) {
            $tasks[] = ['id' => 8, 'text' => 'Audit active franchise subscriber transaction fees', 'completed' => false, 'priority' => 'high'];
            $tasks[] = ['id' => 9, 'text' => 'Reconcile weekly payment gateway batch settlements', 'completed' => true, 'priority' => 'medium'];
        }

        // Generic baseline fallback if role has no specific templates
        if (empty($tasks)) {
            $tasks[] = ['id' => 10, 'text' => 'Sync with platform managers on quarterly operations goals', 'completed' => false, 'priority' => 'medium'];
        }

        return $tasks;
    }
}
