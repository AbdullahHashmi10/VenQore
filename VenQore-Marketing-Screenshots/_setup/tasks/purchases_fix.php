<?php
use Illuminate\Support\Facades\DB; use Carbon\Carbon;
$tid=$tenant->id;
$ids = DB::table('purchases')->where('tenant_id',$tid)->pluck('id');
DB::table('purchase_items')->whereIn('purchase_id',$ids)->delete();
DB::table('purchases')->where('tenant_id',$tid)->delete();
$sup = App\Models\Party::where('tenant_id',$tid)->where('type','supplier')->get();
$prods = App\Models\Product::where('tenant_id',$tid)->get();
$wh = App\Models\Warehouse::where('tenant_id',$tid)->first();
$svc = app(App\Services\V3\PurchaseService::class);
$ok=0; $err=0;
for ($w=52; $w>=0; $w--) {
  $date = Carbon::now()->subDays($w*7+rand(0,3));
  $items=[]; foreach ($prods->random(rand(3,6)) as $p) $items[]=['product_id'=>$p->id,'qty'=>rand(8,30),'unit_cost'=>$p->cost_price];
  $total = array_sum(array_map(fn($i)=>$i['qty']*$i['unit_cost'],$items));
  $recent = $w < 4; $paid = !$recent || $w==0 && false;
  $pay = $recent ? ($w%2 ? 'credit' : 'credit') : 'bank';
  try { $svc->createPurchase(['supplier_id'=>$sup->random()->id,'warehouse_id'=>$wh->id,'purchase_date'=>$date->toDateString(),'due_date'=>$date->copy()->addDays(30)->toDateString(),'payment_method'=>$pay,'amount_paid'=>$recent ? ($w==3 ? round($total*0.5,2) : 0) : $total,'items'=>$items]); $ok++; }
  catch (Throwable $e) { $err++; if ($err<3) echo "ERR ".$e->getMessage()."\n"; }
}
echo "purchases ok $ok err $err\n";
