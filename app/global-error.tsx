"use client";

// Replaces the root layout on a fatal error, so it can't use providers or Tailwind theme context.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#FAF8F3", color: "#1A1A1A", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <h1 style={{ fontSize: 32, margin: 0 }}>Något gick fel / Something went wrong</h1>
        <button onClick={reset} style={{ background: "#C4522F", color: "#fff", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 14, cursor: "pointer" }}>
          Försök igen / Try again
        </button>
      </body>
    </html>
  );
}
