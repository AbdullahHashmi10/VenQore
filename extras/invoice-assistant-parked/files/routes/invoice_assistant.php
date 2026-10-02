<?php

use App\Http\Controllers\InvoiceAssistantController;
use App\Http\Controllers\InvoiceVoiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Conversational invoice assistant — store routes
|--------------------------------------------------------------------------
|
| Included from routes/web.php INSIDE the main store group
| (prefix `s/{store_slug}`, name prefix `store.`, middleware auth / verified /
| tenant / lifecycle / drm / demo / hosted-until). Every route needs
| `sales.create`; the controllers re-check the feature switches, the store's AI
| enable switch and AI role restrictions on EVERY call, so a revoked role or a
| disabled flag also stops handoff and claim.
|
| Names: store.invoice-assistant.*   URLs: /s/{store_slug}/invoice-assistant/*
| Nothing here creates, posts or approves an invoice.
*/
Route::prefix('invoice-assistant')
    ->name('invoice-assistant.')
    ->middleware('permission:sales.create')
    ->group(function () {
        Route::get('/config', [InvoiceAssistantController::class, 'config'])->name('config');

        Route::post('/drafts', [InvoiceAssistantController::class, 'store'])
            ->middleware('throttle:30,1')->name('drafts.store');
        Route::get('/drafts/{draft}', [InvoiceAssistantController::class, 'show'])->name('drafts.show');
        Route::post('/drafts/{draft}/messages', [InvoiceAssistantController::class, 'message'])
            ->middleware('throttle:60,1')->name('drafts.message');
        Route::post('/drafts/{draft}/handoff', [InvoiceAssistantController::class, 'handoff'])
            ->middleware('throttle:20,1')->name('drafts.handoff');
        Route::post('/drafts/{draft}/claim', [InvoiceAssistantController::class, 'claim'])
            ->middleware('throttle:30,1')->name('drafts.claim');
        Route::post('/drafts/{draft}/applied', [InvoiceAssistantController::class, 'applied'])
            ->middleware('throttle:30,1')->name('drafts.applied');
        Route::delete('/drafts/{draft}', [InvoiceAssistantController::class, 'destroy'])->name('drafts.destroy');

        Route::post('/transcriptions', [InvoiceVoiceController::class, 'store'])
            ->middleware('throttle:12,1')->name('transcriptions.store');
    });
