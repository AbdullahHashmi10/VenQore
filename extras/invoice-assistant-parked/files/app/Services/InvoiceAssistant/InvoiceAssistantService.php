<?php

namespace App\Services\InvoiceAssistant;

use App\Models\InvoiceAssistantDraft as Draft;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Orchestrates the conversational invoice workflow.
 *
 * HARD RULE: this class never posts, saves, or approves an invoice and never
 * touches stock, balances or the ledger. Its only product is an editable
 * draft, handed to the normal invoice editor. The operator's explicit Save
 * (store.sales.store) is the only thing that creates a sale.
 *
 * Concurrency rule: no DB transaction or row lock is held across the model
 * call. Capture the revision, call upstream, then apply with compareAndSwap();
 * if the draft moved meanwhile the late result is discarded (409 stale).
 */
class InvoiceAssistantService
{
    public function __construct(
        private DraftRepository $repo,
        private IntentExtractor $extractor,
        private InvoiceIntentValidator $validator,
    ) {}

    // ── create ──────────────────────────────────────────────────────────────

    public function createDraft(User $user, Tenant $tenant, string $text, string $inputMode, string $requestId): array
    {
        $text = $this->cleanText($text);
        $hash = sha1($text . '|' . $inputMode);

        $existing = $this->repo->findByCreateRequest($tenant->id, $user->id, $requestId);
        if ($existing) {
            return $this->replayCreate($existing, $hash);
        }

        [$draft, $created] = $this->repo->createOnce([
            'tenant_id'         => $tenant->id,
            'user_id'           => $user->id,
            'input_mode'        => $inputMode === 'voice' ? 'voice' : 'text',
            'create_request_id' => $requestId,
            'transcript'        => $inputMode === 'voice' ? $text : null,
            'request_log'       => [$requestId => ['hash' => $hash, 'op' => 'create', 'at' => now()->toIso8601String()]],
        ]);
        if (!$created) {
            return $this->replayCreate($draft, $hash);
        }

        $t0 = microtime(true);
        $x = $this->extractor->extract($text, null, now()->toDateString(), $tenant, $user, $draft->input_mode);

        if (!$x['ok']) {
            $this->failDraft($draft, $x['code'] ?? 'provider_error');
            InvoiceAssistantTelemetry::event('intent_failed', $this->ctx($draft, $tenant, $user) + ['reason' => $x['code'], 'duration_ms' => $this->ms($t0)]);
            throw $this->mapFailure($x);
        }

        $check = $this->validator->validate($x['value']);
        if (!$check['ok']) {
            $this->failDraft($draft, 'invalid_model_output');
            InvoiceAssistantTelemetry::event('intent_failed', $this->ctx($draft, $tenant, $user) + ['reason' => 'invalid_model_output', 'duration_ms' => $this->ms($t0)]);
            throw new InvoiceAssistantException(502, 'invalid_model_output',
                'The assistant could not understand that request. Rephrase it or enter the invoice manually.', true);
        }
        if ($check['unsupported'] !== null) {
            $this->failDraft($draft, 'unsupported_request');
            throw new InvoiceAssistantException(422, 'unsupported_request',
                $check['unsupported'] . ' I can help create a sales invoice — for example: “Invoice Ahmed Traders for 3 of ABC-101 on credit”.');
        }

        $intent = $check['intent'];
        $intent['issues'] = $check['issues'];

        $fresh = $this->applyResolution($draft, $tenant, $intent, [], $x, [
            'turns' => 1,
        ]);
        if (!$fresh) {
            throw InvoiceAssistantException::stale($this->presentFresh($draft, $tenant));
        }

        InvoiceAssistantTelemetry::event('draft_created', $this->ctx($fresh, $tenant, $user) + ['duration_ms' => $this->ms($t0), 'cost_usd' => $x['cost'], 'model' => $x['model'], 'provider' => $x['provider']]);

        return $this->present($fresh, $tenant);
    }

