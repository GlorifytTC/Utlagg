"use client";

import { recognizeReceiptLocally } from "@/lib/ocr-client";
import { parseReceiptText } from "@/lib/ocr";

/**
 * The "own model": the free, local receipt reader that would replace Gemini.
 * Tesseract.js (in the browser) -> parseReceiptText -> crowd-learned vendor
 * correction. This is exactly the pipeline the uploader falls back to when
 * Gemini is unavailable, so measuring it measures what users would get.
 */

export interface OwnModelResult {
  vendorName: string | null;
  orgNumber: string | null;
  receiptNumber: string | null;
  date: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  vatRate: number | null;
}

/** Shape-only helper so the uploader's local path and the shadow read post the same thing. */
export function toOwnModelResult(r: {
  vendorName?: string | null;
  orgNumber?: string | null;
  receiptNumber?: string | null;
  date?: string | null;
  totalAmount?: number | null;
  vatAmount?: number | null;
  vatRate?: number | null;
}): OwnModelResult {
  return {
    vendorName: r.vendorName ?? null,
    orgNumber: r.orgNumber ?? null,
    receiptNumber: r.receiptNumber ?? null,
    date: r.date ?? null,
    totalAmount: r.totalAmount ?? null,
    vatAmount: r.vatAmount ?? null,
    vatRate: r.vatRate ?? null,
  };
}

/** Learned vendor name for this org number / OCR guess, if any user has corrected it before. */
export async function lookupLearnedVendor(orgNumber: string | null, ocrGuess: string | null) {
  try {
    const qs = new URLSearchParams();
    if (orgNumber) qs.set("orgNumber", orgNumber);
    if (ocrGuess) qs.set("ocrGuess", ocrGuess);
    if (!qs.toString()) return null;
    const res = await fetch(`/api/ocr/vendor-lookup?${qs.toString()}`);
    if (!res.ok) return null;
    const { correction } = await res.json();
    return (correction as { vendorName: string; basCode: string | null } | null) ?? null;
  } catch {
    return null;
  }
}

/** Full own-model read of one image. */
export async function readWithOwnModel(image: string): Promise<{ result: OwnModelResult; confidence: number } | null> {
  const local = await recognizeReceiptLocally(image);
  if (!local.text) return null;
  const parsed = parseReceiptText(local.text);
  const learned = await lookupLearnedVendor(parsed.orgNumber, parsed.vendorName);
  return {
    result: toOwnModelResult({ ...parsed, vendorName: learned?.vendorName ?? parsed.vendorName }),
    confidence: local.confidence,
  };
}

/** Store an own-model read for training. Returns the training row id (new or existing). */
export async function postShadowRead(body: {
  trainingId?: string | null;
  image?: string;
  localResult: OwnModelResult;
  localConfidence: number | null;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/ocr/shadow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, trainingId: body.trainingId ?? undefined }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return (d.trainingId as string | null) ?? null;
  } catch {
    return null;
  }
}
