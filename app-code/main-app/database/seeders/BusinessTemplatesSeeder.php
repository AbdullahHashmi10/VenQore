<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class BusinessTemplatesSeeder extends Seeder
{
    public static function getTemplates(): array
    {
        return [
            'retail_store' => [
                'name' => 'Retail Store',
                'description' => 'For grocery, karyana, general stores, stationery, sports, pet, and book shops.',
                'industry_preset' => 'Retail',
                'capabilities' => ['pos', 'inventory', 'fifo_costing', 'khata', 'barcodes', 'daily_cash_audit'],
                'terminology' => [
                    'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
                    'product'  => ['singular' => 'Product',  'plural' => 'Products'],
                    'stock'    => ['singular' => 'Stock',    'plural' => 'Stock'],
                ],
            ],
            'fashion_variants' => [
                'name' => 'Fashion & Apparel',
                'description' => 'For clothing stores, footwear, and cosmetics requiring size/color variants.',
                'industry_preset' => 'Apparel',
                'capabilities' => ['pos', 'inventory', 'product_variants', 'khata', 'barcodes', 'loyalty'],
                'terminology' => [
                    'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
                    'product'  => ['singular' => 'Article',  'plural' => 'Articles'],
                    'stock'    => ['singular' => 'Stock',    'plural' => 'Stock'],
                ],
            ],
            'electronics_serials' => [
                'name' => 'Electronics & Serials',
                'description' => 'For mobile, computer, and electronics shops requiring IMEI/serial tracking.',
                'industry_preset' => 'Electronics',
                'capabilities' => ['pos', 'inventory', 'serial_lifecycle', 'warranty', 'barcodes'],
                'terminology' => [
                    'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
                    'product'  => ['singular' => 'Product',  'plural' => 'Products'],
                    'serial'   => ['singular' => 'IMEI',     'plural' => 'IMEIs'],
                ],
            ],
            'hardware_materials' => [
                'name' => 'Hardware & Building Materials',
                'description' => 'For hardware, paint, building materials, auto parts, and agri input stores.',
                'industry_preset' => 'Hardware',
                'capabilities' => ['pos', 'inventory', 'multi_unit', 'quotations', 'van_sales', 'khata'],
                'terminology' => [
                    'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
                    'product'  => ['singular' => 'Item',     'plural' => 'Items'],
                    'location' => ['singular' => 'Yard',     'plural' => 'Yards'],
                ],
            ],
            'restaurant_cafe' => [
                'name' => 'Restaurant & Café',
                'description' => 'For dining, cafes, cloud kitchens, and caterers requiring tables & kitchen tickets.',
                'industry_preset' => 'Restaurant',
                'capabilities' => ['pos', 'compositions', 'occupancy', 'work_orders', 'qr_menu', 'split_payments'],
                'terminology' => [
                    'customer'  => ['singular' => 'Guest',    'plural' => 'Guests'],
                    'position'  => ['singular' => 'Table',    'plural' => 'Tables'],
                    'occupancy' => ['singular' => 'Table',    'plural' => 'Tables'],
                    'job'       => ['singular' => 'Ticket',   'plural' => 'Tickets'],
                ],
            ],
            'bakery_production' => [
                'name' => 'Bakery & Production',
                'description' => 'For bakeries, sweet shops, and food processing with batch expiry & production recipes.',
                'industry_preset' => 'Bakery',
                'capabilities' => ['pos', 'inventory', 'compositions', 'production', 'batch_expiry', 'batch_tracking'],
                'terminology' => [
                    'product'     => ['singular' => 'Item',   'plural' => 'Items'],
                    'composition' => ['singular' => 'Recipe', 'plural' => 'Recipes'],
                ],
            ],
            'pharmacy' => [
                'name' => 'Pharmacy & Medical',
                'description' => 'For pharmacies with batch expiry, prescription holds, and drug serials.',
                'industry_preset' => 'Pharmacy',
                'capabilities' => ['pos', 'inventory', 'batch_tracking', 'batch_expiry', 'occupancy', 'fbr_integration'],
                'terminology' => [
                    'customer'  => ['singular' => 'Patient',           'plural' => 'Patients'],
                    'product'   => ['singular' => 'Medicine',          'plural' => 'Medicines'],
                    'occupancy' => ['singular' => 'Held Prescription', 'plural' => 'Held Prescriptions'],
                ],
            ],
            'wholesale_distribution' => [
                'name' => 'Wholesale & Distribution',
                'description' => 'For B2B wholesalers, distributors, and route sales with credit aging.',
                'industry_preset' => 'Wholesale',
                'capabilities' => ['invoicing', 'inventory', 'quotations', 'sales_orders', 'khata', 'aged_receivables', 'locations'],
                'terminology' => [
                    'customer' => ['singular' => 'Party', 'plural' => 'Parties'],
                    'product'  => ['singular' => 'Item',  'plural' => 'Items'],
                    'location' => ['singular' => 'Van',   'plural' => 'Vans'],
                ],
            ],
            'field_service' => [
                'name' => 'Field Service & Trade Contracting',
                'description' => 'For electricians, plumbers, AC technicians, appliance repair, and handymen.',
                'industry_preset' => 'Electrical',
                'capabilities' => ['services', 'work_orders', 'job_technicians', 'job_site_address', 'van_stock', 'quotations', 'service_contracts'],
                'terminology' => [
                    'customer'   => ['singular' => 'Client',      'plural' => 'Clients'],
                    'product'    => ['singular' => 'Material',    'plural' => 'Materials'],
                    'job'        => ['singular' => 'Job',         'plural' => 'Jobs'],
                    'technician' => ['singular' => 'Technician',  'plural' => 'Technicians'],
                    'location'   => ['singular' => 'Van',         'plural' => 'Vans'],
                ],
            ],
            'repair_shop' => [
                'name' => 'Repair Shop & Auto Workshop',
                'description' => 'For mobile repair, auto workshops, and appliance repair benches.',
                'industry_preset' => 'MobileRepair',
                'capabilities' => ['services', 'work_orders', 'serial_lifecycle', 'positions', 'quotations', 'job_parts_issue'],
                'terminology' => [
                    'customer' => ['singular' => 'Customer', 'plural' => 'Customers'],
                    'product'  => ['singular' => 'Part',     'plural' => 'Parts'],
                    'job'      => ['singular' => 'Repair',   'plural' => 'Repairs'],
                    'position' => ['singular' => 'Bench',    'plural' => 'Benches'],
                ],
            ],
            'workshop_manufacturing' => [
                'name' => 'Workshop & Tailoring',
                'description' => 'For tailoring, printing presses, furniture making, and small workshops.',
                'industry_preset' => 'Consulting',
                'capabilities' => ['services', 'work_orders', 'compositions', 'quotations', 'tailor_measurements'],
                'terminology' => [
                    'customer' => ['singular' => 'Client', 'plural' => 'Clients'],
                    'product'  => ['singular' => 'Fabric', 'plural' => 'Fabrics'],
                    'job'      => ['singular' => 'Order',  'plural' => 'Orders'],
                ],
            ],
            'services_contracts' => [
                'name' => 'IT Services & AMC Contracting',
                'description' => 'For IT support, solar, pest control, cleaning services, and consultants with annual contracts.',
                'industry_preset' => 'IT',
                'capabilities' => ['services', 'work_orders', 'service_contracts', 'recurring_invoices', 'quotations', 'expenses'],
                'terminology' => [
                    'customer'   => ['singular' => 'Client',   'plural' => 'Clients'],
                    'job'        => ['singular' => 'Ticket',   'plural' => 'Tickets'],
                    'technician' => ['singular' => 'Engineer', 'plural' => 'Engineers'],
                    'contract'   => ['singular' => 'Contract', 'plural' => 'Contracts'],
                ],
            ],
        ];
    }

    public static function mapToTemplateKey(string $industry): string
    {
        $normalized = strtolower(trim($industry));
        
        $map = [
            // Retail Store group
            'grocery' => 'retail_store',
            'karyana' => 'retail_store',
            'general_store' => 'retail_store',
            'supermarket' => 'retail_store',
            'minimart' => 'retail_store',
            'stationery' => 'retail_store',
            'book_shop' => 'retail_store',
            'sports_shop' => 'retail_store',
            'pet_shop' => 'retail_store',
            'toy_shop' => 'retail_store',
            'gift_shop' => 'retail_store',
            'cosmetics' => 'retail_store',
            'crockery' => 'retail_store',
            'bookstore' => 'retail_store',
            'retail' => 'retail_store',

            // Fashion group
            'fashion' => 'fashion_variants',
            'apparel' => 'fashion_variants',
            'clothing' => 'fashion_variants',
            'boutique' => 'fashion_variants',
            'shoes' => 'fashion_variants',
            'footwear' => 'fashion_variants',
            'textile' => 'fashion_variants',

            // Electronics group
            'electronics' => 'electronics_serials',
            'mobile_shop' => 'electronics_serials',
            'computer_shop' => 'electronics_serials',
            'appliances' => 'electronics_serials',

            // Hardware group
            'hardware' => 'hardware_materials',
            'hardware_store' => 'hardware_materials',
            'paint_store' => 'hardware_materials',
            'building_materials' => 'hardware_materials',
            'auto_parts' => 'hardware_materials',
            'agri_input' => 'hardware_materials',
            'fertilizer' => 'hardware_materials',
            'pipes_fittings' => 'hardware_materials',

            // Restaurant group
            'restaurant' => 'restaurant_cafe',
            'cafe' => 'restaurant_cafe',
            'coffee_shop' => 'restaurant_cafe',
            'cloud_kitchen' => 'restaurant_cafe',
            'bakery_cafe' => 'restaurant_cafe',
            'caterer' => 'restaurant_cafe',
            'pizzeria' => 'restaurant_cafe',
            'fast_food' => 'restaurant_cafe',

            // Bakery group
            'bakery' => 'bakery_production',
            'sweet_shop' => 'bakery_production',
            'confectionery' => 'bakery_production',
            'food_production' => 'bakery_production',

            // Pharmacy group
            'pharmacy' => 'pharmacy',
            'chemist' => 'pharmacy',
            'medical_store' => 'pharmacy',
            'clinic' => 'pharmacy',
            'dental_clinic' => 'pharmacy',

            // Wholesale group
            'wholesale' => 'wholesale_distribution',
            'distributor' => 'wholesale_distribution',
            'distribution' => 'wholesale_distribution',
            'trader' => 'wholesale_distribution',

            // Field Service group
            'electrician' => 'field_service',
            'plumber' => 'field_service',
            'hvac_technician' => 'field_service',
            'ac_repair' => 'field_service',
            'handyman' => 'field_service',
            'pest_control' => 'field_service',
            'cleaning_service' => 'field_service',
            'solar_installer' => 'field_service',

            // Repair Shop group
            'repair_shop' => 'repair_shop',
            'mobile_repair' => 'repair_shop',
            'computer_repair' => 'repair_shop',
            'car_wash' => 'repair_shop',
            'auto_workshop' => 'repair_shop',
            'mechanic' => 'repair_shop',
            'appliance_repair' => 'repair_shop',

            // Workshop/Tailoring group
            'workshop' => 'workshop_manufacturing',
            'tailoring' => 'workshop_manufacturing',
            'tailor_shop' => 'workshop_manufacturing',
            'boutique_tailoring' => 'workshop_manufacturing',
            'printing_press' => 'workshop_manufacturing',
            'furniture_making' => 'workshop_manufacturing',
            'manufacturing' => 'workshop_manufacturing',

            // Services Contracts group
            'it_services' => 'services_contracts',
            'consulting' => 'services_contracts',
            'amc_services' => 'services_contracts',
            'cleaning_company' => 'services_contracts',
            'agency' => 'services_contracts',
        ];

        return $map[$normalized] ?? $normalized;
    }

    public function run(): void
    {
        // Seeder implementation ready to apply template definitions
    }
}
