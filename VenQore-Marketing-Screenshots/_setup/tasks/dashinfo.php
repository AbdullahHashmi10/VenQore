<?php
header('Content-Type: text/plain');
foreach (['dashboards','dashboard_frames'] as $t) { echo "== $t\n"; foreach (DB::table($t)->limit(8)->get() as $r) { echo json_encode($r, JSON_UNESCAPED_SLASHES)."\n"; } }
echo "== cards\n";
foreach (DB::table('dashboard_cards')->get() as $r) { echo json_encode($r, JSON_UNESCAPED_SLASHES)."\n"; }
