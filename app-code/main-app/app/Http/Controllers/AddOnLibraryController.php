<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Add-ons library (FOH plan, step 1c).
 *
 * One place to define "Extra cheese +100, Olives +50" ONCE and say where it
 * applies: to every product in a category (the five pizza toppings) and/or to
 * individual products. The register reads the merged result from
 * `pos.modifiers`; nothing here touches variants, which stay variants.
 */
class AddOnLibraryController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        $tenant = app('current.tenant');

        $groups = ModifierGroup::where('tenant_id', $tenant->id)
            ->where('is_library', true)
            ->with(['modifiers' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'), 'categories:id,name', 'products:id,name'])
            ->orderBy('sort_order')->orderBy('name')
            ->get()
            ->map(fn (ModifierGroup $g) => $this->shape($g))
            ->values();

        // The product form asks for the list as plain JSON (not an Inertia visit).
        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json(['groups' => $groups]);
        }

        return Inertia::render('Inventory/AddOns', [
            'storeSlug'  => $tenant->slug,
            'groups'     => $groups,
            'categories' => Category::where('tenant_id', $tenant->id)->orderBy('name')->get(['id', 'name']),
            'products'   => Product::where('tenant_id', $tenant->id)->orderBy('name')->limit(1000)->get(['id', 'name', 'category_id']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');
        $data   = $this->validated($request);

        $group = DB::transaction(function () use ($tenant, $data) {
            $group = ModifierGroup::create([
                'tenant_id'  => $tenant->id,
                'name'       => $data['name'],
                'min_select' => $data['min_select'],
                'max_select' => $data['max_select'],
                'required'   => $data['min_select'] >= 1,
                'sort_order' => (int) ModifierGroup::where('tenant_id', $tenant->id)->where('is_library', true)->count(),
                'is_library' => true,
            ]);
            $this->syncChoices($group, $data['modifiers'], $tenant->id);
            $this->syncTargets($group, $data, $tenant->id);
            return $group;
        });

        return response()->json(['success' => true, 'group' => $this->shape($this->fresh($group))]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $tenant = app('current.tenant');
        $group  = ModifierGroup::where('tenant_id', $tenant->id)->where('is_library', true)->findOrFail($id);
        $data   = $this->validated($request);

        DB::transaction(function () use ($group, $tenant, $data) {
            $group->update([
                'name'       => $data['name'],
                'min_select' => $data['min_select'],
                'max_select' => $data['max_select'],
                'required'   => $data['min_select'] >= 1,
            ]);
            $this->syncChoices($group, $data['modifiers'], $tenant->id);
            $this->syncTargets($group, $data, $tenant->id);
        });

        return response()->json(['success' => true, 'group' => $this->shape($this->fresh($group))]);
    }

    public function destroy($id): JsonResponse
    {
        $tenant = app('current.tenant');
        $group  = ModifierGroup::where('tenant_id', $tenant->id)->where('is_library', true)->findOrFail($id);

        DB::transaction(function () use ($group) {
            $group->categories()->detach();
            $group->products()->detach();
            $group->modifiers()->delete();
            $group->delete();
        });

        return response()->json(['success' => true]);
    }

    private function validated(Request $request): array
    {
        $d = $request->validate([
            'name'                    => 'required|string|max:80',
            'min_select'              => 'nullable|integer|min:0|max:50',
            'max_select'              => 'nullable|integer|min:1|max:50',
            'modifiers'               => 'nullable|array|max:100',
            'modifiers.*.id'          => 'nullable|integer',
            'modifiers.*.name'        => 'required|string|max:80',
            'modifiers.*.price_delta' => 'nullable|numeric|min:-9999999|max:9999999',
            'modifiers.*.is_default'  => 'nullable|boolean',
            'modifiers.*.available'   => 'nullable|boolean',
            'category_ids'            => 'nullable|array',
            'category_ids.*'          => 'string',
            'product_ids'             => 'nullable|array',
            'product_ids.*'           => 'string',
        ]);

        $d['min_select'] = (int) ($d['min_select'] ?? 0);
        $d['max_select'] = max(1, (int) ($d['max_select'] ?? 1), $d['min_select']);
        $d['modifiers']  = $d['modifiers'] ?? [];
        return $d;
    }

    private function syncChoices(ModifierGroup $group, array $mods, $tenantId): void
    {
        $keep = [];
        foreach (array_values($mods) as $i => $m) {
            $row = null;
            if (!empty($m['id'])) {
                $row = Modifier::where('modifier_group_id', $group->id)->find($m['id']);
            }
            $payload = [
                'name'        => $m['name'],
                'price_delta' => $m['price_delta'] ?? 0,
                'is_default'  => !empty($m['is_default']),
                'available'   => array_key_exists('available', $m) ? (bool) $m['available'] : true,
                'sort_order'  => $i,
            ];
            if ($row) {
                $row->update($payload);
            } else {
                $row = Modifier::create($payload + ['tenant_id' => $tenantId, 'modifier_group_id' => $group->id]);
            }
            $keep[] = $row->id;
        }
        $group->modifiers()->whereNotIn('id', $keep)->delete();
    }

    private function syncTargets(ModifierGroup $group, array $data, $tenantId): void
    {
        if (array_key_exists('category_ids', $data)) {
            $ids = Category::where('tenant_id', $tenantId)->whereIn('id', $data['category_ids'] ?? [])->pluck('id')->all();
            $group->categories()->sync($ids);
        }
        if (array_key_exists('product_ids', $data)) {
            $ids = Product::where('tenant_id', $tenantId)->whereIn('id', $data['product_ids'] ?? [])->pluck('id')->all();
            $group->products()->sync($ids);
        }
    }

    private function fresh(ModifierGroup $group): ModifierGroup
    {
        return ModifierGroup::with(['modifiers' => fn ($q) => $q->orderBy('sort_order')->orderBy('id'), 'categories:id,name', 'products:id,name'])->find($group->id);
    }

    private function shape(ModifierGroup $g): array
    {
        return [
            'id'           => $g->id,
            'name'         => $g->name,
            'min_select'   => (int) $g->min_select,
            'max_select'   => (int) $g->max_select,
            'required'     => (bool) $g->required,
            'modifiers'    => $g->modifiers->map(fn ($m) => [
                'id' => $m->id, 'name' => $m->name, 'price_delta' => (float) $m->price_delta,
                'is_default' => (bool) $m->is_default, 'available' => (bool) $m->available,
            ])->values(),
            'category_ids' => $g->categories->pluck('id')->values(),
            'product_ids'  => $g->products->pluck('id')->values(),
        ];
    }
}
