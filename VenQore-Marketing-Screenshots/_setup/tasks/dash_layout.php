<?php
header('Content-Type: text/plain');
$v = $_GET['v'] ?? 'classic';
$id = 'cd905753-29ab-455d-a386-cd0c512120b4';
$tenant = App\Models\Tenant::orderBy('id')->first();
$keys = array_keys(array_filter(app(App\Reckoner\Reckoner::class)->checkAvailability(array_keys(App\Reckoner\ReckonerRegistry::all()), auth()->user(), $tenant)));
$c = function($k,$p,$x,$y,$w,$h,$st=[]) { return ['reading_key'=>$k,'period'=>$p,'x'=>$x,'y'=>$y,'w'=>$w,'h'=>$h,'style'=>array_merge(['v'=>2,'showDelta'=>false],$st)]; };
$Y='this_year'; $M='this_month';
$L = [
 'classic'=>[ $c('core.revenue',$Y,0,0,3,2,['accent'=>true]), $c('core.net_profit',$Y,3,0,3,2), $c('core.gross_profit',$Y,6,0,3,2), $c('core.transaction_count',$Y,9,0,3,2),
   $c('core.revenue_trend',$Y,0,2,12,4), $c('core.receivables_aging',$M,0,6,4,4), $c('core.avg_transaction_value',$Y,4,6,4,4), $c('expenses.by_category',$Y,8,6,4,4) ],
 'headline'=>[ $c('core.revenue_trend',$Y,0,0,8,5,['accent'=>true]), $c('core.transaction_count',$Y,8,2,4,3), $c('core.net_profit',$Y,0,5,4,2), $c('core.gross_profit',$Y,4,5,4,2), $c('core.avg_transaction_value',$Y,8,5,4,2),
   $c('expenses.by_category',$Y,0,7,6,4), $c('khata.biggest_debtors',$Y,6,7,6,4) ],
 'command'=>[ $c('core.revenue',$Y,0,0,3,2,['accent'=>true]), $c('core.net_profit',$Y,3,0,3,2), $c('core.gross_profit',$Y,6,0,3,2), $c('inventory.stock_value',$Y,9,0,3,2),
   $c('core.revenue_trend',$Y,0,2,8,4), $c('core.avg_transaction_value',$Y,8,2,4,2), $c('core.transaction_count',$Y,8,4,4,2),
   $c('khata.biggest_debtors',$Y,0,6,4,4), $c('expenses.by_category',$Y,4,6,4,4), $c('core.recent_sales',$Y,8,6,4,4) ],
];
$clean = App\Reckoner\DashboardSanitizer::sanitize($L[$v], $keys);
DB::table('dashboard_cards')->where('dashboard_id',$id)->delete();
foreach ($clean as $r) { unset($r['id']); foreach (['period_custom','args','style'] as $j) if (isset($r[$j])) $r[$j]=json_encode($r[$j]); DB::table('dashboard_cards')->insert(array_merge($r,['id'=>(string)Illuminate\Support\Str::uuid(),'tenant_id'=>1,'dashboard_id'=>$id,'created_at'=>now(),'updated_at'=>now()])); }
DB::table('dashboards')->where('id',$id)->update(['frame_key'=>$v==='command'?'command_centre':$v,'frame_dirty'=>1]);
echo "ok $v kept ".count($clean)." of ".count($L[$v])."\n"; foreach($clean as $r) echo $r['reading_key'].' '.$r['chart'].' '.$r['period']."\n";
