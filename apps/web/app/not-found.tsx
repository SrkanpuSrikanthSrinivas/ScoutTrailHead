export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, background: "var(--sand)", fontFamily: "system-ui" }}>
      <h2 style={{ fontFamily: "Oswald, system-ui", color: "var(--pine)" }}>Trail not found</h2>
      <a href="/" style={{ color: "var(--moss)" }}>Back to camp →</a>
    </div>
  );
}
