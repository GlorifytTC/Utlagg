"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Status = "idle" | "starting" | "pending" | "complete" | "failed";

interface Identity {
  personalNumber: string;
  name: string;
}

/**
 * Drives the BankID animated-QR flow against /api/bankid/auth.
 * On "complete" it calls onComplete(identity); the parent decides how to turn
 * that into a signed-in session (see the integration note).
 */
export function BankIDLogin({
  onComplete,
}: {
  onComplete?: (identity: Identity | null) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [autoStartToken, setAutoStartToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (poll.current) clearInterval(poll.current);
    poll.current = null;
  }, []);

  const renderQr = useCallback(async (qr: string) => {
    try {
      setQrDataUrl(await QRCode.toDataURL(qr, { margin: 1, width: 240 }));
    } catch {
      /* ignore render errors */
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus("starting");
    try {
      const res = await fetch("/api/bankid/auth", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Kunde inte starta BankID.");
        setStatus("failed");
        return;
      }
      const data = await res.json();
      sessionId.current = data.sessionId;
      setAutoStartToken(data.autoStartToken);
      await renderQr(data.qr);
      setStatus("pending");

      poll.current = setInterval(async () => {
        if (!sessionId.current) return;
        const r = await fetch("/api/bankid/auth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionId.current }),
        });
        const d = await r.json();
        if (d.status === "complete") {
          stop();
          setStatus("complete");
          onComplete?.(d.identity ?? null);
        } else if (d.status === "failed") {
          stop();
          setStatus("failed");
          setError(d.hintCode ?? "Autentiseringen avbröts.");
        } else if (d.qr) {
          await renderQr(d.qr);
        }
      }, 1000);
    } catch {
      setError("Nätverksfel mot BankID.");
      setStatus("failed");
    }
  }, [onComplete, renderQr, stop]);

  useEffect(() => () => stop(), [stop]);

  return (
    <div className="flex flex-col items-center gap-4">
      {status === "idle" || status === "failed" ? (
        <button
          onClick={start}
          className="rounded-lg bg-ink px-5 py-3 text-paper"
        >
          Logga in med BankID
        </button>
      ) : null}

      {status === "starting" ? <p className="text-sm">Startar BankID…</p> : null}

      {status === "pending" && qrDataUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="BankID QR-kod" width={240} height={240} />
          {autoStartToken ? (
            <a
              className="text-sm underline"
              href={`bankid:///?autostarttoken=${autoStartToken}&redirect=null`}
            >
              Öppna BankID på den här enheten
            </a>
          ) : null}
          <p className="text-xs text-ink/60">Skanna QR-koden med BankID-appen.</p>
        </>
      ) : null}

      {status === "complete" ? (
        <p className="text-sm text-nordic">Inloggning klar.</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
