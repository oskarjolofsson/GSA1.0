import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authRedirect } from "@/lib/auth/route-guard";
import { publicOrigin } from "@/lib/http/public-origin";

/**
 * Refresh the Supabase session on every request and enforce the auth redirect.
 *
 * The cookie dance is the @supabase/ssr contract: read cookies off the request,
 * write refreshed ones onto BOTH the request (so getUser sees them) and the
 * response (so the browser stores them). Do not add logic between
 * createServerClient and getUser — it risks logging users out at random.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = authRedirect({
    hasSession: !!user,
    pathname: request.nextUrl.pathname,
  });

  if (redirectTo) {
    const url = new URL(redirectTo, publicOrigin(request));
    return NextResponse.redirect(url);
  }

  return response;
}
