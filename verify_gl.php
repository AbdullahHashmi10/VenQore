<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$id = DB::table('accounts')->where('code', '1000')->value('id');
echo "ACCOUNT_ID_1000: $id\n";
echo "JOURNAL_ITEMS_COUNT: " . DB::table('journal_items')->where('account_id', $id)->count() . "\n";
echo "SUM_DEBIT: " . DB::table('journal_items')->where('account_id', $id)->sum('debit') . "\n";
echo "SUM_CREDIT: " . DB::table('journal_items')->where('account_id', $id)->sum('credit') . "\n";
