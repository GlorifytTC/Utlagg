"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BasSelect } from "./BasSelect";
import { getBasAccount } from "@/lib/bas";
import { suggestBasCode } from "@/lib/auto-categorize";
import { resolveVatRate, vatFromGross, type VatRate } from "@/lib/vat";
import { recognizeReceiptLocally } from "@/lib/ocr-client";
import { parseReceiptText } from "@/lib/ocr";
import { useLanguage } from "@/context/LanguageContext";
import { ReceiptAnnotator } from "@/components/dashboard/ReceiptAnnotator";
import { cn } from "@/lib/utils";

interface Draft {
  vendorName: string;
  receiptNumber: string;
  date: string;
  totalAmount: string;
  vatAmount: string;
  vatRate: VatRate;
  basCode: string | null;
  // True only when basCode was filled in automatically from the vendor
  // name (not picked by the person) — drives the "auto-detected" hint and
  // is cleared the moment they touch the category selector themselves.
  basCodeAutoDetected: boolean;
  aiConfidence: number | null;
  receiptText: string;
  image: string;
}

const emptyDraft = (): Draft => ({
  vendorName: "",
  receiptNumber: "",
  // Empty rather than new Date(): a non-deterministic value in the initial
  // form state is a hydration-mismatch risk, and a blank date the person
  // fills in is more honest than a defaulted "today" that may be wrong.
  date: "",
  totalAmount: "",
  vatAmount: "",
  vatRate: 25,
  basCode: null,
  basCodeAutoDetected: false,
  aiConfidence: null,
  receiptText: "",
  image: "",
});

async function compressImage(file: File, maxDim = 1500, quality = 0.6): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

