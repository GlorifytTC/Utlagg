/**
 * Sends transactional email via Brevo's HTTP API (api.brevo.com), the same
 * approach used by the working TaskBridge project — NOT SMTP/nodemailer.
 * Brevo issues two different secrets: an API key (used here, as the
 * `api-key` header) and a separate SMTP key (for port 587 SMTP auth). This
 * project was previously using the API key as an SMTP password, which
 * Brevo's mail relay correctly rejects with a generic 535 — the two are
 * not interchangeable. Switching to the HTTP API sidesteps SMTP entirely:
 * no STARTTLS handshake, no SMTP-specific credential, just a normal
 * authenticated HTTPS POST, with a clear JSON error body on failure
 * instead of an opaque SMTP response code.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Env vars pasted with surrounding quotes (a common copy/paste mistake in
 * Railway's/Vercel's variable editor) end up baked into the string itself —
 * e.g. BREVO_FROM_EMAIL="noreply@utlagg.se\"\"" becomes the literal value
 * noreply@utlagg.se"" . Strip stray quotes/backslashes so a malformed
 * env var can't silently break every outgoing email.
 */
function clean(v: string): string {
  return v.replace(/["'\\]/g, "").trim();
}

const FROM_EMAIL = clean(process.env.BREVO_FROM_EMAIL || "noreply@utlagg.se");
const FROM_NAME = clean(process.env.BREVO_FROM_NAME || "Kvittino");
const APP_NAME = "Kvittino";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@utlagg.se";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_FROM_EMAIL);
}

type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; status: number; error: string };

async function brevoSend(
  to: string,
  subject: string,
  html: string,
): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY || "";
  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          typeof body?.message === "string"
            ? body.message
            : JSON.stringify(body),
      };
    }
    return { ok: true, messageId: body?.messageId ?? "(none returned)" };
  } catch (err) {
    return { ok: false, status: 0, error: (err as Error).message };
  }
}

/**
 * Checks that Brevo's API actually accepts this key, without sending an
 * email — calls the lightweight /account endpoint, which requires the same
 * api-key header as a real send and fails the same way (401/403) if the
 * key is wrong, but performs no side effects.
 */
export async function verifyEmailConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const apiKey = process.env.BREVO_API_KEY || "";
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY is not set" };
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: `HTTP ${res.status}: ${typeof body?.message === "string"
        ? body.message
        : JSON.stringify(body)
        }`,
    };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error(
      `[email] NOT CONFIGURED — missing BREVO_API_KEY or BREVO_FROM_EMAIL. Skipped "${subject}" to ${to}.`,
    );
    return false;
  }

  const apiKey = process.env.BREVO_API_KEY || "";
  console.log("=".repeat(70));
  console.log(`[EMAIL] >>> ATTEMPTING SEND (Brevo HTTP API) to=${to}`);
  console.log(`[EMAIL]     subject = "${subject}"`);
  console.log(`[EMAIL]     from="${FROM_NAME}" <${FROM_EMAIL}>`);
  console.log(
    `[EMAIL]     apiKey prefix=${apiKey.slice(0, 8)}... len=${apiKey.length}`,
  );

  const startedAt = Date.now();
  const result = await brevoSend(to, subject, html);
  if (result.ok) {
    console.log(
      `[EMAIL] <<< SENT OK in ${Date.now() - startedAt}ms — messageId=${result.messageId}`,
    );
    console.log("=".repeat(70));
    return true;
  }
  console.log(
    `[EMAIL] <<< SEND FAILED after ${Date.now() - startedAt}ms`,
  );
  console.log(`[EMAIL]     status: ${result.status}`);
  console.log(`[EMAIL]     error: ${result.error}`);
  console.log("=".repeat(70));
  return false;
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

/**
 * Wraps http/https URLs in anchor tags so they are clickable in all email
 * clients. Input must already be HTML-escaped; & in query strings will be
 * &amp; at this point, which is correct inside an href attribute.
 */
