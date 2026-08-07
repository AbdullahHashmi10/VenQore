<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Warehouse;
use Tests\Feature\VenQoreTestCase;

class PosFeaturesTest extends VenQoreTestCase
{
    /** @test */
    public function categories_endpoint_returns_product_count_for_active_categories(): void
    {
        $tenant = $this->createTenant();
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'cashier');

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();

        // Create a category
        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Phones',
        ]);

        // Create a product inside that category
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'name' => 'iPhone 15',
            'price' => 999.00,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 5,
        ]);

        // Hit the categories endpoint
        $response = $this->get($this->storeUrl($tenant, 'pos/categories'));

        $response->assertStatus(200);
        
        // Assert the category is present in the response
        $response->assertJsonFragment([
            'id' => $category->id,
            'name' => 'Phones',
            'product_count' => 1,
        ]);
    }

    /** @test */
    public function featured_endpoint_returns_active_products_for_the_grid(): void
    {
        $tenant = $this->createTenant();
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'cashier');

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();

        // Create active products
        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Featured Item',
            'price' => 100.00,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 10,
        ]);

        $response = $this->get($this->storeUrl($tenant, 'pos/products/featured'));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $product->id,
            'name' => 'Featured Item',
        ]);
    }

    /** @test */
    public function search_endpoint_filters_products_by_category_id(): void
    {
        $tenant = $this->createTenant();
        $this->seedTenantDefaults($tenant);
        $this->actingAsTenantUser($tenant, 'cashier');

        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first();

        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name' => 'Electronics',
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $tenant->id,
            'category_id' => $category->id,
            'name' => 'Laptop',
            'price' => 500.00,
        ]);

        Stock::create([
            'tenant_id' => $tenant->id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouse->id,
            'quantity' => 2,
        ]);

        $response = $this->get($this->storeUrl($tenant, 'pos/products?q=Laptop&category_id=' . $category->id));

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $product->id,
            'name' => 'Laptop',
        ]);
    }
}
