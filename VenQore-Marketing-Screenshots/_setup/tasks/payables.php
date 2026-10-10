<?php
use Illuminate\Support\Facades\DB;
$ids = DB::table('purchases')->where('tenant_id',$tenant->id)->where('purchase_date','>=',now()->subDays(40)->toDateString())->orderBy('purchase_date','desc')->limit(9)->pluck('id');
DB::table('purchases')->whereIn('id',$ids)->update(['payment_status'=>'unpaid']);
echo "unpaid recent: ".count($ids)."\n";
echo "total purchases ".DB::table('purchases')->where('tenant_id',$tenant->id)->count()." unpaid ".DB::table('purchases')->where('tenant_id',$tenant->id)->where('payment_status','!=','paid')->count()."\n";
echo "unpaid sum ".DB::table('purchases')->where('tenant_id',$tenant->id)->where('payment_status','!=','paid')->sum('total')."\n";
