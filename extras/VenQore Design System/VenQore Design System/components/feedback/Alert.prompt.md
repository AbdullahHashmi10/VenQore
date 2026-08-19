One-line: inline alert used in the dashboard "Alerts" rail and above forms.

```jsx
<Alert tone="warning">13% inventory running low</Alert>
<Alert tone="danger" onDismiss={hide}>9% products out of stock</Alert>
```

Always carries an icon and a sentence. Stack at most three; a fourth becomes "View all".
