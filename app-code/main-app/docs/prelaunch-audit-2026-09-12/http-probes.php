<?php
foreach(['APP_ENV'=>'testing','DB_CONNECTION'=>'mariadb','DB_DATABASE'=>'amd_pos_test','CACHE_STORE'=>'array','MAIL_MAILER'=>'array','SESSION_DRIVER'=>'array'] as $k=>$v){putenv("$k=$v");$_ENV[$k]=$v;$_SERVER[$k]=$v;}
require __DIR__.'/../../vendor/autoload.php';
class AuditHttpHarness extends Tests\TestCase {
 public function bootAudit(){parent::setUp();}
 public function stopAudit(){parent::tearDown();}
 public function auditPlaceholder():void{}
}
$h=new AuditHttpHarness('auditPlaceholder');$h->bootAudit();
use Illuminate\Support\Facades\{DB,Auth,Cache,Http,Mail,Queue};
use App\Services\{ModuleService,StoreProvisioner};
use App\Services\AiBuilder\ApplyConfigurationService;
if(DB::connection()->getDatabaseName()!=='amd_pos_test')throw new RuntimeException('Wrong database');
DB::beginTransaction();Http::preventStrayRequests();Mail::fake();Queue::fake();
$out=[];
$capture=function($key,callable $fn)use(&$out){try{$out[$key]=$fn();}catch(Throwable $e){$out[$key]=['exception'=>get_class($e),'message'=>$e->getMessage()];}};
$bind=function($user,$tenant)use($h){
 app()->instance('current.tenant',$tenant);app()->instance('current.membership',App\Models\TenantUser::where('tenant_id',$tenant->id)->where('user_id',$user->id)->first());
 $user->update(['last_store_id'=>$tenant->id]);$h->actingAs($user);
};
$user=App\Models\User::factory()->create(['name'=>'Prelaunch audit owner','email'=>'audit-'.Illuminate\Support\Str::uuid().'@example.test','email_verified_at'=>now()]);
Auth::login($user);
$engine=json_decode(file_get_contents(__DIR__.'/engine-probes.json'),true);
$tenants=[];
foreach(['solo','retail','wholesale'] as $key){
 $capture("$key.provision",function()use($key,$user,$engine,$bind,&$tenants){
    $modules=$engine["$key.conversation"]['first_proposal']['modules'];
    $tenant=app(StoreProvisioner::class)->create($user,['name'=>'Audit '.ucfirst($key).' '.Illuminate\Support\Str::random(8),'business_type'=>$engine["$key.analyze"]['response']['business_type'],'modules'=>$modules,'setup_completed'=>true]);
    $tenants[$key]=$tenant;$bind($user,$tenant);
    return ['requested'=>$modules,'enabled'=>ModuleService::allEnabled($tenant),'row_count'=>DB::table('tenant_modules')->where('tenant_id',$tenant->id)->count(),'nav'=>App\Support\ModuleNavBuilder::build($tenant,$user),'cards'=>DB::table('dashboard_cards')->where('tenant_id',$tenant->id)->pluck('reading_key')->all(),'terms'=>DB::table('tenant_terminology')->where('tenant_id',$tenant->id)->get(['term_key','singular','plural'])->all(),'seed_counts'=>collect(['products','parties','warehouses','bank_accounts','expense_categories','settings'])->mapWithKeys(fn($table)=>[$table=>DB::table($table)->where('tenant_id',$tenant->id)->count()])->all()];
 });
}
if(isset($tenants['solo'])){
 $t=$tenants['solo'];$bind($user,$t);
 $capture('disabled_product_fixture',function()use($t){$p=App\Models\Product::factory()->create(['tenant_id'=>$t->id,'name'=>'Audit disabled product','sku'=>'AUDIT-OFF']);return ['id'=>$p->id,'products_enabled'=>ModuleService::enabled($t,'products')];});
 foreach(['/api/sync/products','/api/sync/inventory','/api/sync/suppliers','/api/pos/search','/api/work-orders','/s/'.$t->slug.'/tables/state','/s/'.$t->slug.'/api/manufacturing-rules','/s/'.$t->slug.'/new-pos','/s/'.$t->slug.'/new-invoice','/s/'.$t->slug.'/inventory','/s/'.$t->slug.'/api/reckoner/catalogue','/s/'.$t->slug.'/reports/discount'] as $uri){
   $capture('http:'.$uri,function()use($uri,$h,$bind,$user,$t){$bind($user,$t);$r=$h->getJson($uri);$data=json_decode($r->getContent(),true);return ['status'=>$r->status(),'location'=>$r->headers->get('Location'),'body'=>is_array($data)?$data:mb_substr($r->getContent(),0,180)];});
 }
 $capture('reckoner_off_readings',function()use($t,$user){$readings=['batch_tracking.count','proposals.count','recurring_invoices.count','purchase_orders.count','sales_orders.count','returns.count','inventory.stock_value'];$r=app(App\Reckoner\Reckoner::class);return ['availability'=>$r->checkAvailability($readings,$user,$t),'results'=>array_map(fn($x)=>$x->toArray(),$r->readMany(array_map(fn($k)=>new App\Reckoner\ReckonerRequest(key:$k,period:'today'),$readings),$user,$t))];});
 $capture('reapply',function()use($t){$set=ModuleService::allEnabled($t);$a=app(ApplyConfigurationService::class)->apply($t,['modules'=>$set]);$b=app(ApplyConfigurationService::class)->apply($t,['modules'=>$set]);return ['first'=>$a,'second'=>$b,'rows'=>DB::table('tenant_modules')->where('tenant_id',$t->id)->count()];});
 $capture('invalid_requires_one',fn()=>app(ApplyConfigurationService::class)->apply($t,['modules'=>['invoicing']]));
 $capture('zero_module_provision',function()use($user){$t=app(StoreProvisioner::class)->create($user,['name'=>'Audit empty '.Illuminate\Support\Str::random(8),'modules'=>[],'setup_completed'=>true]);return ['requested'=>[],'actual'=>ModuleService::allEnabled($t)];});
 $capture('duplicate_provision',function()use($user){$args=['name'=>'Audit duplicate '.Illuminate\Support\Str::random(8),'modules'=>['expenses','reports'],'setup_completed'=>true];$a=app(StoreProvisioner::class)->create($user,$args);$b=app(StoreProvisioner::class)->create($user,$args);return ['first'=>$a->slug,'second'=>$b->slug,'distinct'=>$a->id!==$b->id];});
}
file_put_contents(__DIR__.'/http-probes.json',json_encode($out,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_PARTIAL_OUTPUT_ON_ERROR));
DB::rollBack();
foreach($out as $key=>$result)echo $key.': '.($result['exception']??($result['status']??'captured')).(isset($result['message'])?' '.$result['message']:'').PHP_EOL;
// Process exits after rollback; PHPUnit lifecycle teardown is not used outside its runner.
