<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (!app()->bound('current.tenant')) {
            $fakeTenant = new \stdClass();
            $fakeTenant->id = null;
            $fakeTenant->slug = 'test-store';
            $fakeTenant->currency_symbol = 'Rs';
            $fakeTenant->is_demo = false;
            app()->instance('current.tenant', $fakeTenant);
        }
    }
}
