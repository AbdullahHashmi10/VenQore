<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HeartbeatController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/heartbeat', [HeartbeatController::class, 'store']);

use App\Http\Controllers\Api\SyncController;

Route::get('/check-connection', [SyncController::class, 'checkConnection']);

Route::get('/sync/users', [SyncController::class, 'users']);
Route::get('/sync/products', [SyncController::class, 'products']);
Route::get('/sync/customers', [SyncController::class, 'customers']);
Route::get('/sync/suppliers', [SyncController::class, 'suppliers']);
Route::get('/sync/inventory', [SyncController::class, 'inventory']);
Route::get('/sync/taxes', [SyncController::class, 'taxes']);
Route::post('/sync/orders/batch', [SyncController::class, 'batchOrders']);


