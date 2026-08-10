<?php
$plan = App\Models\Plan::where('slug', 'business')->first();
if ($plan) {
    App\Models\PlanLimit::updateOrCreate(
        ['plan_id' => $plan->id, 'key' => 'growth_engine'],
        ['value' => '1', 'reset_period' => 'never']
    );
    // Also enable it for the current tenant directly just in case it doesn't auto-sync
    $tenant = App\Models\Tenant::find(3);
    if ($tenant) {
        $tenant->update(['growth_engine' => true]);
    }
    echo "Growth Engine Enabled for Business Plan!\n";
}
