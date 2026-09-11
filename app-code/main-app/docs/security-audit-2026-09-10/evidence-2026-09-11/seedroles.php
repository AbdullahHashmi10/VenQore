<?php
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Hash; use Illuminate\Support\Str;
$t = App\Models\Tenant::where('slug','e2e-mart')->first(); app()->instance('current.tenant',$t);
foreach ([['cashier','e2e.cashier@example.com',null],['manager','e2e.manager@example.com','2468']] as [$role,$email,$pin]) {
  $u = App\Models\User::withoutGlobalScopes()->where('email',$email)->first() ?: App\Models\User::create(['name'=>ucfirst($role).' E2E','email'=>$email,'password'=>Hash::make('Str0ng!Passw0rd#2026'),'email_verified_at'=>now()]);
  $u->forceFill(['last_store_id'=>$t->id])->save();
  DB::table('tenant_users')->updateOrInsert(['tenant_id'=>$t->id,'user_id'=>$u->id],['role'=>$role,'status'=>'active','security_pin'=>$pin?Hash::make($pin):null,'created_at'=>now(),'updated_at'=>now()]);
  echo "$role {$u->id}\n";
}
$wh = DB::table('warehouses')->where('tenant_id',$t->id)->value('id');
if (!DB::table('products')->where('sku','E2E-CHEAP')->exists()) {
  $pid=(string) Str::uuid();
  DB::table('products')->insert(['id'=>$pid,'tenant_id'=>$t->id,'name'=>'E2E Loss Leader','sku'=>'E2E-CHEAP','price'=>50,'cost_price'=>60,'base_unit'=>'pcs','tax_rate'=>0,'created_at'=>now()->subDay(),'updated_at'=>now()->subDay()]);
  DB::table('inventory_batches')->insert(['id'=>(string) Str::uuid(),'tenant_id'=>$t->id,'product_id'=>$pid,'warehouse_id'=>$wh,'batch_type'=>'opening','original_qty'=>10,'initial_qty'=>10,'remaining_qty'=>10,'unit_cost'=>60,'purchase_invoice_id'=>'opening-cheap','created_at'=>now()->subDay(),'updated_at'=>now()->subDay()]);
  DB::table('stocks')->insert(['id'=>(string) Str::uuid(),'tenant_id'=>$t->id,'product_id'=>$pid,'warehouse_id'=>$wh,'quantity'=>10,'reserved_quantity'=>0,'status'=>'available','created_at'=>now(),'updated_at'=>now()]);
  app(App\Services\V3\AccountingService::class)->createEntry(['date'=>now()->subDay()->format('Y-m-d'),'reference_type'=>'opening_balance','reference'=>'opening-'.$pid,'description'=>'Opening stock cheap'],[['account_code'=>'1100','debit'=>600,'credit'=>0],['account_code'=>'7000','debit'=>0,'credit'=>600]]);
  echo "product $pid\n";
}
