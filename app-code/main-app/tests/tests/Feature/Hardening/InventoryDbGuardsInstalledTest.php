<?php

namespace Tests\Feature\Hardening;

use App\Support\InventoryDbGuards;
use Illuminate\Support\Facades\Artisan;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/** A clean database migrated from scratch ends with both inventory guards installed. */
class InventoryDbGuardsInstalledTest extends VenQoreTestCase
{
    #[Test]
    public function a_freshly_migrated_database_has_both_guards(): void
    {
        foreach (array_keys(InventoryDbGuards::GUARDS) as $name) {
            $this->assertTrue(InventoryDbGuards::exists($name), "{$name} must be installed by the migrations on a clean database.");
        }
        $this->assertSame(0, Artisan::call('venqore:db-guards', ['--check' => true]));
    }
}
