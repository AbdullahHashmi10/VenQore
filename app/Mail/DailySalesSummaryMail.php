<?php

namespace App\Mail;

use App\Models\Tenant;
use App\Models\DailySnapshot;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class DailySalesSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $snapshot;
    public $dateString;

    public function __construct(Tenant $tenant, DailySnapshot $snapshot, string $dateString)
    {
        $this->tenant = $tenant;
        $this->snapshot = $snapshot;
        $this->dateString = $dateString;
    }

    public function build()
    {
        return $this->subject("📅 Daily Sales Report Summary - {$this->tenant->name} ({$this->dateString})")
            ->html("
                <h2>Daily Store Performance Summary</h2>
                <p>Hello,</p>
                <p>Here is the store performance summary for {$this->tenant->name} on <strong>{$this->dateString}</strong>:</p>
                <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; border-color: #ddd;'>
                    <tr style='background-color: #f5f5f5;'>
                        <th align='left'>Metric</th>
                        <th align='right'>Value</th>
                    </tr>
                    <tr>
                        <td><strong>Sales Today</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->sales_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Purchases Today</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->purchases_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Expenses Today</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->expense_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Cash in Hand</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->cash_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Stock Valuation (FIFO)</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->stock_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Receivables (A/R)</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->receivables_value, 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Payables (A/P)</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->snapshot->payables_value, 2) . "</td>
                    </tr>
                </table>
                <br>
                <p>Best regards,<br>The VenQore ERP Team</p>
            ");
    }
}
