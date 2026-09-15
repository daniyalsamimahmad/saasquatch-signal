import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it out of the bundler
  serverExternalPackages: ["better-sqlite3"],
  // Trace the seeded database file into every serverless function bundle.
  // At runtime on Vercel, lib/db.ts copies it to /tmp (the only writable path)
  // so the demo's write flows work per-instance. See README deployment notes.
  outputFileTracingIncludes: {
    "/**/*": ["./data/app.db"],
  },
};

export default nextConfig;
