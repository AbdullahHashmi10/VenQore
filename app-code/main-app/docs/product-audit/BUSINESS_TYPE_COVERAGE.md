# Every business type and its scenario

Generated from config/business_types.php and config/ai_builder.php on 16 October 2026. A business label or descriptive note is positioning metadata, not proof of specialist capability. Candidate modules combine the base preset and type extras before dependency resolution, capability checks, plans, roles and non-live filtering. No specialized clinical, regulated-product, legal-practice, school administration or industrial ERP capability is implied.

## Services, repairs & field trades

| Business | Starting preset | Non-live / unknown candidates | Specialist note to verify |
| --- | --- | --- | --- |
| Gadget & phone repair shops | repair_workshop | — | Job cards, IMEI intake, parts deduction, repair warranty |
| Computer & laptop repair centres | repair_workshop | — | — |
| Auto repair & mechanic garages | repair_workshop | — | Parts and technician labour on one invoice |
| Appliance repair (AC, fridges, washers) | field_service | — | — |
| Bicycle & motorcycle service centres | repair_workshop | — | — |
| Hair salons & barber shops | salon | — | Staff commission, appointments, repeat-client khata |
| Nail salons & spas | salon | — | — |
| Pet grooming & veterinary clinics | salon | — | — |
| Freelance designers & developers | professional_services | — | Milestone invoices, zero-inventory ledger |
| Digital marketing & SEO agencies | professional_services | — | Monthly retainers on recurring invoices |
| Consultants & business coaches | professional_services | — | Hourly and session billing |
| Accountants, tax consultants & auditors | professional_services | — | — |
| Lawyers & legal practices | professional_services | — | — |
| Architects & interior designers | professional_services | — | Quotation to final bill |
| Photographers & videographers | professional_services | — | Equipment hire and shoot booking |
| Electricians & electrical contractors | field_service | — | Tool management and technician dispatch |
| Plumbing & sanitary contractors | field_service | — | — |
| Carpentry & woodwork services | field_service | — | — |
| Painters & renovation contractors | field_service | — | — |
| Cleaning & janitorial companies | field_service | — | — |
| HVAC installation & maintenance | field_service | — | — |
| Pest control services | field_service | — | — |
| Equipment & tool rental | rental_hire | — | Tool check-out and check-in |
| Event decorators & sound hire | rental_hire | — | — |
| Gyms, fitness studios & trainers | membership_studio | — | Recurring memberships |
| Tuition centres & music/art academies | membership_studio | — | — |

## Retail & merchandising

| Business | Starting preset | Non-live / unknown candidates | Specialist note to verify |
| --- | --- | --- | --- |
| Grocery & kiryana stores | grocery | — | Loose weights, pack units, quick-pick |
| Supermarkets & minimarts | grocery | — | High-speed scanning, scale barcodes |
| Pharmacies & medical stores | pharmacy | — | Batches, expiry alerts, FEFO, drug registers |
| Surgical & medical equipment suppliers | retail_shop | — | — |
| Mobile phone & gadget retailers | mobile_electronics | — | IMEI serials, instant warranty cards |
| Consumer electronics & home appliances | mobile_electronics | — | — |
| Fashion & garment boutiques | clothing | — | Size/colour matrix, WooCommerce sync |
| Shoe & footwear stores | clothing | — | — |
| Jewellery & watch shops | retail_shop | — | — |
| Cosmetics & perfume stores | retail_shop | — | — |
| Hardware & paint stores | hardware_store | — | Sold by length, weight or piece |
| Sanitary & plumbing supply stores | hardware_store | — | — |
| Building materials, cement & steel | hardware_store | — | — |
| Furniture & home décor stores | retail_shop | — | — |
| Bookstores & stationery shops | retail_shop | — | — |
| Toy & hobby stores | retail_shop | — | — |
| Pet supply stores | retail_shop | — | — |
| Auto spare parts & accessories | hardware_store | — | — |
| Tyre & battery dealers | mobile_electronics | — | Serial and warranty tracking |
| Eyewear & optical boutiques | retail_shop | — | — |
| Gift, flower & craft shops | retail_shop | — | — |
| Vape & tobacco stores | retail_shop | — | — |
| Sports & outdoor equipment | clothing | — | — |
| Electrical & lighting stores | hardware_store | — | — |
| Kitchenware & crockery stores | retail_shop | — | — |

## Food, beverage & hospitality

| Business | Starting preset | Non-live / unknown candidates | Specialist note to verify |
| --- | --- | --- | --- |
| Dine-in restaurants | restaurant | — | Floor plan, table service, split bills, kitchen tickets |
| Cafés & coffee houses | cafe | — | Rapid counter POS, ingredient deduction |
| Chai & tea shops | cafe | — | — |
| Artisan bakeries & cake shops | bakery | — | Advance orders, batch recipes |
| Fast food, burger & pizza outlets | food_counter | — | — |
| Ice cream & dessert parlours | food_counter | — | — |
| Juice, shake & smoothie bars | food_counter | — | — |
| Food trucks & kiosks | food_counter | — | Offline-first operation |
| Sweet & mithai shops | bakery | — | Weighing scale and box packs |
| Catering businesses | catering | — | Event quotes, bulk recipes |
| Cloud & dark kitchens | food_counter | — | — |
| Pubs, bistros & lounges | restaurant | — | — |

## Wholesale, trade & B2B distribution

