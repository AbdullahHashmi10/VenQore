# Builder business-type coverage: all 85 catalogue entries

14 October 2026. Design classification only. No runtime tests performed.

Use with BUILDER_DECISION_SYSTEM_V2.md. Every type contributes question priorities and a disclosed starting template, not permanent module facts. Every technical module follows the 48-entry policy ledger in that specification. This avoids 4,080 independently maintained type-by-module decisions drifting away from real activities.

The preset and extra modules below are read from the current local catalogue. Their contents are context, not approved universal defaults. A blank extra means no additional type-level modules; its preset can still contain many defaults.

For every row: confirm consequential facts; allow mixed activity; use the same complete workflow bundles; preserve skip as unknown; verify exact supported behaviours. Priorities below are design recommendations, not calibrated probabilities or owner-validated evidence.

## services

| Business type | Current preset | Current type extras | High-value unresolved facts | Counterexample / capability check |
|---|---|---|---|---|
| phone_repair | repair_workshop | serials | Job lifecycle, customer-device identity, bought spare parts | Customer IMEI is not resale inventory; warranty/intake behaviour needs verification. |
| computer_repair | repair_workshop | serials | Job lifecycle, customer assets, bought parts | Service serial intake and stocked-device serials are different. |
| auto_repair | repair_workshop | — | Jobs, parts/labour, appointments and bays | Vehicle/bay needs do not prove table service or supported workshop detail. |
| appliance_repair | field_service | — | Field jobs, materials, scheduling | Site visits do not imply route optimisation or multiple stock locations. |
| bike_service | repair_workshop | — | Repair jobs, parts, booked work | Customer bicycle identity is not stock ownership. |
| salon_barber | salon | — | Appointments versus walk-in; retail versus consumed supplies | Retail products, batches and sizes cannot be excluded by services sector. |
| nail_spa | salon | — | Appointments, consumable quantities, paid treatments | Chemicals may expire; products need not be sold to need materials tracking. |
| pet_care | salon | products, inventory | Bookings, service work, supplied/sold goods | Current products/inventory extras are suggestions, not proof all owners hold stock. |
| freelance_creative | professional_services | — | Client bills, project stages, manual versus automatic recurrence | Monthly invoice is not automation; jobs need not be repair tickets. |
| marketing_agency | professional_services | — | Client/project billing, retainers, team access | Campaign delivery and approval workflows are not supplied merely by invoicing. |
| consultant | professional_services | — | Client bills, session/project work, payment stages | Appointments and ongoing work need separate scope; no assumed stock. |
| accounting_firm | professional_services | — | Client work and billing; internal accounting tasks | Being an accounting firm does not mean clients' books are managed in this tenant. |
| law_firm | professional_services | — | Client billing, work stages, deposits | Case management and trust/client-money accounting are distinct support requirements. |
| architect_interior | professional_services | — | Project billing, advances, bought project materials | Design-only and material procurement are different; no universal manufacturing. |
| photo_video | professional_services | — | Bookings, staged payments, equipment/hire needs | Owning cameras does not imply depreciation register or rental availability support. |
| electrician | field_service | — | Field jobs, bought versus customer parts, units | Service sector must allow materials inventory and purchasing. |
| plumber | field_service | — | Job stages, pipes/materials, supplier/customer balances | Bought lengths and customer-provided materials are separate paths. |
| carpenter | field_service | — | On-site work versus making; material ownership | May be mixed services/manufacturing; do not lock the field-service preset. |
| painter_renovation | field_service | — | Jobs/projects, deposits, paint quantities | Litres and material buying are relevant despite service classification. |
| cleaning | field_service | — | One-off/recurring jobs, consumables, attendance | Repeated visits do not prove automatic invoices or payroll. |
| hvac | field_service | — | Scheduled field/repair jobs, parts and customer equipment | Installation, repair and resale may coexist; dispatch capabilities need verification. |
| pest_control | field_service | — | Scheduled/repeat work, chemicals, batches/expiry | Service sector must not suppress expiry or measured materials. |
| equipment_rental | rental_hire | — | Availability, hire periods, deposits and returns | Recurring invoices alone do not provide a complete rental workflow. |
| event_hire | rental_hire | — | Booking dates, allocated hired assets, returns/deposits | Stock sale reservations are not automatically rental availability. |
| gym_fitness | membership_studio | — | Membership billing, sessions, access needs | Membership access/attendance is not guaranteed by recurring invoicing. |
| tuition_academy | membership_studio | — | Fees, recurring billing intent, classes/students | School/class/student management is beyond generic billing unless verified. |

## retail

