"use strict";

// Native modal dialog keeps focus inside the menu and supports Escape.
const featuresMenu = typeof document === 'undefined' ? null : document.getElementById('features-menu');
const featuresTrigger = featuresMenu ? document.querySelector('[data-features-open]') : null;
if (featuresMenu && featuresTrigger && typeof featuresMenu.showModal === 'function') {
  featuresTrigger.setAttribute('role', 'button');
  const historyList = featuresMenu.querySelector('.features-release-list');
  const historyCount = featuresMenu.querySelector('.features-updates-heading > span');
  const historyStatus = featuresMenu.querySelector('.features-menu-footer > span');
  const dateNote = historyStatus.textContent;
  const english = document.documentElement.lang === 'en';
  const snapshots = new Map([...historyList.querySelectorAll('.release-entry')].map((entry) => [entry.dataset.releaseTag, {
    hash: entry.dataset.releaseBodySha256,
    notes: entry.querySelector('.release-notes').cloneNode(true),
  }]));
  const arrow = historyList.querySelector('summary svg').cloneNode(true);
  const refreshInterval = 5 * 60 * 1000;
  let lastSuccess = 0;
  let loading = false;
  let historyTimer = null;
  historyCount.setAttribute('aria-live', 'polite');
  historyStatus.setAttribute('role', 'status');

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const refreshHistory = async () => {
    if (loading || Date.now() - lastSuccess < refreshInterval) return;
    loading = true;
    historyList.setAttribute('aria-busy', 'true');
    try {
      const releases = await fetchPublicReleaseHistory();
      if (!releases.length) throw new Error('No published releases');
      const hashes = await Promise.all(releases.map((release) => hashReleaseBody(release.body)));
      const openTags = new Set([...historyList.querySelectorAll('details[open]')].map((entry) => entry.dataset.releaseTag));
      const knownTags = new Set([...historyList.querySelectorAll('details')].map((entry) => entry.dataset.releaseTag));
      const active = document.activeElement;
      const focusInList = historyList.contains(active);
      const activeTag = focusInList ? active.closest('details')?.dataset.releaseTag : null;
      const scroll = historyList.scrollTop;
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < releases.length; index += 1) {
        const release = releases[index];
        const entry = element('details', 'release-entry');
        entry.dataset.releaseTag = release.tag_name;
        entry.open = openTags.has(release.tag_name) || (index === 0 && !knownTags.has(release.tag_name));
        const summary = element('summary');
        summary.append(element('span', 'release-version', release.tag_name));
        if (index === 0) summary.append(element('span', 'release-badge', english ? 'Latest' : 'Новое'));
        const date = element('time', '', formatReleaseDate(release.published_at, english));
        date.dateTime = release.published_at;
        summary.append(date, arrow.cloneNode(true));
        entry.append(summary);
        const snapshot = snapshots.get(release.tag_name);
        if (snapshot && hashes[index] && snapshot.hash === hashes[index]) {
          entry.append(snapshot.notes.cloneNode(true));
        } else {
          const notes = element('div', 'release-notes');
          notes.append(element('p', 'release-origin', english ? 'From the official GitHub release notes.' : 'Официальное описание GitHub — в языке оригинала.'));
          for (const section of parseReleaseNotes(release.body, english)) {
            const paragraph = element('p');
            if (section.heading) paragraph.append(element('strong', '', section.heading + '. '));
            paragraph.append(document.createTextNode(section.text));
            notes.append(paragraph);
          }
          entry.append(notes);
        }
        fragment.append(entry);
      }
      historyList.replaceChildren(fragment);
      historyList.scrollTop = scroll;
      if (focusInList) {
        const entry = [...historyList.querySelectorAll('details')].find((item) => item.dataset.releaseTag === activeTag);
        (entry?.querySelector('summary') || historyList).focus({ preventScroll: true });
      }
      historyCount.textContent = releaseCountLabel(releases.length, english);
      historyStatus.textContent = dateNote;
      lastSuccess = Date.now();
    } catch {
      historyStatus.textContent = english
        ? 'GitHub is unavailable. Showing saved release history.'
        : 'GitHub недоступен. Показана сохранённая история.';
    } finally {
      loading = false;
      historyList.removeAttribute('aria-busy');
    }
  };
  const openFeatures = () => {
    if (featuresMenu.open) return;
    featuresMenu.showModal();
    featuresTrigger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('features-menu-open');
    void refreshHistory();
    historyTimer = setInterval(() => { void refreshHistory(); }, refreshInterval);
  };
  featuresTrigger.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openFeatures();
  });
  featuresTrigger.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      openFeatures();
    }
  });
  featuresMenu.querySelector('[data-features-close]').addEventListener('click', () => featuresMenu.close());
  featuresMenu.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const stops = [...featuresMenu.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex="0"]')]
      .filter((element) => element.getClientRects().length > 0);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  featuresMenu.addEventListener('close', () => {
    clearInterval(historyTimer);
    historyTimer = null;
    featuresTrigger.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('features-menu-open');
    featuresTrigger.focus({ preventScroll: true });
  });
  featuresMenu.addEventListener('click', (event) => {
    if (event.target !== featuresMenu) return;
    const box = featuresMenu.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
      featuresMenu.close();
    }
  });
}


