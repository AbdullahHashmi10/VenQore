<?php

namespace Tests\Feature\Hardening;

use App\Services\Commerce\StorefrontBadges;
use Tests\TestCase;

/**
 * The platform owner's word beats the nightly rules, in both directions.
 * Pure logic, no database.
 */
class StorefrontBadgesTest extends TestCase
{
    /** @test */
    public function without_an_override_the_nightly_result_decides(): void
    {
        $this->assertTrue(StorefrontBadges::visible(true, null));
        $this->assertFalse(StorefrontBadges::visible(false, null));
    }

    /** @test */
    public function a_forced_on_shows_a_badge_the_rules_did_not_award(): void
    {
        $this->assertTrue(StorefrontBadges::visible(false, 'on'));
    }

    /** @test */
    public function a_forced_off_hides_a_badge_the_rules_did_award(): void
    {
        $this->assertFalse(StorefrontBadges::visible(true, 'off'));
    }

    /** @test */
    public function every_badge_has_what_the_screens_need(): void
    {
        $badges = StorefrontBadges::catalogue();
        $this->assertArrayHasKey('early_merchant', $badges);
        $this->assertArrayHasKey('fastest_growing', $badges);
        $this->assertArrayHasKey('most_reviewed', $badges);
        $priorities = [];
        foreach ($badges as $key => $b) {
            foreach (['label', 'description', 'tone', 'priority'] as $field) {
                $this->assertArrayHasKey($field, $b, "{$key} lacks {$field}");
            }
            $priorities[] = $b['priority'];
        }
        $this->assertSame($priorities, array_values(array_unique($priorities)), 'Badge priorities must be unique.');
    }
}
