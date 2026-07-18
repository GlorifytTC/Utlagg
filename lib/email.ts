/**
 * Sends transactional email via Brevo's HTTP API (https://api.brevo.com/v3/smtp/email).
 *
 * IMPORTANT — why HTTP and not SMTP: Vercel's serverless functions frequently
 * block or throttle outbound SMTP (port 587/465), so nodemailer connections
 * hang or time out — the classic "account created but confirmation email
 * failed" symptom. An HTTPS POST works reliably in that environment. This is
 * the transport the app now uses.
 *
 * Brevo issues two different secrets: an SMTP key and a separate v3 API key.
 * The HTTP API requires the v3 API KEY (starts with "xkeysib-") in the
 * `api-key` header. We read BREVO_API_KEY, falling back to BREVO_SMTP_KEY for
 * backward compatibility, but for HTTP the value MUST be a v3 API key — an
 * SMTP-only key will be rejected with 401.
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Normalises an env-var value before use. It targets copy/paste corruption
 * that is invisible in a hosting dashboard's masked field and has each
 * broken outgoing mail here before:
 *
 *   1. Surrounding quotes/backslashes baked in by Railway's/Vercel's variable
 *      editor, e.g. BREVO_FROM_EMAIL="noreply@utlagg.se" → the literal value
 *      including the quotes.
 *   2. Invisible junk — zero-width spaces, BOMs, non-breaking spaces, control
 *      characters — and stray surrounding whitespace. A pasted trailing
 *      newline in an API key produces a generic, hard-to-diagnose SMTP 535.
 *
 * It deliberately does NOT strip visible non-ASCII letters (e.g. the "ä" in a
 * display name like "Utlägg"), which are legitimate in some fields. Those are
 * reported by nonAsciiReport() instead, so a rogue "ä" in a field that MUST be
 * ASCII (email address, API key, login) is surfaced rather than silently
 * mangled — that exact character is what took mail down last time.
 */
function clean(v: string): string {
  return v
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width spaces & BOM
    .replace(/\u00A0/g, " ") // non-breaking space -> normal space
    .replace(/[\u0000-\u001F\u007F]/g, "") // control chars (incl. stray \n)
    .replace(/["'\\]/g, "") // stray quotes/backslashes
    .trim();
}

/**
 * Lists any non-ASCII characters in a value that Brevo requires to be pure
 * ASCII (the sender email address, the API/SMTP key, the SMTP login). Returns
 * [] when clean. This is how the recurring "unrecognised ä in the credentials"
 * outage becomes visible instead of a mystery 535/relay rejection.
 */
function nonAsciiReport(
  value: string,
): Array<{ index: number; char: string; codePoint: string }> {
  const out: Array<{ index: number; char: string; codePoint: string }> = [];
  for (let i = 0; i < value.length; i++) {
    const code = value.codePointAt(i)!;
    if (code > 0x7f) {
      out.push({
        index: i,
        char: value[i],
        codePoint: "U+" + code.toString(16).toUpperCase().padStart(4, "0"),
      });
    }
  }
  return out;
}

const FROM_EMAIL = clean(process.env.BREVO_FROM_EMAIL || "noreply@utlagg.se");
const FROM_NAME = clean(process.env.BREVO_FROM_NAME || "Kvittino");
const APP_NAME = "Kvittino";
const SUPPORT_EMAIL = clean(process.env.SUPPORT_EMAIL || "support@utlagg.se");

/**
 * Per-variable health check for the email credentials, safe to expose to the
 * admin debug route: never returns the secret itself, only its length, whether
 * clean() had to strip invisible corruption from it, and any rogue non-ASCII
 * characters (with code points) in fields that must be ASCII. One call to the
 * debug endpoint then pinpoints a stray "ä"/newline/zero-width char that a
 * masked dashboard field would otherwise hide.
 */
export function emailConfigDiagnostics(): Record<string, unknown> {
  const raw: Record<string, string | undefined> = {
    BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL,
    BREVO_FROM_NAME: process.env.BREVO_FROM_NAME,
    BREVO_SMTP_LOGIN: process.env.BREVO_SMTP_LOGIN,
    BREVO_SMTP_KEY: process.env.BREVO_SMTP_KEY,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
  };
  // BREVO_FROM_NAME is allowed to hold non-ASCII (e.g. "Utlägg"); the rest
  // must be ASCII, so a non-ASCII finding there is an actionable problem.
  const asciiRequired = new Set([
    "BREVO_FROM_EMAIL",
    "BREVO_SMTP_LOGIN",
    "BREVO_SMTP_KEY",
    "BREVO_API_KEY",
  ]);
  const report: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v == null) {
      report[k] = "(not set)";
      continue;
    }
    const cleaned = clean(v);
    report[k] = {
      rawLength: v.length,
      cleanedLength: cleaned.length,
      hadInvisibleCorruption: v !== cleaned,
      nonAscii: asciiRequired.has(k)
        ? nonAsciiReport(cleaned).length
          ? nonAsciiReport(cleaned)
          : "none"
        : "(non-ASCII allowed here)",
    };
  }
  return report;
}

