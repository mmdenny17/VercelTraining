// Fixture, not a build item. File-backed key/value store, same pattern as
// lib/cms-source.ts -- persisted to disk so a Route Handler and a Server
// Component both see the same value (M3's lesson: a plain module-scope
// variable is NOT shared across Next's separate bundles).

import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), ".preferences-store.json");

type PreferencesRecord = { celebrationDismissed: boolean };
type Store = Record<string, PreferencesRecord>;

function readAll(): Store {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function getRaw(distId: string): PreferencesRecord {
  return readAll()[distId] ?? { celebrationDismissed: false };
}

export function setRaw(distId: string, prefs: PreferencesRecord): PreferencesRecord {
  const all = readAll();
  all[distId] = prefs;
  fs.writeFileSync(FILE, JSON.stringify(all));
  return prefs;
}
