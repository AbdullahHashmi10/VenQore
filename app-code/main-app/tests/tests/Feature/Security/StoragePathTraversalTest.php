<?php

namespace Tests\Feature\Security;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class StoragePathTraversalTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // This test exercises the public storage route itself. Installation,
        // database-health, and tenant UI middleware are unrelated and can turn
        // every test request into a 403 before routing is reached.
        $this->withoutMiddleware();
    }

    #[Test]
    public function it_refuses_traversal_out_of_the_public_disk(): void
    {
        foreach ([
            '/storage/../../.env',
            '/storage/..%2f..%2f.env',
            '/storage/....//....//.env',
            '/storage/../../../composer.json',
        ] as $url) {
            $this->get($url)->assertNotFound();
        }
    }

    #[Test]
    public function it_refuses_disallowed_extensions_inside_the_disk(): void
    {
        $path = storage_path('app/public/t03probe.php');
        file_put_contents($path, '<?php echo "x";');

        try {
            $this->get('/storage/t03probe.php')->assertNotFound();
        } finally {
            @unlink($path);
        }
    }

    #[Test]
    public function it_refuses_svg_even_inside_the_public_disk(): void
    {
        $path = storage_path('app/public/t03probe.svg');
        file_put_contents($path, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

        try {
            $this->get('/storage/t03probe.svg')->assertNotFound();
        } finally {
            @unlink($path);
        }
    }

    #[Test]
    public function it_still_serves_a_legitimate_image(): void
    {
        $path = storage_path('app/public/t03probe.png');
        file_put_contents($path, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        ));

        try {
            $this->get('/storage/t03probe.png')->assertOk();
        } finally {
            @unlink($path);
        }
    }
}
