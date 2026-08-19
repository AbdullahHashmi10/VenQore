<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CapabilitiesRegistrySeeder extends Seeder
{
    public function run(): void
    {
        $seederPath = database_path('seeders/PlanFeatureMatrixSeeder.php');
        if (!file_exists($seederPath)) {
            throw new \RuntimeException("PlanFeatureMatrixSeeder.php not found at: {$seederPath}");
        }

        $content = file_get_contents($seederPath);
        $lines = explode("\n", $content);

        $currentGroup = 'onboarding';
        $capabilities = [];

        // Mapping group names from comments to short keys
        $groupMapping = [
            'Group 1' => 'onboarding',
            'Group 2' => 'pos',
            'Group 3' => 'invoicing',
            'Group 4' => 'procurement',
            'Group 5' => 'inventory',
            'Group 6' => 'ecommerce',
            'Group 7' => 'accounting',
            'Group 8' => 'reports',
            'Group 9' => 'infrastructure',
            'Group 10' => 'ai',
            'Group 11' => 'chat',
            'Group 12' => 'support',
        ];

        foreach ($lines as $line) {
            // Check for group comment, e.g. "// Group 1 — Onboarding"
            foreach ($groupMapping as $groupLabel => $groupKey) {
                if (str_contains($line, '//') && str_contains($line, $groupLabel)) {
                    $currentGroup = $groupKey;
                    break;
                }
            }

            // Match key pattern, e.g., 'demo_store' => [
            if (preg_match('/^\s*\'([a-z0-9_]+)\'\s*=>\s*\[/', $line, $matches)) {
                $key = $matches[1];
                $label = ucwords(str_replace('_', ' ', $key));

                // Classify kind
                $kind = 'capability';
                if (str_contains($key, 'limit') || in_array($key, ['transactions_per_month', 'locations'])) {
                    $kind = 'limit';
                }

                $capabilities[$key] = [
                    'key'           => $key,
                    'group_key'     => $currentGroup,
                    'label'         => $label,
                    'description'   => "Enables the {$label} capability in the POS workspace.",
                    'icon'          => $this->getDefaultIconForGroup($currentGroup),
                    'kind'          => $kind,
                    'is_composable' => 1,
                    'requires'      => null,
                    'conflicts'     => null,
                    'provides_nav'  => null,
                    'provides_cards'=> null,
                    'provides_terms'=> null,
                    'min_plan'      => 'trial',
                    'status'        => 'live',
                    'sort_order'    => count($capabilities) * 10,
                ];
            }
        }

        // Add the three custom capabilities requested by the user
        $customFeatures = [
            'optical_prescription' => [
                'key'           => 'optical_prescription',
                'group_key'     => 'pos',
                'label'         => 'Optical Prescription Tracking',
                'description'   => 'Track sphere, cylinder, axis, and prism parameters for eye tests and optical customer sales.',
                'icon'          => 'eye',
                'kind'          => 'capability',
                'is_composable' => 1,
                'requires'      => null,
                'conflicts'     => null,
                'provides_nav'  => null,
                'provides_cards'=> null,
                'provides_terms'=> json_encode(['prescription']),
                'min_plan'      => 'starter',
                'status'        => 'live',
                'sort_order'    => 9000,
            ],
            'tailor_measurements' => [
                'key'           => 'tailor_measurements',
                'group_key'     => 'pos',
                'label'         => 'Tailoring Customer Measurements',
                'description'   => 'Record and track neck, chest, waist, sleeve, and custom tailor measurements for clothing orders.',
                'icon'          => 'scissors',
                'kind'          => 'capability',
                'is_composable' => 1,
                'requires'      => null,
                'conflicts'     => null,
                'provides_nav'  => null,
                'provides_cards'=> null,
                'provides_terms'=> json_encode(['measurements']),
                'min_plan'      => 'starter',
                'status'        => 'live',
                'sort_order'    => 9010,
            ],
            'jewelry_metal_rates' => [
                'key'           => 'jewelry_metal_rates',
                'group_key'     => 'inventory',
                'label'         => 'Daily Jewelry Metal Rates',
                'description'   => 'Allows manual entry of daily gold, silver, and platinum rates per gram to auto-price jewelry inventory items.',
                'icon'          => 'coin',
                'kind'          => 'capability',
                'is_composable' => 1,
                'requires'      => null,
                'conflicts'     => null,
                'provides_nav'  => null,
                'provides_cards'=> null,
                'provides_terms'=> json_encode(['metal_rate']),
                'min_plan'      => 'starter',
                'status'        => 'live',
                'sort_order'    => 9020,
            ]
        ];

        // Service engine capabilities (Phase 3: Services & Field Work)
        $serviceCapabilities = [
            'work_orders' => [
                'key'           => 'work_orders',
                'group_key'     => 'pos',
                'label'         => 'Work Orders (Job Cards)',
                'description'   => 'Enable job/work-order creation for field service businesses (electricians, repair shops, AC technicians, plumbers).',
                'icon'          => 'briefcase',
                'kind'          => 'capability',
                'is_composable' => 1,
                'requires'      => json_encode(['production']),
                'conflicts'     => null,
                'provides_nav'  => json_encode([['slot' => 'Work', 'term' => 'job']]),
                'provides_cards'=> json_encode(['open_jobs']),
                'provides_terms'=> json_encode(['job', 'technician', 'contract']),
                'min_plan'      => 'starter',
                'status'        => 'live',
                'sort_order'    => 9030,
            ],
            'service_contracts' => [
                'key'           => 'service_contracts',
                'group_key'     => 'pos',
                'label'         => 'Service Contracts (AMC)',
                'description'   => 'Annual maintenance contracts with recurring billing and expiry alerts.',
                'icon'          => 'file-contract',
                'kind'          => 'capability',
                'is_composable' => 1,
                'requires'      => json_encode(['work_orders', 'recurring_invoices']),
                'conflicts'     => null,
                'provides_nav'  => null,
                'provides_cards'=> json_encode(['expiring_contracts']),
                'provides_terms'=> json_encode(['contract']),
                'min_plan'      => 'business',
                'status'        => 'live',
                'sort_order'    => 9031,
            ],
        ];

        foreach ($customFeatures as $k => $cf) {
            $capabilities[$k] = $cf;
        }
        foreach ($serviceCapabilities as $k => $cf) {
            $capabilities[$k] = $cf;
        }

        // Insert capabilities registry in a single transaction
        DB::transaction(function () use ($capabilities) {
            foreach ($capabilities as $cap) {
                // Insert into capabilities table
                DB::table('capabilities')->updateOrInsert(
                    ['key' => $cap['key']],
                    array_merge($cap, [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])
                );

                // Populate search index
                $nameNorm = strtolower($cap['label']);
                $tokens = implode(' ', array_filter(array_unique(array_merge(
                    explode('_', $cap['key']),
                    explode(' ', $nameNorm)
                ))));

                DB::table('capability_search_index')->updateOrInsert(
                    ['capability_key' => $cap['key']],
                    [
                        'name_norm'      => $nameNorm,
                        'name_soundex'   => soundex($cap['label']),
                        'name_metaphone' => metaphone($cap['label']),
                        'aliases'        => null,
                        'tokens'         => $tokens,
                        'embedding'      => null,
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ]
                );
            }
        });

        $this->command->info("Seeded " . count($capabilities) . " capabilities into the registry and search index.");
    }

    private function getDefaultIconForGroup(string $group): string
    {
        $icons = [
            'onboarding'     => 'rocket',
            'pos'            => 'shopping-cart',
            'invoicing'      => 'file-invoice',
            'procurement'    => 'truck-loading',
            'inventory'      => 'box',
            'ecommerce'      => 'globe',
            'accounting'     => 'calculator',
            'reports'        => 'chart-bar',
            'infrastructure' => 'server',
            'ai'             => 'cpu',
            'chat'           => 'comments',
            'support'        => 'life-ring',
        ];
        return $icons[$group] ?? 'cog';
    }
}
