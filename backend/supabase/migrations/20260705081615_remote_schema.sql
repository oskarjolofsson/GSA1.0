


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    insert into public.profiles (id, email, name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', '')
    )
    on conflict (id) do update
    set email = excluded.email,
        name  = excluded.name;

    return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare 
  default_role_id uuid;
begin
  select id into default_role_id
  from roles
  where name = 'user';

  insert into user_roles (user_id, role_id)
  values (new.id, default_role_id);

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_last_sign_in"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    -- Only update if the value actually changed
    if new.last_sign_in_at is distinct from old.last_sign_in_at then
        update public.profiles
        set last_signed_in_at = new.last_sign_in_at
        where id = new.id;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."sync_last_sign_in"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "video_id" "uuid",
    "model_version" "text" NOT NULL,
    "status" "text" DEFAULT 'awaiting_upload'::"text" NOT NULL,
    "success" boolean,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "analysis_status_check" CHECK (("status" = ANY (ARRAY['awaiting_upload'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analysis_issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "confidence" real,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issue_id" "uuid" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "analysis_issues_confidence_check" CHECK ((("confidence" >= (0.0)::double precision) AND ("confidence" <= (1.0)::double precision)))
);


ALTER TABLE "public"."analysis_issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."billing_customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "billing_customer_id" "uuid" NOT NULL,
    "external_subscription_id" "text" NOT NULL,
    "external_price_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false NOT NULL,
    "canceled_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_event_at" timestamp with time zone,
    "provider" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "raw" "jsonb"
);


ALTER TABLE "public"."billing_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "task" "text" NOT NULL,
    "success_signal" "text" NOT NULL,
    "fault_indicator" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."drills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_drill" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_id" "uuid" NOT NULL,
    "drill_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."issue_drill" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "phase" "text",
    "current_motion" "text",
    "expected_motion" "text",
    "swing_effect" "text",
    "shot_outcome" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text" NOT NULL,
    CONSTRAINT "issues_phase_check" CHECK (("phase" = ANY (ARRAY['SETUP'::"text", 'BACKSWING'::"text", 'TRANSITION'::"text", 'DOWNSWING'::"text", 'IMPACT'::"text", 'FOLLOW_THROUGH'::"text"])))
);


ALTER TABLE "public"."issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_drill_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "drill_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "successful_reps" integer DEFAULT 0 NOT NULL,
    "failed_reps" integer DEFAULT 0 NOT NULL,
    "skipped" boolean DEFAULT false NOT NULL,
    "order_index" integer
);


ALTER TABLE "public"."practice_drill_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "analysis_issue_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "session_type" "text",
    "program_step_id" "uuid",
    "notes" "text",
    CONSTRAINT "practice_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['range'::"text", 'play'::"text", 'retest'::"text"]))),
    CONSTRAINT "practice_sessions_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."practice_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processed_webhook_events" (
    "event_id" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."processed_webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "last_signed_in_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_drill_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "drill_id" "uuid" NOT NULL,
    "strength" integer DEFAULT 0 NOT NULL,
    "last_seen_at" timestamp with time zone,
    "times_seen" integer DEFAULT 0 NOT NULL,
    "last_grade" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "program_drill_states_last_grade_check" CHECK (("last_grade" = ANY (ARRAY['rough'::"text", 'ok'::"text", 'dialed'::"text"])))
);


ALTER TABLE "public"."program_drill_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."program_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "program_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "session_type" "text" NOT NULL,
    "prescription" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "practice_session_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "program_steps_session_type_check" CHECK (("session_type" = ANY (ARRAY['range'::"text", 'play'::"text", 'retest'::"text"]))),
    CONSTRAINT "program_steps_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."program_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "analysis_issue_id" "uuid",
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "programs_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analysis_id" "uuid" NOT NULL,
    "prompt_shape" "text",
    "prompt_height" "text",
    "prompt_misses" "text",
    "prompt_extra" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


COMMENT ON TABLE "public"."prompts" IS 'Stores user-provided prompts for video analysis';



COMMENT ON COLUMN "public"."prompts"."analysis_id" IS 'Foreign key to analysis table';



COMMENT ON COLUMN "public"."prompts"."prompt_shape" IS 'User prompt about swing shape';



COMMENT ON COLUMN "public"."prompts"."prompt_height" IS 'User prompt about swing height';



COMMENT ON COLUMN "public"."prompts"."prompt_misses" IS 'User prompt about misses';



