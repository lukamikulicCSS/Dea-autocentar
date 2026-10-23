import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (bivši middleware) za administraciju:
 *  1. osvježava Supabase sesiju (kolačiće) prije renderiranja,
 *  2. neprijavljene korisnike preusmjerava na prijavu.
 * Stvarna provjera ovlasti (je li korisnik administrator) radi se na serveru
 * u svakoj stranici, akciji i API ruti — proxy je samo prva linija.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const isPublicAdminPage =
    pathname === "/admin/prijava" || pathname === "/admin/zaboravljena-lozinka";

  if (pathname.startsWith("/admin") && !isPublicAdminPage && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = "/admin/prijava";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/auth/:path*"],
};
