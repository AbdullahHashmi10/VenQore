<?php

/**
 * VenQore Test Suite — Pest Configuration
 *
 * Pest v3 bootstrap file.
 * All Feature tests use the VenQoreTestCase base class.
 */

use Tests\Feature\VenQoreTestCase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

// Feature tests: use the full VenQoreTestCase with tenant helpers
pest()->extend(VenQoreTestCase::class)->in('Feature');

// Unit tests: use the lighter base TestCase
pest()->extend(TestCase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/
