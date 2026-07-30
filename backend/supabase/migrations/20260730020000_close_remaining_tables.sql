-- Close the ten tables that still had no RLS policy to client roles.
--
-- Nothing reaches these through PostgREST: the mobile app and the admin dashboard
-- both use Supabase for auth only and make no .from()/.rpc()/.channel() calls, and
-- the backend connects as the `postgres` owner over DATABASE_URL, which bypasses
-- RLS. Client roles therefore need no access at all, so the safest policy is none —
-- privileges revoked, RLS on, no policy to get subtly wrong.
--
-- Two of these were live vulnerabilities, not hypotheticals:
--
--   user_roles  Anyone holding the anon key could read the admin role id from
--               `roles` and INSERT themselves a row. user_service.is_admin() reads
--               exactly this table, so that is a direct path to every require_admin
--               endpoint. Privilege escalation.
--   profiles    Every user's email address was readable with the anon key that
--               ships inside the mobile app.
--
-- Two carry no user dimension and are closed for different reasons:
--
--   roles                     reference data; write access allows renaming or
--                             inventing roles, which feeds the escalation above.
--   processed_webhook_events  the Stripe idempotency ledger; write access lets an
--                             attacker pre-insert event ids so the backend treats
--                             real webhooks as already handled and skips them.
--
-- To open one of these to clients later, GRANT SELECT and add a policy scoped to
-- auth.uid(); the tables with no user_id of their own (practice_drill_runs, prompts,
-- billing_subscriptions) need an EXISTS through their parent.
--
-- Idempotent: safe to re-run.

-- ---------- revoke every client privilege ----------
-- service_role and the postgres owner are untouched.

REVOKE ALL ON TABLE public.profiles                 FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_roles               FROM anon, authenticated;
REVOKE ALL ON TABLE public.roles                    FROM anon, authenticated;
REVOKE ALL ON TABLE public.user_feedback            FROM anon, authenticated;
REVOKE ALL ON TABLE public.practice_sessions        FROM anon, authenticated;
REVOKE ALL ON TABLE public.practice_drill_runs      FROM anon, authenticated;
REVOKE ALL ON TABLE public.prompts                  FROM anon, authenticated;
REVOKE ALL ON TABLE public.billing_customers        FROM anon, authenticated;
REVOKE ALL ON TABLE public.billing_subscriptions    FROM anon, authenticated;
REVOKE ALL ON TABLE public.processed_webhook_events FROM anon, authenticated;

-- ---------- RLS on, deliberately no policies ----------
-- With RLS enabled and no policy, a re-GRANT alone still exposes nothing: someone
-- would also have to add a policy on purpose.

ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_drill_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- NOTE ON NEW TABLES: Supabase's default privileges on this schema grant client
-- roles everything on newly created tables — that is how issue_goals and
-- issue_misses became writable by anon with no GRANT in any migration. This
-- migration does NOT change that default, so a new table still arrives open to
-- anon and authenticated. Revoke explicitly when adding one, or close the default
-- schema-wide with:
--
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;

-- ---------- rollback ----------
--
-- The Supabase CLI has no down-migration mechanism; this is the manual undo.
--
--   ALTER TABLE public.profiles                 DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.user_roles               DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.roles                    DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.user_feedback            DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.practice_sessions        DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.practice_drill_runs      DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.prompts                  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.billing_subscriptions    DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE public.processed_webhook_events DISABLE ROW LEVEL SECURITY;
--   -- billing_customers had RLS enabled before this migration; leave it enabled.
--
--   GRANT ALL ON TABLE public.profiles                 TO anon, authenticated;
--   GRANT ALL ON TABLE public.user_roles               TO anon, authenticated;
--   GRANT ALL ON TABLE public.roles                    TO anon, authenticated;
--   GRANT ALL ON TABLE public.user_feedback            TO anon, authenticated;
--   GRANT ALL ON TABLE public.practice_sessions        TO anon, authenticated;
--   GRANT ALL ON TABLE public.practice_drill_runs      TO anon, authenticated;
--   GRANT ALL ON TABLE public.prompts                  TO anon, authenticated;
--   GRANT ALL ON TABLE public.billing_customers        TO anon, authenticated;
--   GRANT ALL ON TABLE public.billing_subscriptions    TO anon, authenticated;
--   GRANT ALL ON TABLE public.processed_webhook_events TO anon, authenticated;