    // ── read ────────────────────────────────────────────────────────────────

    public function get(User $user, Tenant $tenant, string $id): array
    {
        $draft = $this->repo->findOwned($id, $tenant->id, $user->id);

        return $this->present($draft, $tenant);
    }

    // ── message (clarification / edit) ──────────────────────────────────────

    public function message(User $user, Tenant $tenant, string $id, int $expectedRevision, ?string $text, array $selections, string $requestId): array
    {
        $text = $text !== null ? $this->cleanText($text) : null;
        if (($text === null || $text === '') && !$selections) {
            throw new InvoiceAssistantException(422, 'empty_message', 'Say what to change, or pick one of the options.');
        }
        if ($text !== null && $text !== '' && $selections) {
            throw new InvoiceAssistantException(422, 'one_interaction_only', 'Send either a message or a selection, not both at once.');
        }

        $draft = $this->repo->findOwned($id, $tenant->id, $user->id);
        $hash = sha1(json_encode([$text, $selections]));

        $logged = $draft->request_log[$requestId] ?? null;
        if ($logged) {
            if (($logged['hash'] ?? null) !== $hash) {
                throw new InvoiceAssistantException(409, 'conflicting_replay', 'That request id was already used for a different message.');
            }
            InvoiceAssistantTelemetry::event('duplicate_recovered', $this->ctx($draft, $tenant, $user) + ['stage' => 'message']);

            return $this->present($draft, $tenant);
        }

        if (!in_array($draft->status, [Draft::NEEDS_CLARIFICATION, Draft::READY_FOR_REVIEW], true)) {
            throw InvoiceAssistantException::invalidState($draft->status);
        }
        if ((int) $draft->revision !== $expectedRevision) {
            throw InvoiceAssistantException::stale($this->present($draft, $tenant));
        }
        if ($draft->turns >= (int) config('invoice_assistant.max_turns', 10)) {
            throw new InvoiceAssistantException(422, 'turn_limit',
                'This conversation reached its limit. Hand the draft to the editor, or start a new one.');
        }

        $log = $this->repo->remember($draft, $requestId, $hash, 'message');

        // Structured selection: no model call at all.
        if ($selections) {
            $choices = $this->applySelections($draft, $selections, $tenant);
            $fresh = $this->applyResolution($draft, $tenant, $draft->intent, $choices, null, [
                'turns' => $draft->turns + 1, 'request_log' => $log,
            ]);
            if (!$fresh) {
                throw InvoiceAssistantException::stale($this->presentFresh($draft, $tenant));
            }

            return $this->present($fresh, $tenant);
        }

        // Deterministic shortcut: "5" answers a single "how many?" question.
        $shortcut = $this->quantityShortcut($draft, $text);
        if ($shortcut !== null) {
            $fresh = $this->applyResolution($draft, $tenant, $shortcut, $draft->choices ?? [], null, [
                'turns' => $draft->turns + 1, 'request_log' => $log,
            ]);
            if (!$fresh) {
                throw InvoiceAssistantException::stale($this->presentFresh($draft, $tenant));
            }

            return $this->present($fresh, $tenant);
        }

        // Free-text edit: model proposes a FULL revised intent; backend diffs it.
        $t0 = microtime(true);
        $x = $this->extractor->extract($text, $draft->intent, now()->toDateString(), $tenant, $user, $draft->input_mode);
        if (!$x['ok']) {
            InvoiceAssistantTelemetry::event('intent_failed', $this->ctx($draft, $tenant, $user) + ['reason' => $x['code'], 'duration_ms' => $this->ms($t0)]);
            throw $this->mapFailure($x);
        }
        $check = $this->validator->validate($x['value']);
        if (!$check['ok']) {
            throw new InvoiceAssistantException(502, 'invalid_model_output',
                'The assistant could not apply that change. Rephrase it or use the options shown.', true);
        }
        if ($check['unsupported'] !== null) {
            throw new InvoiceAssistantException(422, 'unsupported_request', $check['unsupported']);
        }

        $old = $draft->intent;
        $new = $check['intent'];
        $new['issues'] = $check['issues'];
        $changes = $this->diff($old, $new);

        // Ambiguity guard: one number in the message but several quantities moved.
        if ($this->ambiguousQuantityEdit($text, $changes)) {
            $new = $old;
            $new['clarification'] = ['question' => 'That could apply to more than one line. Which line should the new quantity go on?', 'line_key' => null];
            $changes = [];
        }

        $choices = $this->pruneChoices($draft->choices ?? [], $old, $new);
        $fresh = $this->applyResolution($draft, $tenant, $new, $choices, $x, [
            'turns' => $draft->turns + 1, 'request_log' => $log,
        ]);
        if (!$fresh) {
            // A late response must never overwrite newer edits.
            throw InvoiceAssistantException::stale($this->presentFresh($draft, $tenant));
        }

        $out = $this->present($fresh, $tenant);
        $out['changes'] = $changes;

        return $out;
    }

