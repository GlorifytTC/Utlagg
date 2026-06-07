"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import QRCode from "qrcode";

type Status = "idle" | "pending" | "failed";

/**
 * BankID sign-up OR login (same flow). Starts an order, animates the QR
 * client-side, and calls signIn("bankid", { orderRef }). New personnummer ->
 * account is created; returning one -> logged in.
 */
export function BankIDLogin({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [autoStart, setAutoStart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => () => stop(), [stop]);

  async function animatedQrData(token: string, secret: string, seconds: number) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(String(seconds)));
    const hex = [...new Uint8Array(sig)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `bankid.${token}.${seconds}.${hex}`;
  }

  async function start() {
    setError(null);
    setStatus("pending");
    let seeds;
    try {
      const res = await fetch("/api/bankid/auth", { method: "POST" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Kunde inte starta BankID.");
        setStatus("failed");
        return;
      }
      seeds = await res.json();
    } catch {
      setError("Nätverksfel mot BankID.");
      setStatus("failed");
      return;
    }

    setAutoStart(seeds.autoStartToken);
    const started = Date.now();
    const tick = async () => {
      const seconds = Math.floor((Date.now() - started) / 1000);
      try {
        const data = await animatedQrData(seeds.qrStartToken, seeds.qrStartSecret, seconds);
        setQr(await QRCode.toDataURL(data, { margin: 1, width: 240 }));
      } catch {
        /* ignore */
      }
    };
    await tick();
    timer.current = setInterval(tick, 1000);

    // Blocks server-side until the user completes in the BankID app.
    const result = await signIn("bankid", {
      orderRef: seeds.orderRef,
      redirect: false,
    });
    stop();
    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setStatus("failed");
      setError("BankID avbröts eller misslyckades.");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {status !== "pending" && (
        <button
          onClick={start}
          className="w-full rounded-full border hairline px-5 py-3 text-sm font-medium hover:bg-ink/5"
        >
          {status === "failed" ? "Försök igen med BankID" : "Logga in / skapa konto med BankID"}
        </button>
      )}
      {status === "pending" && qr && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="BankID QR-kod" width={220} height={220} />
          {autoStart && (
            <a
              className="text-sm underline"
              href={`bankid:///?autostarttoken=${autoStart}&redirect=null`}
            >
              Öppna BankID på den här enheten
            </a>
          )}
          <p className="text-xs text-ink/60">Skanna QR-koden med BankID-appen.</p>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
