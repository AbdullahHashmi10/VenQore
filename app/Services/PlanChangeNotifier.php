<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\PlanChangeNotification;

class PlanChangeNotifier
{
    public static function notifyOverride(
        Tenant $tenant,
        string $key,
        mixed $oldValue,
        mixed $newValue,
        ?string $customMessage,
        int $adminId
    ): void {
        $isIncrease = self::isIncrease($key, $oldValue, $newValue);

        PlanChangeNotification::create([
            'tenant_id'     => $tenant->id,
            'type'          => $isIncrease ? 'limit_increase' : 'limit_decrease',
            'title'         => $isIncrease
                ? 'Your ' . self::keyLabel($key) . ' limit has been increased'
                : 'Your ' . self::keyLabel($key) . ' limit has been adjusted',
            'message'       => $customMessage ?? self::buildMessage($key, $oldValue, $newValue),
            'details'       => ['key' => $key, 'old' => $oldValue, 'new' => $newValue],
            'sent_by'       => 'admin',
            'admin_user_id' => $adminId,
        ]);
    }

    public static function notifyPlanUpgrade(Tenant $tenant, string $from, string $to): void
    {
        PlanChangeNotification::create([
            'tenant_id' => $tenant->id,
            'type'      => 'upgrade',
            'title'     => 'Your plan has been upgraded',
            'message'   => "Your account has been upgraded from {$from} to {$to}. New limits and features are active immediately.",
            'details'   => ['from' => $from, 'to' => $to],
            'sent_by'   => 'admin',
        ]);
    }

    public static function notifyExtension(Tenant $tenant, int $days): void
    {
        PlanChangeNotification::create([
            'tenant_id' => $tenant->id,
            'type'      => 'extension',
            'title'     => 'Your plan access has been extended',
            'message'   => "Your plan access has been extended by {$days} day(s). Your updated expiry is reflected immediately.",
            'sent_by'   => 'admin',
        ]);
    }

    private static function isIncrease(string $key, mixed $old, mixed $new): bool
    {
        if ($new === null) return true;  // null = unlimited = always an increase
        if ($old === null) return false; // was unlimited, now capped = decrease
        return (int) $new > (int) $old;
    }

    private static function keyLabel(string $key): string
    {
        return match($key) {
            'transactions_per_month' => 'monthly transaction',
            'sku_limit'   => 'product (SKU)',
            'locations'   => 'warehouse location',
            'staff_limit' => 'staff seat',
            'storage_gb'  => 'storage',
            default       => str_replace('_', ' ', $key),
        };
    }

    private static function buildMessage(string $key, mixed $old, mixed $new): string
    {
        $label = self::keyLabel($key);
        $oldDisplay = ($old === null || $old === '') ? 'unlimited' : $old;
        $newDisplay = ($new === null || $new === '') ? 'unlimited' : $new;

        return "Your {$label} limit has been changed from {$oldDisplay} to {$newDisplay}. This change is effective immediately.";
    }
}
