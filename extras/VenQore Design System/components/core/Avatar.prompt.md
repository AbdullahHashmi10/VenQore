One-line: user avatar, plus `AvatarStack` for collaborator rows.

```jsx
<Avatar name="Ahmad Raza" ring />
<AvatarStack people={["Alexandra Deff","Edwin Adenike","Isaac Oluwatemilorun","David Oshodi","Zoya K"]} />
```

Initial fallbacks pick one of the six playful hues from the name hash — this is the only place a categorical colour appears without data behind it. Never scale an avatar on hover; show a ring.
