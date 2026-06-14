"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, ZoomIn, ZoomOut, Maximize2, SquareDashedMousePointer, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export type AnnField =
  | "receiptNumber"
  | "vatAmount"
  | "vatRate"
  | "totalAmount"
  | "date"
  | "vendorName";

interface Box { x: number; y: number; w: number; h: number; }

const ZOOMS = [1, 1.5, 2, 3];

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
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [field, setField] = useState<AnnField>("vendorName");
  const [armed, setArmed] = useState(false); // when true, the next drag draws a box
  const [zoom, setZoom] = useState(1);
  const [stageW, setStageW] = useState(360);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageW(el.clientWidth || 360);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fields: { key: AnnField; label: string }[] = [
    { key: "vendorName", label: t.annFieldVendor },
    { key: "receiptNumber", label: t.annFieldReceiptNo },
    { key: "vatRate", label: t.annFieldVatRate },
    { key: "vatAmount", label: t.annFieldVat },
    { key: "totalAmount", label: t.annFieldTotal },
    { key: "date", label: t.annFieldDate },
  ];
  const fieldLabel = fields.find((f) => f.key === field)?.label ?? "";
  const imgWidth = Math.round(stageW * zoom);

  function rel(e: React.PointerEvent) {
    const r = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - r.left, 0), r.width),
      y: Math.min(Math.max(e.clientY - r.top, 0), r.height),
    };
  }

  function onDown(e: React.PointerEvent) {
    if (busy || !armed) return; // not armed → let the page scroll normally
    const p = rel(e);
    setStart({ x: p.x, y: p.y });
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  }
  function onMove(e: React.PointerEvent) {
    if (!start || !armed) return;
    const p = rel(e);
    setBox({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  }
  async function onUp() {
    if (!start) return;
    const r = wrapRef.current!.getBoundingClientRect();
    const b = box;
    setStart(null);
    setArmed(false); // one-shot: always return to scroll mode
    if (!b || b.w < 8 || b.h < 8) { setBox(null); return; }
    await readBox({ x: b.x / r.width, y: b.y / r.height, w: b.w / r.width, h: b.h / r.height });
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
        canvas.width = sw; canvas.height = sh;
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
      if (!res.ok || !value) { toast.error(t.annReadFail); return; }
      onValue(field, value);
      toast.success(t.annSaved);
      fetch("/api/ocr/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value, vendor: vendor ?? undefined, bbox: norm, crop }),
      }).catch(() => {});
    } catch {
      toast.error(t.annReadFail);
    } finally {
      setBusy(false);
      setTimeout(() => setBox(null), 700);
    }
  }

  const zoomIdx = Math.max(0, ZOOMS.indexOf(zoom));
  const zoomIn = () => setZoom(ZOOMS[Math.min(zoomIdx + 1, ZOOMS.length - 1)]);
  const zoomOut = () => setZoom(ZOOMS[Math.max(zoomIdx - 1, 0)]);
  const fit = () => setZoom(1);

  return (
    <div className="rounded-2xl border hairline bg-grain p-4">
      <p className="font-display text-base">{t.annTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink/55">{t.annDesc}</p>

      {/* Field picker */}
      <div className="mt-3 flex flex-wrap gap-2">
        {fields.map((f) => (
          <button
            key={f.key}
            onClick={() => setField(f.key)}
            className={cn(
              "min-h-[40px] rounded-full border px-4 text-sm transition",
              field === f.key
                ? "border-nordic-600 bg-nordic-600 text-paper"
                : "border-ink/15 text-ink/70 hover:border-ink/40",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Action row: arm button (or armed banner) + zoom */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {armed ? (
          <button
            onClick={() => { setArmed(false); setBox(null); setStart(null); }}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-ink/20 px-4 text-sm text-ink/70"
          >
            <X className="h-4 w-4" /> {t.annCancel}
          </button>
        ) : (
          <button
            onClick={() => setArmed(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-paper transition hover:bg-nordic-900"
          >
            <SquareDashedMousePointer className="h-4 w-4" /> {t.annArm}
          </button>
        )}
        <div className="inline-flex items-center gap-1">
          <button onClick={zoomOut} aria-label="Zoom out" disabled={zoom === ZOOMS[0]} className="flex h-10 w-10 items-center justify-center rounded-full border hairline text-ink/70 disabled:opacity-30">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-ink/60">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} aria-label="Zoom in" disabled={zoom === ZOOMS[ZOOMS.length - 1]} className="flex h-10 w-10 items-center justify-center rounded-full border hairline text-ink/70 disabled:opacity-30">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={fit} aria-label="Fit" className="flex h-10 w-10 items-center justify-center rounded-full border hairline text-ink/70">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className={cn("mt-2 text-xs", armed ? "font-medium text-nordic-600" : "text-ink/50")}>
        {armed ? t.annArmed.replace("{field}", fieldLabel) : t.annScroll}
      </p>

      {/* Stage: scrolls normally unless armed */}
      <div
        ref={stageRef}
        className={cn(
          "relative mt-2 max-h-[62vh] overflow-auto rounded-lg border bg-paper transition",
          armed ? "border-nordic-600 ring-2 ring-nordic-400/40" : "hairline",
        )}
        style={{ touchAction: armed ? "none" : "auto" }}
      >
        <div
          ref={wrapRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          className={cn("relative inline-block select-none", armed && "cursor-crosshair")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" draggable={false} style={{ width: imgWidth, height: "auto", display: "block", maxWidth: "none" }} />
          {box && (
            <div className="pointer-events-none absolute border-2 border-nordic-600 bg-nordic-400/25" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
          )}
        </div>
        {busy && (
          <div className="pointer-events-none sticky inset-x-0 top-1/2 flex justify-center">
            <span className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" /> {t.annReading}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
