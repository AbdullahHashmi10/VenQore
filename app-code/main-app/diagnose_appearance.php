<?php

/**
 * Appearance 409 — diagnostic.
 *
 * The console reports "409 Conflict", but 409 is only ever Inertia's redirect
 * signal (ResponseFactory::location). The real exception was recorded once in
 * the error_logs table and then deduplicated by fingerprint, so every repeat
 * since has incremented a counter instead of writing a new log line. That is
 * why laravel.log looks clean while the browser keeps failing.
 *
 * Run from app-code/main-app:
 *     php diagnose_appearance.php
 *
 * Delete this file when the bug is fixed.
 */

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$line = str_repeat('=', 78);

echo "\n$line\nAPPEARANCE 409 DIAGNOSTIC\n$line\n";

/* 1 ─ The recorded exceptions ------------------------------------------- */

echo "\n[1] Recent errors mentioning 'appearance' or 'workspace'\n\n";

try {
    $rows = DB::table('error_logs')
        ->where(function ($q) {
            $q->where('url', 'like', '%appearance%')
              ->orWhere('url', 'like', '%workspace%');
        })
        ->orderByDesc('last_seen_at')
        ->limit(5)
        ->get();

    if ($rows->isEmpty()) {
        echo "    (nothing recorded — the exception is happening before the\n";
        echo "     reporter runs, or error_logs is not writable)\n";
    }

    foreach ($rows as $r) {
        echo "  ── seen {$r->occurrence_count}× · last {$r->last_seen_at}\n";
        echo "  URL     : {$r->method} {$r->url}\n";
        echo "  Status  : {$r->status_code}\n";
        echo "  MESSAGE : {$r->message}\n";
        echo "  ORIGIN  : {$r->file}:{$r->line}\n\n";
        echo "  Stack (first 12 frames):\n";
        foreach (array_slice(explode("\n", (string) $r->stack_trace), 0, 12) as $frame) {
            echo "      $frame\n";
        }
        echo "\n";
    }
} catch (\Throwable $e) {
    echo "    Could not read error_logs: {$e->getMessage()}\n";
}

/* 2 ─ Does the preference table actually exist? -------------------------- */

echo "$line\n[2] Storage tables\n\n";

foreach (['user_preferences', 'dashboard_layouts', 'error_logs'] as $table) {
    $exists = Illuminate\Support\Facades\Schema::hasTable($table);
    echo '    ' . str_pad($table, 20) . ($exists ? 'OK' : 'MISSING  ← migration has not run') . "\n";

    if ($exists && $table === 'user_preferences') {
        foreach (DB::table($table)->limit(10)->get() as $row) {
            echo "        user={$row->user_id} tenant=" . ($row->tenant_id ?? 'NULL')
               . " key={$row->key} value={$row->value}\n";
        }
    }
}

/* 3 ─ Do the saved values still validate? -------------------------------- */

echo "\n$line\n[3] Saved themes vs. what is now allowed\n\n";

echo '    Allowed themes : ' . implode(', ', App\Support\Appearance::THEMES) . "\n";
echo '    Default theme  : ' . App\Support\Appearance::defaults()['theme'] . "\n\n";

if (Illuminate\Support\Facades\Schema::hasTable('user_preferences')) {
    foreach (DB::table('user_preferences')->where('key', 'appearance')->get() as $row) {
        $saved = json_decode($row->value, true);
        $theme = $saved['theme'] ?? '(none)';
        $ok = in_array($theme, App\Support\Appearance::THEMES, true);
        echo "    user={$row->user_id}  theme={$theme}  "
           . ($ok ? 'valid' : 'RETIRED ← would fail an "in:" validation rule') . "\n";
    }
}

/* 4 ─ The routes the two failing buttons resolve to ---------------------- */

echo "\n$line\n[4] Routes used by the failing requests\n\n";

foreach (['store.appearance.update', 'store.appearance.experience', 'store.workspace', 'store.dashboard-v1', 'error.page'] as $name) {
    $route = Illuminate\Support\Facades\Route::getRoutes()->getByName($name);
    echo '    ' . str_pad($name, 30)
       . ($route ? implode('|', $route->methods()) . ' /' . $route->uri() : 'NOT REGISTERED ← this would throw')
       . "\n";
}

echo "\n$line\nDone. Paste this whole output back.\n$line\n\n";