| Business | Starting preset | Non-live / unknown candidates | Specialist note to verify |
| --- | --- | --- | --- |
| FMCG & packaged-goods wholesalers | wholesale | — | Tiered prices, cartons to pieces |
| Grain, flour & bulk commodities | wholesale | — | — |
| Garment & fabric stockists | wholesale | — | — |
| Hardware & tools wholesalers | wholesale | — | — |
| Electrical supplies wholesalers | wholesale | — | — |
| Pharmaceutical wholesalers & stockists | wholesale | — | — |
| Mobile & tech distributors | wholesale | — | — |
| Auto parts distributors | wholesale | — | — |
| Packaging & box suppliers | wholesale | — | — |
| Stationery & office supplies | wholesale | — | — |
| Chemical & industrial cleaning | wholesale | — | — |
| Import / export trading firms | wholesale | — | — |

## Light manufacturing & assembly

| Business | Starting preset | Non-live / unknown candidates | Specialist note to verify |
| --- | --- | --- | --- |
| Commercial bakeries & confectioneries | bakery | — | Flour and sugar to bread, deducted automatically |
| Tailoring & custom stitching workshops | tailoring | — | — |
| Furniture makers & woodworking | light_manufacturing | — | Wood and hardware into a finished table |
| Coffee roasters, spice blenders & craft drinks | light_manufacturing | — | — |
| Signage & custom print shops | light_manufacturing | — | — |
| Soap & candle makers | light_manufacturing | — | — |
| Hardware assembly & kit packing | light_manufacturing | — | — |
| Aluminium & glass fabrication | light_manufacturing | — | — |
| Leather goods & bag makers | light_manufacturing | — | — |
| Custom gift & merchandise assembly | light_manufacturing | — | — |

## Every starting preset

| Preset | Label | Candidate modules | Non-live candidates |
| --- | --- | --- | --- |
| pos_only | Simple Counter | products, pos | — |
| retail_shop | Retail Shop | products, pos, inventory, customers, khata_credit, payments, expenses, barcodes_labels, reports, online_store, onsite_catalogue | — |
| grocery | Grocery / Kiryana | products, pos, inventory, units_of_measure, purchases, suppliers, customers, khata_credit, payments, expenses, barcodes_labels, cash_register, reports, online_store, onsite_catalogue | — |
| pharmacy | Pharmacy | products, pos, inventory, batches_expiry, purchases, suppliers, customers, khata_credit, payments, expenses, barcodes_labels, reports | — |
| cafe | Cafe | products, pos, inventory, cookbook, expenses, online_store, onsite_catalogue | — |
| restaurant | Restaurant | products, pos, park_recall, table_service, cookbook, inventory, expenses, staff_attendance, reports, online_store, onsite_catalogue | — |
| bakery | Bakery | products, pos, inventory, cookbook, production_runs, batches_expiry, sales_orders, customers, expenses, reports, online_store, onsite_catalogue | — |
| mobile_electronics | Mobile & Electronics | products, pos, inventory, serials, purchases, suppliers, customers, khata_credit, payments, sales_returns, expenses, reports, online_store, onsite_catalogue | — |
| clothing | Clothing & Footwear | products, variants, pos, inventory, barcodes_labels, customers, sales_returns, expenses, reports, online_store, onsite_catalogue | — |
| hardware_store | Hardware / General Store | products, pos, inventory, units_of_measure, purchases, suppliers, customers, khata_credit, payments, expenses, reports, online_store, onsite_catalogue | — |
| wholesale | Wholesale / Distribution | products, inventory, multi_location, stock_transfers, sales_orders, pricing_tiers, purchases, suppliers, purchase_orders, customers, khata_credit, payments, accounting_workspace, reports | — |
| multi_branch_retail | Multi-Branch Retail | products, pos, inventory, multi_location, stock_transfers, purchases, suppliers, customers, khata_credit, staff_attendance, cash_register, expenses, reports, online_store, onsite_catalogue | — |
| freelancer | Freelancer / Consultant | services, invoicing, quotations, sales_returns, customers, expenses, reports | quotations |
| salon | Salon / Spa | services, customers, invoicing, staff_attendance, loyalty_gift, expenses, reports | — |
| repair_workshop | Repair Workshop | services, products, pos, park_recall, inventory, customers, invoicing, expenses, reports | — |
| field_service | Field Service & Trades | services, products, inventory, customers, invoicing, purchases, suppliers, staff_attendance, payments, expenses, reports | — |
| professional_services | Professional Services | services, customers, invoicing, recurring_invoices, payments, expenses, reports | — |
| membership_studio | Memberships & Classes | services, customers, invoicing, recurring_invoices, staff_attendance, payments, expenses, reports | — |
| rental_hire | Rental & Hire | products, services, inventory, pre_sales, customers, invoicing, payments, expenses, reports | — |
| food_counter | Quick-Service Food | products, pos, inventory, cookbook, cash_register, expenses, reports, online_store, onsite_catalogue | — |
| catering | Catering | products, inventory, cookbook, sales_orders, customers, invoicing, purchases, suppliers, payments, expenses, reports | — |
| light_manufacturing | Light Manufacturing | products, inventory, cookbook, production_runs, purchases, suppliers, purchase_orders, sales_orders, customers, invoicing, payments, expenses, reports | — |
| tailoring | Tailoring & Stitching | products, inventory, services, sales_orders, customers, khata_credit, payments, staff_attendance, expenses, reports | — |

The CSV includes the problem, full scenario and measurement for every type. Run a journey for every unique preset and every type-specific module difference; do not call the whole type family tested because one example passed.
