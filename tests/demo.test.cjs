'use strict';
// Проверяем переключение реальных кнопок и доступное состояние иллюстрации.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function classes(initial = '') {
  const values = new Set(initial.split(/\s+/).filter(Boolean));
  return {
    toggle(name, enabled) { enabled ? values.add(name) : values.delete(name); },
    contains(name) { return values.has(name); },
  };
}

for (const filename of ['index.html', 'en.html']) {
  test(filename + ': режимы чтения, исходника и правки показывают нужный пример', async () => {
    const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
    const buttons = [...html.matchAll(/<button\b([^>]*)>/g)]
      .filter((match) => /data-mode=/.test(match[1]))
      .map((match) => {
        const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)]
          .map((attr) => [attr[1], attr[2]]));
        return {
          dataset: { mode: attrs['data-mode'] },
          attrs,
          classList: classes(attrs.class),
          addEventListener(event, callback) { assert.equal(event, 'click'); this.click = callback; },
          setAttribute(name, value) { this.attrs[name] = value; },
        };
      });
    assert.deepEqual(buttons.map((button) => button.dataset.mode), ['read', 'source', 'edit']);
    const panels = {
      'demo-read': { hidden: true },
      'demo-source': { hidden: false, classList: classes() },
      'release-status': { textContent: '' },
    };
    assert.match(html, /id="demo-read" hidden/);
    assert.doesNotMatch(html, /id="demo-source" hidden/);
    const context = vm.createContext({
      document: {
        documentElement: { lang: filename === 'en.html' ? 'en' : 'ru' },
        querySelectorAll: (selector) => selector === '[data-mode]' ? buttons : [],
        getElementById: (id) => panels[id],
      },
      URL, AbortController,
      setTimeout: () => 1,
      clearTimeout: () => {},
      fetch: async () => { throw new Error('offline'); },
    });
    await vm.runInContext(script, context);
    for (const mode of ['edit', 'read', 'source', 'edit', 'read']) {
      const button = buttons.find((candidate) => candidate.dataset.mode === mode);
      button.click();
      assert.equal(panels['demo-read'].hidden, mode !== 'read');
      assert.equal(panels['demo-source'].hidden, mode === 'read');
      assert.equal(panels['demo-source'].classList.contains('editing'), mode === 'edit');
      assert.equal(button.attrs['aria-controls'], mode === 'read' ? 'demo-read' : 'demo-source');
      for (const candidate of buttons) {
        const selected = candidate === button;
        assert.equal(candidate.classList.contains('active'), selected);
        assert.equal(candidate.attrs['aria-pressed'], String(selected));
      }
    }
  });
}
