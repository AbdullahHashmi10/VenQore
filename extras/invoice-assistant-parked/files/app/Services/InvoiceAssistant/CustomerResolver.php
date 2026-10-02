<?php

namespace App\Services\InvoiceAssistant;

use App\Helpers\SettingsHelper;
use App\Models\Party;
use Illuminate\Support\Collection;

/**
 * Eligible, store-scoped customer lookup.
 *
 *   1. an operator's explicit selection (re-validated, never trusted blindly)
 *   2. an exact phone / e-mail the operator gave
 *   3. an exact (case/space-insensitive) name
 *
 * Several eligible matches => ambiguous, the operator picks. No match =>
 * suggestions only. This class never picks "the first one" and never creates a
 * customer.
 */
class CustomerResolver
{
    public function __construct(private int|string|null $tenantId = null) {}

    public function forTenant(int|string $tenantId): static
    {
        return new static($tenantId);
    }

    /**
     * @return array{status:string, party:?Party, candidates:array, basis:?string}
     *   status: resolved | ambiguous | not_found | missing
     */
    public function resolve(array $ref, ?string $chosenId = null): array
    {
        if ($chosenId) {
            $party = $this->eligible()->where('id', $chosenId)->first();
            if ($party) {
                return $this->done($party, 'selected');
            }
            // A stale/forged selection falls through to a fresh lookup.
        }

        $name = $this->squash($ref['name'] ?? null);
        $code = trim((string) ($ref['code'] ?? ''));

        if ($name === '' && $code === '') {
            return ['status' => 'missing', 'party' => null, 'candidates' => [], 'basis' => null];
        }

        if ($code !== '') {
            $hits = $this->byCode($code);
            if ($hits->count() === 1) {
                return $this->done($hits->first(), 'exact_code');
            }
            if ($hits->count() > 1) {
                return $this->ambiguous($hits);
            }
        }

        if ($name !== '') {
            $exact = $this->eligible()
                ->where('name', 'like', $this->escapeLike($name))
                ->limit(25)->get()
                ->filter(fn (Party $p) => $this->squash($p->name) === $name)
                ->values();

            if ($exact->count() === 1) {
                return $this->done($exact->first(), 'exact_name');
            }
            if ($exact->count() > 1) {
                return $this->ambiguous($exact);
            }

            return $this->suggest($name);
        }

        return ['status' => 'not_found', 'party' => null, 'candidates' => [], 'basis' => null];
    }

    /** Re-check that a previously chosen id is still an eligible customer. */
    public function stillEligible(string $id): bool
    {
        return $this->eligible()->where('id', $id)->exists();
    }

    private function eligible()
    {
        $q = Party::query()->where('tenant_id', $this->tenantId);
        $types = SettingsHelper::isStrictPartyRoles() ? ['customer'] : ['customer', 'both'];

        return $q->whereIn('type', $types);
    }

    private function byCode(string $code): Collection
    {
        if (str_contains($code, '@')) {
            $needle = mb_strtolower($code);

            return $this->eligible()->where('email', 'like', $this->escapeLike($code))->limit(10)->get()
                ->filter(fn (Party $p) => mb_strtolower(trim((string) $p->email)) === $needle)->values();
        }

        $digits = preg_replace('/\D+/', '', $code) ?? '';
        if (strlen($digits) < 7) {
            return collect();
        }
        $tail = substr($digits, -9);

        return $this->eligible()->where('phone', 'like', '%' . $tail . '%')->limit(10)->get()
            ->filter(fn (Party $p) => substr(preg_replace('/\D+/', '', (string) $p->phone) ?? '', -9) === $tail)->values();
    }

    private function suggest(string $name): array
    {
        $limit = (int) config('invoice_assistant.candidate_limit', 5);
        $first = explode(' ', $name)[0] ?? $name;
        $rows = $this->eligible()
            ->where(function ($q) use ($name, $first) {
                $q->where('name', 'like', '%' . $this->likeBody($name) . '%')
                    ->orWhere('name', 'like', '%' . $this->likeBody($first) . '%');
            })
            ->orderBy('name')->limit($limit)->get();

        return [
            'status'     => 'not_found',
            'party'      => null,
            'candidates' => $rows->map(fn (Party $p) => $this->candidate($p))->all(),
            'basis'      => null,
        ];
    }

    private function ambiguous(Collection $parties): array
    {
        $limit = (int) config('invoice_assistant.candidate_limit', 5);

        return [
            'status'     => 'ambiguous',
            'party'      => null,
            'candidates' => $parties->take($limit)->map(fn (Party $p) => $this->candidate($p))->all(),
            'basis'      => null,
        ];
    }

    private function done(Party $party, string $basis): array
    {
        return ['status' => 'resolved', 'party' => $party, 'candidates' => [], 'basis' => $basis];
    }

    public function candidate(Party $p): array
    {
        return [
            'id'              => (string) $p->id,
            'label'           => (string) $p->name,
            'secondary_label' => $p->phone ?: ($p->email ?: ($p->category ?: null)),
        ];
    }

    private function squash(?string $s): string
    {
        return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', (string) $s)));
    }

    /** Exact-match LIKE: escape wildcards so "100%" cannot match everything. */
    private function escapeLike(string $s): string
    {
        return $this->likeBody($s);
    }

    private function likeBody(string $s): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $s);
    }
}
