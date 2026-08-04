<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\DB;

class AiSpendGuard
{
    /**
     * Enforces daily USD spend caps per feature or globally using row-level database locks.
     * Returns true if request is within budget, false if daily spend cap has been tripped.
     */
    public function checkAndRecord(string $scope, float $costUsd, float $capUsd = 3.00): bool
    {
        $today = today()->toDateString();

        return DB::transaction(function () use ($scope, $today, $costUsd, $capUsd) {
            $row = DB::table('ai_spend_counters')
                ->where('scope', $scope)
                ->where('day', $today)
                ->lockForUpdate()
                ->first();

            if (!$row) {
                $tripped = $costUsd >= $capUsd;
                DB::table('ai_spend_counters')->insert([
                    'scope'      => $scope,
                    'day'        => $today,
                    'spend_usd'  => $costUsd,
                    'cap_usd'    => $capUsd,
                    'tripped'    => $tripped,
                ]);
                return !$tripped;
            }

            if ($row->tripped || (float) $row->spend_usd >= $capUsd) {
                return false;
            }

            $newSpend = (float) $row->spend_usd + $costUsd;
            $tripped = $newSpend >= $capUsd;

            DB::table('ai_spend_counters')
                ->where('id', $row->id)
                ->update([
                    'spend_usd' => $newSpend,
                    'tripped'   => $tripped,
                ]);

            return !$tripped;
        }, 3);
    }
}
