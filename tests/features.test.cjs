'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectPublicReleases, fetchPublicReleaseHistory, parseReleaseNotes, formatReleaseDate, releaseCountLabel, hashReleaseBody } = require('../features.js');

const release = (tag, date, extra = {}) => ({ tag_name: tag, published_at: date, body: '### Added\n- A feature', draft: false, prerelease: false, ...extra });
test('history sorts publication dates, excludes drafts/prereleases and invalid data, and deduplicates tags', () => {
  const result = selectPublicReleases([
    release('old', '2026-10-30T10:00:00Z'), release('new', '2026-11-01T10:00:00Z'),
    release('draft', '2027-01-01T00:00:00Z', { draft: true }),
    release('preview', '2027-01-01T00:00:00Z', { prerelease: true }),
    release('broken', 'bad date'), release('old', '2026-10-29T00:00:00Z'), {}, null,
  ]);
  assert.deepEqual(result.map((item) => item.tag_name), ['new', 'old']);
  assert.throws(() => selectPublicReleases({ message: 'rate limited' }));
});
test('history is bounded to 30 releases and accepts missing release notes', () => {
  const payload = Array.from({ length: 40 }, (_, i) => release(String(i), new Date(Date.UTC(2026, 0, i + 1)).toISOString(), { body: null }));
  const result = selectPublicReleases(payload);
  assert.equal(result.length, 30);
  assert.equal(result[0].tag_name, '39');
  assert.equal(result[0].body, '');
});
test('official notes retain additions and fixes, strip markdown links, and omit old installer/checksum sections', () => {
  const result = parseReleaseNotes('## Grizzly 9.0\n### Added\n- **Split view** and [docs](https://example.com).\n\n### Fixed\n- Saving files.\n### Downloads\n[old installer](https://old.example/app.exe)\n### SHA-256\n123', false);
  assert.deepEqual(result, [
    { heading: 'Добавлено', text: 'Split view and docs.' },
    { heading: 'Исправлено', text: 'Saving files.' },
  ]);
  assert.deepEqual(parseReleaseNotes('### Добавлено\n- Тест\n### Загрузки\nСтарый установщик', false), [{ heading: 'Добавлено', text: 'Тест' }]);
  assert.equal(parseReleaseNotes('', true)[0].text, 'No release notes were published.');
});
test('Minsk publication dates cross UTC midnight correctly and release counts are localized', () => {
  assert.match(formatReleaseDate('2026-10-31T23:30:00Z', false), /^1 ноября 2026$/);
  assert.equal(formatReleaseDate('2026-10-31T23:30:00Z', true), '1 Nov 2026');
  assert.equal(releaseCountLabel(1, false), '1 релиз');
  assert.equal(releaseCountLabel(2, false), '2 релиза');
  assert.equal(releaseCountLabel(11, false), '11 релизов');
  assert.equal(releaseCountLabel(21, false), '21 релиз');
});
test('translated snapshot identities change when the official notes change', async () => {
  assert.equal(await hashReleaseBody('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.notEqual(await hashReleaseBody('abc'), await hashReleaseBody('abcd'));
  for (const name of ['index.html', 'en.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
    assert.equal([...html.matchAll(/data-release-body-sha256="[a-f0-9]{64}"/g)].length, 4);
  }
});
test('release API uses bounded public endpoint, no credentials, redirect rejection and cache bypass', async () => {
  const result = await fetchPublicReleaseHistory(async (url, options) => {
    assert.equal(url, 'https://api.github.com/repos/Slipcast-dev/Grizzly/releases?per_page=30');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal);
    return { ok: true, json: async () => [release('v2', '2026-11-01T00:00:00Z')] };
  });
  assert.equal(result[0].tag_name, 'v2');
  for (const fetcher of [async () => { throw new Error('offline'); }, async () => ({ ok: false, status: 403 }), async () => ({ ok: true, json: async () => ({ invalid: true }) })]) {
    await assert.rejects(fetchPublicReleaseHistory(fetcher));
  }
});
