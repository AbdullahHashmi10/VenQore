<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoiceAssistant\TranscribeRequest;
use App\Services\InvoiceAssistant\InvoiceAssistantAccess;
use App\Services\InvoiceAssistant\InvoiceAssistantException;
use App\Services\InvoiceAssistant\Speech\SpeechTranscriptionService;
use Illuminate\Http\JsonResponse;

/**
 * POST /s/{store_slug}/invoice-assistant/transcriptions
 *
 * Validated audio in, editable text out. Creates no draft: the operator reads
 * and corrects the transcript, then sends it through the normal text endpoint.
 */
class InvoiceVoiceController extends Controller
{
    public function __construct(private SpeechTranscriptionService $speech) {}

    public function store(TranscribeRequest $request): JsonResponse
    {
        $requestId = (string) $request->input('request_id');

        try {
            $user = $request->user();
            $tenant = app('current.tenant');
            // Authenticated + entitled BEFORE a single audio byte is inspected or forwarded.
            InvoiceAssistantAccess::assert($user, $tenant, true);

            $body = $this->speech->transcribe(
                $user, $tenant, $request->file('audio'), (string) $request->input('locale', 'auto'), $requestId
            );

            return response()->json($body)->withHeaders(['Cache-Control' => 'no-store, private']);
        } catch (InvoiceAssistantException $e) {
            return response()->json($e->toArray($requestId), $e->httpStatus)->withHeaders(['Cache-Control' => 'no-store, private']);
        }
    }
}
