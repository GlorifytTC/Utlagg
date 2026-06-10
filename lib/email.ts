import { Resend } from "resend";

/**
 * Resend email client + Swedish templates. Degrades gracefully: if
 * RESEND_API_KEY is unset, sends are skipped (logged) rather than throwing, so
 * the rest of the app keeps working in dev/preview.
 */
const apiKey = process.env.RESEND_API_KEY || undefined;
const FROM = process.env.RESEND_FROM_EMAIL || "Utlagg <noreply@utlagg.se>";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

export function isEmailConfigured(): boolean {
  return resend !== null;
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return false;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] send failed:", error);
    return false;
  }
  return true;
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="sv"><body style="font-family:system-ui,sans-serif;background:#F4F1EA;padding:24px;color:#16181D">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="color:#888;font-size:12px;margin-top:32px">Utlagg · AI-driven kvittohantering</p>
  </div></body></html>`;
}

export function sendEnterpriseInquiry(ownerEmail: string, fromEmail: string, note?: string) {
  return send(
    ownerEmail,
    "Enterprise-förfrågan från " + fromEmail,
    layout(
      "Ny Enterprise-förfrågan",
      `<p>En användare vill ha en Enterprise-offert.</p>
       <p><strong>E-post:</strong> ${fromEmail}</p>
       ${note ? `<p><strong>Meddelande:</strong> ${note}</p>` : ""}
       <p>Svara dem direkt för att komma överens om pris, och sätt sedan deras plan till
       Enterprise i adminpanelen.</p>`,
    ),
  );
}

export function sendWelcomeEmail(to: string, name?: string) {
  return send(
    to,
    "Välkommen till Utlagg",
    layout(
      `Välkommen${name ? `, ${name}` : ""}!`,
      `<p>Tack för att du valde Utlagg. Du kan nu ladda upp kvitton, låta AI:n läsa av moms och BAS-konto, och exportera till din bokföring.</p>
       <p><a href="${APP_URL}/dashboard" style="color:#2F6079">Gå till din dashboard →</a></p>`,
    ),
  );
}

export function sendVerificationEmail(to: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Verifiera din e-postadress",
    layout(
      "Verifiera din e-post",
      `<p>Klicka för att verifiera din e-postadress. Länken gäller i 24 timmar.</p>
       <p><a href="${url}" style="color:#2F6079">Verifiera e-post →</a></p>`,
    ),
  );
}

export function sendCompanyInviteEmail(to: string, token: string) {
  const url = `${APP_URL}/accept-invite?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Du har bjudits in till ett företag på Utlagg",
    layout(
      "Inbjudan till Utlagg",
      `<p>Du har blivit inbjuden att gå med i ett företag på Utlagg. Logga in eller skapa ett konto och acceptera inbjudan. Länken gäller i 7 dagar.</p>
       <p><a href="${url}" style="color:#2F6079">Acceptera inbjudan →</a></p>`,
    ),
  );
}

export function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    "Återställ ditt lösenord",
    layout(
      "Återställ lösenord",
      `<p>Vi fick en begäran om att återställa ditt lösenord. Länken gäller i 1 timme.</p>
       <p><a href="${url}" style="color:#2F6079">Återställ lösenord →</a></p>
       <p style="color:#888;font-size:12px">Ignorera detta mail om du inte gjorde begäran.</p>`,
    ),
  );
}
