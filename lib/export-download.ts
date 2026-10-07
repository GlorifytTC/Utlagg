import { zipSync } from "fflate";

export type ExportFile = { name: string; blob: Blob };

/** Fetch one export file. Throws Error(message) on a non-2xx. */
export async function fetchFile(url: string, init?: RequestInit, fallbackName = "export"): Promise<ExportFile> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.error ?? `HTTP ${res.status}`);
  }
  const name = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  return { name, blob: await res.blob() };
}

function save({ name, blob }: ExportFile) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking right away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

/** One file downloads as-is; several are bundled into a single ZIP (one total export). */
export async function downloadExport(files: ExportFile[], zipName: string): Promise<void> {
  if (files.length === 1) return save(files[0]);
  const used = new Set<string>();
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    let n = f.name;
    for (let i = 2; used.has(n); i++) n = f.name.replace(/(\.[^.]*)?$/, `-${i}$1`);
    used.add(n);
    entries[n] = new Uint8Array(await f.blob.arrayBuffer());
  }
  save({ name: zipName, blob: new Blob([zipSync(entries)], { type: "application/zip" }) });
}