COMMENT ON COLUMN "public"."prompts"."prompt_extra" IS 'Additional user prompt';



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comments" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 3)))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "video_key" "text",
    "start_time" interval,
    "end_time" interval,
    "camera_view" "text",
    "club_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "thumbnail_key" "text",
    CONSTRAINT "videos_camera_view_check" CHECK (("camera_view" = ANY (ARRAY['unknown'::"text", 'face_on'::"text", 'down_the_line'::"text"]))),
    CONSTRAINT "videos_club_type_check" CHECK (("club_type" = ANY (ARRAY['unknown'::"text", 'iron'::"text", 'driver'::"text"])))
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analysis_issues"
    ADD CONSTRAINT "analysis_issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analysis"
    ADD CONSTRAINT "analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drills"
    ADD CONSTRAINT "drills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issue_drill"
    ADD CONSTRAINT "issue_drill_issue_id_drill_id_key" UNIQUE ("issue_id", "drill_id");



ALTER TABLE ONLY "public"."issue_drill"
    ADD CONSTRAINT "issue_drill_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_drill_runs"
    ADD CONSTRAINT "practice_drill_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processed_webhook_events"
    ADD CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("event_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_drill_states"
    ADD CONSTRAINT "program_drill_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."program_drill_states"
    ADD CONSTRAINT "program_drill_states_program_id_drill_id_key" UNIQUE ("program_id", "drill_id");



ALTER TABLE ONLY "public"."program_steps"
    ADD CONSTRAINT "program_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_analysis_id_key" UNIQUE ("analysis_id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "uq_billing_subscriptions_provider_external_id" UNIQUE ("provider", "external_subscription_id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_analysis_issues_confidence" ON "public"."analysis_issues" USING "btree" ("confidence");



CREATE INDEX "idx_analysis_issues_created_at" ON "public"."analysis_issues" USING "btree" ("created_at");



CREATE INDEX "idx_analysis_issues_issue_id" ON "public"."analysis_issues" USING "btree" ("issue_id");



CREATE INDEX "idx_analysis_video_id" ON "public"."analysis" USING "btree" ("video_id");



CREATE INDEX "idx_drills_title" ON "public"."drills" USING "btree" ("title");



CREATE INDEX "idx_issue_drill_drill_id" ON "public"."issue_drill" USING "btree" ("drill_id");



CREATE INDEX "idx_issue_drill_issue_id" ON "public"."issue_drill" USING "btree" ("issue_id");



CREATE INDEX "idx_issues_phase" ON "public"."issues" USING "btree" ("phase");



CREATE INDEX "idx_issues_title" ON "public"."issues" USING "btree" ("title");



CREATE INDEX "idx_practice_drill_runs_drill" ON "public"."practice_drill_runs" USING "btree" ("drill_id");



CREATE INDEX "idx_practice_drill_runs_session" ON "public"."practice_drill_runs" USING "btree" ("session_id");



CREATE INDEX "idx_practice_drill_runs_session_order" ON "public"."practice_drill_runs" USING "btree" ("session_id", "order_index");



CREATE INDEX "idx_practice_sessions_analysis_issue" ON "public"."practice_sessions" USING "btree" ("analysis_issue_id");



CREATE INDEX "idx_practice_sessions_program_step" ON "public"."practice_sessions" USING "btree" ("program_step_id");



CREATE INDEX "idx_practice_sessions_user" ON "public"."practice_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_practice_sessions_user_started" ON "public"."practice_sessions" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_program_drill_states_program" ON "public"."program_drill_states" USING "btree" ("program_id");



CREATE INDEX "idx_program_drill_states_program_strength" ON "public"."program_drill_states" USING "btree" ("program_id", "strength");



CREATE INDEX "idx_program_steps_program" ON "public"."program_steps" USING "btree" ("program_id");



CREATE UNIQUE INDEX "idx_program_steps_unique_order" ON "public"."program_steps" USING "btree" ("program_id", "order_index");



CREATE INDEX "idx_programs_analysis_issue" ON "public"."programs" USING "btree" ("analysis_issue_id");



CREATE INDEX "idx_programs_user" ON "public"."programs" USING "btree" ("user_id");



CREATE INDEX "idx_programs_user_status" ON "public"."programs" USING "btree" ("user_id", "status");



CREATE INDEX "idx_prompts_analysis_id" ON "public"."prompts" USING "btree" ("analysis_id");



CREATE INDEX "idx_videos_user_id" ON "public"."videos" USING "btree" ("user_id");



CREATE INDEX "profiles_email_idx" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "profiles_name_idx" ON "public"."profiles" USING "btree" ("name");



CREATE INDEX "user_roles_user_id_created_at_idx" ON "public"."user_roles" USING "btree" ("user_id", "created_at");



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analysis_issues"
    ADD CONSTRAINT "analysis_issues_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analysis_issues"
    ADD CONSTRAINT "analysis_issues_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analysis"
    ADD CONSTRAINT "analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analysis"
    ADD CONSTRAINT "analysis_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_customers"
    ADD CONSTRAINT "billing_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_subscriptions"
    ADD CONSTRAINT "billing_subscriptions_billing_customer_id_fkey" FOREIGN KEY ("billing_customer_id") REFERENCES "public"."billing_customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_drill"
    ADD CONSTRAINT "issue_drill_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_drill"
    ADD CONSTRAINT "issue_drill_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_drill_runs"
    ADD CONSTRAINT "practice_drill_runs_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id");



ALTER TABLE ONLY "public"."practice_drill_runs"
    ADD CONSTRAINT "practice_drill_runs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_analysis_issue_id_fkey" FOREIGN KEY ("analysis_issue_id") REFERENCES "public"."analysis_issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_program_step_id_fkey" FOREIGN KEY ("program_step_id") REFERENCES "public"."program_steps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_drill_states"
    ADD CONSTRAINT "program_drill_states_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_drill_states"
    ADD CONSTRAINT "program_drill_states_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."program_steps"
    ADD CONSTRAINT "program_steps_practice_session_id_fkey" FOREIGN KEY ("practice_session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."program_steps"
    ADD CONSTRAINT "program_steps_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_analysis_issue_id_fkey" FOREIGN KEY ("analysis_issue_id") REFERENCES "public"."analysis_issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "public"."analysis"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analysis_issues" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analysis_issues_owner_select" ON "public"."analysis_issues" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."analysis" "a"
  WHERE (("a"."id" = "analysis_issues"."analysis_id") AND ("a"."user_id" = "auth"."uid"())))));



