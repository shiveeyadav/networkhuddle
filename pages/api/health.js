import { query } from '../../lib/db';

// Liveness/readiness check used by the Docker HEALTHCHECK. No auth, no session lookup.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    await query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(503).json({ ok: false });
  }
}
