<?php
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
$s = DB::table('storefronts')->first();
echo "before: {$s->slug} status={$s->status} name={$s->display_name}\n";
DB::table('storefronts')->where('id',$s->id)->update([
 'status'=>'published','published_at'=>$s->published_at ?: now(),'intake_paused'=>0,'onsite_paused'=>0,
 'supports_pickup'=>1,'supports_delivery'=>1,'show_images'=>1,'onsite_ordering_enabled'=>1,'counter_qr_enabled'=>1,
 'description'=>$s->description ?: 'Laptops, phones, audio and accessories from a trusted local electronics shop.',
 'updated_at'=>now()]);
$n=0;
foreach (DB::table('products')->where('tenant_id',$s->tenant_id)->limit(60)->get() as $i=>$p) {
  if (DB::table('storefront_products')->where('storefront_id',$s->id)->where('product_id',$p->id)->exists()) continue;
  DB::table('storefront_products')->insert(['id'=>(string)Str::uuid(),'storefront_id'=>$s->id,'tenant_id'=>$s->tenant_id,'product_id'=>$p->id,
   'is_published'=>1,'show_online'=>1,'show_onsite'=>1,'is_featured'=>$i<8?1:0,'sort_order'=>$i,'created_at'=>now(),'updated_at'=>now()]);
  $n++;
}
echo "published $n products\n";
