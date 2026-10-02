<?php

namespace App\Services\InvoiceAssistant;

use App\Models\InvoiceAssistantDraft as Draft;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Owner/tenant scope, revision control, TTL and transition enforcement.
 *
 * Rules this class exists to enforce:
 *   - a draft is visible ONLY to the tenant+user that created it (everything
 *     else is a 404, never a 403, so ids cannot be probed);
 *   - every write carries the revision the caller saw; a stale write is a 409;
 *   - no database transaction or row lock is ever held across a model/network
 *     call — callers capture the revision, call upstream, then apply with
 *     compareAndSwap(), which only succeeds if nobody moved the revision.
 */
class DraftRepository
{
    private const JSON_COLUMNS = ['intent', 'choices', 'resolved', 'unresolved', 'request_log'];

    public function ttl(): \DateTimeInterface
    {
        return now()->addMinutes(max(1, (int) config('invoice_assistant.draft_ttl_minutes', 30)));
    }

    public function create(array $attrs): Draft
    {
        return Draft::create(array_merge([
            'schema_version' => 1,
            'revision'       => 1,
            'status'         => Draft::INTERPRETING,
            'turns'          => 1,
            'expires_at'     => $this->ttl(),
        ], $attrs));
    }

    /** Idempotent create: returns [draft, created?]. */
    public function createOnce(array $attrs): array
    {
        try {
            return [$this->create($attrs), true];
        } catch (QueryException $e) {
            if (!$this->isDuplicate($e)) {
                throw $e;
            }
            $existing = Draft::where('tenant_id', $attrs['tenant_id'])
                ->where('user_id', $attrs['user_id'])
                ->where('create_request_id', $attrs['create_request_id'] ?? null)
                ->first();
            if (!$existing) {
                throw $e;
            }

            return [$existing, false];
        }
    }

    public function findByCreateRequest(int|string $tenantId, int|string $userId, string $requestId): ?Draft
    {
        return Draft::where('tenant_id', $tenantId)->where('user_id', $userId)
            ->where('create_request_id', $requestId)->first();
    }

    /**
     * Owned, unexpired draft — or 404/410.
     */
    public function findOwned(?string $id, int|string $tenantId, int|string $userId, bool $forUpdate = false): Draft
    {
        if (!$id || !Str::isUuid($id)) {
            throw InvoiceAssistantException::notFound();
        }

        $q = Draft::where('id', $id)->where('tenant_id', $tenantId)->where('user_id', $userId);
        if ($forUpdate) {
            $q->lockForUpdate();
        }
        $draft = $q->first();
        if (!$draft) {
            throw InvoiceAssistantException::notFound();
        }

        if ($draft->status === Draft::EXPIRED) {
            throw InvoiceAssistantException::expired();
        }
        if ($draft->isActive() && $draft->isExpired()) {
            Draft::where('id', $draft->id)->whereIn('status', Draft::ACTIVE)
                ->update(['status' => Draft::EXPIRED, 'updated_at' => now()]);
            throw InvoiceAssistantException::expired();
        }

        return $draft;
    }

    /**
     * Apply $attrs only if the draft is still at $revision and in an allowed
     * state. Returns the fresh draft, or null when someone else got there
     * first. This is the primitive every post-network write uses.
     */
    public function compareAndSwap(Draft $draft, array $attrs, array $allowedStatuses = Draft::ACTIVE): ?Draft
    {
        $set = $this->encode($attrs);
        $set['revision']   = $draft->revision + 1;
        $set['updated_at'] = now();

        $n = Draft::where('id', $draft->id)
            ->where('tenant_id', $draft->tenant_id)
            ->where('user_id', $draft->user_id)
            ->where('revision', $draft->revision)
            ->whereIn('status', $allowedStatuses)
            ->update($set);

        return $n === 1 ? Draft::find($draft->id) : null;
    }

    /**
     * Short critical section: lock the row, verify owner/expiry/state/revision,
     * run $fn (pure, NO network), save with revision+1.
     *
     * @param callable(Draft):void $fn
     */
    public function mutate(
        string $id,
        int|string $tenantId,
        int|string $userId,
        ?int $expectedRevision,
        callable $fn,
        array $allowedStatuses = Draft::ACTIVE,
    ): Draft {
        return DB::transaction(function () use ($id, $tenantId, $userId, $expectedRevision, $fn, $allowedStatuses) {
            $draft = $this->findOwned($id, $tenantId, $userId, true);

            if (!in_array($draft->status, $allowedStatuses, true)) {
                throw InvoiceAssistantException::invalidState($draft->status);
            }
            if ($expectedRevision !== null && (int) $draft->revision !== (int) $expectedRevision) {
                throw InvoiceAssistantException::stale();
            }

            $fn($draft);
            $draft->revision = $draft->revision + 1;
            $draft->save();

            return $draft;
        });
    }

    /** Remember a request id so a replay returns the earlier outcome. Bounded. */
    public function remember(Draft $draft, string $requestId, string $hash, string $op): array
    {
        $log = $draft->request_log ?? [];
        $log[$requestId] = ['hash' => $hash, 'op' => $op, 'at' => now()->toIso8601String()];
        $limit = max(5, (int) config('invoice_assistant.request_log_limit', 20));
        if (count($log) > $limit) {
            $log = array_slice($log, -$limit, null, true);
        }

        return $log;
    }

    public function cancel(string $id, int|string $tenantId, int|string $userId, ?int $expectedRevision): Draft
    {
        return $this->mutate($id, $tenantId, $userId, $expectedRevision, function (Draft $d) {
            $d->status = Draft::CANCELLED;
            // Content is not needed after cancel — drop it now.
            $d->intent = null;
            $d->resolved = null;
            $d->unresolved = null;
            $d->choices = null;
            $d->transcript = null;
        });
    }

    /** Delete content past retention; keeps nothing but rows that never held content. */
    public function prune(): int
    {
        $cut = now()->subHours(max(1, (int) config('invoice_assistant.prune_after_hours', 24)));

        Draft::whereIn('status', Draft::ACTIVE)->where('expires_at', '<', now())
            ->update(['status' => Draft::EXPIRED, 'updated_at' => now()]);

        return Draft::whereIn('status', [Draft::EXPIRED, Draft::CANCELLED, Draft::FAILED])
            ->where('updated_at', '<', $cut)
            ->delete();
    }

    private function encode(array $attrs): array
    {
        foreach (self::JSON_COLUMNS as $col) {
            if (array_key_exists($col, $attrs) && $attrs[$col] !== null) {
                $attrs[$col] = json_encode($attrs[$col], JSON_UNESCAPED_UNICODE);
            }
        }

        return $attrs;
    }

    private function isDuplicate(QueryException $e): bool
    {
        $code = (string) ($e->errorInfo[0] ?? $e->getCode());
        $driver = (int) ($e->errorInfo[1] ?? 0);

        return $code === '23000' && in_array($driver, [1062, 19, 2601, 2627], true) || $code === '23505';
    }
}