// Boot-time warning so the invisible-character failure mode shows up in the
// deploy logs without waiting for a send to fail with an opaque 535.
{
  const suspects: Record<string, string> = {
    BREVO_FROM_EMAIL: FROM_EMAIL,
    BREVO_SMTP_LOGIN: clean(process.env.BREVO_SMTP_LOGIN || ""),
    "BREVO_SMTP_KEY/BREVO_API_KEY": clean(
      process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || "",
    ),
  };
  for (const [label, value] of Object.entries(suspects)) {
    const bad = nonAsciiReport(value);
    if (bad.length) {
      console.warn(
        `[email] WARNING: ${label} contains non-ASCII that Brevo may reject: ` +
          bad.map((b) => `${b.codePoint} '${b.char}' @${b.index}`).join(", "),
      );
    }
  }
}

export function isEmailConfigured(): boolean {
  // The HTTP API needs only the API key and a sender address — the SMTP
  // login is no longer required (it was only for the SMTP relay).
  return Boolean(
    (process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY) &&
      process.env.BREVO_FROM_EMAIL,
  );
}

type BrevoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; status: number; error: string };

async function brevoSend(
  to: string,
  subject: string,
  html: string,
): Promise<BrevoSendResult> {
  const apiKey = clean(process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || "");
  // Fail fast with an actionable message when the wrong Brevo credential is
  // configured. The HTTP API only accepts a v3 API key ("xkeysib-…"); an SMTP
  // key ("xsmtpsib-…") is rejected with an opaque 401 that looks like a
  // network/auth problem and wastes a lot of debugging time.
  if (apiKey.startsWith("xsmtpsib")) {
    return {
      ok: false,
      status: 401,
      error:
        "Wrong Brevo credential: BREVO_API_KEY holds an SMTP key (xsmtpsib-…). " +
        "The HTTP API needs a v3 API key (xkeysib-…) — create one on Brevo's " +
        "\"API Keys\" tab (not the SMTP tab) and set it as BREVO_API_KEY.",
    };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(BREVO_API_URL, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: FROM_NAME, email: FROM_EMAIL },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.ok) {
      const data = (await res.json().catch(() => ({}))) as { messageId?: string };
      return { ok: true, messageId: data.messageId ?? "(none returned)" };
    }
    const errText = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: `Brevo API ${res.status}: ${errText.slice(0, 300)}`,
    };
  } catch (err) {
    const e = err as Error;
    return {
      ok: false,
      status: 0,
      error: `${e.name}: ${e.message}`,
    };
  }
}

/**
 * Validates the Brevo credentials WITHOUT sending an email, by calling the
 * account endpoint. Confirms the API key is accepted (and is a real v3 API
 * key, not an SMTP-only key) before relying on it for a send.
 */
export async function verifyEmailConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const apiKey = clean(process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || "");
  if (!apiKey) return { ok: false, error: "No BREVO_API_KEY set" };
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, Accept: "application/json" },
    });
    if (res.ok) return { ok: true };
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Brevo account check ${res.status}: ${
        res.status === 401
          ? "key rejected — is this a v3 API key (xkeysib-…) and not an SMTP key?"
          : body.slice(0, 200)
      }`,
    };
  } catch (err) {
    const e = err as Error;
    return { ok: false, error: `${e.name}: ${e.message}` };
  }
}

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.error(
      `[email] NOT CONFIGURED — missing BREVO_API_KEY (or BREVO_SMTP_KEY) or BREVO_FROM_EMAIL. Skipped "${subject}" to ${to}.`,
    );
    return false;
  }

  const pass = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || "";
  console.log("=".repeat(70));
  console.log(`[EMAIL] >>> ATTEMPTING SEND (Brevo HTTP API) to=${to}`);
  console.log(`[EMAIL]     subject = "${subject}"`);
  console.log(`[EMAIL]     endpoint=${BREVO_API_URL}`);
  console.log(`[EMAIL]     from="${FROM_NAME}" <${FROM_EMAIL}>`);
  console.log(
    `[EMAIL]     api-key prefix=${pass.slice(0, 8)}... len=${pass.length}`,
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

const PAYMENT_FAILED_TEMPLATE = `# Betalning misslyckades

Hej {{ user_name }},

Vi kunde inte dra betalningen för din {{ plan_name }}-prenumeration.

Vi försöker igen automatiskt inom kort. För att undvika avbrott i tjänsten, kontrollera dina betalningsuppgifter.

[button] {{ action_url }} | Uppdatera betalningsuppgifter

Frågor: {{ support_email }}

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

export function sendPaymentFailed(
  to: string,
  params: {
    userName: string;
    planName: string;
    actionUrl: string;
  },
) {
  const html = buildEmailHtml(PAYMENT_FAILED_TEMPLATE, {
    user_name: params.userName,
    app_name: APP_NAME,
    plan_name: params.planName,
    action_url: params.actionUrl,
    support_email: SUPPORT_EMAIL,
  });
  return send(to, "Betalning misslyckades – åtgärd krävs", html);
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
        "Not configured (missing one of BREVO_SMTP_KEY/BREVO_API_KEY, BREVO_SMTP_LOGIN or BREVO_FROM_EMAIL)",
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