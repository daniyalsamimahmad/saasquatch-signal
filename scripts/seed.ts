/**
 * Deterministic database seed.
 *
 * - Idempotent: skips if data/app.db already exists (pass --force to rebuild),
 *   so `npm install`/`npm run build` never wipes local demo data.
 * - Deterministic: all randomness flows from a fixed-seed PRNG (mulberry32),
 *   so every environment gets an identical, reproducible dataset.
 *
 * Sprint 1 scope: schema + demo user. The full synthetic company dataset
 * (~500 companies, ~800 contacts, lists, drafts, search logs) lands with the
 * search sprint — same script, same determinism.
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "../lib/db";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../lib/validators";

const DB_PATH = path.join(process.cwd(), "data", "app.db");
const force = process.argv.includes("--force");

// Seedable PRNG — Math.random() cannot be seeded, and the demo must be reproducible.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function main() {
  if (fs.existsSync(DB_PATH)) {
    if (!force) {
      console.log("✓ Seed skipped — data/app.db exists (use --force to rebuild)");
      return;
    }
    fs.rmSync(DB_PATH);
    for (const suffix of ["-wal", "-shm"]) {
      const sidecar = DB_PATH + suffix;
      if (fs.existsSync(sidecar)) fs.rmSync(sidecar);
    }
  }

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  conn.exec(SCHEMA);

  const insertUser = conn.prepare(
    "INSERT INTO users (id, name, email, passwordHash) VALUES (?, ?, ?, ?)",
  );
  insertUser.run(
    "user_demo",
    "Demo Searcher",
    DEMO_EMAIL,
    bcrypt.hashSync(DEMO_PASSWORD, 10),
  );

  conn.close();
  console.log(`✓ Seeded ${path.relative(process.cwd(), DB_PATH)}`);
  console.log(`  · demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main();
