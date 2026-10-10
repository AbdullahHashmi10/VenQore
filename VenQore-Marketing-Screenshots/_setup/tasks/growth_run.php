<?php
header('Content-Type: text/plain'); set_time_limit(300);
try { App\Jobs\RunGrowthEngineForTenant::dispatchSync(1,'deep',true); echo "ran\n"; } catch (\Throwable $e) { echo get_class($e).': '.$e->getMessage()."\n"; }
echo "recs: ".DB::table('ai_recommendations')->where('tenant_id',1)->count()."\n";
