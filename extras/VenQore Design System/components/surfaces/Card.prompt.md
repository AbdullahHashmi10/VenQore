One-line: the floating panel; every dashboard and marketing block is a Card.

```jsx
<Card eyebrow="Past 6 months" title="Purchases trend" action={<Select size="sm" options={["Month","Year"]}/>}>
  <Chart/>
</Card>
<Card tone="accent" title="Total projects">…</Card>
```

Exactly ONE `tone="accent"` card per screen — it is the screen's focal point. `tone="ink"` is the second-loudest slot (time tracker, download-the-app promo). Only pass `lift` when the whole card is clickable.
