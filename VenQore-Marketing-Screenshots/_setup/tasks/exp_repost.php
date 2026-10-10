<?php
header('Content-Type: text/plain');
$tenant = App\Models\Tenant::orderBy('id')->first();
$user = auth()->user();
$rows = DB::table('expenses')->where('date','>=','2026-01-01')->orderBy('date')->get();
echo "rows ".count($rows)."\n";
$svc = app(App\Services\ExpensePostingService::class);
$ok=0;$fail=0;
foreach ($rows as $r) {
  DB::table('expenses')->where('id',$r->id)->delete();
  try {
    $svc->post($tenant, ['amount'=>(float)$r->amount,'category'=>$r->category,'expense_category_id'=>$r->expense_category_id,'payment_method'=>'cash','expense_date'=>$r->date,'date'=>$r->date,'description'=>$r->description], $user);
    $ok++;
  } catch (\Throwable $e) { $fail++; if ($fail<4) echo $e->getMessage()."\n"; DB::table('expenses')->insert((array)$r); }
}
echo "ok $ok fail $fail\nexpenses now ".DB::table('expenses')->count()."\n";