export function ReceiptUploader({ onSaved }: { onSaved: () => void }) {
  const { t } = useLanguage();
  const [stage, setStage] = useState<"idle" | "scanning" | "review">("idle");
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [scanStatus, setScanStatus] = useState<string>("");
  // Snapshot of exactly what OCR originally guessed, kept around so save()
  // can detect which fields the person actually corrected — those
  // corrections are the real "self-learning" signal (see lib/ocr-learn.ts).
  const [ocrSnapshot, setOcrSnapshot] = useState<{
    vendorName: string | null;
    orgNumber: string | null;
    totalAmount: number | null;
    basCode: string | null;
  } | null>(null);
  // ID of the training-data row created when Gemini read this receipt, so
  // the user's final confirmed values can be attached on save (the label).
  const [trainingId, setTrainingId] = useState<string | null>(null);

  const applyExtractedData = useCallback(
    (
      data: {
        vendorName?: string | null;
        orgNumber?: string | null;
        receiptNumber?: string | null;
        date?: string | null;
        totalAmount?: number | null;
        vatAmount?: number | null;
        vatRate?: number | null;
        rawText?: string | null;
      },
      base64: string,
    ) => {
      let vat = data.vatAmount ?? null;
      const total = data.totalAmount ?? null;
      const rate = data.vatRate ?? null;
      if ((vat == null || vat === 0) && total && rate) {
        vat = Math.round((total - total / (1 + rate / 100)) * 100) / 100;
      }
      const suggestedBasCode = suggestBasCode(data.vendorName);
      const suggestedAccount = suggestedBasCode ? getBasAccount(suggestedBasCode) : undefined;
      setOcrSnapshot({
        vendorName: data.vendorName ?? null,
        orgNumber: data.orgNumber ?? null,
        totalAmount: total,
        basCode: suggestedBasCode,
      });
      setDraft({
        vendorName: data.vendorName ?? "",
        receiptNumber: data.receiptNumber ?? "",
        // Leave blank rather than silently defaulting to today — a wrong
        // date that LOOKS correct (e.g. today's date on a 2022 receipt) is
        // worse than an empty field the person notices and fills in.
        date: data.date ?? "",
        totalAmount: total?.toString() ?? "",
        vatAmount: vat != null ? vat.toString() : "",
        // Prefer the VAT rate OCR actually read off the receipt; only fall
        // back to the category's typical rate when OCR found none.
        vatRate:
          (rate as VatRate | undefined) ??
          (suggestedAccount
            ? resolveVatRate(suggestedAccount.vatCategory, new Date(data.date ?? new Date()))
            : 25),
        basCode: suggestedBasCode,
        basCodeAutoDetected: Boolean(suggestedBasCode),
        aiConfidence: null,
        receiptText: data.rawText ?? "",
        image: base64,
      });
    },
    [],
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setStage("scanning");
      setScanStatus(t.rcScanningLocally);
      setOcrSnapshot(null);
      setTrainingId(null);
      try {
        const base64 = await compressImage(file);

        // Step 0: AI reading via Gemini (free-tier vision). This understands
        // ANY receipt/format directly, and every read is saved server-side
        // as labeled training data. If it fails (no key, daily quota hit,
        // network error) we fall through to free local Tesseract below, so
        // the app keeps working regardless.
        setScanStatus(t.rcScanningAi ?? t.rcScanningLocally);
        try {
          const aiRes = await fetch("/api/ocr/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64 }),
          });
          if (aiRes.ok) {
            const ai = await aiRes.json();
            // Only accept the AI result if it actually found something.
            if (ai.vendorName || ai.totalAmount != null) {
              setTrainingId(ai.trainingId ?? null);
              applyExtractedData(
                {
                  vendorName: ai.vendorName,
                  orgNumber: ai.orgNumber,
                  receiptNumber: ai.receiptNumber,
                  date: ai.date,
                  totalAmount: ai.totalAmount,
                  vatAmount: ai.vatAmount,
                  vatRate: ai.vatRate,
                  rawText: ai.rawText ?? "",
                },
                base64,
              );
              setStage("review");
              return;
            }
          }
          // Non-OK (e.g. 502 fallback flag) or empty result: fall through.
        } catch (e) {
          console.error("AI OCR unavailable, falling back to local:", e);
        }

        // Step 1: free, local OCR in the browser — no API key, no cost,
        // runs even with zero AI keys configured anywhere. Default path.
        setScanStatus(t.rcScanningLocally);
        let localText = "";
        let localConfidence = 0;
        try {
          const local = await recognizeReceiptLocally(base64, (status, progress) => {
            setScanStatus(`${status} ${Math.round(progress * 100)}%`);
          });
          localText = local.text;
          localConfidence = local.confidence;
        } catch (e) {
          console.error("local OCR failed, will rely on server fallback:", e);
        }

        const localParsed = localText ? parseReceiptText(localText) : null;

        if (localParsed) {
          // Before showing OCR's guess, check whether ANY user has
          // already corrected this exact vendor before (matched by org
          // number — reliable — or, failing that, the same garbled OCR
          // text). If so, use the crowd-corrected name/category instead
          // of repeating the same mistake. Best-effort: a failed lookup
          // (network hiccup, not logged in yet, etc.) just falls through
          // to OCR's own guess, same as before this existed.
          let vendorOverride: { vendorName: string; basCode: string | null } | null = null;
          try {
            const qs = new URLSearchParams();
            if (localParsed.orgNumber) qs.set("orgNumber", localParsed.orgNumber);
            if (localParsed.vendorName) qs.set("ocrGuess", localParsed.vendorName);
            if (qs.toString()) {
              const lookupRes = await fetch(`/api/ocr/vendor-lookup?${qs.toString()}`);
              if (lookupRes.ok) {
                const { correction } = await lookupRes.json();
                if (correction) vendorOverride = correction;
              }
            }
          } catch (e) {
            console.error("vendor correction lookup failed (non-blocking):", e);
          }

          // Always use what Tesseract found — even a low-confidence local
          // read is more honest than OCR.space's free demo key, which is
          // shared, rate-limited, and has produced garbage results (e.g.
          // "net te" for a ZARA receipt). No paid API is used as a
          // fallback here by design — see the decision recorded below.
          applyExtractedData(
            {
              vendorName: vendorOverride?.vendorName ?? localParsed.vendorName,
              orgNumber: localParsed.orgNumber,
              receiptNumber: localParsed.receiptNumber,
              date: localParsed.date,
              totalAmount: localParsed.totalAmount,
              vatAmount: localParsed.vatAmount,
              vatRate: localParsed.vatRate,
              rawText: localParsed.rawText,
            },
            base64,
          );
          if (vendorOverride?.basCode) {
            // applyExtractedData already auto-suggests a basCode from the
            // vendor name, but the crowd-learned one (tied to this exact
            // org number) is more specific than the generic name-pattern
            // guess, so it takes precedence.
            setDraft((d) => ({ ...d, basCode: vendorOverride!.basCode, basCodeAutoDetected: true }));
          }
          const looksGood =
            localConfidence >= 60 && (localParsed.totalAmount != null || localParsed.vendorName != null);
          if (!looksGood && !vendorOverride) {
            setError(t.rcLowConfidence);
          } else if (localConfidence < 80 && !vendorOverride) {
            setError(t.rcLocalLowConfidence);
          }
        } else {
          // Tesseract found literally no text at all (blurry photo, OCR
          // worker failed to load, etc.) — don't silently call a paid API
          // or the free-but-unreliable OCR.space fallback; ask the person
          // to fill it in by hand instead, with an honest explanation.
          setDraft(emptyDraft());
          setError(t.rcLowConfidence);
        }
        setStage("review");
        return;
      } catch (err) {
        console.error(err);
        setError("Kunde inte läsa filen.");
        setStage("review");
      }
    },
    [applyExtractedData, t],
  );

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [showCamera]);

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      cameraRef.current?.click();
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setShowCamera(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      closeCamera();
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      closeCamera();
      if (blob) {
        const file = new File([blob], `kvitto-${Date.now()}.jpg`, { type: "image/jpeg" });
        handleFile(file);
      }
    }, "image/jpeg", 0.85);
  }

  function onBasChange(code: string) {
    const account = getBasAccount(code);
    setDraft((d) => ({
      ...d,
      basCode: code,
      basCodeAutoDetected: false, // person took over — no longer "just a guess"
      vatRate: account ? resolveVatRate(account.vatCategory, new Date(d.date)) : d.vatRate,
    }));
  }

  function recalcVat(total: string, rate: VatRate) {
    const n = Number(total);
    if (Number.isFinite(n) && n > 0) return vatFromGross(n, rate).vat.toString();
    return "";
  }

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: draft.vendorName || undefined,
          receiptNumber: draft.receiptNumber || undefined,
          imageUrl: draft.image || undefined,
          date: draft.date ? new Date(draft.date).toISOString() : undefined,
          totalAmount: draft.totalAmount ? Number(draft.totalAmount) : undefined,
          vatAmount: draft.vatAmount ? Number(draft.vatAmount) : undefined,
          vatRate: draft.vatRate,
          basCode: draft.basCode ?? undefined,
          category: draft.basCode ? getBasAccount(draft.basCode)?.name : undefined,
          aiConfidence: draft.aiConfidence ?? undefined,
          receiptText: draft.receiptText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunde inte spara.");
        setIsSaving(false);
        return;
      }
      // Teach the shared correction history if the person changed the
      // vendor name from what OCR guessed — best-effort, never blocks the
      // save that just succeeded above.
      if (ocrSnapshot && draft.vendorName && draft.vendorName !== ocrSnapshot.vendorName) {
        fetch("/api/ocr/vendor-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgNumber: ocrSnapshot.orgNumber ?? undefined,
            ocrGuess: ocrSnapshot.vendorName ?? undefined,
            correctVendor: draft.vendorName,
            basCode: draft.basCode ?? undefined,
          }),
        }).catch(() => {});
      }
      // Attach the final confirmed values as the training label for the row
      // Gemini created when it read this receipt. wasCorrected flags whether
      // the user changed what the AI proposed — the highest-value examples.
      if (trainingId) {
        const wasCorrected =
          !!ocrSnapshot &&
          (draft.vendorName !== (ocrSnapshot.vendorName ?? "") ||
            (draft.totalAmount !== "" &&
              Number(draft.totalAmount) !== (ocrSnapshot.totalAmount ?? NaN)));
        fetch("/api/ocr/ai/confirm", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainingId,
            confirmedVendor: draft.vendorName || undefined,
            confirmedDate: draft.date || undefined,
            confirmedTotal: draft.totalAmount !== "" ? Number(draft.totalAmount) : undefined,
            confirmedVat: draft.vatAmount !== "" ? Number(draft.vatAmount) : undefined,
            confirmedVatRate: draft.vatRate ?? undefined,
            wasCorrected,
          }),
        }).catch(() => {});
      }
      setDraft(emptyDraft());
      setStage("idle");
      onSaved();
    } catch {
      setError("Något gick fel vid sparande.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-[#0D0D0D]">
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center bg-black/90 p-4 sm:p-6"
          >
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <video ref={videoRef} playsInline muted className="max-h-full max-w-full rounded-xl object-contain" />
            </div>
            <div className="flex shrink-0 justify-center gap-3 py-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={capturePhoto} className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 dark:bg-white/[0.12] dark:text-white dark:hover:bg-white/[0.18]">
                {t.receiptTakePhoto}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeCamera} className="rounded-full border border-white/40 px-6 py-2.5 text-sm text-white hover:bg-white/10">
                {t.receiptCancel}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="font-display text-xl text-gray-900 dark:text-white">{t.receiptNewTitle}</h2>

      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="drop"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
            className={cn(
              "mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition",
              dragging ? "border-nordic-600 bg-nordic-600/[0.08]" : "border-gray-900/[0.15] bg-white/40 dark:border-white/[0.15] dark:bg-black/30",
            )}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">{t.receiptDragDrop}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => inputRef.current?.click()} className="rounded-full bg-nordic-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-nordic-700 dark:text-[#050505]">
                {t.receiptChooseImage}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCamera} className="rounded-full border border-gray-900/[0.15] px-5 py-2.5 text-sm text-gray-600 hover:border-gray-900/40 dark:border-white/[0.15] dark:text-gray-300 dark:hover:border-white/40">
                {t.receiptTakePhoto}
              </motion.button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-400">{t.receiptCameraHint}</p>
          </motion.div>
        )}

        {stage === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-4 flex flex-col items-center justify-center gap-4 p-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-10 w-10 rounded-full border-2 border-nordic-600 border-t-transparent"
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">AI analyserar kvitto…</p>
          </motion.div>
        )}

        {stage === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 space-y-4"
          >
            {draft.aiConfidence != null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                AI-träffsäkerhet: {Math.round(draft.aiConfidence * 100)}%
              </motion.p>
            )}
            {draft.image && (
              <ReceiptAnnotator
                image={draft.image}
                vendor={draft.vendorName || null}
                onValue={(f, v) =>
                  setDraft((d) => {
                    if (f === "vatRate") {
                      const nums = (v.replace(",", ".").match(/\d+/g) ?? []).map(Number);
                      const rate = ([6, 12, 25] as const).find((r) => nums.includes(r)) ?? d.vatRate;
                      return { ...d, vatRate: rate as VatRate };
                    }
                    if (f === "vatAmount" || f === "totalAmount") {
                      return { ...d, [f]: v.replace(/[^\d.,-]/g, "").replace(",", ".") };
                    }
                    return { ...d, [f]: v.trim() };
                  })
                }
              />
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Leverantör</label>
                <input
                  value={draft.vendorName}
                  onChange={(e) => setDraft({ ...draft, vendorName: e.target.value })}
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Kvittonummer</label>
                <input
                  value={draft.receiptNumber}
                  onChange={(e) => setDraft({ ...draft, receiptNumber: e.target.value })}
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                  placeholder="Valfritt"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Datum</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Belopp (SEK)</label>
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
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Momssats</label>
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
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                >
                  <option value={6}>6 %</option>
                  <option value={12}>12 %</option>
                  <option value={25}>25 %</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Moms (SEK)</label>
                <input
                  inputMode="decimal"
                  value={draft.vatAmount}
                  onChange={(e) => setDraft({ ...draft, vatAmount: e.target.value })}
                  className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                BAS-konto
                {draft.basCodeAutoDetected && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {t.rcCategoryAutoDetected}
                  </span>
                )}
              </label>
              <BasSelect value={draft.basCode} onChange={onBasChange} />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm text-amber-600 dark:text-amber-400"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={save}
                disabled={isSaving}
                className={cn(
                  "rounded-full bg-nordic-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-nordic-700 dark:text-[#050505]",
                  isSaving && "opacity-70 cursor-not-allowed",
                )}
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent dark:border-gray-900 dark:border-t-transparent" />
                    </motion.span>
                    Sparar...
                  </span>
                ) : (
                  "Spara kvitto"
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setDraft(emptyDraft());
                  setStage("idle");
                  setError(null);
                }}
                className="rounded-full border border-gray-900/[0.15] px-6 py-2.5 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40"
              >
                Avbryt
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}