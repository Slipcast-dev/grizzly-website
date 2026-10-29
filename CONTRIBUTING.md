# Contributing

**English** · [Русский](CONTRIBUTING.ru.md)

Ideas and fixes are welcome. Use issues for ordinary bugs and [SECURITY.md](SECURITY.md) for vulnerabilities. Issue forms are available in English and Russian.

1. Create a branch or fork from `main`.
2. Keep changes focused. The site stays static; add dependencies only when necessary.
3. Update `index.html` and `en.html`, dynamic messages and both documentation versions together. Run the commands in [README](README.md); check both languages at narrow and wide widths, keyboard navigation, RU/EN switching, automatic language selection and both demo modes.
4. Open a pull request describing the problem, result and checks. For visual changes include screenshots without personal data.

Do not add tokens, `.env` files, personal data, executable installers or app files. Installers belong in the app repository's releases. When updating fallback downloads, keep both pages' URLs identical for each platform and verify the actual asset names.

Do not change workflow permissions without justification. Pin Actions to full SHAs; never run contributor code through `pull_request_target`. Language selection must keep working when localStorage is blocked and must never redirect to an arbitrary URL.

Required checks and discussion resolution must complete before merge. Contributions use the project's MIT license. Follow the [code of conduct](CODE_OF_CONDUCT.md).