    // ── handoff ─────────────────────────────────────────────────────────────

    public function handoff(User $user, Tenant $tenant, string $id, int $expectedRevision, string $requestId, string $storeSlug): array
    {
        $draft = $this->repo->findOwned($id, $tenant->id, $user->id);
        $hash = sha1('handoff|' . $id);

        $logged = $draft->request_log[$requestId] ?? null;
        if ($logged) {
            if (($logged['hash'] ?? null) !== $hash) {
                throw new InvoiceAssistantException(409, 'conflicting_replay', 'That request id was already used for something else.');
            }
            if ($draft->status === Draft::HANDED_OFF) {
                InvoiceAssistantTelemetry::event('duplicate_recovered', $this->ctx($draft, $tenant, $user) + ['stage' => 'handoff']);

                return $this->handoffPayload($draft, $storeSlug);
            }
        }

        if ($draft->status !== Draft::READY_FOR_REVIEW) {
            throw InvoiceAssistantException::invalidState($draft->status);
        }
        if ((int) $draft->revision !== $expectedRevision) {
            throw InvoiceAssistantException::stale($this->present($draft, $tenant));
        }

        // Re-validate against the store AS IT IS NOW: entities, prices, stock.
        $resolver = new InvoiceDraftResolver($tenant->id, $draft->id);
        $now = $resolver->resolve($draft->intent, $draft->choices ?? [], $draft->input_mode === 'voice');

        if (!$now['can_handoff'] || $resolver->fingerprint($now['resolved']) !== $resolver->fingerprint($draft->resolved ?? [])) {
            $status = $now['can_handoff'] ? Draft::READY_FOR_REVIEW : Draft::NEEDS_CLARIFICATION;
            $fresh = $this->repo->compareAndSwap($draft, [
                'status' => $status, 'resolved' => $now['resolved'], 'unresolved' => $now['unresolved'],
                'candidate_set_id' => $this->setId($now['unresolved']),
            ]);
            throw new InvoiceAssistantException(409, 'changed_since_review',
                'Something changed since you reviewed this draft (a price, stock level or customer). Review the updated draft.',
                false, [], $fresh ? $this->present($fresh, $tenant) : null);
        }

        $log = $this->repo->remember($draft, $requestId, $hash, 'handoff');
        $fresh = $this->repo->compareAndSwap($draft, [
            'status'        => Draft::HANDED_OFF,
            'handed_off_at' => now(),
            'expires_at'    => $this->repo->ttl(),
            'request_log'   => $log,
        ], [Draft::READY_FOR_REVIEW]);
        if (!$fresh) {
            throw InvoiceAssistantException::stale($this->presentFresh($draft, $tenant));
        }

        InvoiceAssistantTelemetry::event('draft_handed_off', $this->ctx($fresh, $tenant, $user) + ['lines' => count($now['resolved']['lines'])]);

        return $this->handoffPayload($fresh, $storeSlug);
    }

