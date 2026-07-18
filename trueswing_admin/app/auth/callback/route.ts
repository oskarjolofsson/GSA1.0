import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (PKCE) callback. Supabase redirects here with a `code` after the user
 * consents at Google. We exchange it for a session (cookies get set via the
 * server client) and forward to `next` (the admin gate at `/` by default).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or exchange failed — send back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
