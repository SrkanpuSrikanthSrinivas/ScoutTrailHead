"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, fontFamily: "system-ui" }}>
        <h2>Something went wrong</h2>
        <button onClick={() => reset()} style={{ padding: "10px 16px", borderRadius: 8, border: 0, background: "#4a6741", color: "#fff", fontWeight: 700 }}>Try again</button>
      </body>
    </html>
  );
}