| Business type | Current preset | Current type extras | High-value unresolved facts | Counterexample / capability check |
|---|---|---|---|---|
| grocery | grocery | — | Counter/other sales, stock source, payment timing, units/expiry | Single shop remains single regardless of catalogue size; side services possible. |
| supermarket | grocery | stock_takes | Sales channels, independent stock counts, users | Size or current stock_takes extra does not prove multi-location/attendance. |
| pharmacy | pharmacy | — | Batch/expiry requirements, stock/buying, selling | Do not infer clinical/prescription features or impose stock traits against explicit scope. |
| surgical_supplies | retail_shop | batches_expiry, serials, purchases, suppliers | Batch/serial identity as applicable, procurement and channels | Current extras do not establish every item needs both batches and serials. |
| mobile_retail | mobile_electronics | — | Serialised owned stock, sales/returns, optional repair | IMEI resale and customer repair-device intake must stay distinct. |
| electronics | mobile_electronics | — | Serial/warranty needs, variants, buying, repair side activity | Warranty administration is a separate behaviour to verify, not an automatic promise. |
| fashion | clothing | — | Variant requirements, counter/online, stock source | Clothing can be distinct one-off items; variants not universal. |
| footwear | clothing | — | Sizes/styles, stock, channels | Size sets do not prove multiple warehouses or barcode printing. |
| jewellery | retail_shop | serials | Individual identity, measured quantity, bespoke/service activity | Serial module does not necessarily support purity, metal pricing or hallmark workflows. |
| cosmetics | retail_shop | batches_expiry | Expiry/lot needs, variants, retail/services | Expiry extra is a strong candidate, not confirmed practice. |
| hardware | hardware_store | — | Measured/conversion units, procurement, trade prices | Bulk volume does not prove branches, customer credit or formal tenders. |
| sanitary_supply | hardware_store | — | Units, versions, customer orders | Retailing fixtures does not prove installation/job management. |
| building_materials | hardware_store | sales_orders | Delivery/later fulfilment, units, procurement | Sales-order extra does not prove delivery routing or credit. |
| furniture_store | retail_shop | sales_orders | Goods orders/deposits, resale versus making | Sold furniture does not imply manufacturing; deposit not always stock allocation. |
| books_stationery | retail_shop | — | Item quantities, counter/online, barcodes | Stationery services/printing are possible secondary activities. |
| toys | retail_shop | — | Item versions, sales channels, stock source | No default reward programme merely because retail. |
| pet_supply | retail_shop | batches_expiry | Food expiry, other goods, service side activities | Expiry candidate is item-specific; service activity can reopen. |
| auto_parts | hardware_store | serials | Part catalogue/identity, units and repair side work | Serials not universal to all spare parts. |
| tyre_battery | mobile_electronics | — | Individual/warranty identity, fitting service, buying | Installation services and inventory may coexist. |
| optical | retail_shop | sales_orders | Product sales, client orders, optional fitting/examination | Optical/prescription workflows are not supplied merely by sales_orders. |
| gift_flower | retail_shop | — | Made versus resold goods, dated orders/delivery | Custom arrangements can require material consumption; retail label insufficient. |
| vape_tobacco | retail_shop | — | Item/variant/expiry scope, channels | No inferred compliance/regulatory capability from trade label. |
| sports | clothing | — | Goods versions, services/hire where applicable | Clothing preset may overfit non-apparel sports equipment. |
| electrical_lighting | hardware_store | — | Units/variants, supply, installation side work | Service branch can coexist with hardware retail. |
| kitchenware | retail_shop | — | Item sets/versions, stock source and channels | Bundled/auto-deduction requests require capability check; composites beta. |

## food

| Business type | Current preset | Current type extras | High-value unresolved facts | Counterexample / capability check |
|---|---|---|---|---|
| restaurant | restaurant | — | Tables/kitchen, takeaway/delivery, ingredients and payment timing | No forced production runs; trade invoices/prices remain possible. |
| cafe | cafe | — | Counter versus seated service, kitchen, ingredients | Cafe label alone does not establish tables or rewards. |
| tea_shop | cafe | — | Counter/table service, ingredients, units | A takeaway stall is not automatically a dine-in restaurant. |
| bakery | bakery | — | Makes versus resells, batch/expiry, custom orders | Recipe/runs cannot be Core merely from bakery name. |
| fast_food | food_counter | — | Counter/table/order workflow and ingredient needs | Tableless kitchen tickets require actual supported capability check. |
| dessert | food_counter | — | Made versus bought products, measured/variant/expiry needs | Food variants are valid; no automatic formal production. |
| juice_bar | food_counter | — | Counter/orders, ingredient quantities and preparation | Measured ingredients do not necessarily mean recorded production runs. |
| food_truck | food_counter | — | Counter/orders, ingredients, independent stock counts | Moving physical location is not multiple simultaneous stock locations. |
| sweets | bakery | units_of_measure | Makes/resells, weight conversion, batch/expiry | Units extra is candidate; production must be independently established. |
| catering | catering | — | Advance jobs/orders, deposits, B2B prices, ingredients | Catering may be invoice-only without POS; food does not forbid trade pricing. |
| cloud_kitchen | food_counter | — | Online/order channels, delivery, kitchen/ingredients | No assumed tables; provider/delivery planning support must be verified. |
| pub_lounge | restaurant | — | Tables/bar counter, tabs, measured goods | Hospitality can need customer credit; no hard sector denial. |