/** Accept only published stable releases and display the newest publications first. */
function selectPublicReleases(payload) {
  if (!Array.isArray(payload)) throw new Error('Invalid releases response');
  const seen = new Set();
  return payload.filter((release) => release && release.draft === false && release.prerelease === false
    && typeof release.tag_name === 'string' && release.tag_name.length > 0 && release.tag_name.length <= 80
    && typeof release.published_at === 'string' && Number.isFinite(Date.parse(release.published_at))
    && (release.body === null || typeof release.body === 'string'))
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
    .filter((release) => {
      if (seen.has(release.tag_name)) return false;
      seen.add(release.tag_name);
      return true;
    })
    .slice(0, 30)
    .map((release) => ({ tag_name: release.tag_name, published_at: release.published_at, body: (release.body || '').slice(0, 30000) }));
}

async function fetchPublicReleaseHistory(fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher('https://api.github.com/repos/Slipcast-dev/Grizzly/releases?per_page=30', {
      headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal,
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
    });
    if (!response.ok) throw new Error('GitHub HTTP ' + response.status);
    return selectPublicReleases(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function hashReleaseBody(body) {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function formatReleaseDate(value, english) {
  return new Intl.DateTimeFormat(english ? 'en-GB' : 'ru-RU', {
    day: 'numeric', month: english ? 'short' : 'long', year: 'numeric', timeZone: 'Europe/Minsk',
  }).format(new Date(value)).replace(/\s*г\.$/, '');
}

function releaseCountLabel(count, english) {
  if (english) return count + (count === 1 ? ' release' : ' releases');
  const word = { one: 'релиз', few: 'релиза' }[new Intl.PluralRules('ru').select(count)] || 'релизов';
  return count + ' ' + word;
}

/** Render a bounded plain-text subset of official notes; never interpret remote HTML. */
function parseReleaseNotes(body, english) {
  const labels = english ? { added: 'Added', changed: 'Improved', improved: 'Improved', fixed: 'Fixed', security: 'Security', 'добавлено': 'Added', 'изменено': 'Improved', 'улучшено': 'Improved', 'исправлено': 'Fixed', 'безопасность': 'Security' }
    : { added: 'Добавлено', changed: 'Улучшено', improved: 'Улучшено', fixed: 'Исправлено', security: 'Безопасность' };
  const result = [];
  let heading = '';
  let pending = '';
  const flush = () => {
    if (!pending.trim()) return;
    result.push({ heading, text: pending.trim() });
    pending = '';
    heading = '';
  };
  for (let line of body.slice(0, 30000).split(/\r?\n/)) {
    const title = line.match(/^#{1,6}\s+(.+)$/);
    if (title) {
      flush();
      const name = title[1].trim().replace(/[*`]/g, '');
      if (/^(downloads?|sha[- ]?256|checksums?|загрузки|скачать|контрольные суммы)(?:\s|:|$)/i.test(name)) break;
      if (/^grizzly\s+v?\d/i.test(name)) continue;
      heading = labels[name.toLowerCase()] || name;
      continue;
    }
    if (!line.trim()) { flush(); continue; }
    if (/^\s*([-*+] |\d+\. )/.test(line)) flush();
    line = line.replace(/^>\s?/, '').replace(/^\s*(?:[-*+] |\d+\. )/, '')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(\*\*|__|`)/g, '').trim();
    if (/^\[!(?:IMPORTANT|WARNING|NOTE|TIP|CAUTION)\]$/.test(line)) continue;
    pending += (pending ? ' ' : '') + line;
    if (result.length >= 59) break;
  }
  flush();
  return result.length ? result : [{ heading: '', text: english ? 'No release notes were published.' : 'Описание релиза не опубликовано.' }];
}

if (typeof module === 'object' && module.exports) {
  module.exports = { selectPublicReleases, fetchPublicReleaseHistory, hashReleaseBody, formatReleaseDate, releaseCountLabel, parseReleaseNotes };
}
