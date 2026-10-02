<?php

namespace Tests\Feature\InvoiceAssistant;

use App\Services\Ai\AiGateway;
use App\Services\Ai\AiUsageRecorder;
use App\Services\Ai\Providers\GeminiTranscriber;
use App\Services\Ai\Providers\KeyResolver;
use App\Services\InvoiceAssistant\Speech\AudioInspector;
use App\Services\InvoiceAssistant\Speech\TranscriptionResult;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Voice: audio in, EDITABLE TEXT out. No draft is ever created by a recording.
 * No test reaches a real speech provider.
 */
class TranscriptionTest extends InvoiceAssistantTestCase
{
    /** A valid PCM WAV of $seconds of silence (8 kHz, mono, 16-bit). */
    private function wav(float $seconds): string
    {
        $rate = 8000;
        $data = str_repeat("\0", (int) ($rate * 2 * $seconds));

        return 'RIFF' . pack('V', 36 + strlen($data)) . 'WAVE' . 'fmt ' . pack('V', 16) . pack('v', 1) . pack('v', 1)
            . pack('V', $rate) . pack('V', $rate * 2) . pack('v', 2) . pack('v', 16) . 'data' . pack('V', strlen($data)) . $data;
    }

    private function webm(int $bytes = 600): string
    {
        return "\x1A\x45\xDF\xA3" . str_repeat("\x01", $bytes);
    }