    private function handoffPayload(Draft $d, string $storeSlug): array
    {
        return [
            'draft_id'     => $d->id,
            'prefill_key'  => $d->id,
            'redirect_url' => route('store.sales.invoice.create', ['store_slug' => $storeSlug, 'assistant_draft' => $d->id]),
        ];
    }

    // ── claim / acknowledge (single-use, recoverable) ───────────────────────

    /**
     * Atomic claim. Exactly one caller gets the token; a claim that was never
     * acknowledged (crash/refresh mid-hydration) can be re-claimed after the
     * grace window. The prefill is rebuilt from the store's CURRENT state.
     *
     * @return array{prefill:array, claim_token:string, draft_id:string}
     */
    public function claim(User $user, Tenant $tenant, string $id): array
    {
        $draft = $this->repo->findOwned($id, $tenant->id, $user->id);

        if ($draft->applied_at !== null) {
            throw new InvoiceAssistantException(410, 'already_applied', 'This draft was already opened in an invoice tab.');
        }
        if ($draft->status !== Draft::HANDED_OFF) {
            throw InvoiceAssistantException::invalidState($draft->status);
        }

        $token = Str::random(32);
        $grace = (int) config('invoice_assistant.claim_grace_seconds', 120);
        $won = Draft::where('id', $draft->id)
            ->where('tenant_id', $tenant->id)->where('user_id', $user->id)
            ->where('status', Draft::HANDED_OFF)
            ->whereNull('applied_at')
            ->where(function ($q) use ($grace) {
                $q->whereNull('claim_token')->orWhere('claimed_at', '<', now()->subSeconds($grace));
            })
            ->update(['claim_token' => $token, 'claimed_at' => now(), 'updated_at' => now()]);

        if ($won !== 1) {
            throw new InvoiceAssistantException(409, 'claim_in_progress', 'This draft is being opened in another tab.', true);
        }

        $resolver = new InvoiceDraftResolver($tenant->id, $draft->id);
        $now = $resolver->resolve($draft->intent, $draft->choices ?? [], $draft->input_mode === 'voice');

        if (!$now['can_handoff']) {
            // Permissions/entities changed after review: back to the assistant.
            Draft::where('id', $draft->id)->update([
                'claim_token' => null, 'claimed_at' => null, 'status' => Draft::NEEDS_CLARIFICATION,
                'resolved' => json_encode($now['resolved']), 'unresolved' => json_encode($now['unresolved']),
                'revision' => DB::raw('revision + 1'), 'updated_at' => now(),
            ]);
            $fresh = Draft::find($draft->id);
            throw new InvoiceAssistantException(409, 'needs_review',
                'The draft needs another look before it can open in the editor.', false, [], $this->present($fresh, $tenant));
        }

        $prefill = (new InvoicePrefillAdapter($tenant->id))
            ->build($draft->id, (int) $draft->revision, $now['resolved'], $now['party'], $draft->resolved ?? []);

        return ['prefill' => $prefill, 'claim_token' => $token, 'draft_id' => $draft->id];
    }

    /** Page-load variant: never throws, returns null when it cannot be claimed. */
    public function claimForPage(User $user, Tenant $tenant, ?string $id): ?array
    {
        if (!$id || !config('invoice_assistant.enabled')) {
            return null;
        }
        try {
            return $this->claim($user, $tenant, $id);
        } catch (InvoiceAssistantException) {
            return null;
        }
    }

