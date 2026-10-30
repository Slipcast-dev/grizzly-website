# Website update mockup: Grizzly 1.1.0

**English** · [Русский](README.ru.md)

**Status: visual concept for review. Not deployed.**

## Preview

- [Full Russian page](site-ru.svg).
- [Full English page](site-en.svg).
- [Larger detail: code demo and supported languages](syntax-detail-ru.svg).

## Proposed changes

The page keeps its existing identity and gains source-code copy, programming-language extensions, a Python Source-mode illustration and a compact section for eight language families. The release badge and the theme-color caption below the demo are removed. Hero copy is repositioned to keep the layout balanced. The section heading is “Everything you need. Now all in one place.” The supporting copy is “Text. Code. Context. Whatever you're working on.” The reading card mentions Markdown, text and fenced code. The separate Markdown example panel has been removed and subsequent sections moved up. The design focuses only on syntax highlighting.

The existing dark palette, teal/gold/coral accents, page progression, language button, original PNG app icon, wordmark and Apple/Intel/Windows SVG marks are retained. Highlight colors come from the app's existing Xcode theme. The app panel is an illustration, not a screenshot of a running build.

Supported families: Python, Swift, C/C++, C#, JavaScript/JSX, TypeScript/TSX, CSS/SCSS and PHP. Existing JSON, YAML, INI/TOML, XML/HTML, TeX and log highlighting is still mentioned. Live highlighting while editing is explicitly limited to macOS in the copy.

## Research

Reviewed app commit `52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905` and release [v1.1.0](https://github.com/Slipcast-dev/Grizzly/releases/tag/v1.1.0):

- [File types and fence aliases](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/Sources/Grizzly/Core/FileType.swift).
- [Syntax engine](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/Sources/Grizzly/Core/SyntaxEngine.swift).
- [Markdown rendering](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/Sources/Grizzly/Render/MarkdownView.swift).
- [macOS edit highlighting](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/Sources/Grizzly/Features/EditorView.swift).
- [Theme colors](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/Sources/Grizzly/App/Theme.swift).
- [Windows syntax engine](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/electron/renderer/core.js).
- [Usage and platform wording](https://github.com/Slipcast-dev/Grizzly/blob/52778e0d5bf9e473e61f35c2ea1e0a9d8ff6b905/docs/en/usage.md).

## Scope and next step

Only the SVG mockups and review notes are added in this branch. Production pages, scripts, styles, root READMEs and the live site are unchanged. The full-page SVGs embed the unchanged app icon; no external image loads are required. The mockup controls are visual only.

Wait for the user's instructions before implementing, merging or deploying this proposal. The draft PR must not be merged automatically.
