import test from 'node:test';
import assert from 'node:assert/strict';
import * as v from '../lib/validate.js';
import { HttpError } from '../lib/errors.js';

const bad = (fn) => assert.throws(fn, (e) => e instanceof HttpError && e.status === 400);

test('text trims, strips control chars and enforces limits', () => {
  assert.equal(v.text('  hi\u0007 there  ', { label: 'X' }), 'hi  there');
  assert.equal(v.text('a\r\nb\u0000', { multiline: true }), 'a\nb');
  assert.equal(v.text(undefined), '');
  bad(() => v.text('', { required: true }));
  bad(() => v.text('x'.repeat(11), { max: 10 }));
  bad(() => v.text({ a: 1 }));
});

test('email normalises and rejects junk', () => {
  assert.equal(v.email(' Bob@Example.COM '), 'bob@example.com');
  bad(() => v.email('not-an-email'));
  bad(() => v.email('a b@c.d'));
});

test('password length rules', () => {
  assert.equal(v.password('12345678'), '12345678');
  bad(() => v.password('short'));
  bad(() => v.password('x'.repeat(201)));
  bad(() => v.password(12345678));
});

test('url adds https, blocks other schemes, checks host suffix', () => {
  assert.equal(v.url('example.com/a'), 'https://example.com/a');
  assert.equal(v.url(''), '');
  bad(() => v.url('javascript:alert(1)'));
  bad(() => v.url('http://localhost'));
  assert.equal(v.url('uk.linkedin.com/in/x', { hostSuffix: 'linkedin.com' }), 'https://uk.linkedin.com/in/x');
  bad(() => v.url('evil-linkedin.com/in/x', { hostSuffix: 'linkedin.com' }));
});

test('int, idParam and oneOf', () => {
  assert.equal(v.int('42', { min: 1, max: 100 }), 42);
  bad(() => v.int('4.5'));
  bad(() => v.int('12abc'));
  assert.equal(v.int(' 30 ', { min: 10, max: 600 }), 30);
  bad(() => v.int('0', { min: 1 }));
  assert.equal(v.idParam('7'), 7);
  bad(() => v.idParam('-1'));
  bad(() => v.idParam('99999999999'));
  const list = [{ value: 'a' }, { value: 'b' }];
  assert.equal(v.oneOf('a', list), 'a');
  assert.equal(v.oneOf('', list), '');
  bad(() => v.oneOf('c', list));
  bad(() => v.oneOf('', list, { required: true }));
});

test('localDateTime accepts datetime-local values only', () => {
  assert.equal(v.localDateTime('2026-11-20T07:30'), '2026-11-20T07:30');
  assert.equal(v.localDateTime('2026-11-20T07:30:15'), '2026-11-20T07:30');
  bad(() => v.localDateTime('2026-13-01T07:30'));
  bad(() => v.localDateTime('20/11/2026 07:30'));
});

test('bool', () => {
  for (const t of [true, 'true', 'on', 1, '1']) assert.equal(v.bool(t), true);
  for (const f of [false, 'false', 0, '', null, undefined]) assert.equal(v.bool(f), false);
});
