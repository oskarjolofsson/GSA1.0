# How to Migrate Supabase Changes (Dev → Prod)

This documents the workflow for making schema changes to TrueSwing's database
safely — build and test on the dev project first, then push the same
migration to prod without touching existing customer data.

## Setup reference

- **Dev project ref:** `fdxmqxpuezfqilnrdwmz`
- **Prod project ref:** `<fill in prod ref here>`
- Migration files live in `supabase/migrations/` in the backend repo.
- Every schema change is a `.sql` file in that folder — never make schema
  changes through the Supabase Studio Table Editor or SQL Editor directly.
  Doing so bypasses migration history and will cause `db push` to fail with
  sync errors later.

## The workflow

### 1. Link to dev

```bash
supabase link --project-ref fdxmqxpuezfqilnrdwmz
```

### 2. Create a new migration file

```bash
supabase migration new <short_description_of_change>
```

This creates an empty timestamped `.sql` file in `supabase/migrations/`.
Write the schema change in it, e.g.:

```sql
ALTER TABLE public.analysis ADD COLUMN swing_tempo numeric;
```

### 3. Push to dev and test

```bash
supabase db push
```

Test the app/backend against the dev project until you're confident the
change is correct.

### 4. Check what's pending before touching prod

```bash
supabase link --project-ref ravbetnydtdxiuisypct
supabase migration list
```

This shows which migrations are already applied on prod vs. which are
pending. Confirm only the migration(s) you intend to ship are pending —
no surprises.

### 5. Push to prod

```bash
supabase db push
```

Only the new, not-yet-applied migration file(s) run. Existing rows are
untouched unless the migration itself deletes/alters them.

### 6. Relink back to dev for the next round of work

```bash
supabase link --project-ref fdxmqxpuezfqilnrdwmz
```

## Safe vs. destructive changes

| Change | Safe? | Notes |
|---|---|---|
| `CREATE TABLE` | ✅ | Brand new table, no risk |
| `ALTER TABLE ... ADD COLUMN` | ✅ | Existing rows get `NULL` (or a default) for the new column |
| `ALTER TABLE ... ADD CONSTRAINT` | ⚠️ | Fails loudly if existing data violates it — good, but test on dev first |
| `DROP COLUMN` / `DROP TABLE` | 🔴 | Actually deletes data. Double-check the `db push` output before confirming |
| Rename via `DROP` + `ADD` instead of `RENAME COLUMN` | 🔴 | Silently loses that column's data — always use `RENAME COLUMN` for renames |

**Rule of thumb:** anything that only *adds* is safe. Anything that
*drops or renames* needs a manual read-through before pushing to prod.

## Common errors & fixes

### `relation "X" already exists`
Local migration history and actual schema drifted apart (e.g. a table was
made manually in the dashboard instead of via migration). Fix by pulling a
fresh baseline:
```bash
rm supabase/migrations/*.sql
supabase migration repair --status reverted <old_migration_ids...>
supabase db pull
```

### `trigger "protect_buckets_delete" already exists` (or similar storage triggers)
These are platform-managed defaults created automatically on every new
Supabase project — not part of your schema. Delete these two lines from
the migration file before pushing to a fresh project:
```sql
CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets ...
CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects ...
```

### `could not translate host name "db.<ref>.supabase.co"`
You're using the **direct connection** string, which is IPv6-only and
won't resolve on most networks. Use the **Session pooler** string instead
(`aws-0-<region>.pooler.supabase.com:5432`, username `postgres.<ref>`).

### `invalid connection option "pgbouncer"`
The connection string has a `?pgbouncer=true` query param on the end —
that's meant for ORMs like Prisma, not plain psycopg2/SQLAlchemy. Strip
everything from the `?` onward.

### `403 Forbidden` / `User not allowed` on `auth.admin.*` calls
The admin client is using the anon/publishable key instead of the
service_role/secret key. Double check `SUPABASE_SERVICE_ROLE_KEY` in
`.env` is actually the secret key, not a duplicate of the anon key.

## What migrations do NOT capture (handle manually per project)

- **Auth settings** — redirect URLs, email templates, OAuth provider
  config. Mirror manually between dev and prod in Project Settings → Auth.
- **Storage buckets** — bucket names and their policies need to be
  recreated separately on each project.
- **Edge functions** — deployed independently via `supabase functions deploy`.

## Where to find things in the dashboard

- **Connection strings:** top bar → **Connect** (not under Settings anymore)
- **API keys:** Settings → **API Keys** (may show either legacy
  `anon`/`service_role` keys or the newer `sb_publishable_...`/
  `sb_secret_...` format depending on when the project was created)
- **DB password reset:** Settings → Database