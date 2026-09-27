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
        
        $customer = $reminder->customer;
        $phone = $customer?->phone;
        $amount = (float)($reminder->invoice->invoice_total ?? $reminder->invoice->total ?? 0.0);
        $messageBody = "Dear {$customer?->name}, this is a reminder that invoice #{$reminder->invoice->reference_number} is outstanding. Amount due: {$amount}";

        if ($reminder->type === 'whatsapp') {
            if (!$phone) {
                return redirect()->back()->with('error', 'Customer does not have a phone number registered.');
            }

            $metaToken = \App\Helpers\SettingsHelper::get('whatsapp_access_token');
            $metaPhoneId = \App\Helpers\SettingsHelper::get('whatsapp_phone_number_id');
            $metaApiUrl = \App\Helpers\SettingsHelper::get('whatsapp_api_url', 'https://graph.facebook.com/v17.0');

            if (!empty($metaToken) && !empty($metaPhoneId)) {
                try {
                    $response = \Illuminate\Support\Facades\Http::withToken($metaToken)
                        ->timeout(10)
                        ->post("{$metaApiUrl}/{$metaPhoneId}/messages", [
                            'messaging_product' => 'whatsapp',
                            'to' => $phone,
                            'type' => 'text',
                            'text' => ['body' => $messageBody],
                        ]);

                    if ($response->successful()) {
                        $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                        return redirect()->back()->with('success', 'WhatsApp reminder delivered via Meta Cloud API.');
                    }

                    $reminder->update(['status' => 'failed']);
                    return redirect()->back()->with('error', 'Meta WhatsApp API returned error: ' . $response->body());
                } catch (\Exception $e) {
                    $reminder->update(['status' => 'failed']);
                    return redirect()->back()->with('error', 'WhatsApp dispatch error: ' . $e->getMessage());
                }
            } elseif (class_exists(\Twilio\Rest\Client::class) && config('services.twilio.sid')) {
                try {
                    $twilio = new \Twilio\Rest\Client(config('services.twilio.sid'), config('services.twilio.token'));
                    $twilio->messages->create(
                        "whatsapp:" . $phone,
                        [
                            "from" => "whatsapp:" . config('services.twilio.whatsapp_from'),
                            "body" => $messageBody
                        ]
                    );
                    $reminder->update(['status' => 'sent', 'sent_at' => now()]);
                    return redirect()->back()->with('success', 'WhatsApp reminder delivered via Twilio.');
                } catch (\Exception $e) {
                    $reminder->update(['status' => 'failed']);
                    return redirect()->back()->with('error', 'Twilio WhatsApp failed: ' . $e->getMessage());
                }
            } else {
                return redirect()->back()->with('error', 'No WhatsApp API gateway configured. Please configure Meta API credentials in Settings -> Messages.');
            }
        } elseif ($reminder->type === 'email') {
            $email = $customer?->email;
            if (!$email) {
                return redirect()->back()->with('error', 'Customer does not have an email address registered.');
            }

            try {
                \Illuminate\Support\Facades\Mail::raw($messageBody, function ($m) use ($email, $reminder) {
                    $m->to($email)
                      ->subject("Payment Reminder: Invoice #{$reminder->invoice->reference_number}");
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
}
