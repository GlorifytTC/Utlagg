"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export type AnnField =
  | "receiptNumber"
  | "vatAmount"
  | "totalAmount"
  | "date"
  | "vendorName";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ReceiptAnnotator({
  image,
  vendor,
  onValue,
}: {
  image: string;
  vendor: string | null;
  onValue: (field: AnnField, value: string) => void;
}) {
  const { t } = useLanguage();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [field, setField] = useState<AnnField>("receiptNumber");
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [busy, setBusy] = useState(false);

  const fields: { key: AnnField; label: string }[] = [
    { key: "receiptNumber", label: t.annFieldReceiptNo },
    { key: "vatAmount", label: t.annFieldVat },
    { key: "totalAmount", label: t.annFieldTotal },
    { key: "date", label: t.annFieldDate },
    { key: "vendorName", label: t.annFieldVendor },
  ];

  function rel(e: React.PointerEvent) {
    const r = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
      W: r.width,
      H: r.height,
    };
  }

  function onDown(e: React.PointerEvent) {
    if (busy) return;
    const p = rel(e);
    setStart({ x: p.x, y: p.y });
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.PointerEvent) {
    if (!start) return;
    const p = rel(e);
    setBox({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  }
  async function onUp(e: React.PointerEvent) {
    if (!start) return;
    const r = wrapRef.current!.getBoundingClientRect();
    const b = box;
    setStart(null);
    if (!b || b.w < 8 || b.h < 8) {
      setBox(null);
      return;
    }
    const norm = { x: b.x / r.width, y: b.y / r.height, w: b.w / r.width, h: b.h / r.height };
    await readBox(norm);
  }

  function cropImage(norm: { x: number; y: number; w: number; h: number }): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const sx = norm.x * img.naturalWidth;
        const sy = norm.y * img.naturalHeight;
        const sw = Math.max(1, norm.w * img.naturalWidth);
        const sh = Math.max(1, norm.h * img.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => reject(new Error("img load"));
      img.src = image;
    });
  }

  async function readBox(norm: { x: number; y: number; w: number; h: number }) {
    setBusy(true);
    try {
      const crop = await cropImage(norm);
      const res = await fetch("/api/ocr/region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, field }),
      });
      const data = await res.json();
      const value = (data.value ?? "").toString().trim();
      if (!res.ok || !value) {
        toast.error(t.annReadFail);
        return;
      }
      onValue(field, value);
      toast.success(t.annSaved);
      // Save the markup as a training sample (best-effort, non-blocking).
      fetch("/api/ocr/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, vendor: vendor ?? undefined, bbox: norm, crop }),
      }).catch(() => {});
    } catch {
      toast.error(t.annReadFail);
    } finally {
      setBusy(false);
      setTimeout(() => setBox(null), 600);
    }
  }

  return (
    <div className="rounded-2xl border hairline bg-grain p-4">
      <p className="font-display text-base">{t.annTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink/55">{t.annDesc}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {fields.map((f) => (
          <button
            key={f.key}
            onClick={() => setField(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              field === f.key
                ? "border-nordic-600 bg-nordic-600 text-paper"
                : "border-ink/15 text-ink/60 hover:border-ink/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-ink/50">{t.annHint}</p>
      <div
        ref={wrapRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative mt-2 inline-block max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg border hairline"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" draggable={false} className="block max-h-[420px] w-auto" />
        {box && (
          <div
            className="absolute border-2 border-nordic-600 bg-nordic-400/20"
            style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
          />
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/50">
            <span className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper">
              <Loader2 className="h-4 w-4 animate-spin" /> {t.annReading}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
