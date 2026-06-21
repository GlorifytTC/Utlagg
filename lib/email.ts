import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "",
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN || "",
    pass: process.env.BREVO_API_KEY || "",
  },
});

/**
 * Env vars pasted with surrounding quotes (a common copy/paste mistake in
 * Railway's variable editor) end up baked into the string itself — e.g.
 * BREVO_FROM_EMAIL="noreply@utlagg.se\"\"" becomes the literal value
 * noreply@utlagg.se"" . Strip stray quotes/backslashes so a malformed
 * env var can't silently break every outgoing email.
 */
function clean(v: string): string {
  return v.replace(/["'\\]/g, "").trim();
}

const FROM_EMAIL = clean(process.env.BREVO_FROM_EMAIL || "noreply@utlagg.se");
const FROM_NAME = clean(process.env.BREVO_FROM_NAME || "Utlagg");
const APP_NAME = "Utlagg";
const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || "support@utlagg.se";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_SMTP_HOST &&
      process.env.BREVO_SMTP_LOGIN &&
      process.env.BREVO_FROM_EMAIL,
  );
}

/**
 * Checks the SMTP connection + auth WITHOUT sending an email, by talking to
 * Brevo and doing the EHLO/AUTH handshake only. Much faster to iterate on
 * than a full register-and-wait cycle, and tells you immediately whether
 * the problem is credentials/connectivity vs. something with the send itself.
 */
export async function verifyEmailConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { responseCode?: number; response?: string };
    return {
      ok: false,
      error: `${e.name}: ${e.message} (code=${e.code ?? "?"} responseCode=${e.responseCode ?? "?"} response=${e.response ?? "?"})`,
    };
  }
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error(
      `[email] NOT CONFIGURED — missing one of BREVO_API_KEY / BREVO_SMTP_HOST / BREVO_SMTP_LOGIN / BREVO_FROM_EMAIL. Skipped "${subject}" to ${to}.`,
    );
    return false;
  }

  // Masked config dump — safe to leave in logs, never prints the secret itself.
  const apiKey = process.env.BREVO_API_KEY || "";
  console.log(
    `[email] attempting send → to=${to} subject="${subject}" ` +
      `host=${process.env.BREVO_SMTP_HOST} port=${Number(process.env.BREVO_SMTP_PORT) || 587} ` +
      `login=${process.env.BREVO_SMTP_LOGIN} from="${FROM_NAME}" <${FROM_EMAIL}> ` +
      `keyPrefix=${apiKey.slice(0, 8)}... keyLen=${apiKey.length}`,
  );

  const startedAt = Date.now();
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(
      `[email] SENT ok in ${Date.now() - startedAt}ms → messageId=${info.messageId} ` +
        `accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} ` +
        `response="${info.response}"`,
    );
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException & {
      responseCode?: number;
      response?: string;
      command?: string;
    };
    console.error(
      `[email] SEND FAILED after ${Date.now() - startedAt}ms → to=${to} subject="${subject}"\n` +
        `  name: ${e.name}\n` +
        `  message: ${e.message}\n` +
        `  code: ${e.code ?? "(none)"}\n` +
        `  responseCode: ${e.responseCode ?? "(none)"}\n` +
        `  response: ${e.response ?? "(none)"}\n` +
        `  command: ${e.command ?? "(none)"}`,
    );
    return false;
  }
}

