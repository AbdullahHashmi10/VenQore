<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Composition;
use App\Models\CompositionItem;
use App\Models\Party;
use App\Models\ProductBarcode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Run essential seeders first
        $this->call([
            WarehouseSeeder::class,
            CategorySeeder::class,
            ExpenseCategorySeeder::class,
            ProductAttributeSeeder::class,
            AccountSeeder::class,
            BlogPostSeeder::class,
            CapabilitiesRegistrySeeder::class,
        ]);

        // 1. Admin User (Commented out to allow the first web registration to become the primary owner/platform_admin)
        // 1. Admin User
        // 1. Admin User logic moved to Installer or AdminUserSeeder
        // We do not create it here to prevent duplicate/default usage in production installations.

        /* 
         * DEMO DATA REMOVED FOR CLEAN SLATE
         * Products, Compositions, Stock, and Parties are no longer seeded by default.
         */
    }
}
