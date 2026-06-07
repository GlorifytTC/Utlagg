import { NextResponse, type NextRequest } from "next/server";
import { isBankIdConfigured, initiateBankIdAuth } from "@/lib/bankid";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Starts a BankID order and returns the seeds the client needs to animate the
 * QR code. The client then calls signIn("bankid", { orderRef }) — the NextAuth
 * "bankid" provider polls collect and creates/finds the account.
 */
export async function POST(req: NextRequest) {
  if (!isBankIdConfigured()) {
    return NextResponse.json(
      { error: "BankID är inte konfigurerat (saknar certifikat)." },
      { status: 503 },
    );
  }
  try {
    const ip = clientIp(req) ?? "127.0.0.1";
    const { orderRef, autoStartToken, qrStartToken, qrStartSecret } =
      await initiateBankIdAuth(ip);
    return NextResponse.json({
      orderRef,
      autoStartToken,
      qrStartToken,
      qrStartSecret,
    });
  } catch (err) {
    console.error("bankid start error:", err);
    return NextResponse.json({ error: "Kunde inte starta BankID." }, { status: 502 });
  }
}
