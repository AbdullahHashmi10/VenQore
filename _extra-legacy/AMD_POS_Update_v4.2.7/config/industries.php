<?php

return [
    'Retail' => [
        'group' => 'Big Retail',
        'type' => 'Supermarket / Grocery (Karyana)',
        'categories' => [
            'Fresh Produce' => ['Fruits', 'Vegetables'],
            'Dairy & Eggs' => [],
            'Beverages' => ['Cold Drinks', 'Juices', 'Water'],
            'Bakery' => [],
            'Canned Goods' => [],
            'Snacks & Confectionery' => ['Chips', 'Biscuits', 'Chocolates'],
            'Frozen Foods' => [],
            'Personal Care' => ['Soaps', 'Shampoos', 'Toothpaste'],
            'Household Cleaners' => ['Detergents', 'Surface Cleaners'],
        ],
        'units' => ['kg', 'g', 'lb', 'oz', 'liter', 'ml', 'pack', 'piece', 'can', 'bottle'],
        'attributes' => [
            'Weight/Volume' => ['500g', '1kg', '1L'],
            'Pack Size' => ['Single', 'Family Pack'],
            'Flavor' => ['Vanilla', 'Chocolate'],
        ],
        'settings' => [
            'batch_tracking' => false,
            'variants_enabled' => false,
        ]
    ],
    'Apparel' => [
        'group' => 'Big Retail',
        'type' => 'Fashion & Apparel Boutique',
        'categories' => [
            "Men's Clothing" => ['Shirts', 'Trousers'],
            "Women's Clothing" => ['Dresses', 'Tops'],
            "Kids & Baby" => [],
            "Footwear" => ['Casual', 'Formal', 'Sports'],
            "Activewear" => [],
            "Accessories" => ['Belts', 'Hats', 'Scarves'],
            "Outerwear" => ['Jackets', 'Coats'],
            "Underwear & Sleepwear" => [],
        ],
        'units' => ['piece', 'pair', 'set'],
        'attributes' => [
            'Size' => ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
            'Color' => ['Red', 'Blue', 'Black', 'White'],
            'Material' => ['Cotton', 'Polyester', 'Denim', 'Leather'],
            'Fit' => ['Slim', 'Regular', 'Loose'],
        ],
        'settings' => [
            'batch_tracking' => false,
            'variants_enabled' => true, // Size/Color enabled by default
        ]
    ],
    'Electronics' => [
        'group' => 'Big Retail',
        'type' => 'Electronics & Appliances',
        'categories' => [
            'Smartphones' => [],
            'Laptops & Computers' => ['Laptops', 'Desktops', 'Accessories'],
            'Televisions' => ['LED', 'Smart TV'],
            'Audio & Headphones' => ['Speakers', 'Headphones'],
            'Home Appliances' => ['Fridge', 'AC', 'Washing Machine'],
            'Cameras' => [],
            'Wearables' => ['Smartwatches'],
            'Cables & Chargers' => [],
        ],
        'units' => ['piece', 'box', 'set'],
        'attributes' => [
            'Storage' => ['64GB', '128GB', '1TB'],
            'Color' => ['Silver', 'Space Grey', 'Black'],
            'Condition' => ['New', 'Refurbished', 'Open Box'],
            'Screen Size' => ['13-inch', '15-inch', '55-inch'],
        ],
        'settings' => [
            'serial_tracking' => true, // IMEI tracking enabled
            'batch_tracking' => false,
        ]
    ],
    'Pharmacy' => [
        'group' => 'Big Retail',
        'type' => 'Pharmacy / Medical Store',
        'categories' => [
            'Prescription Medicine' => [],
            'OTC' => ['Pain Killers', 'Cough Syrup'],
            'Vitamins & Supplements' => [],
            'First Aid' => ['Bandages', 'Surgical'],
            'Medical Equipment' => ['BP Monitors', 'Thermometers'],
            'Baby Care' => ['Diapers', 'Baby Food'],
            'Personal Hygiene' => [],
        ],
        'units' => ['box', 'strip', 'bottle', 'tablet', 'capsule', 'tube', 'ml'],
        'attributes' => [
            'Dosage' => ['10mg', '500mg', '5ml'],
            'Pack Size' => ['10s', '30s', '100s'],
            'Form' => ['Tablet', 'Syrup', 'Injection', 'Gel'],
        ],
        'settings' => [
            'batch_tracking' => true, // Expiry dates enabled
            'serial_tracking' => false,
        ]
    ],
    'Hardware' => [
        'group' => 'Hard Goods',
        'type' => 'Hardware & Construction',
        'categories' => [
            'Hand Tools' => ['Hammers', 'Screwdrivers'],
            'Power Tools' => ['Drills', 'Saws'],
            'Fasteners' => ['Nuts', 'Bolts', 'Screws'],
            'Electrical' => ['Switches', 'Bulbs'],
            'Plumbing' => ['Pipes', 'Faucets'],
            'Paint & Finishes' => [],
            'Lumber & Wood' => [],
            'Safety Gear' => [],
        ],
        'units' => ['piece', 'set', 'kg', 'lb', 'meter', 'foot', 'liter', 'gallon'],
        'attributes' => [
            'Dimensions' => [],
            'Voltage' => ['12V', '110V', '220V'],
            'Material' => ['Steel', 'Brass', 'PVC', 'Wood'],
            'Grade' => ['Professional', 'DIY'],
        ],
    ],
    'AutoParts' => [
        'group' => 'Hard Goods',
        'type' => 'Auto Parts & Workshop',
        'categories' => [
            'Engine Parts' => [],
            'Tyres & Wheels' => [],
            'Batteries' => [],
            'Oils & Fluids' => ['Engine Oil', 'Coolant'],
            'Brakes' => [],
            'Filters' => [],
            'Body Parts' => ['Bumpers', 'Mirrors'],
            'Interior Accessories' => ['Mats', 'Covers'],
        ],
        'units' => ['piece', 'set', 'liter', 'quart', 'gallon'],
        'attributes' => [
            'Year' => ['2020', '2021', '2022'],
            'Position' => ['Left', 'Right', 'Front', 'Rear'],
            'Material' => ['Ceramic', 'Semi-Metallic'],
            'Viscosity' => ['5W-30', '10W-40'],
        ],
    ],
    'Furniture' => [
        'group' => 'Hard Goods',
        'type' => 'Furniture & Home Decor',
        'categories' => [
            'Living Room' => ['Sofas', 'Coffee Tables'],
            'Bedroom' => ['Beds', 'Wardrobes'],
            'Dining Room' => [],
            'Office Furniture' => ['Desks', 'Chairs'],
            'Outdoor Furniture' => [],
            'Lighting' => ['Lamps'],
            'Rugs & Carpets' => [],
            'Wall Decor' => [],
        ],
        'units' => ['piece', 'set'],
        'attributes' => [
            'Dimensions' => [],
            'Material' => ['Wood', 'Metal', 'Glass', 'Fabric'],
            'Color/Finish' => ['Oak', 'Walnut', 'White', 'Matte Black'],
            'Assembly' => ['Pre-assembled', 'Flat-pack'],
        ],
    ],
    'MobileRepair' => [
        'group' => 'Hard Goods',
        'type' => 'Mobile Repair & Accessories',
        'categories' => [
            'Cases & Covers' => [],
            'Screen Protectors' => [],
            'Chargers & Adapters' => [],
            'Power Banks' => [],
            'Replacement Parts' => ['Screens', 'Batteries'],
            'Used Devices' => [],
        ],
        'units' => ['piece'],
        'attributes' => [
            'Model Compatibility' => ['iPhone 13', 'Galaxy S22'],
            'Color' => [],
            'Material' => ['Silicone', 'Leather', 'Hard Plastic'],
            'Quality' => ['Original', 'OEM', 'Copy'],
        ],
        'settings' => [
            'variants_enabled' => true,
        ]
    ],
    'Cosmetics' => [
        'group' => 'Lifestyle',
        'type' => 'Cosmetics & Beauty',
        'categories' => [
            'Makeup' => ['Face', 'Eyes', 'Lips'],
            'Skincare' => ['Face Wash', 'Moisturizers'],
            'Hair Care' => ['Shampoo', 'Conditioner'],
            'Fragrances' => [],
            'Bath & Body' => [],
            'Tools & Brushes' => [],
            'Men\'s Grooming' => [],
        ],
        'units' => ['piece', 'pack', 'ml', 'fl oz', 'gram'],
        'attributes' => [
            'Shade/Tone' => ['Fair', 'Beige', 'Tan', 'Dark'],
            'Skin Type' => ['Oily', 'Dry', 'Sensitive', 'All'],
            'Volume' => ['50ml', '100ml'],
            'Scent' => ['Floral', 'Woody', 'Citrus'],
        ],
    ],
    'Sports' => [
        'group' => 'Lifestyle',
        'type' => 'Sports & Fitness',
        'categories' => [
            'Cardio Machines' => [],
            'Weights & Strength' => [],
            'Sportswear' => [],
            'Team Sports' => ['Soccer', 'Basketball'],
            'Yoga & Pilates' => [],
            'Camping & Outdoor' => [],
            'Supplements' => [],
        ],
        'units' => ['piece', 'pair', 'set', 'kg', 'lb'],
        'attributes' => [
            'Size' => ['S', 'M', 'L', 'XL'],
            'Weight' => ['5kg', '10kg', '20lbs'],
            'Gender' => ['Men', 'Women', 'Unisex'],
            'Flavor' => ['Vanilla', 'Chocolate'],
        ],
        'settings' => [
            'variants_enabled' => true, // Sizes
        ]
    ],
    'Toys' => [
        'group' => 'Lifestyle',
        'type' => 'Toys & Baby Store',
        'categories' => [
            'Action Figures' => [],
            'Dolls' => [],
            'Board Games & Puzzles' => [],
            'Outdoor Play' => [],
            'Baby Gear' => ['Strollers', 'Seats'],
            'Diapers & Wipes' => [],
            'Feeding' => [],
        ],
        'units' => ['piece', 'set', 'pack', 'box'],
        'attributes' => [
            'Age Group' => ['0-12m', '3+ years', '8+ years'],
            'Size' => ['Size 1', 'Size 2', 'Size 5'],
            'Color' => [],
            'Theme' => ['Animals', 'Cars', 'Superheroes'],
        ],
    ],
    'Optical' => [
        'group' => 'Lifestyle',
        'type' => 'Optical / Eyewear',
        'categories' => [
            'Frames' => [],
            'Sunglasses' => [],
            'Contact Lenses' => [],
            'Reading Glasses' => [],
            'Kids Eyewear' => [],
            'Lens Solutions' => [],
            'Accessories' => ['Cases', 'Chains'],
        ],
        'units' => ['piece', 'pair', 'box'],
        'attributes' => [
            'Frame Material' => ['Metal', 'Plastic', 'Titanium'],
            'Shape' => ['Round', 'Square', 'Aviator', 'Cat-eye'],
            'Lens Power' => ['+1.00', '-2.50'],
            'Color' => [],
        ],
    ],
    'PetShop' => [
        'group' => 'Lifestyle',
        'type' => 'Pet Shop',
        'categories' => [
            'Dog Food' => [],
            'Cat Food' => [],
            'Treats' => [],
            'Toys' => [],
            'Grooming' => [],
            'Collars & Leashes' => [],
            'Beds & Cages' => [],
            'Aquariums' => [],
        ],
        'units' => ['bag', 'can', 'piece', 'kg', 'lb'],
        'attributes' => [
            'Life Stage' => ['Puppy/Kitten', 'Adult', 'Senior'],
            'Weight' => [],
            'Flavor' => ['Chicken', 'Beef', 'Fish'],
            'Size' => ['Small Breed', 'Large Breed'],
        ],
    ],
    'Restaurant' => [
        'group' => 'Food & Beverage',
        'type' => 'Restaurant / Fast Food',
        'categories' => [
            'Appetizers' => [],
            'Mains' => [],
            'Burgers/Sandwiches' => [],
            'Pizza' => [],
            'Sides' => [],
            'Drinks' => [],
            'Desserts' => [],
            'Kids Menu' => [],
        ],
        'units' => ['serving', 'plate', 'piece', 'glass'],
        'attributes' => [
            'Serving Size' => ['Regular', 'Large', 'Family'],
            'Spice Level' => ['Mild', 'Medium', 'Hot'],
            'Add-ons' => ['Cheese', 'Bacon', 'Extra Sauce'],
        ],
    ],
    'Cafe' => [
        'group' => 'Food & Beverage',
        'type' => 'Cafe / Coffee Shop',
        'categories' => [
            'Hot Coffee' => [],
            'Iced Coffee' => [],
            'Tea' => [],
            'Bakery/Pastries' => [],
            'Sandwiches' => [],
            'Breakfast' => [],
            'Smoothies' => [],
        ],
        'units' => ['cup', 'mug', 'glass', 'piece'],
        'attributes' => [
            'Size' => ['Small/Tall', 'Medium/Grande', 'Large/Venti'],
            'Milk Type' => ['Whole', 'Skim', 'Oat', 'Almond', 'Soy'],
            'Temperature' => ['Hot', 'Iced'],
        ],
    ],
    'Bakery' => [
        'group' => 'Food & Beverage',
        'type' => 'Bakery',
        'categories' => [
            'Bread & Buns' => [],
            'Cakes' => [],
            'Pastries' => [],
            'Cookies' => [],
            'Donuts' => [],
            'Savory Snacks' => [],
            'Custom Orders' => [],
        ],
        'units' => ['piece', 'dozen', 'kg', 'lb', 'box'],
        'attributes' => [
            'Weight' => ['1kg', '2lb'],
            'Flavor' => ['Chocolate', 'Vanilla', 'Red Velvet'],
            'Dietary' => ['Gluten-Free', 'Vegan', 'Eggless'],
        ],
    ],
    'Solar' => [
        'group' => 'Niche',
        'type' => 'Solar & Energy',
        'categories' => [
            'Solar Panels' => [],
            'Inverters' => [],
            'Batteries' => [],
            'Charge Controllers' => [],
            'Mounting Systems' => [],
            'Cables & Wires' => [],
        ],
        'units' => ['piece', 'watt', 'volt', 'amp', 'meter', 'foot'],
        'attributes' => [
            'Power Output' => ['400W', '550W'],
            'Capacity' => ['100Ah', '200Ah'],
            'Type' => ['Monocrystalline', 'Polycrystalline'],
            'Warranty' => ['5 Years', '10 Years', '25 Years'],
        ],
        'settings' => [
            'serial_tracking' => true,
        ]
    ],
    'IT' => [
        'group' => 'Niche',
        'type' => 'Computer & IT Hardware',
        'categories' => [
            'Processors' => ['CPU'],
            'Graphics Cards' => ['GPU'],
            'Motherboards' => [],
            'RAM' => [],
            'Storage' => ['SSD', 'HDD'],
            'Cases' => [],
            'Power Supplies' => [],
            'Peripherals' => [],
        ],
        'units' => ['piece', 'box', 'kit'],
        'attributes' => [
            'Capacity' => ['8GB', '16GB', '1TB'],
            'Speed' => ['3200MHz', '3.5GHz'],
            'Chipset' => ['Intel', 'VenQore', 'NVIDIA'],
            'Form Factor' => ['ATX', 'Micro-ATX'],
        ],
        'settings' => [
            'serial_tracking' => true, // Serial numbers essential
        ]
    ],
    'Jewelry' => [
        'group' => 'Niche',
        'type' => 'Jewelry',
        'categories' => [
            'Rings' => [],
            'Necklaces' => [],
            'Earrings' => [],
            'Bracelets' => [],
            'Watches' => [],
            'Loose Stones' => [],
            'Sets' => [],
        ],
        'units' => ['piece', 'pair', 'set', 'gram', 'carat'],
        'attributes' => [
            'Material' => ['Gold', 'Silver', 'Platinum', 'Rose Gold'],
            'Purity' => ['18K', '21K', '24K', '925 Sterling'],
            'Size' => ['Ring Size 6', 'Ring Size 7', 'Ring Size 8'],
            'Stone' => ['Diamond', 'Ruby', 'Sapphire', 'Zircon'],
        ],
        'settings' => [
            'weight_decimals' => 3, // Support for precise grams/tola
        ]
    ],
    'Bookstore' => [
        'group' => 'Niche',
        'type' => 'Bookstore & Stationery',
        'categories' => [
            'Fiction' => [],
            'Non-Fiction' => [],
            'Children\'s Books' => [],
            'Textbooks' => [],
            'Office Supplies' => [],
            'Art Supplies' => [],
            'Notebooks' => [],
            'Greeting Cards' => [],
        ],
        'units' => ['piece', 'pack', 'set'],
        'attributes' => [
            'Format' => ['Hardcover', 'Paperback'],
            'Color' => [],
            'Sheet Count' => ['100 pages', '200 pages'],
        ],
    ],
    'Consulting' => [
        'group' => 'Niche',
        'type' => 'General Service / Consulting',
        'categories' => [
            'Services' => [],
            'Consultations' => [],
            'Maintenance Packages' => [],
            'Hourly Rates' => [],
            'Project Fees' => [],
        ],
        'units' => ['hour', 'day', 'session', 'project', 'month'],
        'attributes' => [
            'Duration' => ['30 mins', '1 hour'],
            'Level' => ['Junior', 'Senior', 'Expert'],
            'Type' => ['Remote', 'On-site'],
        ],
    ]
];
