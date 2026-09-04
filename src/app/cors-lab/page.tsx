"use client";

import { useState } from "react";

type EchoResult = {
  method: string;
  origin: string;
  host: string | null;
  referer: string;
};

export default function CorsLab() {
  const [get, setGet] = useState<EchoResult | null>(null);
  const [post, setPost] = useState<EchoResult | null>(null);

  // Both calls are SAME-ORIGIN: this page and /api/echo share a hostname.
  // Nothing cross-origin is happening. Only the verb differs.
  async function fireGet() {
    const res = await fetch("/api/echo");
    setGet(await res.json());
  }

  async function firePost() {
    const res = await fetch("/api/echo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ anything: true }),
    });
    setPost(await res.json());
  }

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.7 }}>
      <h1>cors-lab</h1>
      <p>Both requests below go to /api/echo on this same origin.</p>

      <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0" }}>
        <button onClick={fireGet} style={{ padding: "0.5rem 1rem" }}>
          fire GET
        </button>
        <button onClick={firePost} style={{ padding: "0.5rem 1rem" }}>
          fire POST
        </button>
      </div>

      <section>
        <h2>GET saw:</h2>
        <pre>{get ? JSON.stringify(get, null, 2) : "(not fired yet)"}</pre>
      </section>

      <section>
        <h2>POST saw:</h2>
        <pre>{post ? JSON.stringify(post, null, 2) : "(not fired yet)"}</pre>
      </section>
    </main>
  );
}
