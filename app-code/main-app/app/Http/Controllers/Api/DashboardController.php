<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use App\Models\DashboardCard;
use App\Models\User;
use App\Models\Tenant;
use App\Reckoner\DashboardSanitizer;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboards list for this user/tenant context.
     *
     * GET /api/dashboards
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        // Retrieve user's personal dashboards or role-published templates
        $dashboards = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere(function ($sq) use ($user) {
                      $sq->whereNull('user_id')
                        ->where('for_role', $user->role ?? null);
                  });
            })
            ->orderBy('position')
            ->get();

        // If no dashboards exist yet, auto-create a default one
        if ($dashboards->isEmpty()) {
            $default = $this->createDefaultDashboard($user, $tenant);
            $dashboards = collect([$default]);
        }

        return response()->json(['data' => $dashboards]);
    }

    /**
     * Create a new personal dashboard.
     *
     * POST /api/dashboards
     */
    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:80',
        ]);

        $slug = Str::slug($validated['name']);

        // Check uniqueness for this user
        $exists = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->where('slug', $slug)
            ->exists();

        if ($exists) {
            $slug .= '-' . Str::random(4);
        }

        $dashboard = Dashboard::create([
            'tenant_id' => $tenant->id,
            'user_id' => $user->id,
            'name' => $validated['name'],
            'slug' => $slug,
            'is_default' => false,
            'is_locked' => false,
            'position' => Dashboard::query()->where('tenant_id', $tenant->id)->where('user_id', $user->id)->count(),
        ]);

        return response()->json(['data' => $dashboard], 201);
    }

    /**
     * Get specific dashboard structure and cards (no data).
     *
     * GET /api/dashboards/{id}
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        // Authorise access
        if ($dashboard->user_id !== null && $dashboard->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Get available keys to filter gated cards
        $reckoner = app(Reckoner::class);
        $keys = array_keys(ReckonerRegistry::all());
        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        // Get all cards in database
        $cards = $dashboard->cards;

        // Separate visible and gated cards
        $visibleCards = [];
        foreach ($cards as $card) {
            if (in_array($card->reading_key, $availableKeys, true)) {
                // Ensure card details match current registry shape rules
                $cleanItem = DashboardSanitizer::sanitize([$card->toArray()], $availableKeys);
                if (! empty($cleanItem)) {
                    $cleanCard = $card->toArray();
                    $cleanCard['w'] = $cleanItem[0]['w'];
                    $cleanCard['h'] = $cleanItem[0]['h'];
                    $cleanCard['chart'] = $cleanItem[0]['chart'];
                    $cleanCard['period'] = $cleanItem[0]['period'];
                    $visibleCards[] = $cleanCard;
                }
            }
        }

        $dashboardData = $dashboard->toArray();
        $dashboardData['cards'] = $visibleCards;

        return response()->json(['data' => $dashboardData]);
    }

    /**
     * Update dashboard details (name, position, default flag).
     *
     * PUT /api/dashboards/{id}
     */
    public function update(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->where('user_id', $user->id) // personal dashboards only
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'nullable|string|max:80',
            'position' => 'nullable|integer',
            'is_default' => 'nullable|boolean',
        ]);

        if (isset($validated['name'])) {
            $dashboard->name = $validated['name'];
            $dashboard->slug = Str::slug($validated['name']);
        }

        if (isset($validated['position'])) {
            $dashboard->position = $validated['position'];
        }

        if (! empty($validated['is_default'])) {
            // Unset other defaults
            Dashboard::query()
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $user->id)
                ->update(['is_default' => false]);

            $dashboard->is_default = true;
        }

        $dashboard->save();

        return response()->json(['data' => $dashboard]);
    }

    /**
     * Delete dashboard.
     *
     * DELETE /api/dashboards/{id}
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Never delete the last personal dashboard
        $count = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('user_id', $user->id)
            ->count();

        if ($count <= 1) {
            return response()->json(['error' => 'Cannot delete the last dashboard'], 422);
        }

        DB::transaction(function () use ($dashboard) {
            $dashboard->cards()->delete();
            $dashboard->delete();
        });

        return response()->json(['message' => 'Dashboard deleted']);
    }

    /**
     * Save the entire layout array atomically.
     *
     * PUT /api/dashboards/{id}/layout
     */
    public function saveLayout(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        // Check if layout is locked
        if ($dashboard->is_locked && ! $user->hasPermission('admin.settings_manage')) {
            return response()->json(['error' => 'This layout is locked by your manager.'], 403);
        }

        if ($dashboard->user_id !== null && $dashboard->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'cards' => 'required|array',
        ]);

        $reckoner = app(Reckoner::class);
        $keys = array_keys(ReckonerRegistry::all());
        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        $sanitized = DashboardSanitizer::sanitize($validated['cards'], $availableKeys);

        DB::transaction(function () use ($dashboard, $sanitized, $tenant) {
            // Retrieve all existing cards including gated/hidden ones
            $existing = $dashboard->cards()->get()->keyBy('id');

            $cleanIds = [];
            foreach ($sanitized as $cardData) {
                $cardId = $cardData['id'] ?? null;

                if ($cardId && $existing->has($cardId)) {
                    // Update existing visible card coordinates
                    $card = $existing->get($cardId);
                    $card->update(array_filter($cardData, fn($k) => $k !== 'id', ARRAY_FILTER_USE_KEY));
                    $cleanIds[] = $cardId;
                } else {
                    // Create new card
                    $newCard = $dashboard->cards()->create(array_merge([
                        'tenant_id' => $tenant->id,
                    ], array_filter($cardData, fn($k) => $k !== 'id', ARRAY_FILTER_USE_KEY)));
                    $cleanIds[] = $newCard->id;
                }
            }

            // Delete visible cards that are no longer in the layout, but
            // preserve gated cards that were not present in the sanitized set!
            $gatedKeys = array_diff(array_keys(ReckonerRegistry::all()), array_keys(array_filter($dashboard->cards()->get()->pluck('reading_key')->toArray())));
            
            foreach ($existing as $id => $card) {
                // If it is in cleanIds, it is active.
                // If it is gated (reading_key not currently available), we keep it!
                if (! in_array($id, $cleanIds, true)) {
                    if (in_array($card->reading_key, $gatedKeys, true) || ! ReckonerRegistry::exists($card->reading_key)) {
                        // Keep gated card in place in DB
                        continue;
                    }
                    $card->delete();
                }
            }
        });

        return response()->json(['message' => 'Layout saved successfully']);
    }

    /**
     * Add a card.
     *
     * POST /api/dashboards/{id}/cards
     */
    public function addCard(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($dashboard->is_locked && ! $user->hasPermission('admin.settings_manage')) {
            return response()->json(['error' => 'Layout is locked.'], 403);
        }

        if ($dashboard->user_id !== null && $dashboard->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if ($dashboard->cards()->count() >= 40) {
            return response()->json(['error' => 'Maximum 40 cards allowed.'], 422);
        }

        $validated = $request->validate([
            'reading_key' => 'required|string',
            'period' => 'nullable|string',
            'chart' => 'nullable|string',
            'title_override' => 'nullable|string|max:80',
            'style' => 'nullable|array',
            // Layout Law v2.0 geometry. `size` is legacy — the twelve
            // 2x4..8x8 presets it enumerated are superseded by six categories
            // and eighteen fits — but it is still accepted so a client that has
            // not been redeployed keeps working; LayoutLaw::fromLegacySize()
            // translates it to the nearest legal shape.
            'category' => 'nullable|string|in:C1,C2,C3,C4,C5,C6',
            'fit' => 'nullable|string|max:24',
            'w' => 'nullable|integer|min:1|max:12',
            'h' => 'nullable|integer|min:1|max:16',
            'size' => 'nullable|string|max:12',
        ]);

        $reckoner = app(Reckoner::class);
        $keys = array_keys(ReckonerRegistry::all());
        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        // Enforce availability gate
        if (! in_array($validated['reading_key'], $availableKeys, true)) {
            return response()->json(['error' => 'This reading is not available.'], 422);
        }

        $sanitized = DashboardSanitizer::sanitize([$validated], $availableKeys);
        if (empty($sanitized)) {
            return response()->json(['error' => 'Invalid card options.'], 422);
        }

        $cardData = $sanitized[0];
        unset($cardData['id']);

        // Find next position: simple y row packing
        $maxY = (int) $dashboard->cards()->max('y');
        $cardData['x'] = 0;
        $cardData['y'] = $maxY + 2; // place on a new row

        $card = $dashboard->cards()->create(array_merge([
            'tenant_id' => $tenant->id,
        ], $cardData));

        return response()->json(['data' => $card], 201);
    }

    /**
     * Update card configuration.
     *
     * PATCH /api/dashboards/{id}/cards/{cardId}
     */
    public function updateCard(string $id, string $cardId, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($dashboard->is_locked && ! $user->hasPermission('admin.settings_manage')) {
            return response()->json(['error' => 'Layout is locked.'], 403);
        }

        if ($dashboard->user_id !== null && $dashboard->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $card = $dashboard->cards()
            ->where('tenant_id', $tenant->id)
            ->where('id', $cardId)
            ->firstOrFail();

        $validated = $request->validate([
            'period' => 'nullable|string',
            'period_custom' => 'nullable|array',
            'chart' => 'nullable|string',
            'title_override' => 'nullable|string|max:80',
            'args' => 'nullable|array',
            'style' => 'nullable|array',
            // Layout Law v2.0 geometry. `size` is legacy — the twelve
            // 2x4..8x8 presets it enumerated are superseded by six categories
            // and eighteen fits — but it is still accepted so a client that has
            // not been redeployed keeps working; LayoutLaw::fromLegacySize()
            // translates it to the nearest legal shape.
            'category' => 'nullable|string|in:C1,C2,C3,C4,C5,C6',
            'fit' => 'nullable|string|max:24',
            'w' => 'nullable|integer|min:1|max:12',
            'h' => 'nullable|integer|min:1|max:16',
            'size' => 'nullable|string|max:12',
        ]);

        $reckoner = app(Reckoner::class);
        $keys = array_keys(ReckonerRegistry::all());
        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        // Merge only the keys the request actually sent.
        //
        // This was array_filter($validated), which drops every FALSY value —
        // so clearing a title (null) or switching a card back to a plain
        // surface silently did nothing, because the old value survived the
        // merge. `array_key_exists` is the right test: absent means "leave it
        // alone", present-and-null means "clear it".
        $patch = array_filter(
            $validated,
            fn ($key) => array_key_exists($key, $request->all()),
            ARRAY_FILTER_USE_KEY,
        );

        $merged = array_merge($card->toArray(), $patch);
        $sanitized = DashboardSanitizer::sanitize([$merged], $availableKeys);

        if (empty($sanitized)) {
            return response()->json(['error' => 'Invalid configuration values.'], 422);
        }

        $cardData = $sanitized[0];
        unset($cardData['id']);

        $card->update($cardData);

        return response()->json(['data' => $card]);
    }

    /**
     * Delete a card.
     *
     * DELETE /api/dashboards/{id}/cards/{cardId}
     */
    public function removeCard(string $id, string $cardId, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        if ($dashboard->is_locked && ! $user->hasPermission('admin.settings_manage')) {
            return response()->json(['error' => 'Layout is locked.'], 403);
        }

        if ($dashboard->user_id !== null && $dashboard->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $card = $dashboard->cards()
            ->where('tenant_id', $tenant->id)
            ->where('id', $cardId)
            ->firstOrFail();

        $card->delete();

        return response()->json(['message' => 'Card removed successfully']);
    }

    /**
     * Reset personal layout back to the role default.
     *
     * POST /api/dashboards/{id}/reset
     */
    public function reset(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        $dashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Clear existing cards
        DB::transaction(function () use ($dashboard, $user, $tenant) {
            $dashboard->cards()->delete();

            // Seed starting cards derived from role default templates
            $role = $user->role ?? 'staff';
            $template = Dashboard::query()
                ->where('tenant_id', $tenant->id)
                ->whereNull('user_id')
                ->where('for_role', $role)
                ->first();

            if ($template) {
                // Copy cards from role template
                foreach ($template->cards as $card) {
                    $dashboard->cards()->create($card->replicate(['id', 'dashboard_id'])->toArray());
                }
            } else {
                // Copy from default computed cards (Phase B1 defaults)
                $defaultCards = $this->getDefaultRoleCards($role, $user, $tenant);
                foreach ($defaultCards as $cardData) {
                    $dashboard->cards()->create($cardData);
                }
            }
        });

        return response()->json(['data' => $dashboard->load('cards')]);
    }

    /**
     * Publish personal layout to a role, and optionally lock it.
     *
     * POST /api/dashboards/{id}/publish
     */
    public function publish(string $id, Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $user = $request->user();

        // Lock/publish is restricted to managers/owners
        if (! $user->hasPermission('admin.settings_manage')) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'for_role' => 'required|string|max:40',
            'is_locked' => 'required|boolean',
        ]);

        $sourceDashboard = Dashboard::query()
            ->where('tenant_id', $tenant->id)
            ->where('id', $id)
            ->firstOrFail();

        DB::transaction(function () use ($sourceDashboard, $validated, $tenant) {
            // Find or create template dashboard for this role
            $template = Dashboard::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'user_id' => null, // signifies tenant-wide role template
                    'slug' => 'default-' . $validated['for_role'],
                ],
                [
                    'name' => 'Default ' . ucfirst($validated['for_role']),
                    'for_role' => $validated['for_role'],
                    'is_locked' => $validated['is_locked'],
                    'is_default' => false,
                ]
            );

            // Overwrite template cards with source cards
            $template->cards()->delete();
            foreach ($sourceDashboard->cards as $card) {
                $template->cards()->create($card->replicate(['id', 'dashboard_id'])->toArray());
            }

            // If template is locked, force update is_locked flag on existing user dashboards matching role
            if ($validated['is_locked']) {
                Dashboard::query()
                    ->where('tenant_id', $tenant->id)
                    ->whereNotNull('user_id')
                    ->whereHas('cards', function($q) use ($validated) {
                        // find matching users by their role
                    })
                    ->update(['is_locked' => true]);
            }
        });

        return response()->json(['message' => 'Dashboard published successfully.']);
    }

    /* ------------------------------------------------------------------ *
     * Internal Helpers
     * ------------------------------------------------------------------ */

    private function createDefaultDashboard(User $user, Tenant $tenant): Dashboard
    {
        return DB::transaction(function () use ($user, $tenant) {
            $dashboard = Dashboard::create([
                'tenant_id' => $tenant->id,
                'user_id' => $user->id,
                'name' => 'My Dashboard',
                'slug' => 'my-dashboard',
                'is_default' => true,
                'is_locked' => false,
                'position' => 0,
            ]);

            // Seeding default cards
            $role = $user->role ?? 'owner';
            $defaultCards = $this->getDefaultRoleCards($role, $user, $tenant);
            foreach ($defaultCards as $cardData) {
                $dashboard->cards()->create($cardData);
            }

            return $dashboard;
        });
    }

    private function getDefaultRoleCards(string $role, User $user, Tenant $tenant): array
    {
        $reckoner = app(Reckoner::class);
        $keys = array_keys(ReckonerRegistry::all());
        $availability = $reckoner->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        // Phase B1 Core defaults: sales.revenue, finance.net_profit, stock_value, balance_sheet_ok
        $candidates = [
            [
                'reading_key' => 'sales.revenue',
                'period' => 'today',
                'chart' => 'stat',
                'size' => '4x4',
                'x' => 0, 'y' => 0, 'w' => 4, 'h' => 4,
            ],
            [
                'reading_key' => 'finance.net_profit',
                'period' => 'this_month',
                'chart' => 'stat',
                'size' => '4x4',
                'x' => 4, 'y' => 0, 'w' => 4, 'h' => 4,
            ],
            [
                'reading_key' => 'inventory.stock_value',
                'period' => 'live',
                'chart' => 'stat',
                'size' => '4x4',
                'x' => 8, 'y' => 0, 'w' => 4, 'h' => 4,
            ],
            [
                'reading_key' => 'finance.balance_sheet_ok',
                'period' => 'live',
                'chart' => 'status',
                'size' => '4x4',
                'x' => 0, 'y' => 4, 'w' => 4, 'h' => 4,
            ],
        ];

        $clean = [];
        $x = 0;
        $y = 0;
        foreach ($candidates as $candidate) {
            if (in_array($candidate['reading_key'], $availableKeys, true)) {
                if ($x + $candidate['w'] > 12) {
                    $x = 0;
                    $y += 4;
                }
                $candidate['x'] = $x;
                $candidate['y'] = $y;
                $clean[] = $candidate;
                $x += $candidate['w'];
            }
        }

        return $clean;
    }
}