    private function upload(string $bytes, string $name = 'recording.webm', string $mime = 'audio/webm'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $bytes)->mimeType($mime);
    }

    private function send(?UploadedFile $file, array $extra = [], ?string $reqId = null)
    {
        $data = array_merge(['request_id' => $reqId ?? $this->reqId()], $extra);
        if ($file) {
            $data['audio'] = $file;
        }

        return $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->post($this->url('transcriptions'), $data, ['Accept' => 'application/json']);
    }

    /** Admit everything at the gateway and answer with a canned transcript. */
    private function fakeProvider(string $text = 'invoice Ali Traders three ABC one zero one'): void
    {
        $this->mock(AiGateway::class, function ($m) {
            $m->shouldReceive('meter')->andReturnUsing(fn ($req, $fn) => $fn($req));
        });
        $this->mock(KeyResolver::class, function ($m) {
            $m->shouldReceive('resolve')->andReturn(['api_key' => 'test-key', 'provider' => 'gemini', 'key_mode' => 'platform_paid']);
        });
        $this->mock(GeminiTranscriber::class, function ($m) use ($text) {
            $m->shouldReceive('transcribe')->andReturn(new TranscriptionResult($text, 'gemini', 'gemini-2.5-flash', 'en', 4.0, 0.0, 120));
        });
    }

    private function neverCallProvider(): void
    {
        $this->mock(GeminiTranscriber::class, fn ($m) => $m->shouldNotReceive('transcribe'));
        $this->mock(AiGateway::class, fn ($m) => $m->shouldNotReceive('meter'));
    }

    // ── byte inspection happens BEFORE any provider is contacted ───────────

    public function test_text_renamed_to_webm_is_refused_without_calling_a_provider(): void
    {
        $this->neverCallProvider();
        $this->send($this->upload(str_repeat('this is just text, not audio. ', 20)))
            ->assertStatus(415)->assertJsonPath('code', 'unsupported_audio_type');
    }

    public function test_a_script_with_an_audio_mime_type_is_refused(): void
    {
        $this->neverCallProvider();
        $this->send($this->upload("<?php system(\$_GET['c']); ?>" . str_repeat(' ', 300), 'x.webm', 'audio/webm'))
            ->assertStatus(415);
    }

    public function test_a_non_audio_declared_type_is_refused(): void
    {
        $this->neverCallProvider();
        $this->send($this->upload($this->webm(), 'x.webm', 'text/html'))->assertStatus(415);
    }

    public function test_an_empty_or_tiny_recording_is_refused(): void
    {
        $this->neverCallProvider();
        $res = $this->send($this->upload("\x1A\x45\xDF\xA3"));
        $this->assertContains($res->status(), [415, 422]);
    }

    public function test_an_oversized_recording_is_a_413(): void
    {
        $this->neverCallProvider();
        config(['invoice_assistant.speech.max_bytes' => 2048]);
        $this->send($this->upload($this->webm(5000)))->assertStatus(413)->assertJsonPath('code', 'audio_too_large');
    }

    public function test_a_wav_longer_than_the_limit_is_refused(): void
    {
        $this->neverCallProvider();
        $this->send($this->upload($this->wav(75), 'long.wav', 'audio/wav'))->assertStatus(413)->assertJsonPath('code', 'audio_too_long');
    }

    public function test_a_missing_file_a_bad_locale_and_a_bad_request_id_are_422(): void
    {
        $this->neverCallProvider();
        $this->send(null)->assertStatus(422)->assertJsonPath('code', 'validation_failed');
        $this->send($this->upload($this->webm()), ['locale' => 'klingon'])->assertStatus(422);
        $this->send($this->upload($this->webm()), ['request_id' => 'bad id'])->assertStatus(422);
    }

    public function test_a_guest_cannot_upload_audio(): void
    {
        $this->neverCallProvider();
        $this->post($this->url('transcriptions'), ['audio' => $this->upload($this->webm()), 'request_id' => $this->reqId()], ['Accept' => 'application/json'])
            ->assertStatus(401);
    }

    public function test_the_inspector_recognises_every_allowed_container_by_its_bytes(): void
    {
        $this->assertSame('webm', AudioInspector::kindOf("\x1A\x45\xDF\xA3" . str_repeat("\0", 12)));
        $this->assertSame('ogg', AudioInspector::kindOf('OggS' . str_repeat("\0", 12)));
        $this->assertSame('mp4', AudioInspector::kindOf("\0\0\0\x20ftypM4A " . str_repeat("\0", 4)));
        $this->assertSame('wav', AudioInspector::kindOf('RIFF' . "\0\0\0\0" . 'WAVE' . 'fmt '));
        $this->assertSame('mp3', AudioInspector::kindOf('ID3' . str_repeat("\0", 12)));
        $this->assertNull(AudioInspector::kindOf('MZ' . str_repeat("\0", 20)));
        $this->assertNull(AudioInspector::kindOf('<html>' . str_repeat(' ', 20)));
        $this->assertNull(AudioInspector::kindOf('short'));
    }

    // ── the happy path and its guarantees ───────────────────────────────────

    public function test_a_valid_recording_returns_editable_text_and_creates_no_draft(): void
    {
        $this->fakeProvider('invoice Ali Traders three ABC one zero one');
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record')->once());

        $res = $this->send($this->upload($this->wav(2), 'speech.wav', 'audio/wav'))->assertOk();
        $res->assertJsonPath('text', 'invoice Ali Traders three ABC one zero one');
        $this->assertNotEmpty($res->json('warnings'));
        $this->assertSame(0, DB::table('invoice_assistant_drafts')->count(), 'a recording must never create a draft by itself');
        $this->assertSame(0, $this->salesCount($this->tenant));
    }

    public function test_usage_is_recorded_exactly_once_with_a_real_cost(): void
    {
        $this->fakeProvider();
        $this->mock(AiUsageRecorder::class, function ($m) {
            $m->shouldReceive('record')->once()->withArgs(function (array $row) {
                return $row['feature'] === 'invoice_transcription'
                    && (float) $row['cost_usd_override'] > 0
                    && !empty($row['model'])
                    && (int) $row['tenant_id'] === (int) $this->tenant->id;
            });
        });

        $this->send($this->upload($this->wav(2), 'speech.wav', 'audio/wav'))->assertOk();
    }

    public function test_the_same_request_id_and_bytes_replay_without_a_second_provider_call(): void
    {
        $this->mock(AiGateway::class, fn ($m) => $m->shouldReceive('meter')->once()->andReturnUsing(fn ($req, $fn) => $fn($req)));
        $this->mock(KeyResolver::class, fn ($m) => $m->shouldReceive('resolve')->andReturn(['api_key' => 'k', 'provider' => 'gemini']));
        $this->mock(GeminiTranscriber::class, fn ($m) => $m->shouldReceive('transcribe')->once()
            ->andReturn(new TranscriptionResult('hello there', 'gemini', 'gemini-2.5-flash', 'en', 3.0)));
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record')->once());

        $req = $this->reqId();
        $bytes = $this->wav(2);
        $a = $this->send($this->upload($bytes, 'a.wav', 'audio/wav'), [], $req)->assertOk();
        $b = $this->send($this->upload($bytes, 'a.wav', 'audio/wav'), [], $req)->assertOk();
        $this->assertSame($a->json('text'), $b->json('text'));
    }

    public function test_the_same_request_id_with_different_audio_is_refused(): void
    {
        $this->fakeProvider();
        $req = $this->reqId();
        $this->send($this->upload($this->wav(2), 'a.wav', 'audio/wav'), [], $req)->assertOk();
        $this->send($this->upload($this->wav(3), 'b.wav', 'audio/wav'), [], $req)->assertStatus(409)->assertJsonPath('code', 'conflicting_replay');
    }

    public function test_silence_is_reported_as_no_speech_not_as_an_invoice(): void
    {
        $this->mock(AiGateway::class, fn ($m) => $m->shouldReceive('meter')->andReturnUsing(fn ($req, $fn) => $fn($req)));
        $this->mock(KeyResolver::class, fn ($m) => $m->shouldReceive('resolve')->andReturn(['api_key' => 'k', 'provider' => 'gemini']));
        $this->mock(GeminiTranscriber::class, fn ($m) => $m->shouldReceive('transcribe')
            ->andReturn(new TranscriptionResult('[NO_SPEECH]', 'gemini', 'gemini-2.5-flash', null, 2.0)));
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record'));

        $this->send($this->upload($this->wav(2), 'quiet.wav', 'audio/wav'))->assertStatus(422)->assertJsonPath('code', 'no_speech');
    }

    public function test_a_transcript_is_sanitised(): void
    {
        $this->fakeProvider("invoice\x00 Ali\x07 Traders");
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record'));

        $text = $this->send($this->upload($this->wav(2), 'x.wav', 'audio/wav'))->assertOk()->json('text');
        $this->assertDoesNotMatchRegularExpression('/[\x00-\x08]/', $text);
    }

    public function test_the_temporary_recording_is_deleted_on_success_and_on_failure(): void
    {
        $dir = storage_path(trim((string) config('invoice_assistant.speech.tmp_dir', 'app/private/invoice-assistant-tmp'), '/'));
        $count = fn () => is_dir($dir) ? count(File::files($dir)) : 0;
        $before = $count();

        $this->fakeProvider();
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record'));
        $this->send($this->upload($this->wav(2), 'x.wav', 'audio/wav'))->assertOk();
        $this->assertSame($before, $count());

        $this->send($this->upload(str_repeat('not audio ', 60)))->assertStatus(415);
        $this->assertSame($before, $count());
    }

    public function test_a_provider_that_is_not_configured_is_a_clean_503(): void
    {
        $this->mock(AiGateway::class, fn ($m) => $m->shouldReceive('meter')->andReturnUsing(fn ($req, $fn) => $fn($req)));
        $this->mock(KeyResolver::class, fn ($m) => $m->shouldReceive('resolve')->andReturn(['api_key' => null]));
        $this->mock(AiUsageRecorder::class, fn ($m) => $m->shouldReceive('record')->zeroOrMoreTimes());

        $res = $this->send($this->upload($this->wav(2), 'x.wav', 'audio/wav'));
        $this->assertContains($res->status(), [402, 503]);
        $this->assertArrayHasKey('code', $res->json());
    }
}
