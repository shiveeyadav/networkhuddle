import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, truncate, ukDateTime } from '../lib/format.js';

test('slugify', () => {
  assert.equal(slugify('Café Breakfast — Leeds!'), 'cafe-breakfast-leeds');
  assert.equal(slugify(''), '');
  assert.equal(slugify('x'.repeat(100)).length, 60);
});

test('truncate', () => {
  assert.equal(truncate('a  b   c', 10), 'a b c');
  assert.equal(truncate('abcdefghij', 5), 'abcd…');
});

test('ukDateTime uses Europe/London time', () => {
  // 07:30 UTC in summer is 08:30 BST.
  assert.match(ukDateTime('2026-07-01T07:30:00Z'), /08:30$/);
  assert.equal(ukDateTime('not a date'), '');
});
