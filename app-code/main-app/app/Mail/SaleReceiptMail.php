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
        $this->settings = \App\Services\ReceiptDocument::prepare($sale)['settings'];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Receipt from ' . ($this->settings['business_name'] ?? $this->settings['store_name'] ?? 'VenQore POS'),
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
        $this->settings = \App\Services\ReceiptDocument::prepare($this->sale)['settings'];
        $filename = preg_replace('/[^A-Za-z0-9._-]/', '-', (string) $this->sale->reference_number);
        $pdf = Pdf::loadView('pdf.receipt', [
            'sale' => $this->sale,
            'settings' => $this->settings
        ])->setOptions(['isRemoteEnabled' => false]);

        return [
            \Illuminate\Mail\Mailables\Attachment::fromData(fn() => $pdf->output(), "receipt-{$filename}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