    /** Called by the browser AFTER the tab was hydrated. Idempotent for the same token. */
    public function acknowledge(User $user, Tenant $tenant, string $id, string $token): void
    {
        $draft = $this->repo->findOwned($id, $tenant->id, $user->id);

        if ($draft->applied_at !== null && hash_equals((string) $draft->claim_token, $token)) {
            return; // replay of the same acknowledgement
        }

        $n = Draft::where('id', $draft->id)->where('tenant_id', $tenant->id)->where('user_id', $user->id)
            ->where('claim_token', $token)->whereNull('applied_at')
            ->update(['applied_at' => now(), 'updated_at' => now()]);

        if ($n !== 1) {
            throw new InvoiceAssistantException(409, 'claim_mismatch', 'That claim is no longer valid.');
        }
    }

    // ── cancel ──────────────────────────────────────────────────────────────

    public function cancel(User $user, Tenant $tenant, string $id, ?int $expectedRevision): void
    {
        $this->repo->cancel($id, $tenant->id, $user->id, $expectedRevision);
    }

    // ── outcome link (called by the normal Save, after validation) ──────────

    /**
     * Associates a posted / pending-approval sale with the draft it came from.
     * Never trusts the client: the draft must belong to this tenant+user and
     * have been claimed AND applied. Provenance only — the draft is not a
     * claim about what was posted (the operator may have edited the invoice).
     */
    public function linkOutcome(int|string $tenantId, int|string $userId, ?string $draftId, string $saleId, string $outcome): bool
    {
        if (!$draftId || !Str::isUuid($draftId)) {
            return false;
        }
        $n = Draft::where('id', $draftId)->where('tenant_id', $tenantId)->where('user_id', $userId)
            ->where('status', Draft::HANDED_OFF)->whereNotNull('applied_at')->whereNull('sale_id')
            ->update(['sale_id' => $saleId, 'outcome' => $outcome, 'updated_at' => now()]);

        if ($n === 1) {
            InvoiceAssistantTelemetry::event($outcome === 'posted' ? 'invoice_posted' : 'invoice_pending_approval',
                ['draft_id' => $draftId, 'tenant_id' => $tenantId, 'user_id' => $userId]);
        }

        return $n === 1;
    }

    // ── presentation ────────────────────────────────────────────────────────

    public function present(Draft $d, ?Tenant $tenant = null): array
    {
        $r = $d->resolved ?? [];

        return [
            'draft_id'         => $d->id,
            'schema_version'   => (int) $d->schema_version,
            'revision'         => (int) $d->revision,
            'status'           => $d->status,
            'input_mode'       => $d->input_mode,
            'expires_at'       => $d->expires_at?->toIso8601String(),
            'turns'            => (int) $d->turns,
            'customer'         => $r['customer'] ?? null,
            'lines'            => $r['lines'] ?? [],
            'lines_pending'    => $r['lines_pending'] ?? [],
            'payment'          => $r['payment'] ?? null,
            'invoice_date'     => $r['invoice_date'] ?? null,
            'due_date'         => $r['due_date'] ?? null,
            'notes'            => $r['notes'] ?? null,
            'warehouse'        => $r['warehouse'] ?? null,
            'totals_preview'   => $r['totals_preview'] ?? null,
            'unresolved'       => $d->unresolved ?? [],
            'warnings'         => $r['warnings'] ?? [],
            'defaults_applied' => $r['defaults_applied'] ?? [],
            'can_handoff'      => $d->status === Draft::READY_FOR_REVIEW,
        ];
    }

    private function presentFresh(Draft $d, Tenant $tenant): ?array
    {
        $fresh = Draft::where('id', $d->id)->where('tenant_id', $tenant->id)->first();

        return $fresh ? $this->present($fresh, $tenant) : null;
    }

    // ── internals ───────────────────────────────────────────────────────────

