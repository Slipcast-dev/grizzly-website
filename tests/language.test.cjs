'use strict';
// Проверяем порядок выбора языка и отказ хранилища без сети и браузерных зависимостей.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'language.js'), 'utf8');
const base = 'https://slipcast-dev.github.io/grizzly-website/';

function choose({ url = base, page = 'ru', language = 'en-US', languages = [], saved = null, blocked = false } = {}) {
  const result = { redirect: null, saved };
  const context = vm.createContext({
    URL, Set,
    document: { documentElement: { lang: page } },
    navigator: { language, languages },
    window: {
      location: { href: url, replace: (target) => { result.redirect = target; } },
      localStorage: {
        getItem: () => { if (blocked) throw new Error('storage blocked'); return saved; },
        setItem: (key, value) => {
          if (blocked) throw new Error('storage blocked');
          assert.equal(key, 'grizzly-language');
          result.saved = value;
        },
      },
    },
  });
  vm.runInContext(source, context);
  return result;
}

test('русская настройка браузера оставляет русский язык', () => {
  for (const language of ['ru', 'ru-RU', 'RU-by']) {
    assert.equal(choose({ language }).redirect, null);
  }
});

test('английский, неподдерживаемый и отсутствующий язык выбирают английский', () => {
  for (const language of ['en-US', 'fr-FR', 'de-DE', '']) {
    assert.equal(choose({ language }).redirect, base + 'en.html');
  }
  assert.equal(choose({ language: '', languages: ['ru-RU'] }).redirect, null);
});

test('автовыбор сохраняет путь проекта, параметры и якорь', () => {
  assert.equal(choose({ url: base + '?source=github#download' }).redirect,
    base + 'en.html?source=github#download');
});

test('ручной выбор русского перекрывает сохранённый английский и настройки браузера', () => {
  const result = choose({ url: base + 'en.html?lang=ru#features', page: 'en', saved: 'en' });
  assert.equal(result.redirect, base + '?lang=ru#features');
  assert.equal(result.saved, 'ru');
});

test('ручной выбор английского перекрывает сохранённый русский', () => {
  const result = choose({ url: base + '?lang=en', saved: 'ru', language: 'ru-RU' });
  assert.equal(result.redirect, base + 'en.html?lang=en');
  assert.equal(result.saved, 'en');
});

test('сохранённый ручной выбор действует при следующем посещении', () => {
  assert.equal(choose({ saved: 'ru' }).redirect, null);
  assert.equal(choose({ saved: 'en', language: 'ru-RU' }).redirect, base + 'en.html');
});

test('некорректные сохранённые и URL-значения игнорируются', () => {
  assert.equal(choose({ url: base + '?lang=xx', saved: 'xx', language: 'ru-RU' }).redirect, null);
});

test('заблокированный localStorage не ломает ручной выбор и автовыбор', () => {
  assert.equal(choose({ url: base + '?lang=ru', page: 'en', blocked: true }).redirect,
    base + '?lang=ru');
  assert.equal(choose({ language: 'ru-RU', blocked: true }).redirect, null);
  assert.equal(choose({ blocked: true }).redirect, base + 'en.html');
});

test('прямая ссылка на английскую страницу работает без цикла перенаправлений', () => {
  assert.equal(choose({ url: base + 'en.html', page: 'en', language: 'ru-RU' }).redirect, null);
  assert.equal(choose({ url: base + 'en.html?lang=en', page: 'en', saved: 'ru' }).redirect, null);
});
