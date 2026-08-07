<?php

namespace Tests\Feature\Tools;

use Tests\TestCase;

class RateLimitTest extends TestCase
{
    public function test_tools_limiter_blocks_after_60_requests_per_minute(): void
    {
        for ($i = 0; $i < 60; $i++) {
            $this->postJson(route('tools.barcode.render'), [
                'format' => 'code128',
                'value'  => "TEST{$i}",
                'output' => 'png',
            ])->assertStatus(200);
        }

        $this->postJson(route('tools.barcode.render'), [
            'format' => 'code128',
            'value'  => 'ONE-TOO-MANY',
            'output' => 'png',
        ])->assertStatus(429);
    }

    public function test_tool_leads_limiter_blocks_after_5_per_hour_per_ip(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/tools/lead', [
                'email'     => "user{$i}@example.com",
                'tool_slug' => 'barcode',
                'tool_name' => 'Barcode Generator',
            ]);
        }

        $response = $this->post('/tools/lead', [
            'email'     => 'user6@example.com',
            'tool_slug' => 'barcode',
            'tool_name' => 'Barcode Generator',
        ]);

        $response->assertStatus(429);
    }
}
