<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\Party;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DemoProposalSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoProposalSeeder.");
            return;
        }

        $customers = Party::where('tenant_id', $tenantId)->where('type', 'customer')->get();
        $products  = Product::where('tenant_id', $tenantId)->get();
        $user      = User::where('email', 'demo-owner@venqore-demo.internal')->first()
                  ?? User::where('email', 'demo-admin@venqore-demo.internal')->first();

        if ($customers->isEmpty() || $products->isEmpty()) {
            $this->command?->warn("Skipping proposals — no customers or products.");
            return;
        }

        $statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
        $weights  = [10, 30, 35, 15, 10]; // % distribution

        $notes = [
            'Custom order as discussed during site visit.',
            'Annual supply agreement renewal.',
            'Special bulk pricing applied.',
            'Urgent requirement — expedited delivery included.',
            'New client onboarding package.',
            'Follow-up from trade show meeting.',
        ];

        for ($i = 0; $i < 40; $i++) {
            $status    = $this->weightedRandom($statuses, $weights);
            $daysAgo   = rand(10, 400);
            $createdAt = now()->subDays($daysAgo);
            $validUntil= $createdAt->copy()->addDays(rand(14, 60));

            $proposalNum = 'PROP-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT);
            $proposal = Proposal::create([
                'tenant_id'        => $tenantId,
                'reference_number' => $proposalNum,
                'customer_id'      => $customers->random()->id,
                'user_id'          => $user?->id,
                'status'           => $status,
                'valid_until'      => $validUntil->toDateString(),
                'notes'            => $notes[array_rand($notes)],
                'total_amount'     => 0,
                'discount_amount'  => 0,
                'created_at'       => $createdAt,
                'updated_at'       => $createdAt,
            ]);

            // Add 1–4 items
            $totalAmount    = 0;
            $discountAmount = 0;
            $numItems = rand(1, 4);
            for ($j = 0; $j < $numItems; $j++) {
                $prod = $products->random();
                $qty  = rand(1, 10);
                $disc = [0, 0, 5, 10, 15][rand(0, 4)];
                $lineTotal = $prod->price * $qty * (1 - $disc / 100);
                $lineDisc  = $prod->price * $qty * ($disc / 100);
                
                $totalAmount    += $lineTotal;
                $discountAmount += $lineDisc;

                ProposalItem::create([
                    'proposal_id'  => $proposal->id,
                    'tenant_id'    => $tenantId,
                    'product_id'   => $prod->id,
                    'product_name' => $prod->name,
                    'quantity'     => $qty,
                    'unit_price'   => $prod->price,
                    'unit_cost'    => $prod->cost_price ?? ($prod->price * 0.75),
                    'discount'     => round($lineDisc, 2),
                    'total'        => round($lineTotal, 2),
                ]);
            }

            // Update proposal total
            $proposal->update([
                'total_amount'    => round($totalAmount, 2),
                'discount_amount' => round($discountAmount, 2)
            ]);
        }

        $this->command?->info("✅ 40 Proposals seeded across various statuses.");
    }

    private function weightedRandom(array $items, array $weights): string
    {
        $rand = rand(1, 100);
        $cumulative = 0;
        foreach ($items as $i => $item) {
            $cumulative += $weights[$i];
            if ($rand <= $cumulative) return $item;
        }
        return $items[0];
    }
}