    /**
     * Resolve against the store and apply with compare-and-swap on the revision
     * the caller saw. Returns the fresh draft, or null if it moved meanwhile.
     */
    private function applyResolution(Draft $draft, Tenant $tenant, array $intent, array $choices, ?array $x, array $extra): ?Draft
    {
        $resolver = new InvoiceDraftResolver($tenant->id, $draft->id);
        $out = $resolver->resolve($intent, $choices, $draft->input_mode === 'voice');

        $status = $out['can_handoff'] ? Draft::READY_FOR_REVIEW : Draft::NEEDS_CLARIFICATION;
        $attrs = array_merge([
            'intent'           => $intent,
            'choices'          => $choices,
            'resolved'         => $out['resolved'],
            'unresolved'       => $out['unresolved'],
            'candidate_set_id' => $this->setId($out['unresolved']),
            'status'           => $status,
        ], $extra);
        if ($x) {
            $attrs['provider'] = $x['provider'] ?? $draft->provider;
            $attrs['model'] = $x['model'] ?? $draft->model;
            $attrs['cost_usd'] = (float) $draft->cost_usd + (float) $x['cost'];
        }

        $fresh = $this->repo->compareAndSwap($draft, $attrs);
        if ($fresh) {
            $event = $out['can_handoff'] ? 'draft_resolved' : 'clarification_required';
            InvoiceAssistantTelemetry::event($event, [
                'draft_id' => $fresh->id, 'revision' => $fresh->revision, 'tenant_id' => $tenant->id,
                'user_id' => $fresh->user_id, 'lines' => count($intent['lines'] ?? []), 'unresolved' => count($out['unresolved']),
            ]);
        }

        return $fresh;
    }

    /**
     * Validate every selection against the CURRENT clarification set, then fold
     * into choices. A candidate id that was not offered is rejected even if it
     * exists in the store.
     */
    private function applySelections(Draft $draft, array $selections, Tenant $tenant): array
    {
        $choices = $draft->choices ?? [];
        $open = collect($draft->unresolved ?? []);

        foreach ($selections as $s) {
            $field = $s['field'] ?? null;
            $lineKey = $s['line_key'] ?? null;
            $entry = $open->first(fn ($u) => ($u['field'] ?? null) === $field && (($u['line_key'] ?? null) === $lineKey));

            if (!$entry || empty($entry['candidates'])) {
                throw new InvoiceAssistantException(422, 'invalid_selection', 'That option is not available for this draft.', false, ['selections' => ['No matching open question.']]);
            }
            if (($entry['candidate_set_id'] ?? null) !== ($s['candidate_set_id'] ?? null)) {
                throw new InvoiceAssistantException(409, 'stale_candidates', 'Those options changed. Choose again from the latest list.', false, [], $this->present($draft, $tenant));
            }
            $ids = array_map(fn ($c) => (string) $c['id'], $entry['candidates']);
            $picked = (string) ($s['selected_id'] ?? '');
            if (!in_array($picked, $ids, true)) {
                throw new InvoiceAssistantException(422, 'invalid_selection', 'That option was not one of the choices offered.', false, ['selections' => ['Not in the offered set.']]);
            }

            match ($field) {
                'customer' => $choices['customer'] = $picked,
                'product'  => $choices['lines'][$lineKey]['item'] = $picked,
                'unit'     => $choices['lines'][$lineKey]['unit'] = $picked,
                default    => throw new InvoiceAssistantException(422, 'invalid_selection', 'That question cannot be answered with an option.'),
            };
        }

        return $choices;
    }

    private function quantityShortcut(Draft $draft, ?string $text): ?array
    {
        if ($text === null || !preg_match('/^\s*(\d{1,9}(?:\.\d{1,4})?)\s*$/', $text, $m)) {
            return null;
        }
        $intent = $draft->intent ?? [];
        $missing = array_values(array_filter($intent['lines'] ?? [], fn ($l) => $l['quantity'] === null));
        if (count($missing) !== 1 || (float) $m[1] <= 0) {
            return null;
        }
        $qty = $this->validator->decimal($m[1], 4);
        if ($qty === null || (float) $qty > (float) config('invoice_assistant.max_quantity', 1000000)) {
            return null;
        }
        foreach ($intent['lines'] as &$l) {
            if ($l['line_key'] === $missing[0]['line_key']) {
                $l['quantity'] = $qty;
            }
        }
        unset($l);
        $intent['clarification'] = null;

        return $intent;
    }

