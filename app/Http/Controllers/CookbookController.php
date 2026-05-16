<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\Product;
use App\Models\RecipeMedia;
use App\Models\Warehouse;
use App\Models\Category;
use App\Models\ProductAttribute;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CookbookController extends Controller
{
    public function simulate(Request $request)
    {
        $validated = $request->validate([
            'recipe_id' => 'required|exists:recipes,id',
            'quantity' => 'required|numeric|min:0.01'
        ]);

        $recipe = Recipe::with(['ingredients.ingredientProduct.stocks'])->findOrFail($validated['recipe_id']);
        $targetQty = $validated['quantity'];
        
        // Calculate ratio based on Yield
        $ratio = $targetQty / ($recipe->yield_quantity ?: 1);

        $results = $recipe->ingredients->map(function ($ing) use ($ratio) {
            $requiredQty = $ing->quantity * $ratio;
            
            // Sum available stock from all warehouses
            // Note: In a real multi-warehouse setup, we might filter by user's warehouse
            $availableQty = $ing->ingredientProduct->stocks->sum(function ($stock) {
                return max(0, $stock->quantity - ($stock->reserved_quantity ?? 0));
            });

            return [
                'name' => $ing->ingredientProduct->name,
                'required' => $requiredQty,
                'available' => $availableQty,
                'unit' => $ing->unit,
                'status' => $availableQty >= $requiredQty ? 'ok' : 'short',
                'shortfall' => max(0, $requiredQty - $availableQty)
            ];
        });

        $canMake = $results->every(fn($i) => $i['status'] === 'ok');

        return response()->json([
            'can_make' => $canMake,
            'ingredients' => $results
        ]);
    }

    public function index()
    {
        $recipes = Recipe::with(['product', 'ingredients.ingredientProduct', 'media'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($recipe) {
                // Calculate total ingredient cost
                $totalCost = $recipe->ingredients->sum(function ($ing) {
                    $costPerUnit = $ing->ingredientProduct->cost_price ?? 0;
                    return $ing->quantity * $costPerUnit;
                });
                
                return [
                    'id' => $recipe->id,
                    'name' => $recipe->name,
                    'description' => $recipe->description,
                    'product' => $recipe->product,
                    'yield_quantity' => $recipe->yield_quantity,
                    'labor_cost' => $recipe->labor_cost,
                    'overhead_cost' => $recipe->overhead_cost,
                    'total_cost' => $totalCost + $recipe->labor_cost + $recipe->overhead_cost,
                    'ingredients_count' => $recipe->ingredients->count(),
                    'media' => $recipe->media
                ];
            });

        return Inertia::render('Cookbook/RecipesList', [
            'recipes' => $recipes
        ]);
    }

    public function create()
    {
        $products = Product::orderBy('name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'base_unit' => $p->base_unit ?? 'pcs',
                'cost_price' => $p->cost_price ?? 0,
                'price' => $p->price ?? 0,
            ];
        });

        $warehouses = Warehouse::query()->get();
        $categories = Category::query()->get();
        $attributes = ProductAttribute::query()->get();
        
        return Inertia::render('Cookbook/Create', [
            'products' => $products,
            'warehouses' => $warehouses,
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_id' => 'required|exists:products,id',
            'yield_quantity' => 'required|numeric|min:0.01',
            'labor_cost' => 'nullable|numeric|min:0',
            'overhead_cost' => 'nullable|numeric|min:0',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
            'ingredients.*.wastage_percent' => 'nullable|numeric|min:0|max:100'
        ]);

        $recipe = Recipe::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'product_id' => $validated['product_id'],
            'yield_quantity' => $validated['yield_quantity'],
            'yield_unit' => 'pcs',
            'labor_cost' => $validated['labor_cost'] ?? 0,
            'overhead_cost' => $validated['overhead_cost'] ?? 0,
            'preparation_time' => $validated['prep_time_minutes'] ?? 0,
            'is_active' => true
        ]);

        foreach ($validated['ingredients'] as $ingredient) {
            RecipeIngredient::create([
                'recipe_id' => $recipe->id,
                'product_id' => $ingredient['product_id'],
                'quantity' => $ingredient['quantity'],
                'unit' => $ingredient['unit'] ?? 'units',
                'wastage_percent' => $ingredient['wastage_percent'] ?? 0
            ]);
        }

        if ($request->has('media')) {
            foreach ($request->media as $idx => $item) {
                if (!empty($item['url'])) {
                    RecipeMedia::create([
                        'recipe_id' => $recipe->id,
                        'type' => $item['type'] ?? 'youtube',
                        'url' => $item['url'],
                        'title' => $item['title'] ?? null,
                        'sort_order' => $idx
                    ]);
                }
            }
        }

        return redirect()->route('cookbook.index')->with('success', 'Recipe created successfully');
    }

    public function edit($id)
    {
        $recipe = Recipe::with(['ingredients', 'media'])->findOrFail($id);

        // Transform for form
        $recipeData = [
            'id' => $recipe->id,
            'name' => $recipe->name,
            'description' => $recipe->description,
            'product_id' => $recipe->product_id,
            'yield_quantity' => $recipe->yield_quantity,
            'labor_cost' => $recipe->labor_cost ?? 0,
            'overhead_cost' => $recipe->overhead_cost ?? 0,
            'prep_time_minutes' => $recipe->preparation_time ?? 0,
            'ingredients' => $recipe->ingredients->map(function ($i) {
                return [
                    'product_id' => $i->product_id,
                    'quantity' => $i->quantity,
                    'unit' => $i->unit,
                    'wastage_percent' => $i->wastage_percent ?? 0
                ];
            }),
            'media' => $recipe->media->map(function ($m) {
                return [
                    'type' => $m->type,
                    'url' => $m->url,
                    'title' => $m->title
                ];
            })
        ];

        $products = Product::orderBy('name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'base_unit' => $p->base_unit ?? 'pcs',
                'cost_price' => $p->cost_price ?? 0,
                'price' => $p->price ?? 0,
            ];
        });

        $warehouses = Warehouse::query()->get();
        $categories = Category::query()->get();
        $attributes = ProductAttribute::query()->get();

        return Inertia::render('Cookbook/Create', [
            'products' => $products,
            'recipe' => $recipeData,
            'warehouses' => $warehouses,
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }



    public function update(Request $request, $id)
    {
        $oldRecipe = Recipe::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'product_id' => 'required|exists:products,id',
            'yield_quantity' => 'required|numeric|min:0.01',
            'labor_cost' => 'nullable|numeric|min:0',
            'overhead_cost' => 'nullable|numeric|min:0',
            'prep_time_minutes' => 'nullable|integer|min:0',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.product_id' => 'required|exists:products,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01',
            'ingredients.*.wastage_percent' => 'nullable|numeric|min:0|max:100'
        ]);

        // EXPERT FEATURE: Version Control
        // Do not overwrite. Create new version.
        
        // Determine Parent ID (Root of the version tree)
        $parentId = $oldRecipe->parent_recipe_id ?? $oldRecipe->id;

        // Calculate next version number
        $maxVersion = Recipe::where('id', $parentId)
            ->orWhere('parent_recipe_id', $parentId)
            ->max('version_number');
            
        $newVersion = $maxVersion + 1;

        // Deactivate the old recipe (it becomes history)
        $oldRecipe->update(['is_active' => false]);

        // Create the new version
        $newRecipe = Recipe::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'product_id' => $validated['product_id'],
            'yield_quantity' => $validated['yield_quantity'],
            'yield_unit' => 'pcs',
            'labor_cost' => $validated['labor_cost'] ?? 0,
            'overhead_cost' => $validated['overhead_cost'] ?? 0,
            'preparation_time' => $validated['prep_time_minutes'] ?? 0,
            'is_active' => true,
            'version_number' => $newVersion,
            'parent_recipe_id' => $parentId
        ]);

        foreach ($validated['ingredients'] as $ingredient) {
            RecipeIngredient::create([
                'recipe_id' => $newRecipe->id,
                'product_id' => $ingredient['product_id'],
                'quantity' => $ingredient['quantity'],
                'unit' => $ingredient['unit'] ?? 'units',
                'wastage_percent' => $ingredient['wastage_percent'] ?? 0
            ]);
        }

        // Save Media for new version
        if ($request->has('media')) {
            foreach ($request->media as $idx => $item) {
                if (!empty($item['url'])) {
                    RecipeMedia::create([
                        'recipe_id' => $newRecipe->id,
                        'type' => $item['type'] ?? 'youtube',
                        'url' => $item['url'],
                        'title' => $item['title'] ?? null,
                        'sort_order' => $idx
                    ]);
                }
            }
        }

        return redirect()->route('cookbook.index')->with('success', "Recipe updated to Version {$newVersion} successfully");
    }

    public function destroy($id)
    {
        $recipe = Recipe::findOrFail($id);
        $recipe->ingredients()->delete();
        $recipe->delete();

        return redirect()->route('cookbook.index')->with('success', 'Recipe deleted successfully');
    }
}
