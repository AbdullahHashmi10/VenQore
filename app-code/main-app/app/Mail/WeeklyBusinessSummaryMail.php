<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WeeklyBusinessSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $metrics;

    public function __construct(Tenant $tenant, array $metrics)
    {
        $this->tenant = $tenant;
        $this->metrics = $metrics;
    }

    public function build()
    {
        return $this->subject("📊 Weekly Business Health Summary - {$this->tenant->name}")
            ->html("
                <h2>Weekly Business Performance Summary</h2>
                <p>Hello,</p>
                <p>Here is your weekly performance and health digest for <strong>{$this->tenant->name}</strong> (last 7 days):</p>
                
                <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; border-color: #ddd; width: 100%; max-width: 500px;'>
                    <tr style='background-color: #f5f5f5;'>
                        <th align='left'>Key Metric</th>
                        <th align='right'>Value</th>
                    </tr>
                    <tr>
                        <td><strong>Sales Revenue</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->metrics['sales_revenue'], 2) . " ({$this->metrics['sales_count']} sales)</td>
                    </tr>
                    <tr>
                        <td><strong>Purchases Total</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->metrics['purchases_total'], 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Expenses Total</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->metrics['expenses_total'], 2) . "</td>
                    </tr>
                    <tr style='background-color: #fafafa;'>
                        <td><strong>Estimated Cost of Goods (COGS)</strong></td>
                        <td align='right'>{$this->tenant->currency_symbol} " . number_format($this->metrics['cogs'], 2) . "</td>
                    </tr>
                    <tr style='background-color: #f0fdf4; color: #15803d;'>
                        <td><strong>Estimated Net Profit</strong></td>
                        <td align='right' style='font-weight: bold;'>{$this->tenant->currency_symbol} " . number_format($this->metrics['net_profit'], 2) . "</td>
                    </tr>
                    <tr>
                        <td><strong>Low Stock Items Count</strong></td>
                        <td align='right' style='" . ($this->metrics['low_stock_count'] > 0 ? 'color: #d9534f; font-weight: bold;' : '') . "'>{$this->metrics['low_stock_count']} items</td>
                    </tr>
                    <tr>
                        <td><strong>Top Selling Product</strong></td>
                        <td align='right' style='font-weight: bold; color: #4f46e5;'>{$this->metrics['top_product']}</td>
                    </tr>
                </table>
                <br>
                <p>Log in to your VenQore Command Center to view complete charts and drill down into these numbers.</p>
                <br>
                <p>Best regards,<br>The VenQore ERP Team</p>
            ");
    }
}
