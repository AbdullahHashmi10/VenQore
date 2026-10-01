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

final class ApprovalAwaitingReviewResolver extends AbstractCardResolver
{
    public static function key(): string
    {
        return 'approval.awaiting_review';
    }

    protected function compute(ReckonerContext $ctx, ReckonerPeriod $period, array $card, array $args, string $id, ReckonerShape $shape): ReckonerResult
    {
        $count = 0;
        try {
            if ($ctx->tenant && $ctx->user) {
                $engine = app(ApprovalExecutionEngine::class);
                $eligibleTypes = $engine->getEligibleDocumentTypes($ctx->tenant, $ctx->user);

                if (!empty($eligibleTypes)) {
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

                    $count = $query->count();
                }
            }
        } catch (Throwable $e) {
            return ReckonerResult::unavailable($id, self::key(), 'query_failed', 'Failed to compute awaiting review count: ' . $e->getMessage(), $card, $period);
        }

        return ReckonerResult::success($id, self::key(), $shape, $card, $period, ['value' => $count]);
    }
}
