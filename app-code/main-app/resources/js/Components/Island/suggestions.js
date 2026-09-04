/**
 * What people actually ask a POS system.
 *
 * The first build offered four prompts, which reads as a demo rather than a
 * tool. These are grouped by domain so the list stays scannable at 26 entries,
 * and every one maps to something Reckoner can answer from live store data —
 * no aspirational questions that come back empty.
 */
export const SUGGESTION_GROUPS = [
  {
    id: 'sales',
    label: 'Sales',
    items: [
      { prompt: 'sales today', label: "Today's sales" },
      { prompt: 'sales this week', label: 'Sales this week' },
      { prompt: 'sales this month vs last month', label: 'This month vs last month' },
      { prompt: 'best selling products', label: 'Best selling products' },
      { prompt: 'sales by branch', label: 'Sales by branch' },
      { prompt: 'average order value', label: 'Average order value' },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    items: [
      { prompt: 'profit this month', label: 'Profit this month' },
      { prompt: 'cash in hand', label: 'Cash in hand' },
      { prompt: 'expenses this month', label: 'Expenses this month' },
      { prompt: 'receivables', label: 'Customer receivables' },
      { prompt: 'payables', label: 'Supplier payables' },
      { prompt: 'tax collected this month', label: 'Tax collected' },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    items: [
      { prompt: 'low stock', label: 'Low stock items' },
      { prompt: 'out of stock items', label: 'Out of stock' },
      { prompt: 'total stock value', label: 'Total stock value' },
      { prompt: 'dead stock', label: 'Dead stock' },
      { prompt: 'items expiring soon', label: 'Expiring soon' },
      { prompt: 'stock by warehouse', label: 'Stock by warehouse' },
    ],
  },
  {
    id: 'people',
    label: 'Customers',
    items: [
      { prompt: 'top customers', label: 'Top customers' },
      { prompt: 'customers who have not bought in 60 days', label: 'Inactive customers' },
      { prompt: 'new customers this month', label: 'New customers this month' },
      { prompt: 'customer balances', label: 'Customer balances' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { prompt: 'purchases this month', label: 'Purchases this month' },
      { prompt: 'pending purchase orders', label: 'Pending purchase orders' },
      { prompt: 'invoices due this week', label: 'Invoices due this week' },
      { prompt: 'held orders', label: 'Held orders' },
      { prompt: 'staff attendance today', label: 'Staff attendance today' },
    ],
  },
];

export const ALL_SUGGESTIONS = SUGGESTION_GROUPS.flatMap(g =>
  g.items.map(i => ({ ...i, group: g.label, groupId: g.id }))
);

/** Recent searches first, then everything else, de-duplicated by prompt. */
export const buildSuggestionFeed = (recent = []) => {
  const seen = new Set();
  const feed = [];
  recent.forEach((r) => {
    const key = r.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    feed.push({ prompt: r, label: r, group: 'Recent', groupId: 'recent', recent: true });
  });
  ALL_SUGGESTIONS.forEach((s) => {
    const key = s.prompt.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    feed.push(s);
  });
  return feed;
};
