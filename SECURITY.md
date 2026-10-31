# Security policy

**English** · [Русский](SECURITY.ru.md)

## Supported version

Security fixes target the current `main` version deployed to GitHub Pages. This policy covers the website; the [Grizzly app](https://github.com/Slipcast-dev/Grizzly) has its own security policy.

## Reporting a vulnerability

Do not publish secrets or exploitation details in public issues. Use [private vulnerability reporting](https://github.com/Slipcast-dev/grizzly-website/security/advisories/new).

Include the URL, commit SHA if known, browser, reproduction steps and expected impact. Do not access other people's data or run load attacks. No response time is guaranteed; the project is maintained as the owner's time permits.

## Security model

- Static site without server-side logic, authentication, secrets or file uploads.
- The only API is the public release list for `Slipcast-dev/Grizzly`, with an eight-second timeout, omitted credentials and no redirect following.
- Verified direct installer links are embedded in both HTML pages and remain available when the API fails.
- API text is displayed using `textContent`. Installer URLs must use HTTPS, `github.com` and the exact app release path. URLs containing credentials are rejected.
- CSP permits local scripts, styles and images, with API connections only to GitHub. Inline scripts and eval are not allowed. Referrer Policy is `no-referrer`.
- Publication includes only nine allowlisted resources: `index.html`, `en.html`, `styles.css`, `app.js`, `language.js`, `assets/icon.png`, `assets/grizzly-hero.png`, `.nojekyll` and `.well-known/security.txt`.
- Language selection can redirect only to fixed RU/EN paths on the same site. URL and stored preferences accept only `ru`/`en`; unsupported values are ignored.
- localStorage contains only the manual `grizzly-language` preference. Storage denial does not break the site. There are no website cookies or visitor tracking.
- CI checks both language pages, language selection and storage denial, unsafe constructs, Actions SHA pins and GitHub download handling. CodeQL analyzes JavaScript.
- Secret scanning and push protection provide additional defenses, not a guarantee that all secrets will be detected. Review each diff before publishing.

## Hosting limitations

GitHub Pages does not support arbitrary custom response headers. A meta CSP cannot enforce `frame-ancestors`, so framing is not blocked by this policy. GitHub manages HSTS and TLS. An external security scanner and a full penetration test have not been performed as part of this setup.

## Incident response

1. Revoke and replace a leaked secret in its source system immediately; removing it from Git is not a substitute.
2. For compromised workflows, stop deployments, revoke attacker access, and inspect Actions, deployments and changes.
3. Fix through a pull request, wait for checks and verify the public site.
4. Publish a security advisory without sensitive details when appropriate.

Review security alerts, Dependabot updates and repository access periodically. Use 2FA/passkeys for the owner account; repository configuration does not change account settings.
