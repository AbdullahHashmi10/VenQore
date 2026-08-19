One-line: empty region copy + action; `Skeleton` for loading.

```jsx
<EmptyState title="No purchases yet" body="Record your first purchase and stock levels start tracking themselves." action={<Button size="sm">Record purchase</Button>}/>
<Skeleton height={20} width={180}/>
```

Never render the words "No data". Say what goes here, then offer the action that puts it there.
