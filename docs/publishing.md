# npm Publishing Preparation

This document captures the publication choices for `@yudin-s/vue-chrome-ai`.

## Package Positioning

- Vue 3 composables and plugin for Chrome's browser-side `LanguageModel` API.
- Browser-native runtime, no API keys, and no bundled model.
- Lifecycle control: readiness, download progress, session ownership, streaming, and teardown.
- Complementary to AI SDK provider packages rather than a replacement for them.

Good npm search terms are included in `package.json`: `vue`, `vue3`, `vue-plugin`, `vue-composables`, `chrome-ai`, `built-in-ai`, `gemini-nano`, `prompt-api`, `language-model`, `on-device-ai`, `summarizer`, and `translator`.

## Best Practices Applied

- ESM and CJS builds are both published.
- Type declarations are generated and exported.
- `exports` is explicit to avoid accidental deep imports.
- `sideEffects: false` enables tree-shaking.
- Vue is a peer dependency.
- Package contents are controlled with `files`.
- Docs and a copy-paste Vue SFC example are included.
- `publishConfig.access` is `public` for the scoped package.
- `publishConfig.provenance` is enabled.
- `prepublishOnly` runs typecheck, tests, build, audit, and dry-pack.

## Pre-Publish Checklist

Run:

```bash
npm install
npm run publish:check
npm --cache ./.npm-cache pack --dry-run --json
```

Manual first publish:

```bash
npm login
npm publish --access public --provenance
```

## Suggested First Release

Title:

```text
v0.1.0 - Vue composables for Chrome LanguageModel
```

Summary:

```text
Initial release with Vue 3 composables and plugin support for Chrome's browser-side LanguageModel API. Includes availability checks, download progress, session lifecycle, prompt and streaming helpers, structured output, reflection, context tracking, and wrappers for Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.
```
