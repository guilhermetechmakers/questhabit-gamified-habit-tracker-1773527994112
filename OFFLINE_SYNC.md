# Offline Sync & Local Cache

QuestHabit uses an offline-first data layer so habits, history, and reminders work without a connection and sync when back online.

## Overview

- **Local store:** IndexedDB (via `idb`) holds habits, habit history, reminders, sync queue, conflicts, and sync metadata.
- **Sync engine:** When online, pending changes are pushed to the server via Edge Functions; server state is pulled and merged (last-write-wins).
- **Conflict resolution:** Conflicts are stored locally and can be resolved in the UI (Keep my version / Use server version).

## Key Files

| Area | Path |
|------|------|
| Types | `src/types/offline.ts` |
| IndexedDB | `src/lib/offline/db.ts` |
| Sync engine | `src/lib/offline/sync-engine.ts` |
| Integration (cache + queue) | `src/lib/offline/integration.ts` |
| Sync API (Edge) | `src/api/sync.ts` |
| Context | `src/contexts/sync-context.tsx`, `src/contexts/offline-sync-context.tsx` |
| UI | `src/components/sync/`, `src/components/offline/` |
| Edge Functions | `supabase/functions/sync/`, `supabase/functions/sync-metadata/` |

## Manual Sync

- **From UI:** Use the sync status chip in the app header. When status is "Sync error" or "Conflicts", a retry button appears; click it to run sync again.
- **From code:** Call `runSync(userId)` from `@/lib/offline`, or use `useSync().retrySync()` / `useOfflineSync().triggerSync()`.

## Resolving Conflicts

1. When a conflict is detected, a modal appears with "Habit was changed elsewhere".
2. Choose **Keep my version** to apply your local changes, or **Use server version** to take the server state.
3. Resolving one conflict does not auto-run sync again; use "Retry sync" if needed.

## Encryption

Local encryption is **not** implemented in this version. Sensitive fields (e.g. notes, reminder text) are stored in IndexedDB without at-rest encryption. To add it later:

- Use the Web Crypto API (or a library) to encrypt payloads before writing to IndexedDB and decrypt after read.
- Store keys via a secure mechanism (e.g. user passphrase or platform key storage); do not store raw keys in plain text.

## Edge Functions

- **sync-metadata** (GET/POST): Returns `serverVersion` and `lastModified` for the authenticated user’s habits.
- **sync** (POST): Accepts a batch of habit/history/reminder create/update/delete operations, applies them with RLS, and returns server IDs and any conflicts.

Both require a valid Supabase JWT in the `Authorization` header.

## Data Safety

All code paths follow the project’s runtime safety rules:

- Supabase/API results: `const items = data ?? []`, `Array.isArray(x) ? x : []`.
- React state for lists: `useState<Habit[]>([])`.
- Optional chaining and destructuring with defaults for API and cache reads.

## Database Migration

- `supabase/migrations/20250314150000_habits_last_synced.sql` adds an optional `last_synced_at` column to `habits` for optional server-side sync tracking.
