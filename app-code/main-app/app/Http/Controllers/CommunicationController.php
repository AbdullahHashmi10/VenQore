<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Party;
use App\Models\Payment;
use App\Mail\SaleReceiptMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Helpers\SettingsHelper;
use App\Http\Controllers\PublicReceiptController;

class CommunicationController extends Controller
{
    /**
     * Send email receipt (if SMTP is configured).
     */
    public function sendEmail(Request $request, $id)
    {
        $sale = Sale::with(['customer', 'items.product'])->findOrFail($id);
        $email = $request->email ?? $sale->customer?->email;

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

    /**
     * Server-side preparation of WhatsApp draft for any supported transaction.
     * Enforces tenant boundaries, permission checks, phone normalization,
     * document separation (returns vs sales), and generates wa.me draft URL.
     * Zero outbound HTTP calls are made to Meta or third-party APIs.
     */
    public function prepareWhatsAppDraft(Request $request)
    {
        $tenant = app('current.tenant');
        $tenantId = $tenant?->id;
        $tenantSlug = $tenant?->slug ?? '';

        $documentType = $request->input('document_type', 'sale');
        $documentId = $request->input('document_id');
        $overridePhone = $request->input('phone');

        if (empty($documentId)) {
            return response()->json(['success' => false, 'message' => 'Missing document identifier.'], 422);
        }

        $partyName = 'Customer';
        $partyPhone = '';
        $docNumber = '';
        $docLabel = 'Document';
        $docAmount = 0.0;
        $docLink = '';
        $pdfUrl = '';
        $template = '';

        $storeName = SettingsHelper::get('business_name', $tenant?->name ?? config('app.name'));
        $currency = SettingsHelper::get('currency_code', SettingsHelper::get('currency', 'PKR'));
        $offerPdf = (bool)SettingsHelper::get('whatsapp_offer_pdf', true);

        if ($documentType === 'sale' || $documentType === 'sale_return') {
            $saleQuery = Sale::where('id', $documentId);
            if ($tenantId) {
                $saleQuery->where('tenant_id', $tenantId);
            }
            $sale = $saleQuery->with(['customer', 'items.product'])->first();

            if (!$sale) {
                return response()->json(['success' => false, 'message' => 'Transaction not found or access denied.'], 404);
            }

            // Do not permit sharing of draft or voided records
            if (in_array(strtolower((string)$sale->status), ['draft', 'void', 'cancelled'], true)) {
                return response()->json(['success' => false, 'message' => 'Cannot share draft or voided transaction.'], 422);
            }

            // Enforce return vs sale distinction:
            // If the transaction status is 'returned' or type was requested as 'sale_return', treat strictly as return/credit note
            $isReturn = ($documentType === 'sale_return' || $sale->status === 'returned');

            $party = $sale->customer;
            $partyName = $party?->name ?? 'Walk-in Customer';
            $partyPhone = $overridePhone ?: ($party?->phone ?? '');
            $docLink = PublicReceiptController::generateReceiptUrl($sale);
            $pdfUrl = route('store.sales.show', ['store_slug' => $tenantSlug, 'sale' => $sale->id]);

            if ($isReturn) {
                $documentType = 'sale_return';
                $docLabel = 'Credit Note / Sale Return';
                $docNumber = $sale->reference_number ?: "RET-{$sale->id}";
                $docAmount = abs((float)$sale->total);

                $template = SettingsHelper::get('message_template_returns')
                    ?? 'Greetings from [Firm_Name]. Credit Note / Sale Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]';

                $messageText = str_replace(
                    ['[Firm_Name]', '[Return_Number]', '[Return_Amount]', '[Link]', '[Customer_Name]'],
                    [
                        $storeName,
                        $docNumber,
                        $currency . ' ' . number_format($docAmount, 2),
                        $docLink,
                        $partyName,
                    ],
                    $template
                );
            } else {
                $docLabel = 'Sales Invoice';
                $docNumber = $sale->reference_number ?: "INV-{$sale->id}";
                $docAmount = (float)($sale->invoice_total ?? $sale->total ?? 0.0);

                $template = SettingsHelper::get('message_template_sales')
                    ?? 'Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]';

                $messageText = str_replace(
                    ['[Firm_Name]', '[Invoice_Number]', '[Invoice_Amount]', '[Link]', '[Customer_Name]'],
                    [
                        $storeName,
                        $docNumber,
                        $currency . ' ' . number_format($docAmount, 2),
                        $docLink,
                        $partyName,
                    ],
                    $template
                );
            }
        } elseif ($documentType === 'payment_receipt') {
            $paymentQuery = Payment::where('id', $documentId);
            if ($tenantId) {
                $paymentQuery->where('tenant_id', $tenantId);
            }
            $payment = $paymentQuery->with(['party'])->first();

            if (!$payment) {
                return response()->json(['success' => false, 'message' => 'Payment receipt not found or access denied.'], 404);
            }

            $party = $payment->party;
            $partyName = $party?->name ?? 'Customer';
            $partyPhone = $overridePhone ?: ($party?->phone ?? '');
            $docNumber = $payment->reference_number ?: "REC-{$payment->id}";
            $docLabel = 'Payment Receipt';
            $docAmount = (float)$payment->amount;

            $template = SettingsHelper::get('message_template_payments')
                ?? 'Greetings from [Firm_Name]. Payment Receipt [Receipt_Number] for [Payment_Amount] has been received with thanks.';

            $messageText = str_replace(
                ['[Firm_Name]', '[Receipt_Number]', '[Payment_Amount]', '[Customer_Name]'],
                [
                    $storeName,
                    $docNumber,
                    $currency . ' ' . number_format($docAmount, 2),
                    $partyName,
                ],
                $template
            );
        } elseif ($documentType === 'party_statement') {
            $partyQuery = Party::where('id', $documentId);
            if ($tenantId) {
                $partyQuery->where('tenant_id', $tenantId);
            }
            $party = $partyQuery->first();

            if (!$party) {
                return response()->json(['success' => false, 'message' => 'Party record not found or access denied.'], 404);
            }

            $partyName = $party->name;
            $partyPhone = $overridePhone ?: ($party->phone ?? '');
            $docNumber = "STMT-" . date('Ymd');
            $docLabel = 'Party Statement';
            $docAmount = (float)($party->current_balance ?? 0.0);

            $template = SettingsHelper::get('message_template_statement')
                ?? 'Greetings from [Firm_Name]. Statement for [Party_Name]: Current balance is [Balance_Amount].';

            $messageText = str_replace(
                ['[Firm_Name]', '[Party_Name]', '[Balance_Amount]'],
                [
                    $storeName,
                    $partyName,
                    $currency . ' ' . number_format($docAmount, 2),
                ],
                $template
            );
        } else {
            return response()->json(['success' => false, 'message' => 'Unsupported document type.'], 422);
        }

        // Phone normalization
        $phoneAnalysis = self::normalizePhone($partyPhone, $tenant?->country_code ?? '92');
        $cleanPhone = $phoneAnalysis['clean'];
        $isPhoneValid = $phoneAnalysis['valid'];

        $waUrl = '';
        if ($isPhoneValid) {
            $waUrl = "https://wa.me/{$cleanPhone}?text=" . rawurlencode($messageText);
        }

        return response()->json([
            'success' => true,
            'action' => 'open_whatsapp_draft',
            'document_type' => $documentType,
            'document_type_label' => $docLabel,
            'document_number' => $docNumber,
            'party_name' => $partyName,
            'phone' => $partyPhone,
            'normalized_phone' => $cleanPhone,
            'phone_valid' => $isPhoneValid,
            'amount' => $docAmount,
            'currency' => $currency,
            'message_text' => $messageText,
            'wa_url' => $waUrl,
            'pdf_url' => $pdfUrl,
            'offer_pdf' => $offerPdf,
        ]);
    }

    /**
     * Record that the operator opened the WhatsApp draft link.
     * Strictly records 'opened', never 'sent' or 'delivered'.
     */
    public function recordDraftOpened(Request $request)
    {
        $documentType = $request->input('document_type');
        $documentId = $request->input('document_id');
        $phone = $request->input('phone');

        Log::info("[WhatsAppShare] Operator opened draft for {$documentType} #{$documentId} (Recipient: {$phone}). Status: opened.");

        return response()->json([
            'success' => true,
            'status' => 'opened',
            'message' => 'Draft opened in WhatsApp. Operator must send the message in their WhatsApp client.',
        ]);
    }

    /**
     * Legacy route compatibility for /sales/{id}/send-whatsapp.
     * Guaranteed ZERO outbound Meta API or SMS calls.
     */
    public function sendWhatsApp(Request $request, $id)
    {
        $req = new Request([
            'document_type' => 'sale',
            'document_id' => $id,
            'phone' => $request->phone,
        ]);

        $result = $this->prepareWhatsAppDraft($req);
        $data = $result->getData(true);

        if (!$data['success']) {
            return $result;
        }

        return response()->json([
            'success' => true,
            'action' => 'open_whatsapp',
            'url' => $data['wa_url'],
            'message' => 'Opening WhatsApp with receipt draft...',
            'data' => $data,
        ]);
    }

    /**
     * Helper to normalize international phone numbers (E.164 without leading +).
     */
    public static function normalizePhone(?string $phone, string $defaultCountryCode = '92'): array
    {
        if (empty($phone)) {
            return ['clean' => '', 'valid' => false];
        }

        // Keep only digits
        $digits = preg_replace('/\D+/', '', $phone);

        // Strip double leading zeros (e.g. 0092...)
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // If local format starting with 0, replace with country dialing code
        if (str_starts_with($digits, '0')) {
            $digits = $defaultCountryCode . substr($digits, 1);
        }

        // Valid E.164 phone numbers have 10 to 15 digits
        $isValid = strlen($digits) >= 10 && strlen($digits) <= 15;

        return [
            'clean' => $digits,
            'valid' => $isValid,
        ];
    }
}
