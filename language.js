'use strict';

// Выбор языка выполняется до отрисовки: тексты обеих страниц уже есть в HTML.
(() => {
  const url = new URL(window.location.href);
  const supported = new Set(['ru', 'en']);
  const requested = url.searchParams.get('lang');
  let saved = null;
  try {
    saved = window.localStorage.getItem('grizzly-language');
    if (supported.has(requested)) {
      window.localStorage.setItem('grizzly-language', requested);
    }
  } catch {
    // Блокировка хранилища не мешает выбору языка по URL и настройкам браузера.
  }
  const browserLanguage = (navigator.language || navigator.languages?.[0] || 'en')
    .toLowerCase().split('-')[0];
  const language = supported.has(requested) ? requested
    : supported.has(saved) ? saved
    : url.pathname.endsWith('/en.html') ? 'en'
    : browserLanguage === 'ru' ? 'ru' : 'en';
  if (document.documentElement.lang !== language) {
    const target = new URL(language === 'ru' ? './' : 'en.html', url);
    target.search = url.search;
    target.hash = url.hash;
    window.location.replace(target.href);
  }
})();