    /** Line-level diff between two intents, for "here is what I changed". */
    private function diff(array $old, array $new): array
    {
        $changes = [];
        $oldByKey = collect($old['lines'] ?? [])->keyBy('line_key');
        $newByKey = collect($new['lines'] ?? [])->keyBy('line_key');

        foreach ($newByKey as $key => $line) {
            $was = $oldByKey->get($key);
            if (!$was) {
                $changes[] = ['line_key' => $key, 'field' => 'line', 'from' => null, 'to' => $line['sku'] ?? $line['name']];
                continue;
            }
            foreach (['sku', 'name', 'quantity', 'unit', 'requested_unit_price', 'discount_percent'] as $f) {
                if (($was[$f] ?? null) !== ($line[$f] ?? null)) {
                    $changes[] = ['line_key' => $key, 'field' => $f, 'from' => $was[$f] ?? null, 'to' => $line[$f] ?? null];
                }
            }
        }
        foreach ($oldByKey as $key => $line) {
            if (!$newByKey->has($key)) {
                $changes[] = ['line_key' => $key, 'field' => 'line', 'from' => $line['sku'] ?? $line['name'], 'to' => null];
            }
        }
        foreach (['name', 'code'] as $f) {
            if (($old['customer_reference'][$f] ?? null) !== ($new['customer_reference'][$f] ?? null)) {
                $changes[] = ['line_key' => null, 'field' => "customer_{$f}", 'from' => $old['customer_reference'][$f] ?? null, 'to' => $new['customer_reference'][$f] ?? null];
            }
        }
        foreach (['method', 'amount_paid'] as $f) {
            if (($old['payment'][$f] ?? null) !== ($new['payment'][$f] ?? null)) {
                $changes[] = ['line_key' => null, 'field' => "payment_{$f}", 'from' => $old['payment'][$f] ?? null, 'to' => $new['payment'][$f] ?? null];
            }
        }
        foreach (['invoice_date', 'due_date', 'notes'] as $f) {
            if (($old[$f] ?? null) !== ($new[$f] ?? null)) {
                $changes[] = ['line_key' => null, 'field' => $f, 'from' => $old[$f] ?? null, 'to' => $new[$f] ?? null];
            }
        }

        return $changes;
    }

    private function ambiguousQuantityEdit(?string $text, array $changes): bool
    {
        if (!$text || !preg_match_all('/\d+(?:\.\d+)?/', $text, $m) || count($m[0]) !== 1) {
            return false;
        }
        $qtyLines = array_filter($changes, fn ($c) => $c['field'] === 'quantity');

        return count($qtyLines) > 1;
    }

    /** A changed item/customer/quantity invalidates the choice made for the old value. */
    private function pruneChoices(array $choices, array $old, array $new): array
    {
        $oldByKey = collect($old['lines'] ?? [])->keyBy('line_key');
        foreach ($new['lines'] ?? [] as $line) {
            $was = $oldByKey->get($line['line_key']);
            if (!$was) {
                continue;
            }
            if (($was['sku'] ?? null) !== ($line['sku'] ?? null) || ($was['name'] ?? null) !== ($line['name'] ?? null)) {
                unset($choices['lines'][$line['line_key']]);
            } elseif (($was['quantity'] ?? null) !== ($line['quantity'] ?? null) || ($was['unit'] ?? null) !== ($line['unit'] ?? null)) {
                unset($choices['lines'][$line['line_key']]['unit']);
            }
        }
        $newKeys = array_column($new['lines'] ?? [], 'line_key');
        foreach (array_keys($choices['lines'] ?? []) as $k) {
            if (!in_array($k, $newKeys, true)) {
                unset($choices['lines'][$k]);
            }
        }
        if (($old['customer_reference'] ?? null) !== ($new['customer_reference'] ?? null)) {
            unset($choices['customer']);
        }

        return $choices;
    }

