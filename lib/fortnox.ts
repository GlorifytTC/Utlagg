import type { Receipt } from "@/db/schema";

/**
 * Fortnox OAuth2 + voucher push.
 *
 * Honesty: the OAuth2 plumbing here is correct, but the voucher account mapping
 * (which BAS accounts to debit/credit) is bookkeeping policy and MUST be
 * validated by an accountant before real use. The rows below balance
 * (debit == credit) but use generic default accounts.
 *
 * Requires a Fortnox developer app: FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET,
 * FORTNOX_REDIRECT_URI.
 */

const AUTH_URL = "https://apps.fortnox.se/oauth-v1/auth";
const TOKEN_URL = "https://apis.fortnox.se/oauth-v1/token";
const API_BASE = "https://api.fortnox.se/3";

export interface FortnoxTokens {
  accessToken: string;
  refreshToken: string | null;
  scope: string | null;
  expiresInSeconds: number | null;
}

export function getFortnoxAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FORTNOX_CLIENT_ID ?? "",
    redirect_uri: process.env.FORTNOX_REDIRECT_URI ?? "",
    scope: "bookkeeping",
    state,
    access_type: "offline",
    response_type: "code",
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const id = process.env.FORTNOX_CLIENT_ID ?? "";
  const secret = process.env.FORTNOX_CLIENT_SECRET ?? "";
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

async function tokenRequest(body: URLSearchParams): Promise<FortnoxTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Fortnox token exchange failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    scope?: string;
    expires_in?: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    scope: data.scope ?? null,
    expiresInSeconds: data.expires_in ?? null,
  };
}

export function exchangeFortnoxCode(code: string): Promise<FortnoxTokens> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.FORTNOX_REDIRECT_URI ?? "",
    }),
  );
}

export function refreshFortnoxToken(
  refreshToken: string,
): Promise<FortnoxTokens> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );
}

interface VoucherRow {
  Account: number;
  Debit: number;
  Credit: number;
  TransactionInformation?: string;
}

/** Build a balanced voucher (sum of debits == sum of credits). */
export function mapReceiptToVoucher(receipt: Receipt) {
  const total = Number(receipt.totalAmount ?? 0);
  const vat = Number(receipt.vatAmount ?? 0);
  const net = Math.round((total - vat) * 100) / 100;

  const expenseAccount = receipt.basCode ? Number(receipt.basCode) : 6991; // misc deductible
  const vatInputAccount = 2640; // ingående moms
  const creditAccount = 1930; // company account / cash

  const rows: VoucherRow[] = [
    {
      Account: expenseAccount,
      Debit: net,
      Credit: 0,
      TransactionInformation: receipt.vendorName ?? undefined,
    },
  ];
  if (vat > 0) {
    rows.push({
      Account: vatInputAccount,
      Debit: vat,
      Credit: 0,
      TransactionInformation: `Moms ${receipt.vatRate ?? ""}%`,
    });
  }
  rows.push({ Account: creditAccount, Debit: 0, Credit: total });

  return {
    Voucher: {
      Description: `Kvitto: ${receipt.vendorName ?? "okänd"}`,
      TransactionDate: receipt.date
        ? new Date(receipt.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      VoucherSeries: "A",
      VoucherRows: rows,
    },
  };
}

export async function pushReceiptToFortnox(
  receipt: Receipt,
  accessToken: string,
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/vouchers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(mapReceiptToVoucher(receipt)),
  });
  if (!res.ok) {
    throw new Error(`Fortnox voucher push failed: ${res.status}`);
  }
  return res.json();
}
