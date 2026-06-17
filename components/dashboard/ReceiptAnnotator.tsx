"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ZoomIn, ZoomOut, Maximize2, SquareDashedMousePointer, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export type AnnField = "receiptNumber" | "vatAmount" | "vatRate" | "totalAmount" | "date" | "vendorName";
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
  const [armed, setArmed] = useState(false);
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
    return { x: Math.min(Math.max(e.clientX - r.left, 0), r.width), y: Math.min(Math.max(e.clientY - r.top, 0), r.height) };
  }

  function onDown(e: React.PointerEvent) {
    if (busy || !armed) return;
    const p = rel(e);
    setStart({ x: p.x, y: p.y });
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onMove(e: React.PointerEvent) {
    if (!start || !armed) return;
    const p = rel(e);
    setBox({ x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) });
  }

  async function onUp() {
    if (!start) return;
    const r = wrapRef.current!.getBoundingClientRect();
    const b = box;
    setStart(null);
    setArmed(false);
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
      const res = await fetch("/api/ocr/region", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crop, field }) });
      const data = await res.json();
      const value = (data.value ?? "").toString().trim();
      if (!res.ok || !value) { toast.error(t.annReadFail); return; }
      onValue(field, value);
      toast.success(t.annSaved);
      fetch("/api/ocr/sample", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, value, vendor: vendor ?? undefined, bbox: norm, crop }) }).catch(() => {});
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
    <div className="rounded-2xl border border-gray-900/[0.07] bg-[#F5F4F0]/60 p-4 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-[#0C0D0F]/60">
      <p className="font-display text-base text-gray-900 dark:text-white">{t.annTitle}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t.annDesc}</p>
      
      <div className="mt-3 flex flex-wrap gap-2">
        {fields.map((f) => (
          <motion.button
            key={f.key}
            onClick={() => setField(f.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "min-h-[40px] rounded-full border px-4 text-sm transition",
              field === f.key
                ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                : "border-gray-900/[0.15] text-gray-600 hover:border-gray-900/40 dark:border-white/[0.15] dark:text-gray-300 dark:hover:border-white/40",
            )}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <AnimatePresence mode="wait">
          {armed ? (
            <motion.button
              key="cancel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => { setArmed(false); setBox(null); setStart(null); }}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-gray-900/[0.15] px-4 text-sm text-gray-600 dark:border-white/[0.15] dark:text-gray-300"
            >
              <X className="h-4 w-4" /> {t.annCancel}
            </motion.button>
          ) : (
            <motion.button
              key="arm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={() => setArmed(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              <SquareDashedMousePointer className="h-4 w-4" /> {t.annArm}
            </motion.button>
          )}
        </AnimatePresence>
        
        <div className="inline-flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={zoomOut} aria-label="Zoom out" disabled={zoom === ZOOMS[0]} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-900/[0.12] text-gray-600 disabled:opacity-30 dark:border-white/[0.12] dark:text-gray-300">
            <ZoomOut className="h-4 w-4" />
          </motion.button>
          <span className="w-12 text-center text-xs tabular-nums text-gray-500 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={zoomIn} aria-label="Zoom in" disabled={zoom === ZOOMS[ZOOMS.length - 1]} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-900/[0.12] text-gray-600 disabled:opacity-30 dark:border-white/[0.12] dark:text-gray-300">
            <ZoomIn className="h-4 w-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fit} aria-label="Fit" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-900/[0.12] text-gray-600 dark:border-white/[0.12] dark:text-gray-300">
            <Maximize2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <p className={cn("mt-2 text-xs", armed ? "font-medium text-sky-600" : "text-gray-500 dark:text-gray-400")}>
        {armed ? t.annArmed.replace("{field}", fieldLabel) : t.annScroll}
      </p>

      <div
        ref={stageRef}
        className={cn(
          "relative mt-2 max-h-[62vh] overflow-auto rounded-lg border bg-white/60 transition dark:bg-gray-950/60",
          armed ? "border-sky-600 ring-2 ring-sky-400/40" : "border-gray-900/[0.07] dark:border-white/[0.07]",
        )}
        style={{ touchAction: armed ? "none" : "auto" }}
      >
        <div ref={wrapRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} className={cn("relative inline-block select-none", armed && "cursor-crosshair")}>
          <img src={image} alt="" draggable={false} style={{ width: imgWidth, height: "auto", display: "block", maxWidth: "none" }} />
          <AnimatePresence>
            {box && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-none absolute border-2 border-sky-600 bg-sky-400/25"
                style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              />
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {busy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none sticky inset-x-0 top-1/2 flex justify-center"
            >
              <span className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-white dark:text-gray-900">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4" />
                </motion.span>
                {t.annReading}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}