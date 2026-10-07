# Architecture

## Overview

PawLog is a single-page PWA talking directly to Supabase. There is no custom backend server. Business rules that must hold for every client live in Postgres: row level security, triggers for XP and badges, and RPC functions for multi-step operations.

```
Browser (React PWA)
  ├─ TanStack Query cache
  ├─ Offline queue (IndexedDB)
  └─ supabase-js ──► Supabase
                      ├─ Auth
                      ├─ Postgres (RLS, triggers, RPC, views)
                      ├─ Storage (private bucket cat-photos)
                      └─ Realtime
```

## Frontend layout

| Path | Contents |
| --- | --- |
| `src/auth` | Session provider, protected routes |
| `src/household` | Active household context and switcher |
| `src/lib` | Supabase client, generated DB types, query client, offline queue, formatting, error mapping |
| `src/components` | Shared UI: sheets, buttons, empty states, toasts, app shell with bottom nav and FAB |
| `src/features/*` | One folder per domain: dashboard, cats, logs, timeline, growth, health, photos, care, gamification, household, notifications, search, vet |
| `src/pages` | Login and More screens |
| `src/test` | Vitest unit tests |

Each feature folder owns its queries and mutations as hooks. Components never call Supabase directly.

## Data flow

1. Reads go through TanStack Query hooks keyed by household and cat.
2. Writes go through mutation hooks that invalidate the affected keys.
3. Every log row carries a `client_event_id` generated on the device. XP is awarded by a database trigger keyed on that id, so a retried insert can never award XP twice.
4. Realtime subscriptions on the active household invalidate cached queries when another member logs something.

## Offline

Log inserts that fail because of the network are stored in IndexedDB with their `client_event_id`. The queue flushes when the browser comes back online. A unique-violation response means the row already reached the server and the item is treated as synced. Permission errors drop the item, because retrying will not succeed.

## Routing

Bottom navigation: Home, Cats, Log (FAB), Timeline, More. Cat profiles use nested routes for tabs: overview, timeline, health, growth, photos, passport. Invite links resolve at `/invite/:token`.

## Pattern detection

The attention center is driven by the `detect_patterns` RPC. Rules are deterministic thresholds over logged data, such as weight change over a window, repeated symptoms, missed medication or litter anomalies. Each result carries a severity of act, watch or info and is shown with a reminder that it is not a diagnosis.

## Build

Vite splits the bundle into vendor, Supabase and charts chunks. The PWA service worker precaches the app shell.
