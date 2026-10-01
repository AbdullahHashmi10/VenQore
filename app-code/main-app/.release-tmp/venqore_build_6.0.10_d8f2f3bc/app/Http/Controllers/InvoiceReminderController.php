<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InvoiceReminder;
use App\Models\Sale;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Helpers\SettingsHelper;
use App\Http\Controllers\PublicReceiptController;
use App\Http\Controllers\CommunicationController;

class InvoiceReminderController extends Controller
{
    public function index(Request $request)
    {
        $query = InvoiceReminder::with(['invoice', 'customer']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->whereHas('invoice', function($sq) use ($search) {
                    $sq->where('reference_number', 'like', "%{$search}%");
                })->orWhereHas('customer', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $reminders = $query->orderBy('scheduled_at', 'asc')->paginate(50)->withQueryString();

        // Calculate stats
        $stats = [
            'total' => InvoiceReminder::count(),
            'pending' => InvoiceReminder::where('status', 'pending')->count(),
            'ready_for_draft' => InvoiceReminder::where('status', 'ready_for_draft')->count(),
            'opened' => InvoiceReminder::where('status', 'opened')->count(),
            'marked_sent_manually' => InvoiceReminder::where('status', 'marked_sent_manually')->count(),
            'settled' => InvoiceReminder::where('status', 'settled')->count(),
            'dismissed' => InvoiceReminder::where('status', 'dismissed')->count(),
            'overdue' => InvoiceReminder::whereIn('status', ['pending', 'ready_for_draft'])
                ->where('scheduled_at', '<', now())
                ->count(),
        ];

        return Inertia::render('Reminders/InvoiceReminders', [
            'reminders' => $reminders,
            'filters' => $request->only(['search', 'status']),
            'stats' => $stats
        ]);
    }
    
    public function create() 
    {
        $invoices = Sale::with(['party'])
            ->where('status', 'posted')
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Reminders/Create', [
            'invoices' => $invoices
        ]);
    }
    
