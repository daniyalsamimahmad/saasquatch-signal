/**
 * Zero-install local infrastructure for machines without Docker:
 * boots a real PostgreSQL (embedded-postgres) on :5432 and a real Redis
 * (redis-memory-server) on :6379. docker-compose is the primary path;
 * this is the fallback that keeps `npm run dev` working anywhere.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { RedisMemoryServer } from 'redis-memory-server';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', '.devpg');

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'leads',
  password: 'leads',
  port: 5432,
  persistent: true,
});

const boot = async () => {
  try {
    await pg.initialise();
  } catch {
    /* already initialised */
  }
  await pg.start();
  try {
    await pg.createDatabase('leads');
  } catch {
    /* exists */
  }
  console.log('[dev-infra] postgres ready on :5432 (db=leads user=leads)');

  const redis = new RedisMemoryServer({ instance: { port: 6379 } });
  await redis.start();
  console.log('[dev-infra] redis ready on :6379');
  console.log('[dev-infra] press Ctrl+C to stop');

  const shutdown = async () => {
    console.log('\n[dev-infra] stopping...');
    await redis.stop().catch(() => {});
    await pg.stop().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

boot().catch((err) => {
  console.error('[dev-infra] failed:', err);
  process.exit(1);
});
