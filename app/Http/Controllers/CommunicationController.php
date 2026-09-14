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

        // In a real scenario, we would use Twilio or a similar API
        // For now, we simulate the process

        /*
        $twilio = new \Twilio\Rest\Client(config('services.twilio.sid'), config('services.twilio.token'));
        $twilio->messages->create(
            "whatsapp:" . $phone,
            [
                "from" => "whatsapp:" . config('services.twilio.whatsapp_from'),
                "body" => "Your receipt for Order #{$sale->reference_number} is ready. View it here: " . route('sales.receipt.public', $sale->id)
            ]
        );
        */

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp message queued successfully.',
            'mock_url' => "https://wa.me/{$phone}?text=" . urlencode("Your receipt for Order #{$sale->reference_number} is ready.")
        ]);
    }
}
