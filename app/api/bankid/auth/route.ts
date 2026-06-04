import { NextResponse, type NextRequest } from "next/server";
import {
  isBankIdConfigured,
  initiateBankIdAuth,
  collectBankId,
  cancelBankId,
  buildAnimatedQrData,
} from "@/lib/bankid";
import { clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * BankID auth orchestration.
 *
 *  POST   -> start an order, returns { sessionId, autoStartToken, qr }
 *  PUT    -> poll, returns { status, qr? } and, on "complete", the verified
 *            identity. NOTE: this does NOT yet mint a NextAuth session — see
 *            the integration note in the response/README. Linking BankID
 *            identity to an account is a deliberate decision (GDPR: storing a
 *            personnummer requires a lawful basis), so it's left as wiring.
 *  DELETE -> cancel an order.
 *
 * Order state is kept in a module map. On Vercel's serverless runtime this is
 * per-instance and will not survive across cold starts — back it with Redis
 * (the Upstash client in lib/rate-limit.ts can be reused) before production.
 */

interface Order {
  orderRef: string;
  qrStartToken: string;
  qrStartSecret: string;
  startedAt: number;
}
const orders = new Map<string, Order>();

function configGuard(): NextResponse | null {
  if (!isBankIdConfigured()) {
    return NextResponse.json(
      { error: "BankID är inte konfigurerat (saknar certifikat)." },
      { status: 503 },
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = configGuard();
  if (guard) return guard;

  const ip = clientIp(req) ?? "127.0.0.1";
  try {
    const { orderRef, autoStartToken, qrStartToken, qrStartSecret } =
      await initiateBankIdAuth(ip);
    const sessionId = crypto.randomUUID();
    orders.set(sessionId, {
      orderRef,
      qrStartToken,
      qrStartSecret,
      startedAt: Date.now(),
    });
    const qr = buildAnimatedQrData(qrStartToken, qrStartSecret, 0);
    return NextResponse.json({ sessionId, autoStartToken, qr });
  } catch (err) {
    console.error("bankid start error:", err);
    return NextResponse.json({ error: "Kunde inte starta BankID." }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = configGuard();
  if (guard) return guard;

  const { sessionId } = (await req.json()) as { sessionId?: string };
  const order = sessionId ? orders.get(sessionId) : undefined;
  if (!order) {
    return NextResponse.json({ error: "Ogiltig session" }, { status: 404 });
  }

  try {
    const result = await collectBankId(order.orderRef);
    if (result.status === "complete") {
      orders.delete(sessionId!);
      // Identity verified. Hand off to your session-linking step here.
      return NextResponse.json({
        status: "complete",
        identity: result.completionData?.user ?? null,
      });
    }
    if (result.status === "failed") {
      orders.delete(sessionId!);
      return NextResponse.json({ status: "failed", hintCode: result.hintCode });
    }
    const seconds = Math.floor((Date.now() - order.startedAt) / 1000);
    const qr = buildAnimatedQrData(
      order.qrStartToken,
      order.qrStartSecret,
      seconds,
    );
    return NextResponse.json({ status: "pending", hintCode: result.hintCode, qr });
  } catch (err) {
    console.error("bankid collect error:", err);
    return NextResponse.json({ error: "Kunde inte hämta status." }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  const order = sessionId ? orders.get(sessionId) : undefined;
  if (order) {
    try {
      await cancelBankId(order.orderRef);
    } catch {
      /* ignore cancel errors */
    }
    orders.delete(sessionId!);
  }
  return NextResponse.json({ ok: true });
}
