<?php
header('Content-Type: text/plain'); set_time_limit(300);
use Illuminate\Support\Str; use Carbon\Carbon;
$T=1; $uid=auth()->id(); $now=now();
$run = function($label,$fn){ try { $n=$fn(); echo "OK  $label: $n\n"; } catch (\Throwable $e) { echo "ERR $label: ".substr($e->getMessage(),0,220)."\n"; } };
$wh = DB::table('warehouses')->where('tenant_id',$T)->orderBy('id')->pluck('id')->all();
$prods = DB::table('products')->where('tenant_id',$T)->orderBy('id')->limit(14)->get(['id','name','cost_price','price']);
$sups = DB::table('parties')->where('tenant_id',$T)->where('type','supplier')->orderBy('id')->limit(8)->get();
$d = fn($ago)=>Carbon::now()->subDays($ago)->toDateString();

Schema::disableForeignKeyConstraints(); DB::table('stock_take_items')->delete(); DB::table('stock_takes')->delete(); Schema::enableForeignKeyConstraints();
$run('stock takes', function() use($T,$uid,$wh,$prods,$now,$d){ $n=0; foreach (['completed','completed','draft'] as $i=>$s){ $id=(string)Str::uuid(); DB::table('stock_takes')->insert(['id'=>$id,'tenant_id'=>$T,'reference_number'=>'ST-'.str_pad($i+1,4,'0',STR_PAD_LEFT),'warehouse_id'=>$wh[$i%count($wh)],'date'=>$d(6+$i*20),'status'=>$s,'notes'=>'Cycle count','created_by'=>$uid,'created_at'=>$now,'updated_at'=>$now]);
    foreach ($prods as $k=>$p){ if($k>7) break; $exp=rand(100,300); $cnt=$exp+rand(-3,2); DB::table('stock_take_items')->insert(['id'=>(string)Str::uuid(),'tenant_id'=>$T,'stock_take_id'=>$id,'product_id'=>$p->id,'expected_quantity'=>$exp,'counted_quantity'=>$s==='draft'?$exp:$cnt,'difference'=>$s==='draft'?0:$cnt-$exp,'cost_price'=>$p->cost_price,'created_at'=>$now,'updated_at'=>$now]); } $n++; } return $n; });

