<?php
header('Content-Type: text/plain');
$s = App\Models\Setting::withoutGlobalScopes()->updateOrCreate(['tenant_id'=>null,'key'=>'vensynq_enabled'],['value'=>1]);
Illuminate\Support\Facades\Cache::forget('vensynq_enabled_flag');
echo "vensynq flag set: ".json_encode($s->only(['key','value']))."\n";
echo "plan: ".App\Models\Tenant::orderBy('id')->value('plan')."\n";
echo "gate growth: ".(App\Services\PlanGate::check('growth_engine')?'yes':'no')." vensync: ".(App\Services\PlanGate::check('vensync_command')?'yes':'no')."\n";
