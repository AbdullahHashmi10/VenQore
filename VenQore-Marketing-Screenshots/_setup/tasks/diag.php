<?php
use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Schema;
echo "tenant {$tenant->id} {$tenant->slug} plan={$tenant->plan} type={$tenant->business_type}\n\n";
foreach (DB::select('SHOW TABLES') as $r) { $t = array_values((array)$r)[0];
  if (!Schema::hasColumn($t,'tenant_id')) continue;
  $c = DB::table($t)->where('tenant_id',$tenant->id)->count(); if ($c) echo str_pad($t,40).$c."\n"; }
echo "\n-- empty tenant tables --\n";
$e=[]; foreach (DB::select('SHOW TABLES') as $r) { $t = array_values((array)$r)[0]; if (Schema::hasColumn($t,'tenant_id') && !DB::table($t)->where('tenant_id',$tenant->id)->exists()) $e[]=$t; }
echo implode(', ',$e)."\n";
