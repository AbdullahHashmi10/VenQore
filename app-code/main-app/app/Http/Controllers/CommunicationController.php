<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Mail\SaleReceiptMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CommunicationController extends Controller
{
    public function sendEmail(Request $request, $id)
    {
        $sale = Sale::with(['customer', 'items.product'])->findOrFail($id);
        $email = $request->email ?? $sale->customer->email;

        if (!$email) {
            return response()->json(['success' => false, 'message' => 'No email address provided.'], 422);
        }

        try {
            Mail::to($email)->send(new SaleReceiptMail($sale));
            return response()->json(['success' => true, 'message' => 'Email sent successfully.']);
        } catch (\Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to send email.'], 500);
        }
    }

    public function sendWhatsApp(Request $request, $id)
    {
        $sale = Sale::with(['customer', 'items.product'])->findOrFail($id);
        $phone = $request->phone ?? $sale->customer->phone;

        if (!$phone) {
            return response()->json(['success' => false, 'message' => 'No phone number provided.'], 422);
        }

        $metaToken = \App\Helpers\SettingsHelper::get('whatsapp_access_token');
        $metaPhoneId = \App\Helpers\SettingsHelper::get('whatsapp_phone_number_id');
        $metaApiUrl = \App\Helpers\SettingsHelper::get('whatsapp_api_url', 'https://graph.facebook.com/v17.0');

        $templateRaw = \App\Helpers\SettingsHelper::get('message_template_sales')
            ?? 'Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready.';

        $storeName = \App\Helpers\SettingsHelper::get('business_name', config('app.name'));
        $currency = \App\Helpers\SettingsHelper::get('currency', 'PKR');
        $tenantSlug = app('current.tenant')?->slug ?? '';
        $receiptLink = route('store.sales.show', ['store_slug' => $tenantSlug, 'sale' => $sale->id]);

        $messageText = str_replace(
            ['[Firm_Name]', '[Invoice_Number]', '[Invoice_Amount]', '[Link]'],
            [
                $storeName,
                $sale->reference_number,
                $currency . ' ' . number_format((float)$sale->total, 2),
                $receiptLink,
            ],
            $templateRaw
        );

        // If automated Meta Cloud API is configured:
        if (!empty($metaToken) && !empty($metaPhoneId)) {
            try {
                $response = \Illuminate\Support\Facades\Http::withToken($metaToken)
                    ->timeout(10)
                    ->post("{$metaApiUrl}/{$metaPhoneId}/messages", [
                        'messaging_product' => 'whatsapp',
                        'to' => $phone,
                        'type' => 'text',
                        'text' => ['body' => $messageText],
                    ]);

                if ($response->successful()) {
                    return response()->json([
                        'success' => true,
                        'message' => 'WhatsApp receipt sent successfully via Meta Cloud API.',
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Meta WhatsApp API returned error: ' . $response->body(),
                ], 400);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp gateway error: ' . $e->getMessage(),
                ], 500);
            }
        }

        // Manual share fallback: Open prepared wa.me draft
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        $shareUrl = "https://wa.me/{$cleanPhone}?text=" . urlencode($messageText);

        return response()->json([
            'success' => true,
            'action' => 'open_whatsapp',
            'url' => $shareUrl,
            'message' => 'Opening WhatsApp with receipt draft...',
        ]);
    }
}