CREATE POLICY "analysis_owner_delete" ON "public"."analysis" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "analysis_owner_insert" ON "public"."analysis" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "analysis_owner_select" ON "public"."analysis" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "analysis_owner_update" ON "public"."analysis" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."billing_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."program_drill_states" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_drill_states_owner_select" ON "public"."program_drill_states" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."programs" "p"
  WHERE (("p"."id" = "program_drill_states"."program_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."program_steps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "program_steps_owner_select" ON "public"."program_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."programs" "p"
  WHERE (("p"."id" = "program_steps"."program_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "programs_owner_select" ON "public"."programs" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "videos_owner_delete" ON "public"."videos" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "videos_owner_insert" ON "public"."videos" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "videos_owner_select" ON "public"."videos" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "videos_owner_update" ON "public"."videos" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_last_sign_in"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_last_sign_in"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_last_sign_in"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."analysis" TO "anon";
GRANT ALL ON TABLE "public"."analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis" TO "service_role";



GRANT ALL ON TABLE "public"."analysis_issues" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."analysis_issues" TO "authenticated";
GRANT ALL ON TABLE "public"."analysis_issues" TO "service_role";



GRANT ALL ON TABLE "public"."billing_customers" TO "anon";
GRANT ALL ON TABLE "public"."billing_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_customers" TO "service_role";



GRANT ALL ON TABLE "public"."billing_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."billing_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."drills" TO "anon";
GRANT ALL ON TABLE "public"."drills" TO "authenticated";
GRANT ALL ON TABLE "public"."drills" TO "service_role";



GRANT ALL ON TABLE "public"."issue_drill" TO "anon";
GRANT ALL ON TABLE "public"."issue_drill" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_drill" TO "service_role";



GRANT ALL ON TABLE "public"."issues" TO "anon";
GRANT ALL ON TABLE "public"."issues" TO "authenticated";
GRANT ALL ON TABLE "public"."issues" TO "service_role";



GRANT ALL ON TABLE "public"."practice_drill_runs" TO "anon";
GRANT ALL ON TABLE "public"."practice_drill_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_drill_runs" TO "service_role";



GRANT ALL ON TABLE "public"."practice_sessions" TO "anon";
GRANT ALL ON TABLE "public"."practice_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."processed_webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."processed_webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."processed_webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."program_drill_states" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."program_drill_states" TO "authenticated";
GRANT ALL ON TABLE "public"."program_drill_states" TO "service_role";



GRANT ALL ON TABLE "public"."program_steps" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."program_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."program_steps" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

revoke delete on table "public"."analysis_issues" from "authenticated";

revoke insert on table "public"."analysis_issues" from "authenticated";

revoke update on table "public"."analysis_issues" from "authenticated";

revoke delete on table "public"."program_drill_states" from "authenticated";

revoke insert on table "public"."program_drill_states" from "authenticated";

revoke update on table "public"."program_drill_states" from "authenticated";

revoke delete on table "public"."program_steps" from "authenticated";

revoke insert on table "public"."program_steps" from "authenticated";

revoke update on table "public"."program_steps" from "authenticated";

revoke delete on table "public"."programs" from "authenticated";

revoke insert on table "public"."programs" from "authenticated";

revoke update on table "public"."programs" from "authenticated";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_add_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE TRIGGER on_auth_user_sign_in AFTER UPDATE OF last_sign_in_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_last_sign_in();

-- CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

-- CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


