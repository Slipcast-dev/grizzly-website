# Grizzly Website

**English** · [Русский](README.ru.md)

[![Validate](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/validate.yml/badge.svg)](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/validate.yml)
[![CodeQL](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/codeql.yml/badge.svg)](https://github.com/Slipcast-dev/grizzly-website/actions/workflows/codeql.yml)
[![MIT](https://img.shields.io/badge/license-MIT-86c9b2)](LICENSE)

A bilingual Russian/English website for **Grizzly**, the offline Markdown and text reader for macOS and Windows.

**[Open website](https://slipcast-dev.github.io/grizzly-website/)** · [English](https://slipcast-dev.github.io/grizzly-website/en.html?lang=en) · [Русский](https://slipcast-dev.github.io/grizzly-website/index.html?lang=ru) · **[App source and installers](https://github.com/Slipcast-dev/Grizzly)**

## Features

- Complete Russian and English pages, including the illustrative app demo, accessible labels, metadata and release-status messages.
- RU/EN switch in the header, visible on desktop and mobile.
- Automatic language selection on the main entry page: Russian for `ru` browser preferences, English for all other or missing preferences.
- A manual language choice takes priority and is remembered in this browser using the `grizzly-language` localStorage key.
- Dark responsive design, inline platform SVG logos and themed feature icons; download buttons highlight on hover.
- Direct installer links in both HTML pages work immediately without waiting for JavaScript or the GitHub API.
- The public GitHub Releases API updates links to the latest available release; if it fails, verified direct links remain usable.
- No build framework, third-party JavaScript dependencies, accounts, analytics or website cookies.

## Language selection

`language.js` runs from the document head before styling and content are rendered. Priority:

1. Valid explicit `?lang=ru` or `?lang=en` (also saves the choice).
2. A previously saved manual choice.
3. A direct `en.html` link opens English if no preference was saved.
4. On the main entry page, the browser's preferred language: `ru` → Russian; everything else → English.

A website can read browser language preferences, not a separate operating-system language setting. These often match. If localStorage is blocked, language selection still works for the current navigation, but cannot be remembered. Automatic redirects preserve query parameters and section anchors. With JavaScript disabled, both full pages, language links and downloads still work; automatic selection and persistence are unavailable.

To return to automatic selection, clear this site's stored data in your browser. The RU/EN links always override the saved choice.

## Development and checks

Python 3.12+ and Node.js 22+ are sufficient; no dependencies or API keys are required.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`.

```bash
node --check app.js
node --check language.js
node --test tests/*.test.cjs
python3 scripts/validate.py
python3 scripts/package.py
```

Tests cover browser languages, manual overrides, stored preferences, blocked storage, redirect anchors, both translated pages, localized release messages, API failures and malicious download URLs. Validation checks both pages, matching section anchors, local links, documentation links, CSP and pinned Actions.

## Repository layout

- `index.html` — full Russian page.
- `en.html` — full English page.
- `language.js` — language selection and saved preference.
- `app.js` — demo controls and localized release lookup.
- `styles.css` — shared responsive styling and language selector.
- `scripts/`, `tests/` — validation, packaging and regression tests.
- `README.ru.md`, `SECURITY.ru.md`, `CONTRIBUTING.ru.md`, `CODE_OF_CONDUCT.ru.md` — full Russian documentation; un-suffixed files are English.

## Deployment and maintenance

GitHub Actions publishes to GitHub Pages after a change reaches `main`; PR code cannot deploy. The `github-pages` environment permits only `main`. The artifact contains exactly eight allowlisted resources: `index.html`, `en.html`, `styles.css`, `app.js`, `language.js`, `assets/icon.png`, `.nojekyll` and `.well-known/security.txt`. Source documentation, tests and repository configuration are excluded.

Changes go through a pull request with required Site checks and JavaScript security checks, an up-to-date branch and resolved conversations. Force pushes and deletion of `main` are blocked, including for administrators. An independent approval is not mandatory for this single-maintainer project; enable it when a team joins.

Actions use full commit SHA pins and minimum permissions; checkout does not persist credentials. Dependabot checks Actions weekly and CodeQL scans JavaScript on changes and weekly.

When an app release is published, update the verified fallback links in **both** HTML pages as well. They currently point to the checked assets of **v0.3.3**. Runtime API lookup can select newer releases, but cannot update the static fallback. Keep RU/EN content, metadata and both documentation versions in sync.

## Privacy and hosting limits

Only a manual language preference is stored locally. There is no visitor tracking. The site requests release metadata from `api.github.com` and downloads installers from GitHub; GitHub receives ordinary HTTP request data. The Grizzly desktop app itself works offline.

HTTPS is enforced by Pages. CSP and Referrer Policy are set in HTML. GitHub Pages does not provide arbitrary custom HTTP response headers; a meta CSP cannot enforce `frame-ancestors`. For full header control, use a hosting platform or CDN that supports it.

Read [Security](SECURITY.md), [Contributing](CONTRIBUTING.md) and [Code of conduct](CODE_OF_CONDUCT.md).

## License and credits

[MIT](LICENSE) © 2026 Slipcast-dev. App icon: [Grizzly](https://github.com/Slipcast-dev/Grizzly). Apple/Intel and Windows platform SVGs: [Simple Icons](https://github.com/simple-icons/simple-icons), CC0 (Windows SVG from version 11.0.0). Trademarks belong to their respective owners; platform logos identify supported systems.
