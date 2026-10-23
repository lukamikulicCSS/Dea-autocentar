import "server-only";

/**
 * Obavijest administratorima o novom upitu preko Resend API-ja.
 * Šalje se SAMO kad su postavljeni RESEND_API_KEY i RESEND_FROM.
 * Neuspjeh slanja nikad ne ruši zaprimanje upita (upit je već spremljen u bazu).
 */
export function emailNotificationsEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendInquiryNotification(input: {
  to: string[];
  customerEmail: string;
  message: string | null;
  vehicleTitle: string | null;
  adminUrl: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from || input.to.length === 0) return "skipped";

  const subject = input.vehicleTitle ? `Novi upit: ${input.vehicleTitle}` : "Novi upit s web stranice";
  const lines = [
    `<p><strong>Email kupca:</strong> ${escapeHtml(input.customerEmail)}</p>`,
    input.vehicleTitle ? `<p><strong>Vozilo:</strong> ${escapeHtml(input.vehicleTitle)}</p>` : "",
    input.message ? `<p><strong>Poruka:</strong><br>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>` : "",
    `<p><a href="${escapeHtml(input.adminUrl)}">Otvori upit u administraciji</a></p>`,
  ];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: input.to,
        reply_to: input.customerEmail,
        subject: subject.slice(0, 150),
        html: lines.join(""),
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[upiti] Resend je vratio status ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch {
    console.error("[upiti] Slanje obavijesti nije uspjelo (mreža/timeout)");
    return "failed";
  }
}