function linkify(escaped: string): string {
  return escaped.replace(
    /(https?:\/\/[^\s<"]+)/g,
    '<a href="$1" style="color:#4F46E5;word-break:break-all">$1</a>',
  );
}

/**
 * Renders a prominent CTA button. Use instead of a bare action_url line
 * for primary actions (password reset, verification, etc.).
 */
function actionButton(url: string, label: string = "Öppna"): string {
  return `<p style="margin:20px 0;text-align:center">
    <a href="${escapeHtml(url)}" style="background:#4F46E5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      ${escapeHtml(label)}
    </a>
  </p>`;
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
  return `<p style="margin:8px 0;line-height:1.6">${linkify(escaped)}</p>`;
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
    } else if (line.trim().startsWith("[button]")) {
      // Syntax: [button] url | Label text
      const rest = line.trim().slice(8).trim();
      const [url, label] = rest.split("|").map((s) => s.trim());
      if (url) bodyHtml += actionButton(url, label || "Öppna");
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

[button] {{ action_url }} | Gå till ditt konto

Om du inte skapade detta konto, kontakta {{ support_email }}.

— ${APP_NAME}`;

const VERIFY_TEMPLATE = `# Verifiera din e-postadress

Hej {{ user_name }},

Bekräfta din e-postadress:

[button] {{ action_url }} | Verifiera e-post

Länken gäller i {{ expiration_minutes }} minuter.

Om du inte begärde detta kan du ignorera meddelandet eller kontakta {{ support_email }}.

— ${APP_NAME}`;

const RESET_TEMPLATE = `# Återställ lösenord

Hej {{ user_name }},

En begäran om att återställa ditt lösenord har gjorts.

[button] {{ action_url }} | Sätt nytt lösenord

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

[button] {{ action_url }} | Hantera prenumeration

Frågor: {{ support_email }}

— ${APP_NAME}`;

const PAYMENT_RECEIPT_TEMPLATE = `# Betalningskvitto

Hej {{ user_name }},

Vi har mottagit din betalning.

Plan: {{ plan_name }}
Belopp: {{ amount }}
Datum: {{ billing_date }}

[button] {{ action_url }} | Se betalningsuppgifter

— ${APP_NAME}`;

const SUBSCRIPTION_CANCELED_TEMPLATE = `# Prenumeration avslutad

Hej {{ user_name }},

Din prenumeration på {{ plan_name }} har avslutats.

Du har tillgång fram till {{ billing_date }}.

[button] {{ action_url }} | Återaktivera

För hjälp, kontakta {{ support_email }}.

— ${APP_NAME}`;

// ─── Public API ──────────────────────────────────────────────

export function sendWelcomeEmail(to: string, userName: string) {
  const html = buildEmailHtml(WELCOME_TEMPLATE, {
    user_name: userName,
    app_name: APP_NAME,
    action_url: process.env.NEXTAUTH_URL || "http://localhost:3000",
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

export function sendPasswordChangedEmail(to: string, userName: string) {
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

export function sendCompanyInviteEmail(to: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/accept-invite?token=${encodeURIComponent(token)}`;
  const body = `# Inbjudan till ${APP_NAME}

Du har blivit inbjuden att gå med i ett företag på ${APP_NAME}. Logga in eller skapa ett konto och acceptera inbjudan. Länken gäller i 7 dagar.

[button] ${url} | Acceptera inbjudan

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
  return send(ownerEmail, `Enterprise-förfrågan från ${fromEmail}`, html);
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
  lines.push(`${requesterName} har skickat ett utlägg för godkännande.`);
  if (details.vendor) lines.push(`- Leverantör: ${details.vendor}`);
  lines.push(`- Belopp: ${details.amount} kr`);
  if (details.date)
    lines.push(
      `- Datum: ${new Date(details.date).toLocaleDateString("sv-SE")}`,
    );
  if (details.vatRate) lines.push(`- Moms: ${details.vatRate}%`);
  lines.push("");
  lines.push(`[button] ${appUrl}/dashboard/approvals | Granska godkännanden`);

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
): Promise<{ ok: boolean; detail: string; config: { from: string } }> {
  const config = { from: `"${FROM_NAME}" <${FROM_EMAIL}>` };
  if (!isEmailConfigured()) {
    return {
      ok: false,
      detail:
        "Not configured (missing BREVO_API_KEY or BREVO_FROM_EMAIL)",
      config,
    };
  }
  const result = await brevoSend(
    to,
    "Kvittino — testmejl",
    layout(
      "<h2>Testmejl</h2><p>Det här är ett testmejl från Kvittino's e-postdebug-endpoint. Om du ser det fungerar Brevo-konfigurationen.</p>",
    ),
  );
  if (result.ok) {
    return { ok: true, detail: `messageId=${result.messageId}`, config };
  }
  return {
    ok: false,
    detail: `HTTP ${result.status}: ${result.error}`,
    config,
  };
}