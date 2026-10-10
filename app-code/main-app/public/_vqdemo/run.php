<?php
// TEMPORARY local helper for the screenshot project. Only runs against DB venqore_demo from 127.0.0.1. Delete this folder when finished.
header('Content-Type: text/plain; charset=utf-8');
if (($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1') { http_response_code(403); exit('no'); }
$app = dirname(__DIR__, 2);
require $app.'/vendor/autoload.php';
$l = require $app.'/bootstrap/app.php';
$k = $l->make(Illuminate\Contracts\Console\Kernel::class); $k->bootstrap();
if (config('database.connections.'.config('database.default').'.database') !== 'venqore_demo') { exit('REFUSING: not venqore_demo'); }
$task = preg_replace('/[^a-z0-9_]/i','', $_GET['task'] ?? '');
$file = dirname($app,2).'/VenQore-Marketing-Screenshots/_setup/tasks/'.$task.'.php';
if (!is_file($file)) exit("no such task $task");
set_time_limit(600); ini_set('display_errors','1'); error_reporting(E_ALL);
$tenant = App\Models\Tenant::orderBy('id')->first();
app()->instance('current.tenant', $tenant);
$user = App\Models\User::where('email','owner@venqore-demo.internal')->first();
auth()->login($user);
try { require $file; } catch (Throwable $e) { echo "\nEXCEPTION: ".get_class($e).': '.$e->getMessage()."\n".$e->getFile().':'.$e->getLine()."\n"; }
