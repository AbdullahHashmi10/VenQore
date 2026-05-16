<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BlogController extends Controller
{
    private $posts = [
        [
            'uid' => '1',
            'slug' => 'your-business-has-been-lying-to-you-about-revenue',
            'title' => 'Your Business Has Been Lying to You About Revenue — Here\'s How to Find Out',
            'excerpt' => 'The "revenue" figure in most POS systems is SELECT SUM(total) FROM sales. That\'s it. That single number includes the government tax you collected. Tax you will hand over. Tax that was never yours.',
            'category' => 'Financial Truth',
            'author' => 'VenQore Editorial',
            'date' => '2026-04-10',
            'image' => '/images/blog/revenue-lie.jpg',
            'content' => 'I used to think I understood my revenue. I had a POS. It showed me daily totals. I could tell you within a few thousand what last month looked like. I felt like I had a handle on the numbers. Then I started looking at where those numbers actually came from.

The "revenue" figure in most POS systems is SELECT SUM(total) FROM sales. That\'s it. That single number — used for every dashboard card, every trend line, every monthly comparison — includes the government tax you collected. Tax you will hand over. Tax that was never yours.

In a 15% GST market, your displayed "revenue" is overstated by 13% before any other error enters the calculation.

**The COGS Problem Is Worse**

Most systems calculate your profit margin like this: take your current selling price, subtract your "cost price," and call it gross profit. Simple. Except: where does "cost price" come from?

In the vast majority of SMB software, cost_price is a single column on the product table. It gets overwritten every time you receive a purchase. Buy 100 units at $5, then buy another 100 at $8 — the system now believes your cost is $8. On all units. Including the ones sitting in your warehouse from the first batch.

Your historical profit reports are now fabricated. Every sale from before the price change shows the wrong margin.

**The Framework for Diagnosing Your Own System**

* Pull your last 12 months of revenue. Does that number include tax collected? Compare to your VAT return — if they\'re close, you\'ve been measuring gross.
* Find a product you bought at two different prices. Does your profit report show a step change at the second purchase date, or a static number?
* Find a month where you made a large return to a supplier. Did your inventory value adjust correctly?
* Ask your accountant: "Do your month-end numbers match what the system shows?" If not, you have a reconciliation problem.

**The Uncomfortable Conclusion**

If your software isn\'t built on double-entry bookkeeping, FIFO cost tracking, and immutable posted records — you don\'t have a financial system. You have a receipt generator that approximates your numbers after the fact.

The fix isn\'t to get a better accountant. It\'s to demand software that starts with the math.

> VenQore was built because we were tired of fabricated numbers. Every sale posts a journal entry. Every cost is tracked by batch. Every balance sheet balances. The books are always right — not because we work harder, but because the architecture won\'t allow them to be wrong.'
        ],
        [
            'uid' => '2',
            'slug' => 'the-hidden-tax-on-every-business-that-doesnt-track-customers-properly',
            'title' => 'The Hidden Tax on Every Business That Doesn\'t Track Customers Properly',
            'excerpt' => 'There\'s a number that almost no small business tracks, and it silently destroys more profit than any other single factor. It\'s the cost of a customer you already had — who left.',
            'category' => 'Growth Strategy',
            'author' => 'VenQore Editorial',
            'date' => '2026-04-12',
            'image' => '/images/blog/customer-retention.jpg',
            'content' => 'There\'s a number that almost no small business tracks, and it silently destroys more profit than any other single factor.

It\'s not your cost of goods. It\'s not your payroll. It\'s not even your rent.

It\'s the cost of a customer you already had — who left — and who you never noticed was gone.

**The Math of Customer Loss Is Brutal**

60–70% of customers who will never return show no visible signal of departure. They bought from you. They were satisfied enough not to complain. And then, somewhere between their last visit and now, they found another option — and stayed there. You never knew.

Your revenue didn\'t drop suddenly. It declined over 6 months, slowly, in a trend you attributed to seasonality. It was actually a list of names — people who used to come every three weeks and haven\'t been in for six months.

**The Signal Is in the Cadence**

Every repeat customer has a purchase rhythm. When that rhythm breaks, something changed. The window to intervene is about 2–3 cycles past their normal return date. After that, the relationship has to be rebuilt from scratch — at acquisition cost, not retention cost.

If you track 500 active customers, at any given time, 40–80 of them are past their expected return window. You have 2 weeks to reach out before they\'re effectively gone.

**The Framework for Building a Retention System**

* Establish a return cadence for each customer based on historical visit frequency.
* Define a churn threshold (typically 1.5x–2x their normal cadence).
* Create a touchpoint sequence: Day 35 check-in, Day 42 targeted offer, Day 56 personal escalation.
* Measure recovery rate. A 15% recovery rate on at-risk customers adds measurable revenue without a single new acquisition.
* Feed outcomes back into the model. Returning customers reset their cadence clock.

> VenQore\'s Retention Engine calculates expected return windows for every repeat customer and surfaces the ones who\'ve gone quiet. Not as a report you run — as an alert that reaches you before the relationship is gone. Because by the time you notice the revenue drop, the window has already closed.'
        ]
    ];

    public function index()
    {
        return Inertia::render('Marketing/Blog/Index', [
            'posts' => $this->posts
        ]);
    }

    public function show($slug)
    {
        $post = collect($this->posts)->firstWhere('slug', $slug);

        if (!$post) {
            abort(404);
        }

        return Inertia::render('Marketing/Blog/Show', [
            'post' => $post,
            'recentPosts' => collect($this->posts)->take(3)
        ]);
    }
}
