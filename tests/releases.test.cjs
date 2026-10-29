'use strict';
// Изолированные ответы GitHub проверяют, что сайт не доверяет внешним URL.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fallback = Object.fromEntries(
  [...html.matchAll(/data-platform="([^"]+)" href="([^"]+)"/g)]
    .map((match) => [match[1], match[2]]),
);
const prefix = 'https://github.com/Slipcast-dev/Grizzly/releases/download/v1.0/';

/** Запускает настоящий скрипт в минимальном DOM без доступа к сети. */
async function run(fetchImplementation, language = 'ru') {
  const links = ['arm64', 'intel', 'windows'].map((platform) => ({
    dataset: { platform }, href: fallback[platform],
  }));
  const status = { textContent: '' };
  let timeoutCleared = false;
  const context = vm.createContext({
    document: {
      documentElement: { lang: language },
      querySelectorAll: (selector) => selector === '.download-link' ? links : [],
      getElementById: () => status,
    },
    URL, AbortController,
    setTimeout: () => 1,
    clearTimeout: () => { timeoutCleared = true; },
    fetch: fetchImplementation,
  });
  // Последнее выражение app.js — Promise завершения загрузки релиза.
  await vm.runInContext(source, context);
  assert.equal(timeoutCleared, true);
  return { links, status };
}

function response(assets) {
  return async (url, options) => {
    assert.equal(url, 'https://api.github.com/repos/Slipcast-dev/Grizzly/releases/latest');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ tag_name: 'v1.0', assets }) };
  };
}

test('все три сборки получают корректные прямые ссылки', async () => {
  const names = ['Grizzly-1.0-arm64.dmg', 'Grizzly-1.0-x64.dmg', 'Grizzly-1.0-portable.exe'];
  const { links, status } = await run(response(names.map((name) => ({ name, browser_download_url: prefix + name }))));
  assert.deepEqual(links.map((link) => link.href), names.map((name) => prefix + name));
  assert.match(status.textContent, /v1.0.*напрямую/);
});

test('ошибки сети, HTTP и повреждённый ответ сохраняют fallback', async () => {
  for (const fetcher of [
    async () => { throw new Error('offline'); },
    async () => { throw Object.assign(new Error('timeout'), { name: 'AbortError' }); },
    async () => ({ ok: false, status: 403 }),
    async () => ({ ok: true, json: async () => ({ assets: null }) }),
  ]) {
    const { links, status } = await run(fetcher);
    assert.ok(links.every((link) => link.href === fallback[link.dataset.platform]));
    assert.match(status.textContent, /Не удалось/);
  }
});

test('подмена домена, репозитория, протокола или credentials отклоняется', async () => {
  for (const url of [
    'https://evil.example/Grizzly-arm64.dmg',
    'https://github.com/attacker/Grizzly/releases/download/v1/Grizzly-arm64.dmg',
    'http://github.com/Slipcast-dev/Grizzly/releases/download/v1/Grizzly-arm64.dmg',
    'https://github.com.evil.example/Slipcast-dev/Grizzly/releases/download/v1/Grizzly-arm64.dmg',
    'https://attacker@github.com/Slipcast-dev/Grizzly/releases/download/v1/Grizzly-arm64.dmg',
    'javascript:alert(1)',
  ]) {
    const { links } = await run(response([{ name: 'Grizzly-arm64.dmg', browser_download_url: url }]));
    assert.ok(links.every((link) => link.href === fallback[link.dataset.platform]), url);
  }
});

test('отсутствующая платформа сохраняет fallback, доступная получает загрузку', async () => {
  const name = 'Grizzly-arm64.dmg';
  const { links, status } = await run(response([{ name, browser_download_url: prefix + name }]));
  assert.equal(links[0].href, prefix + name);
  assert.equal(links[1].href, fallback.intel);
  assert.equal(links[2].href, fallback.windows);
  assert.match(status.textContent, /сохранены прямые ссылки/);
});


test('HTML сразу содержит прямые ссылки для трёх платформ без выполнения JavaScript', () => {
  assert.deepEqual(Object.keys(fallback).sort(), ['arm64', 'intel', 'windows']);
  for (const [platform, href] of Object.entries(fallback)) {
    const url = new URL(href);
    assert.equal(url.origin, 'https://github.com');
    assert.ok(url.pathname.startsWith('/Slipcast-dev/Grizzly/releases/download/'));
    assert.ok(url.pathname.endsWith(platform === 'windows' ? '-portable.exe' : platform === 'arm64' ? '-arm64.dmg' : '-x64.dmg'));
  }
});

test('английская страница сохраняет прямые ссылки тех же платформ', () => {
  const english = fs.readFileSync(path.join(__dirname, '..', 'en.html'), 'utf8');
  const englishLinks = Object.fromEntries(
    [...english.matchAll(/data-platform="([^"]+)" href="([^"]+)"/g)]
      .map((match) => [match[1], match[2]]),
  );
  assert.deepEqual(englishLinks, fallback);
  assert.match(english, /<html lang="en">/);
});

test('английские сообщения показываются при успехе, ошибке и отсутствии платформы', async () => {
  const success = await run(response([
    { name: 'Grizzly-arm64.dmg', browser_download_url: prefix + 'Grizzly-arm64.dmg' },
  ]), 'en');
  assert.match(success.status.textContent, /Verified direct downloads/);
  assert.doesNotMatch(success.status.textContent, /[А-Яа-яЁё]/);
  const failure = await run(async () => { throw new Error('offline'); }, 'en');
  assert.match(failure.status.textContent, /Could not check/);
  assert.ok(failure.links.every((link) => link.href === fallback[link.dataset.platform]));
  const full = await run(response(['Grizzly-arm64.dmg', 'Grizzly-x64.dmg', 'Grizzly-portable.exe']
    .map((name) => ({ name, browser_download_url: prefix + name }))), 'en');
  assert.match(full.status.textContent, /Download directly/);
});
