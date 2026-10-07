/** Fetch a file and save it via a temporary anchor. Throws Error(message) on a non-2xx. */
export async function downloadFile(url: string, init?: RequestInit, fallbackName = "export"): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const d = await res.json().catch(() => null);
    throw new Error(d?.error ?? `HTTP ${res.status}`);
  }
  const name = /filename="?([^";]+)"?/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? fallbackName;
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
