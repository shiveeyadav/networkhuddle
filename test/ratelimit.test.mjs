import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit, clientIp } from '../lib/ratelimit.js';

test('allows max hits per window, then blocks, then resets', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_000_000 });
  const key = `t-${Math.random()}`;
  assert.equal(rateLimit(key, 2, 1000), true);
  assert.equal(rateLimit(key, 2, 1000), true);
  assert.equal(rateLimit(key, 2, 1000), false);
  t.mock.timers.tick(1001);
  assert.equal(rateLimit(key, 2, 1000), true);
});

test('keys are independent', () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  assert.equal(rateLimit(a, 1, 60000), true);
  assert.equal(rateLimit(a, 1, 60000), false);
  assert.equal(rateLimit(b, 1, 60000), true);
});

test('clientIp prefers X-Forwarded-For, then X-Real-IP, then socket', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } }), '1.2.3.4');
  assert.equal(clientIp({ headers: { 'x-real-ip': ' 5.6.7.8 ' } }), '5.6.7.8');
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '9.9.9.9' } }), '9.9.9.9');
  assert.equal(clientIp({ headers: {} }), 'unknown');
});
