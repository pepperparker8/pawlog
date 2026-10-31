# Security

## Secrets

- The frontend uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The service role key is never used in this repository and must never be placed in a `VITE_` variable.
- `.env` is gitignored. `.env.example` contains placeholders only.

## Authorization model

Authorization is enforced by Postgres row level security, not by frontend filtering.

| Role | Read | Create and edit logs | Edit cats and health records | Manage members and invites | Delete household |
| --- | --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes | Yes |
| Caregiver | Yes | Yes | Yes | No | No |
| Viewer | Yes | No | No | No | No |

Policies call `SECURITY DEFINER` helpers (`is_household_member`, `can_edit_household`, `is_household_owner`, `household_role_of`). These helpers read `household_members` with a fixed `search_path` and avoid recursive policy evaluation.

## Tenant isolation

- Every tenant table stores `household_id` and its policies check membership of that household.
- `enforce_tenant_consistency` rejects a row whose `cat_id` belongs to another household, so a member of one household cannot attach data to a cat in another.
- Storage paths start with the household id and Storage policies check membership against it.
- Views run as the invoking user so RLS still applies.

## Integrity

- XP is awarded only by database triggers. Clients cannot insert into `xp_transactions` or stats tables.
- `client_event_id` is unique, so replayed requests cannot duplicate logs or XP.
- Cats are archived, not deleted. Logs use soft delete.
- Changes to sensitive tables are written to `audit_logs`.

## Health content

PawLog does not produce diagnoses or health scores, including in Ask answers. Pattern alerts are threshold rules over logged data and always point the user to a veterinarian.

## Ask PawLog

- Off by default. Only the household owner can switch it on (`households.ai_enabled`).
- The `ask` edge function runs every query with the caller's JWT, so RLS limits it to the caller's household. Viewers cannot ask.
- Each question sends the selected cat's profile, last 30 days of check-ins and observations, recent weights, active medications, open conditions, the last 5 vet visits and recent Ask turns to the Anthropic API. No other cat or household data is sent.
- `ANTHROPIC_API_KEY` is a Supabase function secret and never reaches the client.
- Messages older than 30 days are deleted on the next question. Members can clear a cat's thread at any time.
- A rolling 24-hour cap per household (`ASK_DAILY_CAP`, default 30) limits cost.
- Red-flag wording in the question, or two days of not eating in check-ins, sets the answer to Emergency regardless of the model output. Answers carry no diagnosis or doses.

## Tests

`supabase/tests/rls.sql` runs inside a transaction and rolls back. It checks that:

- User A cannot read cats or households of household B
- User A cannot insert into household B
- A viewer cannot insert logs
- A duplicate `client_event_id` is rejected and XP is awarded once

```bash
psql "$DATABASE_URL" -f supabase/tests/rls.sql
```

Run the Supabase security advisor after every migration.

## Reporting

Report vulnerabilities privately to the repository owner. Do not open public issues for security problems.
