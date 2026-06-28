"use client";

/**
 * Genuinely free, local OCR — runs Tesseract.js entirely in the browser as
 * a Web Worker + WebAssembly. No API key, no per-request cost, no server
 * call for the text-extraction step itself (only the structured-field
 * parsing happens server-side-or-client-side in parseReceiptText, which is
 * pure JS regex, not a paid call either).
 *
 * This exists because every other path in lib/ocr.ts (Mindee, the vision
 * LLM, Google Vision) requires a paid API key, and without one configured
 * the app was silently falling through to OCR.space's shared "helloworld"
 * demo key — a heavily rate-limited, low-quality fallback. Tesseract.js was
 * already a dependency in package.json but had never been wired up to
 * actually run.
 *
 * The worker is created once and reused across uploads in the same
 * session (loading the Swedish language model takes a few seconds, so we
 * don't want to repeat that for every receipt).
 *
 * NOTE: Tesseract.js's worker script and language training data load from
 * cdn.jsdelivr.net / tessdata.projectnaptha.com by default — see
 * middleware.ts for the matching CSP allowances.
 */

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;
// The worker's logger is fixed at creation time in this version of
// tesseract.js (no setLogger method exists post-creation), so progress is
// routed through a mutable callback slot instead of recreating workers.
let currentProgressCallback: ((status: string, progress: number) => void) | null = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      // 'swe' covers Swedish business receipts; 'eng' is included too since
      // brand names, English loanwords, and some chains print in English.
      const worker = await createWorker("swe+eng", undefined, {
        logger: (m) => {
          if (m.status && typeof m.progress === "number") {
            currentProgressCallback?.(m.status, m.progress);
          }
        },
      });
      // Tesseract's default page-segmentation mode assumes a document with
      // multiple paragraphs/columns. A receipt is one narrow column of
      // text, so SINGLE_COLUMN reads it far more reliably — this is the
      // standard, documented tuning for receipt OCR specifically (not a
      // guess), and is the single biggest accuracy lever available without
      // a paid API.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN });
      return worker;
    })();
  }
  return workerPromise;
}

export interface LocalOcrResult {
  text: string;
  confidence: number; // 0-100, Tesseract's own mean confidence
}

/**
 * Runs OCR on an image entirely in the browser. Accepts a data URL,
 * object URL, or File/Blob — anything Tesseract.js's recognize() accepts.
 */
export async function recognizeReceiptLocally(
  image: string | File | Blob,
  onProgress?: (status: string, progress: number) => void,
): Promise<LocalOcrResult> {
  const worker = await getWorker();
  currentProgressCallback = onProgress ?? null;
  try {
    const { data } = await worker.recognize(image);
    return { text: data.text ?? "", confidence: data.confidence ?? 0 };
  } finally {
    currentProgressCallback = null;
  }
}

/** Call when the uploader unmounts for good (e.g. navigating away) to free
 * the WASM worker's memory. Safe to skip — the browser will clean it up on
 * page unload regardless — but tidy to call if you have a natural spot. */
export async function terminateLocalOcrWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
