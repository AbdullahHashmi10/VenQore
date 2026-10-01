<?php

namespace Tests\Feature;

use App\Http\Controllers\UpdaterController;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class UpdaterChunkTokenTest extends TestCase
{
    private string $testStorage;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testStorage = sys_get_temp_dir().DIRECTORY_SEPARATOR.'venqore-updater-test-'.bin2hex(random_bytes(6));
        File::makeDirectory($this->testStorage.DIRECTORY_SEPARATOR.'app', 0755, true);
        $this->app->useStoragePath($this->testStorage);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->testStorage);
        parent::tearDown();
    }

    public function test_first_chunk_returns_token_and_legacy_client_can_finish_upload(): void
    {
        $controller = $this->app->make(UpdaterController::class);
        $uploadId = 'token_handshake';

        $first = $controller->run($this->chunkRequest($uploadId, 0, 2, 'first-half'));
        $firstData = $first->getData(true);

        $this->assertSame(200, $first->getStatusCode());
        $this->assertFalse($firstData['complete']);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $firstData['update_token']);

        $second = $controller->run($this->chunkRequest(
            $uploadId,
            1,
            2,
            'second-half',
        ));
        $secondData = $second->getData(true);

        $this->assertSame(200, $second->getStatusCode());
        $this->assertTrue($secondData['complete']);
        $this->assertSame($firstData['update_token'], $secondData['update_token']);
        $this->assertSame('first-halfsecond-half', File::get(storage_path('app/update_package/update.zip')));
    }

    private function chunkRequest(
        string $uploadId,
        int $index,
        int $total,
        string $content,
        ?string $token = null,
    ): Request {
        $payload = [
            'step' => 'upload',
            'chunk_index' => $index,
            'total_chunks' => $total,
            'upload_id' => $uploadId,
            'filename' => 'update.zip',
        ];
        if ($token !== null) {
            $payload['update_token'] = $token;
        }

        return Request::create(
            '/api/updater/run',
            'POST',
            $payload,
            [],
            ['chunk' => UploadedFile::fake()->createWithContent('chunk', $content)],
        );
    }
}
