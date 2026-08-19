One-line: tooltip for icon buttons and the collapsed rail.

```jsx
<Tooltip label="Reports" side="right"><IconButton label="Reports">…</IconButton></Tooltip>
```

In real code, portal the bubble to `<body>` — a tooltip inside an `overflow:hidden` ancestor never renders, and no z-index fixes that.
