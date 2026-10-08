"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Reusable logo uploader. Reads a chosen image, downscales it to a small
 * square-ish PNG (≤256px) so the stored base64 stays well under the server's
 * ~1.5MB cap, then calls onSave(dataUrl | null). The parent owns the actual
 * PATCH so this component is reusable for both company and accountant logos.
 */
export function LogoUploader({
  value,
  onSave,
  label: labelProp,
  avatar = false,
}: {
  value: string | null;
  onSave: (dataUrl: string | null) => Promise<void> | void;
  label?: string;
  /** Profile picture: centre-cropped to a square and previewed in a circle. */
  avatar?: boolean;
}) {
  const { t } = useLanguage();
  const label = labelProp ?? t.logoDefaultLabel;
  const [preview, setPreview] = useState<string | null>(value);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t.logoPickImage);
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await downscale(file, 256, avatar);
      setPreview(dataUrl);
      await onSave(dataUrl);
      toast.success(t.logoSaved);
    } catch {
      toast.error(t.logoSaveError);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      setPreview(null);
      await onSave(null);
      toast.success(t.logoRemoved);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] ${avatar ? "rounded-full" : "rounded-lg"}`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className={avatar ? "h-full w-full object-cover" : "h-full w-full object-contain p-1"} />
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-400">{t.logoNone}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? t.loading : preview ? t.logoChange : t.logoUpload}
          </Button>
          {preview && (
            <Button variant="outline" disabled={busy} onClick={remove}>
              {t.logoRemove}
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          aria-label={label}
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
function downscale(file: File, maxDim: number, square = false): Promise<string> {
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
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        if (square) {
          const side = Math.min(img.width, img.height);
          const out = Math.min(maxDim, side);
          canvas.width = canvas.height = out;
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, out, out);
        } else {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
