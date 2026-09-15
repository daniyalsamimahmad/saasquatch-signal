import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite connection, safe on both local dev and Vercel serverless.
 *
 * Vercel's filesystem is read-only except /tmp, and the bundled seed DB
 * would be silently unwritable — the exact "silent wrongness" failure mode
 * this project exists to fix. So on Vercel we copy the seeded database to
 * /tmp once per cold start and open it there: every write works within the
 * instance's lifetime, and the demo resets when the instance recycles.
 * That trade-off is disclosed in the README, not hidden.
 */

const SEED_DB_PATH = path.join(process.cwd(), "data", "app.db");
const TMP_DB_PATH = "/tmp/app.db";

function open(): Database.Database {
  const target = process.env.VERCEL ? TMP_DB_PATH : SEED_DB_PATH;
  if (process.env.VERCEL && !fs.existsSync(TMP_DB_PATH)) {
    fs.copyFileSync(SEED_DB_PATH, TMP_DB_PATH);
  }
  // fileMustExist: a missing seed must fail loudly — silently creating an
  // empty database is exactly the silent-wrongness this project is about.
  const conn = new Database(target, { fileMustExist: true });
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");
  return conn;
}

// Cache across HMR reloads in dev and across invocations in a warm instance.
const globalCache = globalThis as unknown as { __sqlite?: Database.Database };

export function db(): Database.Database {
  if (!globalCache.__sqlite) {
    globalCache.__sqlite = open();
  }
  return globalCache.__sqlite;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS companies (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  website       TEXT,
  linkedin      TEXT,
  description   TEXT,
  industryId    TEXT NOT NULL,          -- FK -> canonical taxonomy (data/taxonomy.json)
  rawIndustry   TEXT NOT NULL,          -- the messy original string; kept on purpose — it demos the fix
  naicsCode     TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  employeeCount INTEGER NOT NULL,
  revenueBand   TEXT NOT NULL,
  foundedYear   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industryId);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(state, city);

CREATE TABLE IF NOT EXISTS contacts (
  id        TEXT PRIMARY KEY,
  companyId TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  title     TEXT NOT NULL,
  email     TEXT NOT NULL,
  linkedin  TEXT
);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(companyId);

CREATE TABLE IF NOT EXISTS lists (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_lists_user ON lists(userId);

CREATE TABLE IF NOT EXISTS list_items (
  id        TEXT PRIMARY KEY,
  listId    TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  companyId TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  addedAt   TEXT NOT NULL DEFAULT (datetime('now')),
  note      TEXT,
  UNIQUE(listId, companyId)
);
CREATE INDEX IF NOT EXISTS idx_list_items_list ON list_items(listId);

CREATE TABLE IF NOT EXISTS search_logs (
  id                  TEXT PRIMARY KEY,
  userId              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query               TEXT NOT NULL,
  resolvedIndustryId  TEXT,
  confidence          INTEGER,
  band                TEXT,               -- 'high' | 'medium' | 'low'
  resultCount         INTEGER NOT NULL DEFAULT 0,
  createdAt           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(userId, createdAt);

CREATE TABLE IF NOT EXISTS drafts (
  id            TEXT PRIMARY KEY,
  userId        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companyId     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contactId     TEXT REFERENCES contacts(id) ON DELETE SET NULL,
  subject       TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL DEFAULT '',
  contextPoints TEXT NOT NULL DEFAULT '[]',   -- JSON array of three generated context points
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','sent')),
  createdAt     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(userId, status);
`;