## wholesale

| Business type | Current preset | Current type extras | High-value unresolved facts | Counterexample / capability check |
|---|---|---|---|---|
| fmcg_wholesale | wholesale | units_of_measure | Customer pricing/terms, orders, stock/units | Wholesale does not prove credit, multiple counts or many price tiers. |
| grain_commodities | wholesale | units_of_measure | Measured quantities, buying, customer terms | Units candidate; lot/quality-specific functionality needs verification. |
| fabric_stockist | wholesale | variants, units_of_measure | Length/conversions, actual variants, orders | Variants extra can be wrong for distinct-item stockists. |
| hardware_wholesale | wholesale | — | Units, order timing, trade-price scope | Bulk selling alone does not establish proposals or bank matching. |
| electrical_wholesale | wholesale | — | Goods identity, orders, supplier terms | Possible installation/services must stay available. |
| pharma_wholesale | wholesale | batches_expiry | Lot/expiry, procurement, customer terms | Expiry candidate important; compliance details not inferred. |
| tech_distributor | wholesale | serials | Owned stock serials, orders, prices | Serials extra does not prove device-service intake needs. |
| auto_parts_distributor | wholesale | — | Part identity, orders, customer groups | Individual serials and price tiers not universal. |
| packaging | wholesale | units_of_measure | Units/conversions, making versus distributing | Wholesale label may hide in-house production. |
| office_supplies | wholesale | — | Goods/services mix, ordering and prices | Retail counter can coexist with B2B distribution. |
| chemicals | wholesale | batches_expiry | Lots/expiry, measured units, procurement | Expiry extra does not cover safety/certification requirements automatically. |
| import_export | wholesale | — | Ownership/stock, provider channels, cost allocation | Landed cost beta; forwarding/service-only work can differ from wholesaling. |

## manufacturing

| Business type | Current preset | Current type extras | High-value unresolved facts | Counterexample / capability check |
|---|---|---|---|---|
| commercial_bakery | bakery | purchases, suppliers, purchase_orders | Material/output recording, batches, wholesale orders | Purchases/PO extras not proof of credit; outsourced goods may also be resold. |
| tailoring | tailoring | — | Customer materials versus own fabrics; fittings/jobs; making | Customer-owned material, measurements and production runs require distinct scope checks. |
| furniture_maker | light_manufacturing | — | Bespoke jobs, materials, output, deposits | Job/custom production and standard batch runs differ. |
| coffee_spice | light_manufacturing | batches_expiry | Recipes/blending, outputs, batches/expiry and units | Batch extra does not prove every sale requires run tracking. |
| signage_print | light_manufacturing | — | Service/custom job versus goods production; material use | Quote/prepress/artwork workflows may be unsupported despite maker label. |
| soap_candle | light_manufacturing | batches_expiry | Recipes/materials, output batches, versions/expiry | Expiry candidate not universal to candles; type name combines different products. |
| kit_assembly | light_manufacturing | — | BOM/output versus sale bundle auto-deduction | Composite auto-deduction beta; production runs are not an equivalent substitute. |
| aluminium_glass | light_manufacturing | services | Making plus installation, units, customer jobs | Current services extra identifies a candidate mixed scope, not confirmed use. |
| leather_goods | light_manufacturing | variants | Making/output, actual sizes/colours, channels | Variants extra and manufacture label do not settle every workflow. |
| custom_merch | light_manufacturing | — | Custom orders, variants, outsourced versus own making | Making elsewhere may need billing/orders without full production. |

## Catalogue boundaries

The proposed 20-business test includes a clinic, but clinic is not one of these 85 current catalogue keys. Do not silently equate medical practice requirements with ordinary billing. An unmatched business receives activity clarification and an explicit unsupported-needs check. Likewise labels such as tutor, gym, distributor and print shop must be matched through the actual catalogue rather than becoming a second naming system.

Selection of equipment_rental, event_hire, gym_fitness, tuition_academy, optical or jewellery is not proof the software supplies every specialised function suggested by the name. Assess actual required tasks and supported implementation. A recurring invoice cannot stand in for rental availability or membership access.

Coverage check performed for this document: 85 unique reviewed type keys match 85 extracted catalogue entries. Sector totals: services 26, retail 25, food 12, wholesale 12, manufacturing 10. This is document/source coverage, not application correctness or owner validation.
