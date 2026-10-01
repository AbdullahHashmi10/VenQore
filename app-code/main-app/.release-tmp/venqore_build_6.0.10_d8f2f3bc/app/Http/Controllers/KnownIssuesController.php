<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class KnownIssuesController extends Controller
{
    public function show(): Response
    {
        $issues = [
            [
                'id'          => 'ISSUE-101',
                'title'       => 'ESC/POS USB Printer Disconnection on System Sleep',
                'status'      => 'Mitigated',
                'severity'    => 'Low',
                'impact'      => 'USB receipt printers may lose connection if host device enters deep sleep mode.',
                'workaround'  => 'Disable host OS sleep settings on POS terminal devices or use Network/LAN printers.',
                'updated_at'  => '2026-08-04',
            ],
            [
                'id'          => 'ISSUE-102',
                'title'       => 'Slow OCR Scan Parsing on Very Low Light Photos',
                'status'      => 'Investigating',
                'severity'    => 'Medium',
                'impact'      => 'Invoice photos taken under low lighting (<50 lux) require extended processing time.',
                'workaround'  => 'Enable device flash or use bright overhead lighting when capturing paper invoices.',
                'updated_at'  => '2026-08-03',
            ],
            [
                'id'          => 'ISSUE-103',
                'title'       => 'Amazon Channel API Rate Throttling During Initial Import',
                'status'      => 'Resolved',
                'severity'    => 'High',
                'impact'      => 'Stores importing >10,000 Amazon SKUs experienced temporary SP-API rate limits.',
                'workaround'  => 'Chunked sync queue enabled in Phase 6. Initial imports automatically stagger SKU syncs.',
                'updated_at'  => '2026-08-02',
            ],
        ];

        return Inertia::render('Marketing/KnownIssues', [
            'issues'      => $issues,
            'lastUpdated' => '2026-08-05',
        ]);
    }
}
