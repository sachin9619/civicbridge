import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return supabaseResponse;

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Gracefully ignore network/token refresh glitches
  }

  const path = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/confirm",
    "/wards",
    "/api/ai/civicpulse",
  ];
  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(route + "/"));

  // Check if browser cookies contain an active Supabase auth token
  const allCookies = request.cookies.getAll();
  const hasAuthTokenCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && (c.name.includes("-auth-token") || c.name.includes("token"))
  );

  const isAuthenticated = Boolean(user || hasAuthTokenCookie);

  // If already authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If completely unauthenticated and trying to access a protected dashboard route
  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
