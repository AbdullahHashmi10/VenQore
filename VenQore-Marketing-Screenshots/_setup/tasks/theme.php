<?php
header('Content-Type: text/plain');
$m = ($_GET['m'] ?? 'light') === 'dark' ? 'dark' : 'light';
$u = auth()->user();
App\Models\UserPreference::put($u->id, 1, App\Models\UserPreference::KEY_APPEARANCE, ['theme'=>'venqore-v6','mode'=>$m]);
App\Models\UserPreference::put($u->id, null, App\Models\UserPreference::KEY_APPEARANCE, ['theme'=>'venqore-v6','mode'=>$m]);
echo "theme $m for user {$u->id}\n";
