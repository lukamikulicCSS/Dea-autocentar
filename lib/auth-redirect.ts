/** Dopušta samo relativne putanje unutar administracije (sprječava open redirect). */
export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/admin";
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\") || /[\r\n]/.test(next)) {
    return "/admin";
  }
  if (next.startsWith("/admin/prijava")) return "/admin";
  return next.slice(0, 300);
}
