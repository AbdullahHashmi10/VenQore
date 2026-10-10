<?php
// Rebuilds the demo store with sane volumes: 12 months of sales, realistic stock, little aged credit.
ignore_user_abort(true);
use Illuminate\Support\Facades\DB; use Carbon\Carbon; use App\Services\DemoStoreService;
$log = fn($m) => file_put_contents(__DIR__.'/../rebuild.log', date('H:i:s')." $m\n", FILE_APPEND);
@unlink(__DIR__.'/../rebuild.log');
$tid = $tenant->id;
DB::statement('SET FOREIGN_KEY_CHECKS=0;');
foreach (DemoStoreService::existingTenantDataTables() as $t) { try { DB::table($t)->where('tenant_id',$tid)->delete(); } catch (Throwable $e) {} }
DB::statement('SET FOREIGN_KEY_CHECKS=1;');
$log('wiped');
$stub = new class extends Illuminate\Console\Command { public function info($s,$v=null){} public function warn($s,$v=null){} public function error($s,$v=null){} public function line($s,$st=null,$v=null){} };
\Database\Seeders\TenantDefaultSeeder::seedFor($tenant);
DB::table('tenant_users')->updateOrInsert(['tenant_id'=>$tid,'user_id'=>$user->id],['role'=>'owner','status'=>'active','display_name'=>'Ayesha Khan','created_at'=>now(),'updated_at'=>now()]);
$tenant->forceFill(['name'=>'Voltix Electronics'])->save();
foreach ([\Database\Seeders\Demo\DemoWarehouseSeeder::class,\Database\Seeders\Demo\DemoBankAccountSeeder::class,\Database\Seeders\Demo\DemoCategorySeeder::class,\Database\Seeders\Demo\DemoProductSeeder::class,\Database\Seeders\Demo\DemoCustomerSeeder::class,\Database\Seeders\Demo\DemoSupplierSeeder::class] as $c) { $s = app($c); $s->setCommand($stub); $s->run($tid); $log($c); }
// realistic stock
DB::table('stocks')->where('tenant_id',$tid)->update(['quantity'=>140]);
DB::table('inventory_batches')->where('tenant_id',$tid)->update(['initial_qty'=>140,'original_qty'=>140,'remaining_qty'=>140]);
$wh = App\Models\Warehouse::where('tenant_id',$tid)->first();
$products = App\Models\Product::where('tenant_id',$tid)->get();
$named = App\Models\Party::where('tenant_id',$tid)->where('type','customer')->where('name','not like','Walk-In%')->get();
$walk = App\Models\Party::where('tenant_id',$tid)->where('type','customer')->where('name','like','Walk-In%')->get();
$svc = app(App\Engines\SaleService::class);
$real = Carbon::now(); $start = $real->copy()->subDays(364)->startOfDay(); $n=0; $fail=0;
for ($d = $start->copy(); $d <= $real; $d->addDay()) {
  $age = (int)$d->diffInDays($real);
  $per = 2.6 + max(0,(365-$age))/365*1.6;                   // growth through the year
  if ($d->isWeekend()) $per *= 1.35; if ($d->month==12) $per *= 1.4;
  $cnt = (int)floor($per) + (mt_rand(0,100)/100 < $per-floor($per) ? 1:0);
  if ($age < 14) $cnt = max($cnt, 5);
  for ($i=0;$i<$cnt;$i++) {
    Carbon::setTestNow($d->copy()->setTime(9,0)->addMinutes(rand(10,600)));
    $credit = $age < 35 && rand(1,100) <= 12;
    $cust = $credit || rand(1,100) <= 55 ? $named->random() : $walk->random();
    $items=[]; $tot=0;
    for ($k=0;$k<rand(1,3);$k++){ $p=$products->random(); $q=rand(1,2); $disc=[0,0,0,5,10][rand(0,4)];
      $items[]=['product_id'=>$p->id,'qty'=>$q,'unit_price'=>$p->price,'discount_percent'=>$disc,'tax_rate'=>0,'sale_uom'=>'PCS']; $tot+=$p->price*$q*(1-$disc/100); }
    $m = $credit ? 'credit' : ['cash','cash','bank','bank','card'][rand(0,4)]; if($m==='card') $m='bank';
    try { $svc->post(['customer_id'=>$cust->id,'warehouse_id'=>$wh->id,'sale_date'=>$d->toDateString(),'payment_method'=>$m,'amount_received'=>$credit?0:$tot,'tenant_id'=>$tid,'items'=>$items]); $n++; }
    catch (Throwable $e) { $fail++; if ($fail<4) $log('fail: '.$e->getMessage()); }
  }
  if ($d->day==1) $log("month ".$d->format('Y-m')." sales so far $n");
}
Carbon::setTestNow(null);
$log("sales done $n fail $fail");
(function() use ($tid,$log,$stub){ $c=0;
foreach ([\Database\Seeders\Demo\DemoExpenseSeeder::class,\Database\Seeders\Demo\DemoPurchaseSeeder::class,\Database\Seeders\Demo\DemoCookbookSeeder::class,\Database\Seeders\Demo\DemoStaffSeeder::class] as $cl) { try { $o=app($cl); $o->setCommand($stub); $o->run($tid); $log("ok $cl"); } catch (Throwable $e) { $log("ERR $cl ".$e->getMessage()); } } })();
// keep only a handful of recent purchases unpaid (realistic payables)
DB::table('purchases')->where('tenant_id',$tid)->where('purchase_date','<',now()->subDays(20)->toDateString())->update(['payment_status'=>'paid']);
DB::table('purchases')->where('tenant_id',$tid)->where('purchase_date','>=',now()->subDays(20)->toDateString())->where('payment_status','paid')->orderBy('purchase_date','desc')->limit(0);
$log('DONE');
echo "started/finished, see rebuild.log\n";
