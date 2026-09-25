// ============================================================
// BUILD ITEM M6.2 -- make a missing variable name itself
// ============================================================
// You worked out the mechanism in M6.1: `next.config.ts` interpolates
// its template literals when the config module is EVALUATED, and the
// rewrite validator only ever sees the resolved string. By then the
// provenance is gone -- the validator is handed "undefined/:path*"
// with no memory of which variable produced it.
//
// You also established the consequence: if three destinations were
// interpolated instead of one, nothing in the build log would tell
// them apart. The fix has to move upstream of the error, not improve
// the error.
//
// Your proposal was to validate at the top of next.config.ts. Write it.
//
// WHAT TO BUILD
// A function that takes the names of the variables this build requires,
// checks process.env for each, and throws if any are missing -- with a
// message that names every missing one, not just the first.
//
// Then call it at the top of next.config.ts, above `const nextConfig`.
//
// DECIDE THESE BEFORE YOU WRITE (they are the real content of this item):
//
// 1. Throw, or collect-then-throw? If BACKEND_BASE_URL and CMS_BASE_URL
//    are BOTH unset, how many builds does a fail-on-first-missing check
//    cost you before the project is green? Does that change your answer?
//
// 2. What counts as "missing"? `undefined` is obvious. What about an
//    empty string -- which is what a Vercel dashboard variable saved
//    with a blank value gives you? Would an empty string have produced
//    the SAME "undefined/:path*" symptom, or a different one? Trace it
//    rather than guessing; the answer decides whether your check is
//    `== null` or something stricter.
//
// 3. Where does this run? next.config.ts is evaluated at build time AND
//    at server start. Is a throw the right behavior in both, or does
//    one of them deserve different handling? (Compare against Module 1's
//    finding about what a failed build produces -- and does not produce.)
//
// THEN THE HARDER HALF -- this is why the item exists:
//
// 4. Your README already names `DATABASE_URL` (db.ts:14) as a live P5
//    violation: the Pool constructs fine with an undefined connection
//    string, nothing fails at boot, and every POST silently fails to
//    persist instead. Same failure class as this one, opposite symptom
//    -- this one fails loudly at build, that one fails silently at
//    runtime forever.
//
//    Does the guard you just wrote fix db.ts too? Say why or why not
//    in a comment before you write any code for it. The answer is not
//    obviously yes, and the reason turns on WHERE each variable is
//    read and WHEN -- the same attachment-point question as always:
//    what does this guard attach to, and is db.ts on that path?
//
// YOUR TURN below this line.
