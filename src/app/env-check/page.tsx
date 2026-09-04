import EnvClient from "./EnvClient";

// Read on every request. Without this the page is prerendered at build time
// and the server value bakes in too, hiding the thing we're testing.
export const dynamic = "force-dynamic";

export default function EnvCheckPage() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>env-check</h1>
      <p>rendered at: {new Date().toISOString()}</p>

      <section>
        <h2>Server Component</h2>
        <p>NEXT_PUBLIC_MY_VAR: {process.env.NEXT_PUBLIC_MY_VAR ?? "(undefined)"}</p>
        <p>MY_VAR: {process.env.MY_VAR ?? "(undefined)"}</p>
      </section>

      <EnvClient />
    </main>
  );
}
