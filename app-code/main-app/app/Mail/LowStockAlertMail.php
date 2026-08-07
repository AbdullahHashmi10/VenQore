<?php

namespace App\Mail;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class LowStockAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public $tenant;
    public $lowStockItems;

    public function __construct(Tenant $tenant, array $lowStockItems)
    {
        $this->tenant = $tenant;
        $this->lowStockItems = $lowStockItems;
    }

    public function build()
    {
        $rowsHtml = '';
        foreach ($this->lowStockItems as $item) {
            $rowsHtml .= "
                <tr>
                    <td>{$item['name']}</td>
                    <td>{$item['sku']}</td>
                    <td align='right' style='color: #d9534f; font-weight: bold;'>{$item['current_stock']}</td>
                    <td align='right'>{$item['threshold']}</td>
                </tr>
            ";
        }

        return $this->subject("⚠️ Low Stock Alert - {$this->tenant->name}")
            ->html("
                <h2>Low Stock Alert Notification</h2>
                <p>Hello,</p>
                <p>The following items in your store <strong>{$this->tenant->name}</strong> are currently running low on stock:</p>
                <table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; border-color: #ddd;'>
                    <tr style='background-color: #f5f5f5;'>
                        <th align='left'>Product Name</th>
                        <th align='left'>SKU</th>
                        <th align='right'>Current Stock</th>
                        <th align='right'>Alert Threshold</th>
                    </tr>
                    {$rowsHtml}
                </table>
                <br>
                <p>Please restock these items soon to prevent sales disruption.</p>
                <br>
                <p>Best regards,<br>The VenQore ERP Team</p>
            ");
    }
}
