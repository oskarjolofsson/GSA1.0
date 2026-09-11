-- Apple Sign In does not return a name in the identity token: the name is only
-- available client-side on the very first authorization, and is written to the
-- user's metadata after the auth user already exists. Two things had to change
-- for that name to reach public.profiles:
--   1. Read both 'name' (Google) and 'full_name' (Apple patch) metadata keys.
--   2. Run the trigger on metadata updates as well, not only on insert, and
--      never overwrite an existing name with an empty one.

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    insert into public.profiles (id, email, name)
    values (
        new.id,
        new.email,
        coalesce(
            nullif(new.raw_user_meta_data->>'name', ''),
            nullif(new.raw_user_meta_data->>'full_name', ''),
            ''
        )
    )
    on conflict (id) do update
    set email = excluded.email,
        name  = coalesce(nullif(excluded.name, ''), public.profiles.name);

    return new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: accounts created before this fix have an empty profiles.name even
-- though the client did write the Apple name into raw_user_meta_data.full_name.
-- Only rows with no name are touched, so this is safe to re-run.
UPDATE public.profiles p
SET name = coalesce(
        nullif(u.raw_user_meta_data->>'name', ''),
        nullif(u.raw_user_meta_data->>'full_name', '')
    )
FROM auth.users u
WHERE u.id = p.id
  AND coalesce(p.name, '') = ''
  AND coalesce(
        nullif(u.raw_user_meta_data->>'name', ''),
        nullif(u.raw_user_meta_data->>'full_name', '')
      ) IS NOT NULL;