    public function store(Request $request) 
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:sales,id',
            'scheduled_at' => 'required|date|after:now',
            'type' => 'required|in:email,whatsapp',
        ]);

        $invoice = Sale::findOrFail($validated['invoice_id']);

        InvoiceReminder::create([
            'invoice_id' => $validated['invoice_id'],
            'customer_id' => $invoice->party_id,
            'scheduled_at' => $validated['scheduled_at'],
            'type' => $validated['type'],
            'status' => 'pending',
        ]);

        return redirect()->route('store.invoice-reminders.index', ['store_slug' => $request->route('store_slug')])
            ->with('success', 'Reminder scheduled successfully.');
    }
    
    public function send(Request $request, $store_slug, $id) 
    {
        $reminder = InvoiceReminder::with(['invoice', 'customer'])->findOrFail($id);
        $customer = $reminder->customer;
        $invoice = $reminder->invoice;

        if (!$invoice) {
            $reminder->update(['status' => 'failed']);
            return redirect()->back()->with('error', 'Invoice record not found.');
        }

        // Recheck unpaid amount immediately before drafting
        $unpaid = (float)($invoice->invoice_total ?? $invoice->total ?? 0.0) - (float)($invoice->paid_amount ?? 0.0);
        if (in_array(strtolower((string)$invoice->status), ['void', 'cancelled'], true) || $unpaid <= 0.001) {
            $reminder->update(['status' => 'settled']);
            $msg = 'Invoice has already been settled or voided. Reminder marked settled.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'settled' => true, 'message' => $msg]);
            }
            return redirect()->back()->with('info', $msg);
        }

        // Check if customer opted out
        if ($customer?->marketing_opt_out || $customer?->opted_out) {
            $reminder->update(['status' => 'dismissed']);
            $msg = 'Customer has opted out of notifications. Reminder dismissed.';
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'opted_out' => true, 'message' => $msg]);
            }
            return redirect()->back()->with('warning', $msg);
        }

        $storeName = SettingsHelper::get('business_name', config('app.name'));
        $currency = SettingsHelper::get('currency_code', SettingsHelper::get('currency', 'PKR'));
        $formattedAmount = $currency . ' ' . number_format($unpaid, 2);
        $receiptLink = PublicReceiptController::generateReceiptUrl($invoice);

        $template = SettingsHelper::get('message_template_reminders')
            ?? 'Dear [Customer_Name], this is a friendly reminder that invoice #[Invoice_Number] from [Firm_Name] is outstanding. Current amount due: [Due_Amount]. View receipt: [Link]';

        $messageBody = str_replace(
            ['[Customer_Name]', '[Invoice_Number]', '[Due_Amount]', '[Firm_Name]', '[Link]'],
            [$customer?->name ?? 'Customer', $invoice->reference_number, $formattedAmount, $storeName, $receiptLink],
            $template
        );

        if ($reminder->type === 'whatsapp') {
            $rawPhone = $request->input('phone', $customer?->phone);
            if (!$rawPhone) {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Customer does not have a phone number registered.'], 422);
                }
                return redirect()->back()->with('error', 'Customer does not have a phone number registered.');
            }

            $phoneAnalysis = CommunicationController::normalizePhone($rawPhone);
            if (!$phoneAnalysis['valid']) {
                $err = 'Invalid phone number for WhatsApp. Please verify the international format.';
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => $err], 422);
                }
                return redirect()->back()->with('error', $err);
            }

            $cleanPhone = $phoneAnalysis['clean'];
            $waUrl = "https://wa.me/{$cleanPhone}?text=" . rawurlencode($messageBody);

            // Per requirement: final status is 'opened', NEVER 'sent' or 'delivered'
            $reminder->update(['status' => 'opened', 'sent_at' => now()]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'action' => 'open_whatsapp_draft',
                    'url' => $waUrl,
                    'status' => 'opened',
                    'message' => 'Opening WhatsApp draft...',
                    'preview' => [
                        'party' => $customer?->name,
                        'phone' => $cleanPhone,
                        'invoice' => $invoice->reference_number,
                        'amount' => $unpaid,
                        'currency' => $currency,
                        'message' => $messageBody,
                    ]
                ]);
            }

            return redirect()->away($waUrl);
        } elseif ($reminder->type === 'email') {
            $email = $customer?->email;
            if (!$email) {
                return redirect()->back()->with('error', 'Customer does not have an email address registered.');
            }

            try {
                Mail::raw($messageBody, function ($m) use ($email, $invoice) {
                    $m->to($email)
                      ->subject("Payment Reminder: Invoice #{$invoice->reference_number}");
                });
                $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                return redirect()->back()->with('success', 'Email reminder sent successfully.');
            } catch (\Exception $e) {
                $reminder->update(['status' => 'failed']);
                return redirect()->back()->with('error', 'Email sending failed: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('error', 'Unsupported reminder type.');
    }

    /**
     * Staff self-reports that they manually sent the message in WhatsApp.
     * Explicitly labeled marked_sent_manually (not delivered).
     */
    public function markSentManually(Request $request, $store_slug, $id)
    {
        $reminder = InvoiceReminder::findOrFail($id);
        $reminder->update(['status' => 'marked_sent_manually', 'sent_at' => now()]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'status' => 'marked_sent_manually', 'message' => 'Reminder marked as manually sent by staff.']);
        }

        return redirect()->back()->with('success', 'Reminder marked as manually sent.');
    }

    /**
     * Operator dismisses a reminder.
     */
    public function dismiss(Request $request, $store_slug, $id)
    {
        $reminder = InvoiceReminder::findOrFail($id);
        $reminder->update(['status' => 'dismissed']);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'status' => 'dismissed', 'message' => 'Reminder dismissed.']);
        }

        return redirect()->back()->with('success', 'Reminder dismissed.');
    }
}
