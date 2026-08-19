One-line: transient confirmation, bottom-right on desktop.

```jsx
<Toast title="Blueprint approved" description="Your system is being assembled — about 40 seconds." onDismiss={close}/>
```

Success auto-dismisses at 4s; errors never auto-dismiss. Lives at `--vq-z-toast` so it clears an open modal.
