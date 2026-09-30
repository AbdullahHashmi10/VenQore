<?php

namespace App\Reckoner\Resolvers;

use App\Models\ApprovalDocument;
use App\Models\Setting;
use App\Models\TenantUser;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerResult;
use App\Reckoner\ReckonerShape;
use App\Services\Approval\ApprovalExecutionEngine;
use Throwable;

final class ApprovalPendingAgingResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'approval.pending_aging';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $under24 = 0;
        $day1To2 = 0;
        $over48 = 0;

        try {
            if ($ctx->tenant && $ctx->user) {
                $engine = app(ApprovalExecutionEngine::class);
                $eligibleTypes = $engine->getEligibleDocumentTypes($ctx->tenant, $ctx->user);

                if (!empty($eligibleTypes)) {
                    $now = now();
                    $query = ApprovalDocument::where('tenant_id', $ctx->tenant->id)
                        ->where('status', ApprovalDocument::STATUS_PENDING)
                        ->whereIn('document_type', $eligibleTypes);

                    $membership = TenantUser::where('tenant_id', $ctx->tenant->id)->where('user_id', $ctx->user->id)->first();
                    $role = $membership?->role;
                    $isOwner = ($role === 'owner');

                    $strictOwnerSetting = Setting::withoutGlobalScopes()
                        ->where('tenant_id', $ctx->tenant->id)
                        ->where('key', 'approval_strict_owner_separation')
                        ->value('value');
                    $strictOwnerSeparation = filter_var($strictOwnerSetting, FILTER_VALIDATE_BOOLEAN);

                    if (!$isOwner || $strictOwnerSeparation) {
                        $query->where('maker_id', '!=', $ctx->user->id);
                    }

                    $docs = $query->get(['id', 'amount', 'created_at']);

                    foreach ($docs as $doc) {
                        $hours = abs((float) $now->diffInHours($doc->created_at, false));
                        if ($hours < 24) {
                            $under24++;
                        } elseif ($hours <= 48) {
                            $day1To2++;
                        } else {
                            $over48++;
                        }
                    }
                }
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute pending aging: ' . $e->getMessage(), $card, $period);
        }

        $data = [
            'under_24h' => $under24,
            '24h_to_48h' => $day1To2,
            'over_48h' => $over48,
        ];

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, $data);
    }
}
