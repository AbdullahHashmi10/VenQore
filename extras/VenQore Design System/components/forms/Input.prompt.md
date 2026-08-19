One-line: the standard labelled text field — 48px tall, 14px radius, label above.

```jsx
<Input label="Business name" placeholder="Rana Traders" />
<Input label="Opening balance" prefix="Rs" value={v} onChange={e => set(e.target.value)} />
<Input label="Email" error="That address is already registered" />
```

Font-size stays at 16px so iOS Safari never zooms on focus. Focus shows the mint ring (`--vq-ring-focus`), not a colour swap.
