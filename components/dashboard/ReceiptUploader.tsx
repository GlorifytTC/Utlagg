"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BasSelect } from "./BasSelect";
import { getBasAccount } from "@/lib/bas";
import { resolveVatRate, vatFromGross, type VatRate } from "@/lib/vat";

interface Draft {
  vendorName: string;
  date: string; // yyyy-mm-dd
  totalAmount: string;
  vatAmount: string;
  vatRate: VatRate;
  basCode: string | null;
  aiConfidence: number | null;
  receiptText: string;
}

const emptyDraft = (): Draft => ({
  vendorName: "",
  date: new Date().toISOString().slice(0, 10),
  totalAmount: "",
  vatAmount: "",
  vatRate: 25,
  basCode: null,
  aiConfidence: null,
  receiptText: "",
});

export function ReceiptUploader({ onSaved }: { onSaved: () => void }) {
  const [stage, setStage] = useState<"idle" | "scanning" | "review">("idle");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setStage("scanning");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Fall back to manual entry rather than blocking the user.
        setDraft(emptyDraft());
        setError(data.error ?? "OCR misslyckades — ange manuellt.");
      } else {
        setDraft({
          vendorName: data.vendorName ?? "",
          date: data.date ?? new Date().toISOString().slice(0, 10),
          totalAmount: data.totalAmount?.toString() ?? "",
          vatAmount: data.vatAmount?.toString() ?? "",
          vatRate: (data.vatRate as VatRate) ?? 25,
          basCode: null,
          aiConfidence: data.confidence ?? null,
          receiptText: data.rawText ?? "",
        });
        if (data.needsManualReview) {
          setError("Låg träffsäkerhet — kontrollera fälten innan du sparar.");
        }
      }
      setStage("review");
    } catch (err) {
      console.error(err);
      setError("Kunde inte läsa filen.");
      setStage("review");
    }
  }, []);

  function onBasChange(code: string) {
    const account = getBasAccount(code);
    setDraft((d) => ({
      ...d,
      basCode: code,
      // Suggest a VAT rate based on the account's category + the receipt date.
      vatRate: account
        ? resolveVatRate(account.vatCategory, new Date(d.date))
        : d.vatRate,
    }));
  }

  function recalcVat(total: string, rate: VatRate) {
    const n = Number(total);
    if (Number.isFinite(n) && n > 0) {
      return vatFromGross(n, rate).vat.toString();
    }
    return "";
  }

  async function save() {
    setError(null);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: draft.vendorName || undefined,
          date: draft.date ? new Date(draft.date).toISOString() : undefined,
          totalAmount: draft.totalAmount ? Number(draft.totalAmount) : undefined,
          vatAmount: draft.vatAmount ? Number(draft.vatAmount) : undefined,
          vatRate: draft.vatRate,
          basCode: draft.basCode ?? undefined,
          category: draft.basCode
            ? getBasAccount(draft.basCode)?.name
            : undefined,
          aiConfidence: draft.aiConfidence ?? undefined,
          receiptText: draft.receiptText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunde inte spara.");
        return;
      }
      setDraft(emptyDraft());
      setStage("idle");
      onSaved();
    } catch {
      setError("Något gick fel vid sparande.");
    }
  }

  return (
    <div className="rounded-2xl border hairline bg-white/60 p-6">
      <h2 className="font-display text-xl">Nytt kvitto</h2>

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragging ? "border-nordic-600 bg-nordic-50" : "hairline"
            }`}
          >
            <p className="text-sm text-ink/70">
              Dra & släpp kvittot här, eller
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-nordic-900"
              >
                Välj bild
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <p className="mt-3 text-xs text-ink/40">
              På mobil öppnas kameran automatiskt.
            </p>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col items-center justify-center gap-4 p-12"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-nordic-600 border-t-transparent" />
            <p className="text-sm text-ink/70">AI analyserar kvitto…</p>
          </motion.div>
        )}

        {stage === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-4"
          >
            {draft.aiConfidence != null && (
              <p className="text-xs text-ink/50">
                AI-träffsäkerhet: {Math.round(draft.aiConfidence * 100)}%
              </p>
            )}
            <Field label="Leverantör">
              <input
                value={draft.vendorName}
                onChange={(e) => setDraft({ ...draft, vendorName: e.target.value })}
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Datum">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Belopp (SEK)">
                <input
                  inputMode="decimal"
                  value={draft.totalAmount}
                  onChange={(e) => {
                    const total = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      totalAmount: total,
                      vatAmount: recalcVat(total, d.vatRate),
                    }));
                  }}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Momssats">
                <select
                  value={draft.vatRate}
                  onChange={(e) => {
                    const rate = Number(e.target.value) as VatRate;
                    setDraft((d) => ({
                      ...d,
                      vatRate: rate,
                      vatAmount: recalcVat(d.totalAmount, rate),
                    }));
                  }}
                  className="input"
                >
                  <option value={6}>6 %</option>
                  <option value={12}>12 %</option>
                  <option value={25}>25 %</option>
                </select>
              </Field>
              <Field label="Moms (SEK)">
                <input
                  inputMode="decimal"
                  value={draft.vatAmount}
                  onChange={(e) => setDraft({ ...draft, vatAmount: e.target.value })}
                  className="input"
                />
              </Field>
            </div>
            <Field label="BAS-konto">
              <BasSelect value={draft.basCode} onChange={onBasChange} />
            </Field>

            {error && <p className="text-sm text-amber">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                className="rounded-full bg-ink px-6 py-2.5 text-sm text-paper hover:bg-nordic-900"
              >
                Spara kvitto
              </button>
              <button
                onClick={() => {
                  setDraft(emptyDraft());
                  setStage("idle");
                  setError(null);
                }}
                className="rounded-full border hairline px-6 py-2.5 text-sm hover:border-ink/40"
              >
                Avbryt
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(22, 24, 29, 0.12);
          background: #fff;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #2f6079;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink/60">
        {label}
      </span>
      {children}
    </label>
  );
}
