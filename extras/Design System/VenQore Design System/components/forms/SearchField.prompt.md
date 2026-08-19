One-line: the app's global search pill, with a mono shortcut cap.

```jsx
<SearchField shortcut="⌘K" onChange={e => setQ(e.target.value)} />
```

Unlike other inputs this one IS a pill — it lives in the top bar next to avatars and icon buttons, and the pill keeps that row coherent.
