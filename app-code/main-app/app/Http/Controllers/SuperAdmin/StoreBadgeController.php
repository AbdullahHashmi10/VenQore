<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\Commerce\StorefrontBadges;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Platform HQ: see which stores hold which badges and override any of them.
 * 'on' forces a badge to show, 'off' hides it, 'auto' hands it back to the rules.
 */
class StoreBadgeController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $catalogue = StorefrontBadges::catalogue();

        $stores = DB::table('storefronts')
            ->when($q !== '', fn ($w) => $w->where(function ($x) use ($q) {
                $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
                $x->where('display_name', 'like', $like)->orWhere('slug', 'like', $like);
            }))
            ->orderByDesc('created_at')->orderBy('id')
            ->paginate(25, ['id', 'slug', 'display_name', 'status', 'created_at'])->withQueryString();

        $rows = DB::table('storefront_badges')->whereIn('storefront_id', collect($stores->items())->pluck('id'))->get()->groupBy('storefront_id');

        $data = collect($stores->items())->map(function ($s) use ($rows, $catalogue) {
            $mine = ($rows[$s->id] ?? collect())->keyBy('badge');
            $badges = [];
            foreach ($catalogue as $key => $_) {
                $r = $mine[$key] ?? null;
                $auto = (bool) ($r->auto_earned ?? false);
                $override = $r->override ?? null;
                $badges[$key] = [
                    'auto' => $auto, 'override' => $override, 'shown' => StorefrontBadges::visible($auto, $override),
                    'note' => $r->note ?? null,
                ];
            }
            return [
                'id' => $s->id, 'slug' => $s->slug, 'name' => $s->display_name ?: $s->slug, 'status' => $s->status,
                'created_at' => $s->created_at, 'badges' => $badges,
            ];
        })->values();

        return Inertia::render('SuperAdmin/StoreBadges/Index', [
            'stores' => ['data' => $data, 'current' => $stores->currentPage(), 'last' => $stores->lastPage(), 'total' => $stores->total()],
            'catalogue' => collect($catalogue)->map(fn ($c, $k) => ['key' => $k, 'label' => $c['label'], 'description' => $c['description'], 'tone' => $c['tone']])->values(),
            'filters' => ['q' => $q],
        ]);
    }

    public function update(Request $request, string $storefront, StorefrontBadges $badges)
    {
        $data = $request->validate([
            'badge' => ['required', 'string', 'max:40'],
            'mode' => ['required', 'in:on,off,auto'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        abort_unless(DB::table('storefronts')->where('id', $storefront)->exists(), 404);
        abort_unless(array_key_exists($data['badge'], StorefrontBadges::catalogue()), 422);

        $badges->setOverride($storefront, $data['badge'], $data['mode'], $data['note'] ?? null, $request->user()?->id);

        return back()->with('success', 'Badge updated.');
    }

    public function refresh(StorefrontBadges $badges)
    {
        $counts = $badges->refresh();

        return back()->with('success', 'Badges recalculated: ' . collect($counts)->map(fn ($n, $k) => "{$k} {$n}")->implode(', ') . '.');
    }
}
