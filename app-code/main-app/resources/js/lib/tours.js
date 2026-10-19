/**
 * Guided tours — the ONE place tour content lives.
 *
 * A tour is a list of steps. A step highlights a real element and explains it in
 * plain words. If the element can't be found (different screen size, a module
 * that is switched off) the step shows as a centred card instead — a tour must
 * never get stuck on something that isn't there.
 *
 *   go        route name to open first (only if we are not already there)
 *   match     substring of the page path that means "we are there"
 *   target    selector, or list of selectors (first visible one wins)
 *   advanceOn 'click': moving on happens when the person clicks the highlighted thing
 *   title/body  plain English, no jargon
 *
 * Targets are the stable ids already used across the app:
 *   #tour-sidebar-<area>  side menu AND dock (sell, purchase, stock, settings)
 *   #tour-omnisearch       the search bar
 *   #tour-add-product, #tour-product-name/price/cost/save      products
 *   #tour-expense-create-btn, #tour-expense-category/amount/submit
 *   #tour-invoice-customer / -paid / -complete                  every money document
 */

const SIDE = '#tour-sidebar-';

export const TOURS = {
    welcome: {
        title: 'A quick look around',
        steps: [
            { title: 'Welcome to VenQore', body: 'Here is a one-minute look at where everything lives. Each step lights up the real thing on your screen. Use the arrow keys or Next, and stop any time.' },
            { go: 'store.dashboard', match: 'dashboard', target: '#board', title: 'Your dashboard', body: 'This is your home screen. Every box on it is a live card showing one part of your business: sales, money owed, low stock and more.', where: 'Your cards will show up here once you have some activity.' },
            { target: '#board .vqc', pick: 0, labelFrom: '.vqc-eyebrow', bodyFor: 'This card is "{label}". It updates by itself as you sell, buy and spend. Tap it to open the full details.', title: 'A live card', body: 'Each card updates by itself as you sell, buy and spend. Tap it to open the full details.', optional: true },
            { target: '#board .vqc .vqc-move', pick: 0, title: 'Move cards around', body: 'Grab this handle and drag to put the card where you want it. Drag the edges to make it bigger or smaller.', optional: true },
            { target: '.vq-foot-add', title: 'Add more cards', body: 'Pick any reading you care about, like profit today or who owes you money, and choose how it looks. You can also let VenQore suggest cards that fit your store.', optional: true },
            { target: '#tour-stock-value', title: 'Stock value', body: 'What your stock on the shelf is worth right now. Tap it to open your products.', optional: true },
            { target: SIDE + 'sell', title: 'Sell', body: 'Everything about selling is under this button: the till, invoices, quotes and customer returns.' },
            { target: SIDE + 'purchase', title: 'Purchase', body: 'Order from suppliers, receive what arrives and send things back. Your stock updates by itself.' },
            { target: SIDE + 'stock', title: 'Stock', body: 'Your products and services, what you have on the shelf, and moving stock between places.' },
            { target: '#tour-omnisearch', title: 'Search for anything', body: 'Type a product, customer or invoice, or a page name. Press Ctrl + K to open it from anywhere.' },
            { target: '#tour-dock-pos', title: 'Open the till', body: 'This button takes you straight to the point of sale for quick counter sales.' },
            { target: SIDE + 'settings', title: 'Settings', body: 'Your business details, tax, receipts, team access and backups all live here.' },
            { title: 'You are ready', body: 'Open your profile any time to see what is left to set up. Each item there can show you how, step by step.' },
        ],
    },

    product: {
        title: 'Add your first product',
        steps: [
            { go: 'store.inventory.index', match: '/inventory', target: '#tour-add-product', advanceOn: 'click', title: 'Start here', body: 'Tap this button to add a product. If you also do work for customers, you can add a service from the same button.' },
            { target: '#tour-product-name', title: 'Give it a name', body: 'The name your customers and staff will recognise.' },
            { target: '#tour-product-price', title: 'Set the selling price', body: 'What a customer pays for one.' },
            { target: '#tour-product-cost', title: 'What it costs you', body: 'Optional, but it lets VenQore show your real profit on every sale.' },
            { target: '#tour-product-save', advanceOn: 'click', title: 'Save it', body: 'That is your first product. It is now ready to sell and to count in stock.' },
        ],
    },

    purchase: {
        title: 'Record a purchase',
        steps: [
            { go: 'store.purchases.index', match: '/purchases', target: ['a[href*="/purchases/create"]', '#tour-new-purchase'], advanceOn: 'click', title: 'Start a new purchase', body: 'Use this when you buy goods from a supplier.' },
            { target: '#tour-invoice-customer', title: 'Who did you buy from?', body: 'Pick your supplier, or add a new one right from here.' },
            { target: '.vqdoc-addline', title: 'What did you buy?', body: 'Add each item, with how many and what you paid for each. Your stock goes up when you save.' },
            { target: '#tour-invoice-paid', title: 'Did you pay yet?', body: 'Enter what you have paid so far. Leave it empty if you will pay the supplier later.' },
            { target: '#tour-invoice-complete', advanceOn: 'click', title: 'Save the purchase', body: 'Your stock is updated and the supplier balance is recorded.' },
        ],
    },

    sale: {
        title: 'Make your first sale',
        steps: [
            { go: 'store.sales.invoice.create', match: '/sales/invoice/create', target: '#tour-invoice-customer', title: 'Who is it for?', body: 'Choose a customer, or leave it as a walk-in. For quick counter sales you can also use the till from the button at the bottom.' },
            { target: '.vqdoc-addline', title: 'Add what you are selling', body: 'Search a product and set how many. The price comes from your product list.' },
            { target: '#tour-invoice-paid', title: 'Take payment', body: 'Enter what the customer paid now. Anything left stays on their account to collect later.' },
            { target: '#tour-invoice-complete', advanceOn: 'click', title: 'Finish the sale', body: 'Stock goes down, money is recorded and you can print or send the receipt.' },
        ],
    },

    expense: {
        title: 'Record an expense',
        steps: [
            { go: 'store.expenses.index', match: '/expenses', target: '#tour-expense-create-btn', advanceOn: 'click', title: 'Add an expense', body: 'Rent, power, wages, repairs: anything you spend to run the business.' },
            { target: '#tour-expense-category', title: 'What kind of expense?', body: 'Pick a category so your reports show where the money goes.' },
            { target: '#tour-expense-amount', title: 'How much?', body: 'The amount you paid.' },
            { target: '#tour-expense-submit', advanceOn: 'click', title: 'Save it', body: 'Your profit figures now include this cost.' },
        ],
    },
};

/** Which getting-started step launches which tour. */
export const TOUR_FOR_STEP = {
    inventory: 'product',
    purchase: 'purchase',
    sale: 'sale',
    expense: 'expense',
};
