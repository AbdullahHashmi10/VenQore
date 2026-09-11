<?php
$t = App\Models\Tenant::where('slug','e2e-mart')->first(); app()->instance('current.tenant', $t);
$pid = Illuminate\Support\Facades\DB::table('products')->where('sku','E2E-WIDGET')->value('id');
app(App\Services\V3\AccountingService::class)->createEntry(['date'=>now()->subDay()->format('Y-m-d'),'reference_type'=>'opening_balance','reference'=>'opening-'.$pid,'description'=>'Opening stock E2E'],[['account_code'=>'1100','debit'=>10000,'credit'=>0],['account_code'=>'7000','debit'=>0,'credit'=>10000]]);
echo "ok $pid\n";
