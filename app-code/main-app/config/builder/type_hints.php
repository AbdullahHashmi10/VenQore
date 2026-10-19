<?php

/*
|--------------------------------------------------------------------------
| Builder type hints — 85 business types (BUILDER_BUSINESS_TYPE_COVERAGE_2026-10-14.md)
|--------------------------------------------------------------------------
| GENERATED once from config/business_types.php and the coverage document, then
| maintained by hand. A type NEVER removes an option and NEVER becomes a fact.
| It only (a) lifts listed questions ONE priority band and (b) supplies the
| disclosed starting template used for skip-all (source: template_assumption).
|
|   template    fact keys the starting setup assumes, each disclosed on the read-back
|   raise       question ids lifted one band (never lowers a band 1-3 screen)
|   unresolved  coverage doc: the high-value facts still to confirm
|   check       coverage doc: counterexample / capability check
*/

return array (
  'phone_repair' => 
  array (
    'label' => 'Gadget & phone repair shops',
    'sector' => 'services',
    'preset' => 'repair_workshop',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
      4 => 'id.customer_item_id',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Job lifecycle, customer-device identity, bought spare parts',
    'check' => 'Customer IMEI is not resale inventory; warranty/intake behaviour needs verification.',
  ),
  'computer_repair' => 
  array (
    'label' => 'Computer & laptop repair centres',
    'sector' => 'services',
    'preset' => 'repair_workshop',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
      4 => 'id.customer_item_id',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Job lifecycle, customer assets, bought parts',
    'check' => 'Service serial intake and stocked-device serials are different.',
  ),
  'auto_repair' => 
  array (
    'label' => 'Auto repair & mechanic garages',
    'sector' => 'services',
    'preset' => 'repair_workshop',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Jobs, parts/labour, appointments and bays',
    'check' => 'Vehicle/bay needs do not prove table service or supported workshop detail.',
  ),
  'appliance_repair' => 
  array (
    'label' => 'Appliance repair (AC, fridges, washers)',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Field jobs, materials, scheduling',
    'check' => 'Site visits do not imply route optimisation or multiple stock locations.',
  ),
  'bike_service' => 
  array (
    'label' => 'Bicycle & motorcycle service centres',
    'sector' => 'services',
    'preset' => 'repair_workshop',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Repair jobs, parts, booked work',
    'check' => 'Customer bicycle identity is not stock ownership.',
  ),
  'salon_barber' => 
  array (
    'label' => 'Hair salons & barber shops',
    'sector' => 'services',
    'preset' => 'salon',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.on_the_spot',
      2 => 'work.booking',
      3 => 'items.counted_supplies',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8e',
    ),
    'unresolved' => 'Appointments versus walk-in; retail versus consumed supplies',
    'check' => 'Retail products, batches and sizes cannot be excluded by services sector.',
  ),
  'nail_spa' => 
  array (
    'label' => 'Nail salons & spas',
    'sector' => 'services',
    'preset' => 'salon',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.on_the_spot',
      2 => 'work.booking',
      3 => 'items.counted_supplies',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q3',
    ),
    'unresolved' => 'Appointments, consumable quantities, paid treatments',
    'check' => 'Chemicals may expire; products need not be sold to need materials tracking.',
  ),
  'pet_care' => 
  array (
    'label' => 'Pet grooming & veterinary clinics',
    'sector' => 'services',
    'preset' => 'salon',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.on_the_spot',
      2 => 'work.booking',
      3 => 'items.counted_supplies',
      4 => 'activity.goods',
      5 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Bookings, service work, supplied/sold goods',
    'check' => 'Current products/inventory extras are suggestions, not proof all owners hold stock.',
  ),
  'freelance_creative' => 
  array (
    'label' => 'Freelance designers & developers',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8d',
    ),
    'unresolved' => 'Client bills, project stages, manual versus automatic recurrence',
    'check' => 'Monthly invoice is not automation; jobs need not be repair tickets.',
  ),
  'marketing_agency' => 
  array (
    'label' => 'Digital marketing & SEO agencies',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8d',
    ),
    'unresolved' => 'Client/project billing, retainers, team access',
    'check' => 'Campaign delivery and approval workflows are not supplied merely by invoicing.',
  ),
  'consultant' => 
  array (
    'label' => 'Consultants & business coaches',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
      1 => 'Q8d',
    ),
    'unresolved' => 'Client bills, session/project work, payment stages',
    'check' => 'Appointments and ongoing work need separate scope; no assumed stock.',
  ),
  'accounting_firm' => 
  array (
    'label' => 'Accountants, tax consultants & auditors',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Client work and billing; internal accounting tasks',
    'check' => 'Being an accounting firm does not mean clients\' books are managed in this tenant.',
  ),
  'law_firm' => 
  array (
    'label' => 'Lawyers & legal practices',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
      1 => 'Q4',
    ),
    'unresolved' => 'Client billing, work stages, deposits',
    'check' => 'Case management and trust/client-money accounting are distinct support requirements.',
  ),
  'architect_interior' => 
  array (
    'label' => 'Architects & interior designers',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8f',
      2 => 'Q4',
    ),
    'unresolved' => 'Project billing, advances, bought project materials',
    'check' => 'Design-only and material procurement are different; no universal manufacturing.',
  ),
  'photo_video' => 
  array (
    'label' => 'Photographers & videographers',
    'sector' => 'services',
    'preset' => 'professional_services',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
      1 => 'Q4',
    ),
    'unresolved' => 'Bookings, staged payments, equipment/hire needs',
    'check' => 'Owning cameras does not imply depreciation register or rental availability support.',
  ),
  'electrician' => 
  array (
    'label' => 'Electricians & electrical contractors',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Field jobs, bought versus customer parts, units',
    'check' => 'Service sector must allow materials inventory and purchasing.',
  ),
  'plumber' => 
  array (
    'label' => 'Plumbing & sanitary contractors',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Job stages, pipes/materials, supplier/customer balances',
    'check' => 'Bought lengths and customer-provided materials are separate paths.',
  ),
  'carpenter' => 
  array (
    'label' => 'Carpentry & woodwork services',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8a',
      2 => 'Q8g',
    ),
    'unresolved' => 'On-site work versus making; material ownership',
    'check' => 'May be mixed services/manufacturing; do not lock the field-service preset.',
  ),
  'painter_renovation' => 
  array (
    'label' => 'Painters & renovation contractors',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8f',
      2 => 'Q8g',
    ),
    'unresolved' => 'Jobs/projects, deposits, paint quantities',
    'check' => 'Litres and material buying are relevant despite service classification.',
  ),
  'cleaning' => 
  array (
    'label' => 'Cleaning & janitorial companies',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8e',
      2 => 'Q8g',
    ),
    'unresolved' => 'One-off/recurring jobs, consumables, attendance',
    'check' => 'Repeated visits do not prove automatic invoices or payroll.',
  ),
  'hvac' => 
  array (
    'label' => 'HVAC installation & maintenance',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8g',
    ),
    'unresolved' => 'Scheduled field/repair jobs, parts and customer equipment',
    'check' => 'Installation, repair and resale may coexist; dispatch capabilities need verification.',
  ),
  'pest_control' => 
  array (
    'label' => 'Pest control services',
    'sector' => 'services',
    'preset' => 'field_service',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.job_tracked',
      2 => 'work.bill',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q3',
      2 => 'Q8e',
      3 => 'Q8g',
    ),
    'unresolved' => 'Scheduled/repeat work, chemicals, batches/expiry',
    'check' => 'Service sector must not suppress expiry or measured materials.',
  ),
  'equipment_rental' => 
  array (
    'label' => 'Equipment & tool rental',
    'sector' => 'services',
    'preset' => 'rental_hire',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'activity.hire',
    ),
    'raise' => 
    array (
      0 => 'Q4',
    ),
    'unresolved' => 'Availability, hire periods, deposits and returns',
    'check' => 'Recurring invoices alone do not provide a complete rental workflow.',
  ),
  'event_hire' => 
  array (
    'label' => 'Event decorators & sound hire',
    'sector' => 'services',
    'preset' => 'rental_hire',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'activity.hire',
    ),
    'raise' => 
    array (
      0 => 'Q4',
    ),
    'unresolved' => 'Booking dates, allocated hired assets, returns/deposits',
    'check' => 'Stock sale reservations are not automatically rental availability.',
  ),
  'gym_fitness' => 
  array (
    'label' => 'Gyms, fitness studios & trainers',
    'sector' => 'services',
    'preset' => 'membership_studio',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8e',
      1 => 'Q8d',
    ),
    'unresolved' => 'Membership billing, sessions, access needs',
    'check' => 'Membership access/attendance is not guaranteed by recurring invoicing.',
  ),
  'tuition_academy' => 
  array (
    'label' => 'Tuition centres & music/art academies',
    'sector' => 'services',
    'preset' => 'membership_studio',
    'template' => 
    array (
      0 => 'activity.services',
      1 => 'work.bill',
    ),
    'raise' => 
    array (
      0 => 'Q8d',
    ),
    'unresolved' => 'Fees, recurring billing intent, classes/students',
    'check' => 'School/class/student management is beyond generic billing unless verified.',
  ),
  'grocery' => 
  array (
    'label' => 'Grocery & kiryana stores',
    'sector' => 'retail',
    'preset' => 'grocery',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Counter/other sales, stock source, payment timing, units/expiry',
    'check' => 'Single shop remains single regardless of catalogue size; side services possible.',
  ),
  'supermarket' => 
  array (
    'label' => 'Supermarkets & minimarts',
    'sector' => 'retail',
    'preset' => 'grocery',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Sales channels, independent stock counts, users',
    'check' => 'Size or current stock_takes extra does not prove multi-location/attendance.',
  ),
  'pharmacy' => 
  array (
    'label' => 'Pharmacies & medical stores',
    'sector' => 'retail',
    'preset' => 'pharmacy',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Batch/expiry requirements, stock/buying, selling',
    'check' => 'Do not infer clinical/prescription features or impose stock traits against explicit scope.',
  ),
  'surgical_supplies' => 
  array (
    'label' => 'Surgical & medical equipment suppliers',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'id.batch_expiry',
      4 => 'id.serial_owned',
      5 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Batch/serial identity as applicable, procurement and channels',
    'check' => 'Current extras do not establish every item needs both batches and serials.',
  ),
  'mobile_retail' => 
  array (
    'label' => 'Mobile phone & gadget retailers',
    'sector' => 'retail',
    'preset' => 'mobile_electronics',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Serialised owned stock, sales/returns, optional repair',
    'check' => 'IMEI resale and customer repair-device intake must stay distinct.',
  ),
  'electronics' => 
  array (
    'label' => 'Consumer electronics & home appliances',
    'sector' => 'retail',
    'preset' => 'mobile_electronics',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Serial/warranty needs, variants, buying, repair side activity',
    'check' => 'Warranty administration is a separate behaviour to verify, not an automatic promise.',
  ),
  'fashion' => 
  array (
    'label' => 'Fashion & garment boutiques',
    'sector' => 'retail',
    'preset' => 'clothing',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8c',
    ),
    'unresolved' => 'Variant requirements, counter/online, stock source',
    'check' => 'Clothing can be distinct one-off items; variants not universal.',
  ),
  'footwear' => 
  array (
    'label' => 'Shoe & footwear stores',
    'sector' => 'retail',
    'preset' => 'clothing',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8c',
    ),
    'unresolved' => 'Sizes/styles, stock, channels',
    'check' => 'Size sets do not prove multiple warehouses or barcode printing.',
  ),
  'jewellery' => 
  array (
    'label' => 'Jewellery & watch shops',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'id.serial_owned',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Individual identity, measured quantity, bespoke/service activity',
    'check' => 'Serial module does not necessarily support purity, metal pricing or hallmark workflows.',
  ),
  'cosmetics' => 
  array (
    'label' => 'Cosmetics & perfume stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8c',
    ),
    'unresolved' => 'Expiry/lot needs, variants, retail/services',
    'check' => 'Expiry extra is a strong candidate, not confirmed practice.',
  ),
  'hardware' => 
  array (
    'label' => 'Hardware & paint stores',
    'sector' => 'retail',
    'preset' => 'hardware_store',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Measured/conversion units, procurement, trade prices',
    'check' => 'Bulk volume does not prove branches, customer credit or formal tenders.',
  ),
  'sanitary_supply' => 
  array (
    'label' => 'Sanitary & plumbing supply stores',
    'sector' => 'retail',
    'preset' => 'hardware_store',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Units, versions, customer orders',
    'check' => 'Retailing fixtures does not prove installation/job management.',
  ),
  'building_materials' => 
  array (
    'label' => 'Building materials, cement & steel',
    'sector' => 'retail',
    'preset' => 'hardware_store',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'sale.order_later',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
    ),
    'unresolved' => 'Delivery/later fulfilment, units, procurement',
    'check' => 'Sales-order extra does not prove delivery routing or credit.',
  ),
  'furniture_store' => 
  array (
    'label' => 'Furniture & home décor stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'sale.order_later',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
      1 => 'Q4',
    ),
    'unresolved' => 'Goods orders/deposits, resale versus making',
    'check' => 'Sold furniture does not imply manufacturing; deposit not always stock allocation.',
  ),
  'books_stationery' => 
  array (
    'label' => 'Bookstores & stationery shops',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q8c',
    ),
    'unresolved' => 'Item quantities, counter/online, barcodes',
    'check' => 'Stationery services/printing are possible secondary activities.',
  ),
  'toys' => 
  array (
    'label' => 'Toy & hobby stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q8c',
    ),
    'unresolved' => 'Item versions, sales channels, stock source',
    'check' => 'No default reward programme merely because retail.',
  ),
  'pet_supply' => 
  array (
    'label' => 'Pet supply stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Food expiry, other goods, service side activities',
    'check' => 'Expiry candidate is item-specific; service activity can reopen.',
  ),
  'auto_parts' => 
  array (
    'label' => 'Auto spare parts & accessories',
    'sector' => 'retail',
    'preset' => 'hardware_store',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'id.serial_owned',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Part catalogue/identity, units and repair side work',
    'check' => 'Serials not universal to all spare parts.',
  ),
  'tyre_battery' => 
  array (
    'label' => 'Tyre & battery dealers',
    'sector' => 'retail',
    'preset' => 'mobile_electronics',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Individual/warranty identity, fitting service, buying',
    'check' => 'Installation services and inventory may coexist.',
  ),
  'optical' => 
  array (
    'label' => 'Eyewear & optical boutiques',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
      3 => 'sale.order_later',
    ),
    'raise' => 
    array (
      0 => 'Q8f',
    ),
    'unresolved' => 'Product sales, client orders, optional fitting/examination',
    'check' => 'Optical/prescription workflows are not supplied merely by sales_orders.',
  ),
  'gift_flower' => 
  array (
    'label' => 'Gift, flower & craft shops',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
      0 => 'Q8c',
    ),
    'unresolved' => 'Made versus resold goods, dated orders/delivery',
    'check' => 'Custom arrangements can require material consumption; retail label insufficient.',
  ),
  'vape_tobacco' => 
  array (
    'label' => 'Vape & tobacco stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Item/variant/expiry scope, channels',
    'check' => 'No inferred compliance/regulatory capability from trade label.',
  ),
  'sports' => 
  array (
    'label' => 'Sports & outdoor equipment',
    'sector' => 'retail',
    'preset' => 'clothing',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Goods versions, services/hire where applicable',
    'check' => 'Clothing preset may overfit non-apparel sports equipment.',
  ),
  'electrical_lighting' => 
  array (
    'label' => 'Electrical & lighting stores',
    'sector' => 'retail',
    'preset' => 'hardware_store',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Units/variants, supply, installation side work',
    'check' => 'Service branch can coexist with hardware retail.',
  ),
  'kitchenware' => 
  array (
    'label' => 'Kitchenware & crockery stores',
    'sector' => 'retail',
    'preset' => 'retail_shop',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.counter',
      2 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Item sets/versions, stock source and channels',
    'check' => 'Bundled/auto-deduction requests require capability check; composites beta.',
  ),
  'restaurant' => 
  array (
    'label' => 'Dine-in restaurants',
    'sector' => 'food',
    'preset' => 'restaurant',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'sale.tables',
      3 => 'food.tables',
      4 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Tables/kitchen, takeaway/delivery, ingredients and payment timing',
    'check' => 'No forced production runs; trade invoices/prices remain possible.',
  ),
  'cafe' => 
  array (
    'label' => 'Cafés & coffee houses',
    'sector' => 'food',
    'preset' => 'cafe',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Counter versus seated service, kitchen, ingredients',
    'check' => 'Cafe label alone does not establish tables or rewards.',
  ),
  'tea_shop' => 
  array (
    'label' => 'Chai & tea shops',
    'sector' => 'food',
    'preset' => 'cafe',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Counter/table service, ingredients, units',
    'check' => 'A takeaway stall is not automatically a dine-in restaurant.',
  ),
  'bakery' => 
  array (
    'label' => 'Artisan bakeries & cake shops',
    'sector' => 'food',
    'preset' => 'bakery',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Makes versus resells, batch/expiry, custom orders',
    'check' => 'Recipe/runs cannot be Core merely from bakery name.',
  ),
  'fast_food' => 
  array (
    'label' => 'Fast food, burger & pizza outlets',
    'sector' => 'food',
    'preset' => 'food_counter',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Counter/table/order workflow and ingredient needs',
    'check' => 'Tableless kitchen tickets require actual supported capability check.',
  ),
  'dessert' => 
  array (
    'label' => 'Ice cream & dessert parlours',
    'sector' => 'food',
    'preset' => 'food_counter',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
      1 => 'Q8b',
    ),
    'unresolved' => 'Made versus bought products, measured/variant/expiry needs',
    'check' => 'Food variants are valid; no automatic formal production.',
  ),
  'juice_bar' => 
  array (
    'label' => 'Juice, shake & smoothie bars',
    'sector' => 'food',
    'preset' => 'food_counter',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
      1 => 'Q8b',
    ),
    'unresolved' => 'Counter/orders, ingredient quantities and preparation',
    'check' => 'Measured ingredients do not necessarily mean recorded production runs.',
  ),
  'food_truck' => 
  array (
    'label' => 'Food trucks & kiosks',
    'sector' => 'food',
    'preset' => 'food_counter',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Counter/orders, ingredients, independent stock counts',
    'check' => 'Moving physical location is not multiple simultaneous stock locations.',
  ),
  'sweets' => 
  array (
    'label' => 'Sweet & mithai shops',
    'sector' => 'food',
    'preset' => 'bakery',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
      4 => 'id.measured',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Makes/resells, weight conversion, batch/expiry',
    'check' => 'Units extra is candidate; production must be independently established.',
  ),
  'catering' => 
  array (
    'label' => 'Catering businesses',
    'sector' => 'food',
    'preset' => 'catering',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'sale.order_later',
      3 => 'sale.bill',
      4 => 'money.advances',
      5 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
      1 => 'Q8b',
      2 => 'Q8g',
      3 => 'Q4',
    ),
    'unresolved' => 'Advance jobs/orders, deposits, B2B prices, ingredients',
    'check' => 'Catering may be invoice-only without POS; food does not forbid trade pricing.',
  ),
  'cloud_kitchen' => 
  array (
    'label' => 'Cloud & dark kitchens',
    'sector' => 'food',
    'preset' => 'food_counter',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'food.counter_takeaway',
      3 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
      1 => 'Q8c',
    ),
    'unresolved' => 'Online/order channels, delivery, kitchen/ingredients',
    'check' => 'No assumed tables; provider/delivery planning support must be verified.',
  ),
  'pub_lounge' => 
  array (
    'label' => 'Pubs, bistros & lounges',
    'sector' => 'food',
    'preset' => 'restaurant',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'activity.making',
      2 => 'sale.tables',
      3 => 'food.tables',
      4 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8b',
    ),
    'unresolved' => 'Tables/bar counter, tabs, measured goods',
    'check' => 'Hospitality can need customer credit; no hard sector denial.',
  ),
  'fmcg_wholesale' => 
  array (
    'label' => 'FMCG & packaged-goods wholesalers',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.measured',
    ),
    'raise' => 
    array (
      0 => 'Q4',
    ),
    'unresolved' => 'Customer pricing/terms, orders, stock/units',
    'check' => 'Wholesale does not prove credit, multiple counts or many price tiers.',
  ),
  'grain_commodities' => 
  array (
    'label' => 'Grain, flour & bulk commodities',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.measured',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Measured quantities, buying, customer terms',
    'check' => 'Units candidate; lot/quality-specific functionality needs verification.',
  ),
  'fabric_stockist' => 
  array (
    'label' => 'Garment & fabric stockists',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.variants',
      5 => 'id.measured',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Length/conversions, actual variants, orders',
    'check' => 'Variants extra can be wrong for distinct-item stockists.',
  ),
  'hardware_wholesale' => 
  array (
    'label' => 'Hardware & tools wholesalers',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Units, order timing, trade-price scope',
    'check' => 'Bulk selling alone does not establish proposals or bank matching.',
  ),
  'electrical_wholesale' => 
  array (
    'label' => 'Electrical supplies wholesalers',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Goods identity, orders, supplier terms',
    'check' => 'Possible installation/services must stay available.',
  ),
  'pharma_wholesale' => 
  array (
    'label' => 'Pharmaceutical wholesalers & stockists',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q4',
    ),
    'unresolved' => 'Lot/expiry, procurement, customer terms',
    'check' => 'Expiry candidate important; compliance details not inferred.',
  ),
  'tech_distributor' => 
  array (
    'label' => 'Mobile & tech distributors',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.serial_owned',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Owned stock serials, orders, prices',
    'check' => 'Serials extra does not prove device-service intake needs.',
  ),
  'auto_parts_distributor' => 
  array (
    'label' => 'Auto parts distributors',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Part identity, orders, customer groups',
    'check' => 'Individual serials and price tiers not universal.',
  ),
  'packaging' => 
  array (
    'label' => 'Packaging & box suppliers',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.measured',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Units/conversions, making versus distributing',
    'check' => 'Wholesale label may hide in-house production.',
  ),
  'office_supplies' => 
  array (
    'label' => 'Stationery & office supplies',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Goods/services mix, ordering and prices',
    'check' => 'Retail counter can coexist with B2B distribution.',
  ),
  'chemicals' => 
  array (
    'label' => 'Chemical & industrial cleaning',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
      4 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
    ),
    'unresolved' => 'Lots/expiry, measured units, procurement',
    'check' => 'Expiry extra does not cover safety/certification requirements automatically.',
  ),
  'import_export' => 
  array (
    'label' => 'Import / export trading firms',
    'sector' => 'wholesale',
    'preset' => 'wholesale',
    'template' => 
    array (
      0 => 'activity.goods',
      1 => 'sale.bill',
      2 => 'sale.order_later',
      3 => 'items.resale_stock',
    ),
    'raise' => 
    array (
    ),
    'unresolved' => 'Ownership/stock, provider channels, cost allocation',
    'check' => 'Landed cost beta; forwarding/service-only work can differ from wholesaling.',
  ),
  'commercial_bakery' => 
  array (
    'label' => 'Commercial bakeries & confectioneries',
    'sector' => 'manufacturing',
    'preset' => 'bakery',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'food.counter_takeaway',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Material/output recording, batches, wholesale orders',
    'check' => 'Purchases/PO extras not proof of credit; outsourced goods may also be resold.',
  ),
  'tailoring' => 
  array (
    'label' => 'Tailoring & custom stitching workshops',
    'sector' => 'manufacturing',
    'preset' => 'tailoring',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8a',
      2 => 'Q8g',
    ),
    'unresolved' => 'Customer materials versus own fabrics; fittings/jobs; making',
    'check' => 'Customer-owned material, measurements and production runs require distinct scope checks.',
  ),
  'furniture_maker' => 
  array (
    'label' => 'Furniture makers & woodworking',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
      1 => 'Q8g',
    ),
    'unresolved' => 'Bespoke jobs, materials, output, deposits',
    'check' => 'Job/custom production and standard batch runs differ.',
  ),
  'coffee_spice' => 
  array (
    'label' => 'Coffee roasters, spice blenders & craft drinks',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
      3 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Recipes/blending, outputs, batches/expiry and units',
    'check' => 'Batch extra does not prove every sale requires run tracking.',
  ),
  'signage_print' => 
  array (
    'label' => 'Signage & custom print shops',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q3',
      1 => 'Q8a',
      2 => 'Q8f',
    ),
    'unresolved' => 'Service/custom job versus goods production; material use',
    'check' => 'Quote/prepress/artwork workflows may be unsupported despite maker label.',
  ),
  'soap_candle' => 
  array (
    'label' => 'Soap & candle makers',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
      3 => 'id.batch_expiry',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Recipes/materials, output batches, versions/expiry',
    'check' => 'Expiry candidate not universal to candles; type name combines different products.',
  ),
  'kit_assembly' => 
  array (
    'label' => 'Hardware assembly & kit packing',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
    ),
    'unresolved' => 'BOM/output versus sale bundle auto-deduction',
    'check' => 'Composite auto-deduction beta; production runs are not an equivalent substitute.',
  ),
  'aluminium_glass' => 
  array (
    'label' => 'Aluminium & glass fabrication',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
      3 => 'activity.services',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
    ),
    'unresolved' => 'Making plus installation, units, customer jobs',
    'check' => 'Current services extra identifies a candidate mixed scope, not confirmed use.',
  ),
  'leather_goods' => 
  array (
    'label' => 'Leather goods & bag makers',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
      3 => 'id.variants',
    ),
    'raise' => 
    array (
      0 => 'Q5',
      1 => 'Q8a',
    ),
    'unresolved' => 'Making/output, actual sizes/colours, channels',
    'check' => 'Variants extra and manufacture label do not settle every workflow.',
  ),
  'custom_merch' => 
  array (
    'label' => 'Custom gift & merchandise assembly',
    'sector' => 'manufacturing',
    'preset' => 'light_manufacturing',
    'template' => 
    array (
      0 => 'activity.making',
      1 => 'sale.order_later',
      2 => 'items.work_materials',
    ),
    'raise' => 
    array (
      0 => 'Q8a',
    ),
    'unresolved' => 'Custom orders, variants, outsourced versus own making',
    'check' => 'Making elsewhere may need billing/orders without full production.',
  ),
);
