#!/usr/bin/env node
/* eslint-disable no-console */
// Runs at container start: applies db/schema.sql, seeds demo events once,
// and creates (or promotes) the admin user from ADMIN_EMAIL / ADMIN_PASSWORD.

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://networkhuddle:networkhuddle@localhost:5432/networkhuddle';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDb() {
  const attempts = 30;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`[init-db] waiting for database (${i}/${attempts}): ${err.message}`);
      await sleep(2000);
    }
  }
  throw new Error('Database not reachable');
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(client, base) {
  const root = slugify(base) || 'member';
  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { rowCount } = await client.query('SELECT 1 FROM users WHERE slug = $1', [candidate]);
    if (rowCount === 0) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function main() {
  await waitForDb();
  const client = await pool.connect();
  try {
    // Serialise concurrent starts (e.g. two replicas) with an advisory lock.
    await client.query('SELECT pg_advisory_lock(424242)');

    const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('[init-db] schema applied');

    const seedEnabled = (process.env.SEED_DEMO_EVENTS || 'true').toLowerCase() !== 'false';
    const seeded = await client.query("SELECT value FROM app_meta WHERE key = 'demo_seeded'");
    if (seedEnabled && seeded.rowCount === 0) {
      const seed = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
      await client.query(seed);
      await client.query(
        "INSERT INTO app_meta (key, value) VALUES ('demo_seeded', now()::text) ON CONFLICT (key) DO NOTHING"
      );
      console.log('[init-db] demo events seeded');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const adminName = (process.env.ADMIN_NAME || 'NetworkHuddle Admin').trim().slice(0, 80);

    if (adminEmail && adminPassword) {
      const existing = await client.query('SELECT id, role FROM users WHERE email = $1', [adminEmail]);
      if (existing.rowCount === 0) {
        if (adminPassword.length < 8) {
          console.warn('[init-db] ADMIN_PASSWORD must be at least 8 characters; admin not created');
        } else {
          const hash = await bcrypt.hash(adminPassword, 12);
          const slug = await uniqueSlug(client, adminName);
          await client.query(
            `INSERT INTO users (email, password_hash, role, is_member, member_since, is_public, name, slug)
             VALUES ($1, $2, 'admin', TRUE, now(), FALSE, $3, $4)`,
            [adminEmail, hash, adminName, slug]
          );
          console.log(`[init-db] admin user created: ${adminEmail}`);
        }
      } else if (existing.rows[0].role !== 'admin') {
        await client.query("UPDATE users SET role = 'admin', is_member = TRUE WHERE id = $1", [existing.rows[0].id]);
        console.log(`[init-db] existing user promoted to admin: ${adminEmail}`);
      }
    } else {
      console.log('[init-db] ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin creation');
    }

    await client.query('DELETE FROM sessions WHERE expires_at < now()');
    await client.query("DELETE FROM password_resets WHERE expires_at < now() - interval '7 days'");
    await client.query('SELECT pg_advisory_unlock(424242)');
  } finally {
    client.release();
  }
  await pool.end();
  console.log('[init-db] done');
}

main().catch((err) => {
  console.error('[init-db] failed:', err);
  process.exit(1);
});
