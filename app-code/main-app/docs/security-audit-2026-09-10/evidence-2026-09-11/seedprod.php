<?php
use Illuminate\Support\Facades\DB; use Illuminate\Support\Str;
$t = App\Models\Tenant::where('slug','e2e-mart')->first();
app()->instance('current.tenant', $t);
$wh = DB::table('warehouses')->where('tenant_id',$t->id)->value('id');
echo "wh=$wh\n";
$pid = Str::uuid()->toString();
DB::table('products')->insert(['base_unit'=>'pcs','id'=>$pid,'tenant_id'=>$t->id,'name'=>'E2E Widget','sku'=>'E2E-WIDGET','price'=>1500,'cost_price'=>1000,'tax_rate'=>0,'created_at'=>now()->subDay(),'updated_at'=>now()->subDay()]);
DB::table('inventory_batches')->insert(['id'=>Str::uuid()->toString(),'tenant_id'=>$t->id,'product_id'=>$pid,'warehouse_id'=>$wh,'batch_type'=>'opening','original_qty'=>10,'initial_qty'=>10,'remaining_qty'=>10,'unit_cost'=>1000,'purchase_invoice_id'=>'opening-e2e','created_at'=>now()->subDay(),'updated_at'=>now()->subDay()]);
app(App\Services\AccountingService::class)->createEntry(['date'=>now()->subDay()->format('Y-m-d'),'reference_type'=>'opening_balance','reference'=>'opening-'.$pid,'description'=>'Opening stock E2E'],[['account_code'=>'1100','debit'=>10000,'credit'=>0],['account_code'=>'7000','debit'=>0,'credit'=>10000]]);
echo "pid=$pid\n";
