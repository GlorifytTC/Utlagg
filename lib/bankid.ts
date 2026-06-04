import { Agent, request } from "undici";
import crypto from "node:crypto";

/**
 * BankID Relying Party (RP) API v6.0 client.
 *
 * Correction vs. the original spec: BankID does NOT use a Bearer API key. It
 * requires MUTUAL TLS with a client certificate issued by your bank
 * (SEB/Nordea/Handelsbanken/etc.) plus the BankID server CA. We also use the
 * animated-QR flow and do NOT collect a personal number at initiation (privacy
 * + it's the recommended flow).
 *
 * Provide the cert material as base64 env vars:
 *   BANKID_P12_BASE64        - your RP client cert (.p12/.pfx), base64
 *   BANKID_P12_PASSPHRASE    - its passphrase
 *   BANKID_CA_BASE64         - BankID CA chain (PEM), base64
 *   BANKID_ENV               - "production" | "test"  (default: test)
 *
 * Runtime: Node.js only (uses TLS client certs). Not Edge-compatible.
 */

function baseUrl(): string {
  return process.env.BANKID_ENV === "production"
    ? "https://appapi2.bankid.com/rp/v6.0"
    : "https://appapi2.test.bankid.com/rp/v6.0";
}

export function isBankIdConfigured(): boolean {
  return Boolean(
    process.env.BANKID_P12_BASE64 &&
      process.env.BANKID_P12_PASSPHRASE &&
      process.env.BANKID_CA_BASE64,
  );
}

let cachedAgent: Agent | null = null;

function getAgent(): Agent {
  if (cachedAgent) return cachedAgent;
  if (!isBankIdConfigured()) {
    throw new Error("BankID is not configured (missing cert env vars).");
  }
  const pfx = Buffer.from(process.env.BANKID_P12_BASE64!, "base64");
  const ca = Buffer.from(process.env.BANKID_CA_BASE64!, "base64");
  cachedAgent = new Agent({
    connect: {
      pfx,
      passphrase: process.env.BANKID_P12_PASSPHRASE!,
      ca,
      rejectUnauthorized: true,
    },
  });
  return cachedAgent;
}

export interface BankIdAuthResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIdCompletionData {
  user: {
    personalNumber: string;
    name: string;
    givenName: string;
    surname: string;
  };
  device: { ipAddress: string };
  signature?: string;
  ocspResponse?: string;
}

export interface BankIdCollectResponse {
  orderRef: string;
  status: "pending" | "failed" | "complete";
  hintCode?: string;
  completionData?: BankIdCompletionData;
}

async function post<T>(path: string, payload: unknown): Promise<T> {
  const res = await request(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    dispatcher: getAgent(),
  });
  const text = await res.body.text();
  if (res.statusCode >= 400) {
    throw new Error(`BankID ${path} failed (${res.statusCode}): ${text}`);
  }
  return JSON.parse(text) as T;
}

/** Initiate auth using the animated-QR flow (no personal number). */
export function initiateBankIdAuth(
  endUserIp: string,
): Promise<BankIdAuthResponse> {
  return post<BankIdAuthResponse>("/auth", {
    endUserIp,
    requirement: { pinCode: false },
  });
}

export function collectBankId(orderRef: string): Promise<BankIdCollectResponse> {
  return post<BankIdCollectResponse>("/collect", { orderRef });
}

export function cancelBankId(orderRef: string): Promise<void> {
  return post<void>("/cancel", { orderRef });
}

/**
 * Animated QR data for a given elapsed time (seconds since the order started).
 * The frontend should refresh this once per second.
 *   qrAuthCode = HMAC-SHA256(qrStartSecret, secondsElapsed)
 *   qrData     = "bankid.<qrStartToken>.<seconds>.<qrAuthCode>"
 */
export function buildAnimatedQrData(
  qrStartToken: string,
  qrStartSecret: string,
  secondsElapsed: number,
): string {
  const qrAuthCode = crypto
    .createHmac("sha256", qrStartSecret)
    .update(String(secondsElapsed))
    .digest("hex");
  return `bankid.${qrStartToken}.${secondsElapsed}.${qrAuthCode}`;
}
