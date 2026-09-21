// ============================================================
// BUILD ITEM M5.5a -- the client component half of the boundary decision
// ============================================================
// This is the one piece of the capstone that has to be a Client Component,
// and DoD item 3 wants that decision written down, not just made. Above
// this comment, in your own words once you've built it: why does THIS
// component need "use client" (what does it do that a Server Component
// structurally cannot), and why does the rest of the page NOT need it?
//
// Requirements:
//   1. "use client" at the top.
//   2. Props: { distId: string }.
//   3. Local state machine: idle -> submitting -> success | error.
//      (useState is fine -- this is a single click handler, not shared
//      state anything else on the page needs.)
//   4. onClick: POST to /api/preferences (M5.1c) with
//      { distId, celebrationDismissed: true }. Use the response status,
//      not just "did fetch throw", to decide success vs error --
//      M5.1c returns structured JSON on both 200 and its error paths, it
//      doesn't throw.
//   5. Render per state: idle/submitting -> a button (disabled while
//      submitting, label changes), success -> confirmation text, no
//      button, error -> the error message plus a way to retry (clicking
//      again from the error state should work, not require a reload).
//
// YOUR TURN below this line.

export default function DismissCelebrationButton({ distId }: { distId: string }) {
  return null;
}
