'use strict';

// Переключается только демонстрация: локальные файлы посетителя не используются.
const modeButtons = document.querySelectorAll('[data-mode]');
for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const reading = button.dataset.mode === 'read';
    document.getElementById('demo-read').hidden = !reading;
    document.getElementById('demo-source').hidden = reading;
    for (const candidate of modeButtons) {
      const selected = candidate === button;
      candidate.classList.toggle('active', selected);
      candidate.setAttribute('aria-pressed', String(selected));
    }
  });
}

/** Получает актуальные установщики; при ошибке сохраняет прямые ссылки из HTML. */
async function loadDownloads() {
  const status = document.getElementById('release-status');
  const english = document.documentElement.lang === 'en';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const patterns = {
    arm64: /-arm64\.dmg$/i,
    intel: /-(?:x64|intel)\.dmg$/i,
    windows: /-portable\.exe$/i,
  };
  try {
    const response = await fetch('https://api.github.com/repos/Slipcast-dev/Grizzly/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    const release = await response.json();
    if (!Array.isArray(release.assets) || typeof release.tag_name !== 'string') {
      throw new Error('Некорректный ответ GitHub');
    }
    let found = 0;
    for (const link of document.querySelectorAll('.download-link')) {
      const pattern = patterns[link.dataset.platform];
      const asset = release.assets.find((item) => typeof item.name === 'string' && pattern.test(item.name));
      if (!asset || typeof asset.browser_download_url !== 'string') continue;
      // Внешние данные не могут подменить загрузку произвольным адресом.
      const url = new URL(asset.browser_download_url);
      if (url.username || url.password || url.origin !== 'https://github.com' || !url.pathname.startsWith('/Slipcast-dev/Grizzly/releases/download/')) continue;
      link.href = url.href;
      found += 1;
    }
    status.textContent = found === 3
      ? (english ? `${release.tag_name} · Download directly from GitHub Releases` : `${release.tag_name} · Загрузка напрямую из GitHub Releases`)
      : (english ? `${release.tag_name} · Verified direct downloads remain available for other platforms.` : `${release.tag_name} · Для остальных платформ сохранены прямые ссылки на проверенные сборки.`);
  } catch {
    status.textContent = english
      ? 'Could not check for a newer release. Verified installers are still available to download directly.'
      : 'Не удалось проверить новую версию. Доступна прямая загрузка проверенных сборок.';
  } finally {
    clearTimeout(timeout);
  }
}

loadDownloads();
