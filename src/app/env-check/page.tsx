import { Suspense } from "react";
import { connection } from "next/server";
import EnvClient from "./EnvClient";

// connection() is an explicit opt-out of caching (same as nav-preview's
// RenderedAt) -- it must live in its own Suspense boundary under
// cacheComponents, so only this piece is excluded from the static shell
// instead of blocking the whole page from prerendering.
async function ServerEnvInfo() {
  await connection();

  return (
    <>
      <p>rendered at: {new Date().toISOString()}</p>
      <section>
        <h2>Server Component</h2>
        <p>NEXT_PUBLIC_MY_VAR: {process.env.NEXT_PUBLIC_MY_VAR ?? "(undefined)"}</p>
        <p>MY_VAR: {process.env.MY_VAR ?? "(undefined)"}</p>
      </section>
    </>
  );
}

export default function EnvCheckPage() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>env-check</h1>
      <Suspense fallback={<p>rendered at: …</p>}>
        <ServerEnvInfo />
      </Suspense>

      <EnvClient />
    </main>
  );
}
