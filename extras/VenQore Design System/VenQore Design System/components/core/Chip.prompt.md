One-line: filter / segment chip — the app's main way of narrowing a list.

```jsx
<Chip selected>All</Chip>
<Chip count={12} onClick={() => setTab("overdue")}>Overdue</Chip>
```

Selected state is a mint fill with the accent glow; unselected is a white pill with a hairline. Springs on hover.
