One-line: the VenQore action button — always a full pill, mint fill for the single primary action on a view.

```jsx
<Button icon={<Plus/>} onClick={save}>Add project</Button>
<Button variant="secondary">Import data</Button>
<Button variant="soft" size="sm">Month</Button>
```

Variants: `primary` (mint fill, coloured glow, white label), `secondary` (white surface + hairline), `soft` (teal-50 wash + teal text — use for filter/segment controls), `ghost` (bare, for tertiary), `danger`. Sizes 34/42/48px. Hover lifts 1px and deepens the fill; press scales to .97. Never scale a button up on hover.
