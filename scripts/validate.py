"""Проверяет якоря, локальные ресурсы и базовые ограничения безопасности сайта."""
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


class PageValidator(HTMLParser):
    """Собирает ссылки и отклоняет опасные HTML-конструкции."""

    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.urls: list[str] = []
        self.csp = ""
        self.referrer = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        identifier = values.get("id")
        if identifier:
            assert identifier not in self.ids, f"Повтор id: {identifier}"
            self.ids.add(identifier)
        for name, _ in attrs:
            assert not name.startswith("on"), f"Inline обработчик: {name}"
            assert name != "style", "Inline стили запрещены CSP"
        assert tag not in {"iframe", "object", "embed", "base"}, tag
        if tag == "script":
            assert values.get("src"), "Inline scripts запрещены"
        for key in ("src", "href"):
            if values.get(key):
                self.urls.append(values[key])
        if tag == "meta":
            if values.get("http-equiv", "").lower() == "content-security-policy":
                self.csp = values.get("content", "")
            if values.get("name") == "referrer":
                self.referrer = values.get("content", "")
        if values.get("target") == "_blank":
            assert {"noopener", "noreferrer"} <= set(values.get("rel", "").split())


def check_page(filename: str, language: str) -> PageValidator:
    """Проверяет каждую языковую страницу и локальные ресурсы."""
    page = PageValidator()
    source = (ROOT / filename).read_text()
    assert f'<html lang="{language}">' in source
    assert 'src="language.js"' in source
    assert 'hreflang="ru"' in source and 'hreflang="en"' in source
    page.feed(source)
    for url in page.urls:
        parsed = urlsplit(url)
        if parsed.scheme:
            assert parsed.scheme == "https", f"Небезопасный URL: {url}"
        elif parsed.netloc:
            raise AssertionError(f"URL без схемы: {url}")
        elif parsed.path:
            assert not parsed.path.startswith("/"), "Путь сломает project Pages"
            target = (ROOT / parsed.path).resolve()
            assert target.is_relative_to(ROOT) and target.is_file(), url
        if not parsed.path and parsed.fragment:
            assert parsed.fragment in page.ids, f"Якорь не найден: {url}"
    for directive in ("default-src 'none'", "script-src 'self'", "style-src 'self'", "connect-src https://api.github.com", "base-uri 'none'", "form-action 'none'"):
        assert directive in page.csp, f"Нет CSP: {directive}"
    assert "unsafe-" not in page.csp
    assert page.referrer == "no-referrer"
    return page


def main() -> None:
    """Проверяет обе страницы, документацию и закрепление Actions полными SHA."""
    russian = check_page("index.html", "ru")
    english = check_page("en.html", "en")
    assert russian.ids == english.ids, "Якоря двух языковых версий должны совпадать"
    for document in ROOT.glob("*.md"):
        for link in re.findall(r"\]\(([^)\s]+)\)", document.read_text()):
            parsed = urlsplit(link)
            if not parsed.scheme and parsed.path:
                target = (document.parent / parsed.path).resolve()
                assert target.is_relative_to(ROOT) and target.is_file(), f"{document.name}: {link}"
    for workflow in (ROOT / ".github/workflows").glob("*.yml"):
        content = workflow.read_text()
        assert "pull_request_target" not in content
        for action in re.findall(r"uses:\s*([^\s#]+)", content):
            assert re.fullmatch(r"[\w.-]+/[\w./-]+@[0-9a-f]{40}", action), action
    pages = (ROOT / ".github/workflows/pages.yml").read_text()
    assert "path: _site" in pages, "Публиковать можно только подготовленный артефакт"
    assert "include-hidden-files: true" in pages, "security.txt не попадёт в Pages"
    print(f"Проверены HTML, CSP, {len(russian.urls) + len(english.urls)} URL двух страниц и SHA всех Actions")


if __name__ == "__main__":
    main()
