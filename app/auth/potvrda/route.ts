import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeAdminRedirect } from "@/lib/auth";
import { sessionClient } from "@/lib/supabase/server";

const ALLOWED: EmailOtpType[] = ["recovery", "invite", "email", "email_change"];

/**
 * Potvrda poveznice iz emaila (oporavak lozinke). Podržava oba načina:
 *
 * 1. ZADANI Supabase predložak ({{ .ConfirmationURL }}): Supabase provjeri token
 *    i preusmjeri ovamo s ?code=... (PKCE). Kod se razmjenjuje za sesiju.
 *    Radi u istom pregledniku u kojem je zatražena nova lozinka.
 *
 * 2. Prilagođeni predložak (moguć tek uz vlastiti SMTP, npr. Resend):
 *    {{ .SiteURL }}/auth/potvrda?token_hash={{ .TokenHash }}&type=recovery&next=/admin/nova-lozinka
 *    Radi u bilo kojem pregledniku.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeAdminRedirect(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await sessionClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && type && ALLOWED.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/admin/prijava?greska=poveznica", request.url));
}