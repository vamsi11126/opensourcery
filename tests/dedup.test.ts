import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl } from '../src/lib/dedup';

test('normalizeUrl rejects non-http and non-https URLs', () => {
  assert.throws(() => normalizeUrl('javascript:alert(1)'), /Only http and https URLs are supported/);
  assert.throws(() => normalizeUrl('mailto:test@example.com'), /Only http and https URLs are supported/);
});

test('normalizeUrl rejects internal hosts', () => {
  assert.throws(() => normalizeUrl('http://127.0.0.1:3000'), /Local or private hosts are not allowed/);
  assert.throws(() => normalizeUrl('http://localhost:3000'), /Local or private hosts are not allowed/);
});

test('normalizeUrl canonicalizes GitHub URLs', () => {
  assert.equal(normalizeUrl('https://github.com/Owner/Repo.git'), 'https://github.com/owner/repo');
});
