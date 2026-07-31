---
tags: [dev-workflow, database, policy]
---

# Database Policy & Rules (CRITICAL)

Part of [[VenQore POS - Home]]

- **Strict MySQL Policy**: the entire system is built strictly on MySQL. SQLite is **NOT** supported for any part of the system, including testing. Do not write or configure any SQLite databases or connections.
- **Production Database**: `venqore_pos` (never wipe or refresh this database).
- **Testing Database**: `amd_pos_test` (used by phpunit/pest for feature tests).
- **Smoke Tests**: run on `venqore_pos` dynamically but are strictly read-only and must NEVER use `RefreshDatabase` or alter data. See `platform.smoke-tests.*` routes in [[Platform & SuperAdmin Routes]].

## Known Worktrees
Stale git worktrees may exist in `.claude/worktrees/`. Safely pruned with:
```bash
git worktree prune
```

## Related
- [[Key Commands]]
- [[Database Schema Overview]]
