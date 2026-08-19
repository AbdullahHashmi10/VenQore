<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\InvoiceReminder;
use App\Models\Sale;
use Illuminate\Support\Facades\Log;

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
            'sent' => InvoiceReminder::where('status', 'sent')->count(),
            'overdue' => InvoiceReminder::where('status', 'pending')
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
        
        $phone = $reminder->customer->phone;
        $amount = (float)($reminder->invoice->invoice_total ?? $reminder->invoice->total ?? 0.0);
        $messageBody = "Dear {$reminder->customer->name}, this is a reminder that invoice #{$reminder->invoice->reference_number} is outstanding. Amount: " . $amount;

        if (!$phone) {
            return redirect()->back()->with('error', 'Customer does not have a phone number registered.');
        }

        if ($reminder->type === 'whatsapp') {
            try {
                if (class_exists(\Twilio\Rest\Client::class) && config('services.twilio.sid')) {
                    $twilio = new \Twilio\Rest\Client(config('services.twilio.sid'), config('services.twilio.token'));
                    $twilio->messages->create(
                        "whatsapp:" . $phone,
                        [
                            "from" => "whatsapp:" . config('services.twilio.whatsapp_from'),
                            "body" => $messageBody
                        ]
                    );
                } else {
                    Log::info("Twilio Client not available or credentials missing. Simulated WhatsApp sent to {$phone}: {$messageBody}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to send Twilio WhatsApp reminder: " . $e->getMessage());
            }
        } else {
            try {
                if (class_exists(\Twilio\Rest\Client::class) && config('services.twilio.sid')) {
                    $twilio = new \Twilio\Rest\Client(config('services.twilio.sid'), config('services.twilio.token'));
                    $twilio->messages->create(
                        $phone,
                        [
                            "from" => config('services.twilio.sms_from', 'VenQore'),
                            "body" => $messageBody
                        ]
                    );
                } else {
                    Log::info("Twilio Client not available or credentials missing. Simulated SMS sent to {$phone}: {$messageBody}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to send Twilio SMS reminder: " . $e->getMessage());
            }
        }

        $reminder->update([
            'status' => 'sent'
        ]);

        return redirect()->back()->with('success', 'Reminder sent successfully.');
    }
}
