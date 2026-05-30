<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Recipe;
use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class DemoCookbookSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoCookbookSeeder.");
            return;
        }

        $products = Product::where('tenant_id', $tenantId)->get();

        if ($products->isEmpty()) {
            $this->command?->warn("Skipping cookbook — no products found.");
            return;
        }

        $recipes = [
            ['name' => 'Electronics Bundle — Starter Pack',    'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Laptop + mouse + keyboard combo bundle for new office setups.'],
            ['name' => 'Gaming Setup — Entry Level',           'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Monitor + keyboard + gaming mouse starter bundle.'],
            ['name' => 'Work From Home Bundle',                'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Webcam, headset, and USB hub bundle for remote workers.'],
            ['name' => 'Student Tech Pack',                    'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Laptop + earbuds + charger bundle for students.'],
            ['name' => 'Photography Starter Kit',              'yield' => 1, 'yield_unit' => 'KIT',  'notes' => 'SD card + card reader + laptop bundle.'],
            ['name' => 'Network Upgrade Package',              'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Router + switch + cables bundle for small office.'],
            ['name' => 'Audio Studio Bundle',                  'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Headphones + interface + monitoring speakers.'],
            ['name' => 'Mobile Office Pack',                   'yield' => 1, 'yield_unit' => 'BAG',  'notes' => 'Laptop bag + portable charger + USB hub.'],
            ['name' => 'Security System Bundle',               'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Smart camera + storage + cables.'],
            ['name' => 'Gift Hamper — Premium Tech',           'yield' => 1, 'yield_unit' => 'BOX',  'notes' => 'Curated premium tech gift set for executives.'],
            ['name' => 'Smart Home Starter',                   'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Smart speaker + smart bulbs + hub.'],
            ['name' => 'Conference Room Kit',                  'yield' => 1, 'yield_unit' => 'SET',  'notes' => 'Display + webcam + speakerphone bundle.'],
        ];

        foreach ($recipes as $data) {
            $finishedProduct = $products->random();
            $recipe = Recipe::create([
                'tenant_id'      => $tenantId,
                'name'           => $data['name'],
                'product_id'     => $finishedProduct->id,
                'yield_quantity' => $data['yield'],
                'yield_unit'     => $data['yield_unit'],
                'description'    => $data['notes'],
                'is_active'      => true,
            ]);

            // Add 2–4 random ingredients
            $ingredientCount = rand(2, 4);
            $usedProducts    = $products->random(min($ingredientCount, $products->count()));

            foreach ($usedProducts as $prod) {
                DB::table('recipe_ingredients')->insert([
                    'id'          => Str::uuid()->toString(),
                    'tenant_id'   => $tenantId,
                    'recipe_id'   => $recipe->id,
                    'product_id'  => $prod->id,
                    'quantity'    => rand(1, 3),
                    'unit'        => 'PCS',
                    'notes'       => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        $this->command?->info("✅ " . count($recipes) . " cookbook recipes seeded.");
    }
}
