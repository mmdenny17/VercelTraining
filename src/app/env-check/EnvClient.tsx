"use client";

export default function EnvClient() {
  return (
    <section>
      <h2>Client Component</h2>
      <p>NEXT_PUBLIC_MY_VAR: {process.env.NEXT_PUBLIC_MY_VAR ?? "(undefined)"}</p>
      <p>MY_VAR: {process.env.MY_VAR ?? "(undefined)"}</p>
    </section>
  );
}
