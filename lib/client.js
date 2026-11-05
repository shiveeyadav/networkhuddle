// Browser helpers (client-safe).

export async function postJSON(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body || {}),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? null : data.error || 'Something went wrong. Please try again.',
      code: data.code || null,
    };
  } catch (e) {
    return { ok: false, status: 0, data: {}, error: 'Network error. Check your connection and try again.', code: null };
  }
}

// Client-side version of the open-redirect guard.
export function safeNextClient(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return '/dashboard';
  return next;
}
