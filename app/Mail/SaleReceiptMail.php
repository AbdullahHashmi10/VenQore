<?php

namespace App\Mail;

use App\Models\Sale;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Barryvdh\DomPDF\Facade\Pdf;

class SaleReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public $sale;
    public $settings;

    public function __construct(Sale $sale)
    {
        $this->sale = $sale;
        $this->settings = \App\Models\Setting::all()->pluck('value', 'key');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Receipt from ' . ($this->settings['store_name'] ?? 'VenQore POS'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.sales.receipt',
        );
    }

    public function attachments(): array
    {
        $pdf = Pdf::loadView('pdf.receipt', [
            'sale' => $this->sale,
            'settings' => $this->settings
        ]);

        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(fn() => $pdf->output(), "receipt-{$this->sale->reference_number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
