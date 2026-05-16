# npm Publishing Preparation

This document captures the publication choices for `@yudin-s/vue-chrome-ai`.

## Package Positioning

- Vue 3-first composables and plugin for Chrome Built-in AI.
- Browser-native, privacy-oriented, no API keys.
- Full lifecycle control: readiness, download progress, session ownership, streaming, and teardown.
- Complementary to AI SDK provider packages rather than a replacement for them.

Good npm search terms are included in `package.json`: `vue`, `vue3`, `vue-plugin`, `vue-composables`, `chrome-ai`, `built-in-ai`, `browser-ai`, `gemini-nano`, `prompt-api`, `language-model`, `on-device-ai`, `summarizer`, and `translator`.

## Best Practices Applied

- ESM and CJS builds are both published.
- Type declarations are generated and exported.
- `exports` is explicit to avoid accidental deep imports.
- `sideEffects: false` enables tree-shaking.
- Vue is a peer dependency.
- Package contents are controlled with `files`.
- `llms.txt`, agent guidance, docs, and a copy-paste Vue SFC example are included.
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
v0.1.0 - Vue 3 composables for Chrome Built-in AI
```

Summary:

```text
Initial release with Vue 3 composables and plugin for Chrome LanguageModel / Gemini Nano and Chrome Built-in AI task APIs. Includes model availability checks, download progress, session lifecycle, prompt/streaming helpers, structured output, reflection, context tracking, and wrappers for Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.
```
