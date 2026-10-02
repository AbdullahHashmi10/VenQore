<?php

namespace App\Http\Controllers;

use App\Http\Requests\InvoiceAssistant\ClarifyDraftRequest;
use App\Http\Requests\InvoiceAssistant\CreateDraftRequest;
use App\Http\Requests\InvoiceAssistant\HandoffDraftRequest;
use App\Services\InvoiceAssistant\InvoiceAssistantAccess;
use App\Services\InvoiceAssistant\InvoiceAssistantException;
use App\Services\InvoiceAssistant\InvoiceAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thin authenticated endpoints for the conversational invoice assistant.
 *
 * Mounted under /s/{store_slug}/invoice-assistant with `permission:sales.create`
 * plus the store group's auth/tenant/lifecycle stack. Nothing here posts an
 * invoice: the last thing this controller can do is hand a reviewed draft to
 * the normal invoice editor. Public visitor routes cannot reach it.
 */
class InvoiceAssistantController extends Controller
{
    public function __construct(private InvoiceAssistantService $service) {}

    /** Which switches are on, so the UI can show or hide the buttons. */
    public function config(Request $request): JsonResponse
    {
        $tenant = app('current.tenant');

        return $this->json(function () use ($request, $tenant) {
            return [
                'enabled'       => InvoiceAssistantAccess::enabled($tenant),
                'voice_enabled' => InvoiceAssistantAccess::enabled($tenant, true),
                'limits'        => [
                    'max_input_chars' => (int) config('invoice_assistant.max_input_chars'),
                    'max_turns'       => (int) config('invoice_assistant.max_turns'),
                    'max_seconds'     => (int) config('invoice_assistant.speech.max_seconds'),
                    'max_bytes'       => (int) config('invoice_assistant.speech.max_bytes'),
                ],
            ];
        }, $request, 200, false);
    }

    public function store(CreateDraftRequest $request): JsonResponse
    {
        return $this->json(fn ($user, $tenant) => $this->service->createDraft(
            $user, $tenant, (string) $request->input('text'), (string) $request->input('input_mode'), (string) $request->input('request_id')
        ), $request, 201, true, $request->input('input_mode') === 'voice');
    }

    public function show(Request $request, string $draft): JsonResponse
    {
        return $this->json(fn ($user, $tenant) => $this->service->get($user, $tenant, $draft), $request);
    }

    public function message(ClarifyDraftRequest $request, string $draft): JsonResponse
    {
        return $this->json(fn ($user, $tenant) => $this->service->message(
            $user, $tenant, $draft, (int) $request->input('expected_revision'),
            $request->input('text'), (array) $request->input('selections', []), (string) $request->input('request_id')
        ), $request);
    }

    public function handoff(HandoffDraftRequest $request, string $draft): JsonResponse
    {
        return $this->json(fn ($user, $tenant) => $this->service->handoff(
            $user, $tenant, $draft, (int) $request->input('expected_revision'), (string) $request->input('request_id'),
            (string) $tenant->slug
        ), $request);
    }

    /** Claim a handed-off draft for hydration into a NEW invoice tab (single-use, recoverable). */
    public function claim(Request $request, string $draft): JsonResponse
    {
        return $this->json(fn ($user, $tenant) => $this->service->claim($user, $tenant, $draft), $request);
    }

    /** The browser confirms the tab was hydrated; only now is the draft consumed. */
    public function applied(Request $request, string $draft): JsonResponse
    {
        $request->validate(['claim_token' => ['required', 'string', 'max:64']]);

        return $this->json(function ($user, $tenant) use ($request, $draft) {
            $this->service->acknowledge($user, $tenant, $draft, (string) $request->input('claim_token'));

            return ['ok' => true];
        }, $request);
    }

    public function destroy(Request $request, string $draft): JsonResponse|\Illuminate\Http\Response
    {
        $rev = $request->input('expected_revision', $request->query('expected_revision'));

        $res = $this->json(function ($user, $tenant) use ($draft, $rev) {
            $this->service->cancel($user, $tenant, $draft, $rev !== null ? (int) $rev : null);

            return ['ok' => true];
        }, $request);

        return $res->getStatusCode() === 200 ? response()->noContent() : $res;
    }

    /**
     * Run $fn(user, tenant) inside the documented error envelope.
     */
    private function json(callable $fn, Request $request, int $status = 200, bool $gated = true, bool $voice = false): JsonResponse
    {
        $requestId = (string) ($request->input('request_id') ?: $request->header('X-Request-Id', ''));

        try {
            $user = $request->user();
            $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
            if ($gated) {
                InvoiceAssistantAccess::assert($user, $tenant, $voice);
            }

            $body = $fn($user, $tenant);

            return response()->json($body, $status)->withHeaders(['Cache-Control' => 'no-store, private']);
        } catch (InvoiceAssistantException $e) {
            return response()->json($e->toArray($requestId), $e->httpStatus)->withHeaders(['Cache-Control' => 'no-store, private']);
        }
    }
}
