<?php

/*
|--------------------------------------------------------------------------
| Signup gifts — the three extras every new workspace is offered free
|--------------------------------------------------------------------------
|
| Read by WorkspaceBuilderController::show() and passed to the builder as the
| `gifts` prop. This is the ONLY place the gift wording and the "worth" figures
| live; the page restates none of it.
|
| HONESTY RULES — read before editing:
|  1. A module may only be listed here if it is `billing => included` (or
|     metered with a free allowance on EVERY plan, Solo included) in
|     config/modules.php. A "gift" that later appears on an invoice is a lie.
|  2. `worth_monthly` is what a comparable stand-alone tool typically costs per
|     month, at the LOW end of the market (checked Oct 2026: stand-alone QR
|     menu apps ~$10–$50/mo, hosted web shops ~$20–$40/mo before apps). Keep
|     it conservative; the page says "typically" and shows it struck through,
|     never as a price we charge.
|  3. Never name a competitor on the page.
|  4. `ai_insights` is metered: the allowance per plan lives in
|     config/pricing.php (ai_credits_monthly). Its `note` must stay true.
|
| `default_on`:
|   'always'      — claimed for everyone
|   'sells_goods' — claimed when the proposal includes `products`; otherwise
|                   shown as "Add it — free" (a plumber does not need a menu,
|                   but may still want one)
*/

return [
    'headline' => 'Three extras, on the house',
    'lede'     => 'Each of these is a product people pay for on its own. With VenQore they come with your workspace — on every plan, including the free one.',
    'promise'  => 'No card. No upgrade needed. Switch any of them off whenever you like.',

    'items' => [
        'ai_insights' => [
            'title'         => 'AI Business Advisor',
            'tagline'       => 'Tells you what is selling, what is slipping and what to do next — in plain words, from your own numbers.',
            'icon'          => 'Sparkles',
            'worth_monthly' => 30,
            'note'          => 'Includes a monthly AI allowance on every plan. Gets sharper the longer you trade.',
            'default_on'    => 'always',
        ],
        'online_store' => [
            'title'         => 'Your Online Store',
            'tagline'       => 'A ready-to-share web shop with your products, prices and online ordering — no website builder needed.',
            'icon'          => 'Store',
            'worth_monthly' => 29,
            'note'          => 'Same stock and prices as your till, so nothing is entered twice.',
            'default_on'    => 'sells_goods',
        ],
        'onsite_catalogue' => [
            'title'         => 'QR Menu & Catalogue',
            'tagline'       => 'Customers scan a code at the counter or table and browse — or order — from their own phone.',
            'icon'          => 'QrCode',
            'worth_monthly' => 17,
            'note'          => 'Print the code once; it updates itself when your prices change.',
            'default_on'    => 'sells_goods',
        ],
    ],
];
