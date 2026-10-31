"""Создаёт артефакт Pages только из явно разрешённых публичных файлов."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = (
    "index.html", "en.html", "styles.css", "app.js", "language.js", "assets/icon.png", "assets/grizzly-hero.png",
    ".nojekyll", ".well-known/security.txt",
)


def main() -> None:
    """Проверяет источники и копирует публичные ресурсы в отдельную папку."""
    destination = ROOT / "_site"
    if destination.is_symlink():
        raise ValueError("Артефакт не может быть символической ссылкой")
    for name in PUBLIC_FILES:
        source = ROOT / name
        if not source.is_file() or source.is_symlink():
            raise ValueError(f"Недопустимый публичный ресурс: {name}")
        if not source.resolve().is_relative_to(ROOT):
            raise ValueError(f"Ресурс выходит за пределы проекта: {name}")
    if destination.exists():
        shutil.rmtree(destination)
    for name in PUBLIC_FILES:
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    print(f"Подготовлено {len(PUBLIC_FILES)} публичных ресурсов")


if __name__ == "__main__":
    main()