    private function replayCreate(Draft $existing, string $hash): array
    {
        $logged = collect($existing->request_log ?? [])->first(fn ($e) => ($e['op'] ?? null) === 'create');
        if (($logged['hash'] ?? null) !== $hash) {
            throw new InvoiceAssistantException(409, 'conflicting_replay', 'That request id was already used for a different request.');
        }
        InvoiceAssistantTelemetry::event('duplicate_recovered', ['draft_id' => $existing->id, 'stage' => 'create']);

        if ($existing->status === Draft::FAILED) {
            throw new InvoiceAssistantException(409, 'previous_attempt_failed', 'That attempt failed. Send it again to retry.', true);
        }
        if ($existing->status === Draft::INTERPRETING) {
            throw new InvoiceAssistantException(409, 'still_interpreting', 'That request is still being processed.', true);
        }

        return $this->present($existing);
    }

    private function failDraft(Draft $draft, string $code): void
    {
        Draft::where('id', $draft->id)->where('revision', $draft->revision)->whereIn('status', Draft::ACTIVE)
            ->update(['status' => Draft::FAILED, 'failure_code' => substr($code, 0, 48),
                'revision' => DB::raw('revision + 1'), 'updated_at' => now()]);
    }

    private function mapFailure(array $x): InvoiceAssistantException
    {
        $code = (string) ($x['code'] ?? 'provider_error');
        $msg = $x['message'] ?? null;

        return match (true) {
            $code === 'out_of_scope' => new InvoiceAssistantException(422, 'unsupported_request',
                $msg ?: 'I can only help create sales invoices here.'),
            $code === 'rate_limited' => new InvoiceAssistantException(429, 'rate_limited',
                'Too many assistant requests right now. Wait a moment and try again.', true),
            $code === 'spend_capped' => new InvoiceAssistantException(429, 'spend_capped',
                $msg ?: 'The AI budget for today has been reached. Enter the invoice manually.', false),
            in_array($code, ['no_addon', 'limit_reached', 'free_limit_reached', 'no_tenant', 'not_allowed', 'plan_locked'], true) => new InvoiceAssistantException(402, 'ai_not_available',
                $msg ?: 'AI is not available on this plan or the allowance is used up.', false),
            in_array($code, ['no_key'], true) => new InvoiceAssistantException(503, 'assistant_unavailable',
                $msg ?: 'The assistant is not configured for this store.', false),
            $code === 'invalid_model_output' => new InvoiceAssistantException(502, 'invalid_model_output',
                'The assistant could not understand that request.', true),
            default => new InvoiceAssistantException(503, 'assistant_unavailable',
                'The assistant is temporarily unavailable. Your text is kept — try again or enter the invoice manually.', true),
        };
    }

    private function setId(array $unresolved): ?string
    {
        return $unresolved ? ($unresolved[0]['candidate_set_id'] ?? null) : null;
    }

    private function cleanText(string $t): string
    {
        $t = preg_replace('/[^\P{C}\n\t]+/u', '', $t) ?? $t;
        $t = trim($t);
        $max = (int) config('invoice_assistant.max_input_chars', 4000);
        if (mb_strlen($t) > $max) {
            throw new InvoiceAssistantException(422, 'input_too_long', "Please keep the request under {$max} characters.");
        }

        return $t;
    }

    private function ctx(Draft $d, Tenant $tenant, User $user): array
    {
        return ['draft_id' => $d->id, 'revision' => $d->revision, 'tenant_id' => $tenant->id, 'user_id' => $user->id, 'input_mode' => $d->input_mode];
    }

    private function ms(float $t0): int
    {
        return (int) round((microtime(true) - $t0) * 1000);
    }
}
