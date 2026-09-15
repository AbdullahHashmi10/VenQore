<?php

namespace Tests\Feature\Dashboard;

use App\Services\Dashboard\FrameValidator;
use Tests\TestCase;

class FrameGeometryLawTest extends TestCase
{
    public function test_every_shipped_frame_obeys_the_geometry_law(): void
    {
        $validator = app(FrameValidator::class);

        foreach (config('dashboard_frames') as $key => $frame) {
            $this->assertSame([], $validator->problems($frame), "Frame {$key} is invalid.");
        }
    }
}
