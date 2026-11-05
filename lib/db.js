// Server-only PostgreSQL access. Import only from API routes,
// getServerSideProps or other server-only lib modules.
import pg from 'pg';

const { Pool } = pg;

function createPool() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgres://networkhuddle:networkhuddle@localhost:5432/networkhuddle',
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  pool.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] idle client error', err);
  });
  return pool;
}

export function getPool() {
  if (!global.__networkhuddlePool) {
    global.__networkhuddlePool = createPool();
  }
  return global.__networkhuddlePool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // ignore rollback failure
    }
    throw err;
  } finally {
    client.release();
  }
}

// Escapes LIKE wildcards in user input.
export function likeEscape(input) {
  return String(input).replace(/[\\%_]/g, (m) => `\\${m}`);
}
