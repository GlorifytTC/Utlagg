"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Reusable logo uploader. Reads a chosen image, downscales it to a small
 * square-ish PNG (≤256px) so the stored base64 stays well under the server's
 * ~1.5MB cap, then calls onSave(dataUrl | null). The parent owns the actual
 * PATCH so this component is reusable for both company and accountant logos.
 */
export function LogoUploader({
  value,
  onSave,
  label = "Logotyp",
}: {
  value: string | null;
  onSave: (dataUrl: string | null) => Promise<void> | void;
  label?: string;
}) {
  const [preview, setPreview] = useState<string | null>(value);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Välj en bildfil.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await downscale(file, 256);
      setPreview(dataUrl);
      await onSave(dataUrl);
      toast.success("Logotyp sparad");
    } catch {
      toast.error("Kunde inte spara logotypen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      setPreview(null);
      await onSave(null);
      toast.success("Logotyp borttagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-ink/40">Ingen</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-ink/50">{label}</span>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Laddar…" : preview ? "Byt" : "Ladda upp"}
          </Button>
          {preview && (
            <Button variant="outline" disabled={busy} onClick={remove}>
              Ta bort
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Downscale an image to a max dimension and return a compressed PNG data URL. */
function downscale(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // SVGs can't be canvas-rasterized reliably; store as-is (already small).
      if (file.type === "image/svg+xml") {
        resolve(reader.result as string);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
