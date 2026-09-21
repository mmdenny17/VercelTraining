// Scaffolding, not a build item. error.tsx must be a Client Component --
// Next requires this because it needs to attach a browser-side error
// boundary and offer a `reset()` that re-renders on the client. Same
// mechanism as nextjs-dashboard's Ch.12 error.tsx (Module 2), just against
// this route's own error: a missing ?distId= (BUILD ITEM M5.5 in page.tsx
// throws for exactly this case).

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>profile-overview (capstone)</h1>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
