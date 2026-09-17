// Fixture, not a build item. Stands in for a real CMS: persisted to a JSON
// file on disk, read/write. This is what makes "publish new content"
// simulate-able without a real Contentstack account.
//
// Earlier version of this file used a plain module-scope variable instead.
// That turned out to be broken as a fixture: Next.js compiles Route
// Handlers and Server Components into separate bundles, each getting its
// OWN copy of an imported module -- so a "shared" JS variable wasn't
// actually shared at all. A file on disk doesn't have that problem: any
// process on the machine reading this path sees the same bytes, which is
// what makes it a fair stand-in for "an external CMS." (It's still not a
// real network call, and still doesn't model multi-pod cache-consistency
// -- that's what a `cacheHandler` is for, per P6.)

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".cms-source.json");

function readFile(): { label: string } {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return { label: "v1 — initial nav label" };
  }
}

export function getContent() {
  const { label } = readFile();
  return { label, wroteAt: new Date().toISOString() };
}

export function setContent(label: string) {
  fs.writeFileSync(FILE, JSON.stringify({ label }));
  return getContent();
}
