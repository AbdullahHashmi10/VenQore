<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $partyName;
    public $partyEmail;
    public $outstandingSales;
    public $totalOutstanding;
    public $reminderDays;

    public function __construct(Tenant $tenant, string $partyName, string $partyEmail, array $outstandingSales, float $totalOutstanding, int $reminderDays)
    {
        $this->tenant          = $tenant;
        $this->partyName       = $partyName;
        $this->partyEmail      = $partyEmail;
        $this->outstandingSales  = $outstandingSales;
        $this->totalOutstanding  = $totalOutstanding;
        $this->reminderDays    = $reminderDays;
    }

    public function build()
    {
        $currency = $this->tenant->settings['currency'] ?? 'PKR';
        $storeName = $this->tenant->name;

        $rowsHtml = '';
        foreach ($this->outstandingSales as $sale) {
            $rowsHtml .= "
                <tr>
                    <td>{$sale['invoice_no']}</td>
                    <td>{$sale['date']}</td>
                    <td align='right'>{$currency} " . number_format($sale['total'], 2) . "</td>
                    <td align='right'>{$currency} " . number_format($sale['paid'], 2) . "</td>
                    <td align='right' style='color: #d9534f; font-weight: bold;'>{$currency} " . number_format($sale['balance'], 2) . "</td>
                </tr>
            ";
        }

        $totalFormatted = $currency . ' ' . number_format($this->totalOutstanding, 2);

        return $this->subject("💳 Payment Reminder — {$storeName}")
            ->html("
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #4f46e5;'>Payment Reminder</h2>
                    <p>Dear <strong>{$this->partyName}</strong>,</p>
                    <p>This is a friendly reminder from <strong>{$storeName}</strong> that you have outstanding payment(s) due.</p>

                    <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; border-color: #ddd; width: 100%;'>
                        <tr style='background-color: #f5f5f5;'>
                            <th align='left'>Invoice #</th>
                            <th align='left'>Date</th>
                            <th align='right'>Total</th>
                            <th align='right'>Paid</th>
                            <th align='right'>Balance Due</th>
                        </tr>
                        {$rowsHtml}
                        <tr style='background-color: #fff3cd; font-weight: bold;'>
                            <td colspan='4' align='right'>Total Outstanding:</td>
                            <td align='right' style='color: #d9534f;'>{$totalFormatted}</td>
                        </tr>
                    </table>

                    <br>
                    <p>Please arrange payment at your earliest convenience. If you have already made the payment, kindly disregard this message.</p>
                    <p>For any queries, please contact us directly.</p>
                    <br>
                    <p>Best regards,<br><strong>{$storeName}</strong></p>
                </div>
            ");
    }
}