function layout(body: string): string {
  return `<!doctype html><html lang="sv"><body style="font-family:system-ui,sans-serif;background:#F4F1EA;padding:24px;color:#16181D">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">${body}</div></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderTemplate(
  template: string,
  params: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(
      new RegExp(`\\{\\{\\s*${escapeRegex(key)}\\s*\\}\\}`, "g"),
      value,
    );
  }
  return result;
}

function lineToHtml(text: string): string {
  const escaped = escapeHtml(text);
  if (escaped.trim() === "") return "<br>";
  return `<p style="margin:8px 0;line-height:1.6">${escaped}</p>`;
}

function buildEmailHtml(
  bodyTemplate: string,
  params: Record<string, string>,
): string {
  const lines = bodyTemplate.split("\n");
  let bodyHtml = "";
  let inBlock = false;
  let blockBuffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inBlock) {
        bodyHtml += `<pre style="background:#F4F1EA;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px"><code>${escapeHtml(blockBuffer.join("\n"))}</code></pre>`;
        blockBuffer = [];
        inBlock = false;
      } else {
        inBlock = true;
      }
      continue;
    }
    if (inBlock) {
      blockBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith("# ")) {
      bodyHtml += `<h1 style="font-size:20px;margin:16px 0 12px">${escapeHtml(line.trim().slice(2))}</h1>`;
    } else if (line.trim().startsWith("## ")) {
      bodyHtml += `<h2 style="font-size:17px;margin:14px 0 10px">${escapeHtml(line.trim().slice(3))}</h2>`;
    } else if (line.trim().startsWith("### ")) {
      bodyHtml += `<h3 style="font-size:15px;margin:12px 0 8px">${escapeHtml(line.trim().slice(4))}</h3>`;
    } else if (line.trim().startsWith("- ")) {
      bodyHtml += `<p style="margin:4px 0 4px 16px;line-height:1.6">– ${escapeHtml(line.trim().slice(2))}</p>`;
    } else {
      bodyHtml += lineToHtml(line);
    }
  }

  if (inBlock && blockBuffer.length > 0) {
    bodyHtml += `<pre style="background:#F4F1EA;padding:12px;border-radius:6px;overflow-x:auto;font-size:13px"><code>${escapeHtml(blockBuffer.join("\n"))}</code></pre>`;
  }

  const rendered = renderTemplate(bodyHtml, params);
  return layout(rendered);
}

// ─── Templates ───────────────────────────────────────────────

const WELCOME_TEMPLATE = `# Välkommen till ${APP_NAME}

Hej {{ user_name }},

Ditt konto har skapats.

Gå till ditt konto:
{{ action_url }}

Om du inte skapade detta konto, kontakta {{ support_email }}.

— ${APP_NAME}`;

const VERIFY_TEMPLATE = `# Verifiera din e-postadress

Hej {{ user_name }},

Bekräfta din e-postadress:
{{ action_url }}

Länken gäller i {{ expiration_minutes }} minuter.

Om du inte begärde detta kan du ignorera meddelandet eller kontakta {{ support_email }}.

— ${APP_NAME}`;

const RESET_TEMPLATE = `# Återställ lösenord

Hej {{ user_name }},

En begäran om att återställa ditt lösenord har gjorts.

Sätt ett nytt lösenord:
{{ action_url }}

Länken gäller i {{ expiration_minutes }} minuter.

Om du inte begärde detta kan du ignorera mejlet eller kontakta {{ support_email }}.

— ${APP_NAME}`;

const PASSWORD_CHANGED_TEMPLATE = `# Ditt lösenord har ändrats

Hej {{ user_name }},

Ditt lösenord har uppdaterats.

Om du inte gjorde denna ändring, kontakta {{ support_email }} omedelbart.

— ${APP_NAME}`;

const SUBSCRIPTION_TEMPLATE = `# Prenumeration bekräftad

Hej {{ user_name }},

Din prenumeration på {{ plan_name }} är nu aktiv.

Nästa debiteringsdatum: {{ billing_date }}

Hantera din prenumeration:
{{ action_url }}

Frågor: {{ support_email }}

— ${APP_NAME}`;

const PAYMENT_RECEIPT_TEMPLATE = `# Betalningskvitto

Hej {{ user_name }},

Vi har mottagit din betalning.

Plan: {{ plan_name }}
Belopp: {{ amount }}
Datum: {{ billing_date }}

Se dina betalningsuppgifter:
{{ action_url }}

— ${APP_NAME}`;

const SUBSCRIPTION_CANCELED_TEMPLATE = `# Prenumeration avslutad

Hej {{ user_name }},

Din prenumeration på {{ plan_name }} har avslutats.

Du har tillgång fram till {{ billing_date }}.

Återaktivera här:
{{ action_url }}

För hjälp, kontakta {{ support_email }}.

— ${APP_NAME}`;

// ─── Public API ──────────────────────────────────────────────

export function sendWelcomeEmail(to: string, userName: string) {
  const html = buildEmailHtml(WELCOME_TEMPLATE, {
    user_name: userName,
    app_name: APP_NAME,
    action_url:
      process.env.NEXTAUTH_URL || "http://localhost:3000",
    support_email: SUPPORT_EMAIL,
  });
  return send(to, `Välkommen till ${APP_NAME}`, html);
}

export function sendVerificationEmail(
  to: string,
  userName: string,
  token: string,
  expirationMinutes: number = 1440,
) {
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const html = buildEmailHtml(VERIFY_TEMPLATE, {
    user_name: userName,
    app_name: APP_NAME,
    action_url: url,
    expiration_minutes: String(expirationMinutes),
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Verifiera din e-postadress", html);
}

export function sendPasswordResetEmail(
  to: string,
  userName: string,
  token: string,
  expirationMinutes: number = 60,
) {
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(token)}`;
  const html = buildEmailHtml(RESET_TEMPLATE, {
    user_name: userName,
    app_name: APP_NAME,
    action_url: url,
    expiration_minutes: String(expirationMinutes),
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Återställ ditt lösenord", html);
}

export function sendPasswordChangedEmail(
  to: string,
  userName: string,
) {
  const html = buildEmailHtml(PASSWORD_CHANGED_TEMPLATE, {
    user_name: userName,
    app_name: APP_NAME,
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Ditt lösenord har ändrats", html);
}

export function sendSubscriptionConfirmation(
  to: string,
  params: {
    userName: string;
    planName: string;
    billingDate: string;
    actionUrl: string;
  },
) {
  const html = buildEmailHtml(SUBSCRIPTION_TEMPLATE, {
    user_name: params.userName,
    app_name: APP_NAME,
    plan_name: params.planName,
    billing_date: params.billingDate,
    action_url: params.actionUrl,
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Prenumeration bekräftad", html);
}

export function sendPaymentReceipt(
  to: string,
  params: {
    userName: string;
    planName: string;
    amount: string;
    billingDate: string;
    actionUrl: string;
  },
) {
  const html = buildEmailHtml(PAYMENT_RECEIPT_TEMPLATE, {
    user_name: params.userName,
    app_name: APP_NAME,
    plan_name: params.planName,
    amount: params.amount,
    billing_date: params.billingDate,
    action_url: params.actionUrl,
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Betalningskvitto", html);
}

export function sendSubscriptionCanceled(
  to: string,
  params: {
    userName: string;
    planName: string;
    billingDate: string;
    actionUrl: string;
  },
) {
  const html = buildEmailHtml(SUBSCRIPTION_CANCELED_TEMPLATE, {
    user_name: params.userName,
    app_name: APP_NAME,
    plan_name: params.planName,
    billing_date: params.billingDate,
    action_url: params.actionUrl,
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Prenumeration avslutad", html);
}

// ─── Legacy compatibility wrappers ───────────────────────────

export function sendCompanyInviteEmail(
  to: string,
  token: string,
) {
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/accept-invite?token=${encodeURIComponent(token)}`;
  const body = `# Inbjudan till ${APP_NAME}

Du har blivit inbjuden att gå med i ett företag på ${APP_NAME}. Logga in eller skapa ett konto och acceptera inbjudan. Länken gäller i 7 dagar.

Acceptera inbjudan:
${url}

— ${APP_NAME}`;
  const html = buildEmailHtml(body, {
    user_name: "",
    app_name: APP_NAME,
    action_url: url,
    support_email: SUPPORT_EMAIL,
    expiration_minutes: "10080",
  });
  return send(
    to,
    `Du har bjudits in till ett företag på ${APP_NAME}`,
    html,
  );
}

export function sendEnterpriseInquiry(
  ownerEmail: string,
  fromEmail: string,
  note?: string,
) {
  const body = `# Ny Enterprise-förfrågan

En användare vill ha en Enterprise-offert.

E-post: ${fromEmail}${note ? `\n\nMeddelande: ${note}` : ""}

Svara dem direkt för att komma överens om pris, och sätt sedan deras plan till Enterprise i adminpanelen.

— ${APP_NAME}`;
  const html = buildEmailHtml(body, {
    user_name: "",
    app_name: APP_NAME,
    action_url: "",
    support_email: SUPPORT_EMAIL,
  });
  return send(
    ownerEmail,
    `Enterprise-förfrågan från ${fromEmail}`,
    html,
  );
}

export function sendApprovalRequestEmail(
  approverEmail: string,
  details: {
    vendor?: string | null;
    amount: string;
    date?: string | null;
    vatRate?: number | null;
  },
  requesterName: string,
): Promise<boolean> {
  const appUrl =
    process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const lines: string[] = [];
  lines.push(`# Utlägg väntar på ditt godkännande`);
  lines.push("");
  lines.push(
    `${requesterName} har skickat ett utlägg för godkännande.`,
  );
  if (details.vendor) lines.push(`- Leverantör: ${details.vendor}`);
  lines.push(`- Belopp: ${details.amount} kr`);
  if (details.date)
    lines.push(
      `- Datum: ${new Date(details.date).toLocaleDateString("sv-SE")}`,
    );
  if (details.vatRate) lines.push(`- Moms: ${details.vatRate}%`);
  lines.push("");
  lines.push(`Gå till godkännanden:`);
  lines.push(`${appUrl}/dashboard/approvals`);

  const html = buildEmailHtml(lines.join("\n"), {
    user_name: "",
    app_name: APP_NAME,
    action_url: `${appUrl}/dashboard/approvals`,
    support_email: SUPPORT_EMAIL,
  });
  return send(
    approverEmail,
    `Godkännande av utlägg: ${details.vendor ?? "kvitto"} · ${details.amount} kr`,
    html,
  );
}
/**
 * Sends a real test email and returns full diagnostic detail (rather than
 * just true/false like the normal send helpers) for the admin debug route.
 */
export async function sendTestEmail(
  to: string,
): Promise<{ ok: boolean; detail: string; config: { from: string; host: string; login: string } }> {
  const config = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    host: process.env.BREVO_SMTP_HOST || "(not set)",
    login: process.env.BREVO_SMTP_LOGIN || "(not set)",
  };
  if (!isEmailConfigured()) {
    return { ok: false, detail: "Not configured (missing env var)", config };
  }
  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject: "Utlagg — testmejl",
      html: layout(
        "<h2>Testmejl</h2><p>Det här är ett testmejl från Utlagg's e-postdebug-endpoint. Om du ser det fungerar SMTP-konfigurationen.</p>",
      ),
    });
    return {
      ok: true,
      detail: `messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response="${info.response}"`,
      config,
    };
  } catch (err) {
    const e = err as NodeJS.ErrnoException & { responseCode?: number; response?: string; command?: string };
    return {
      ok: false,
      detail: `${e.name}: ${e.message} | code=${e.code ?? "?"} responseCode=${e.responseCode ?? "?"} response=${e.response ?? "?"} command=${e.command ?? "?"}`,
      config,
    };
  }
}
