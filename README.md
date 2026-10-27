# Grizzly Website

[![Validate](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/validate.yml/badge.svg)](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/validate.yml)
[![CodeQL](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/codeql.yml/badge.svg)](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/codeql.yml)
[![MIT](https://img.shields.io/badge/license-MIT-86c9b2)](LICENSE)

Русскоязычный сайт-витрина **Grizzly** — офлайн-читалки Markdown и текста для macOS и Windows.

**[Открыть сайт](https://slipcast-dev.github.io/grizzly-website/)** · **[Исходники приложения и установщики](https://github.com/Slipcast-dev/Grizzly)**

## Возможности

- Адаптивная тёмная вёрстка в цветах иконки приложения.
- Демонстрация режимов чтения и исходника (иллюстрация, а не запущенное приложение).
- Прямые ссылки на актуальные сборки через публичный GitHub Releases API.
- При недоступности API кнопки ведут на страницу последнего релиза.
- Без сборщика, сторонних JavaScript-библиотек, аккаунтов, аналитики и cookies сайта.

## Локальный запуск

Нужны Python 3.12+ и Node.js 22+ для проверок. Устанавливать зависимости не требуется.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Откройте `http://127.0.0.1:8765/`. Для проверки и подготовки публикации:

```bash
node --check app.js
node --test tests/*.test.cjs
python3 scripts/validate.py
python3 scripts/package.py
```

`_site/` содержит только разрешённые публичные ресурсы. Документы, тесты и конфигурация репозитория в артефакт не попадают. Переменные окружения и API-ключи не нужны.

## Публикация

GitHub Pages использует GitHub Actions. После проверенного изменения `main` workflow `Deploy Pages` автоматически публикует `_site/`. Публикация из pull request запрещена. Окружение `github-pages` разрешает только `main`.

Обновления вносите через pull request. Ветка `main` требует успешных проверок, актуальности относительно основной ветки и разрешения обсуждений. Force push и удаление запрещены. Для одного владельца обязательное одобрение другим человеком не включено: при появлении команды включите минимум одного независимого ревьюера.

Внешние Actions закреплены полными commit SHA; Dependabot предлагает обновления. Workflows получают минимальные права, checkout не сохраняет Git credentials. CodeQL проверяет JavaScript при изменениях и еженедельно.

## Приватность и ограничения

Сайт обращается к `api.github.com` для списка релизов; GitHub видит обычные данные HTTP-запроса посетителя. Установщики загружаются с GitHub. Это отличается от самого приложения Grizzly, которое работает офлайн.

GitHub Pages управляет HTTPS и HTTP-заголовками. CSP и Referrer Policy заданы через HTML, но `frame-ancestors`, HSTS, Permissions Policy и другие произвольные HTTP-заголовки нельзя настроить здесь через `_headers`. Для полного управления заголовками нужен другой хостинг или CDN. Мы не добавляем файлы, которые Pages игнорирует, и не заявляем о проверках, которых не было.

Подробнее: [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Лицензия

[MIT](LICENSE) © 2026 Slipcast-dev. Иконка скопирована из проекта [Grizzly](https://github.com/Slipcast-dev/Grizzly).
