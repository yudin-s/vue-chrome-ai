# @yudin-s/vue-chrome-ai

[![npm version](https://img.shields.io/npm/v/@yudin-s/vue-chrome-ai.svg)](https://www.npmjs.com/package/@yudin-s/vue-chrome-ai)
[![npm downloads](https://img.shields.io/npm/dm/@yudin-s/vue-chrome-ai.svg)](https://www.npmjs.com/package/@yudin-s/vue-chrome-ai)
[![CI](https://github.com/yudin-s/vue-chrome-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/yudin-s/vue-chrome-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6.svg)](https://www.typescriptlang.org/)
[![GitHub release](https://img.shields.io/github/v/release/yudin-s/vue-chrome-ai.svg)](https://github.com/yudin-s/vue-chrome-ai/releases)

Vue 3 composables, a Vue plugin, and TypeScript helpers for Chrome's browser-side `LanguageModel` API.

Use `@yudin-s/vue-chrome-ai` when a Vue UI needs to check browser support, prepare Gemini Nano locally, stream prompt output, and clean up sessions without wiring the low-level Chrome Built-in AI APIs by hand.

The package keeps the browser API visible, but adds Vue-native state for feature detection, availability, download progress, session lifecycle, prompt calls, streaming, structured output, context-window usage, and the current task APIs such as Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.

> Chrome Built-in AI is browser-owned and still evolving. This package does not bundle a model, does not call Google APIs, and does not polyfill unsupported browsers.

[Live demo](https://yudin-s.github.io/vue-chrome-ai/) · [Composable docs](docs/composables.md) · [Recipes](docs/recipes) · [Comparison](docs/comparison.md) · [Publishing notes](docs/publishing.md)

## Install

```bash
npm install @yudin-s/vue-chrome-ai
```

Vue is a peer dependency. The package ships conservative Prompt API types, so `@types/dom-chromium-ai` is optional.

## Plugin Setup

```ts
import { createApp } from "vue";
import { VueChromeAI } from "@yudin-s/vue-chrome-ai";
import App from "./App.vue";

createApp(App)
  .use(VueChromeAI, {
    createOptions: {
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    },
    autoCheck: true,
    autoCreate: false,
  })
  .mount("#app");
```

The plugin uses Vue provide/inject to share defaults. Every composable can still override those defaults locally.

## Quick Start

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { useChromeAIPrompt } from "@yudin-s/vue-chrome-ai";

const input = ref("Summarize what Chrome Built-in AI is.");
const ai = useChromeAIPrompt({
  createOptions: {
    initialPrompts: [
      { role: "system", content: "You answer concisely and locally." },
    ],
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  },
});

const busy = computed(() => ai.status.value === "prompting");

async function ask() {
  await ai.prompt(input.value);
}
</script>

<template>
  <form @submit.prevent="ask">
    <textarea v-model="input" />
    <button :disabled="busy">Ask local model</button>
    <progress
      v-if="ai.progress.value?.progress != null"
      :value="ai.progress.value.progress"
    />
    <output>{{ ai.text.value }}</output>
  </form>
</template>
```

Vue users can pass plain values, `ref`, `computed`, or getter functions for options such as `createOptions`, `autoCreate`, `autoCheck`, and task settings. That keeps language, modality, and task configuration reactive without rebuilding the composable.

More examples:

- [Basic prompt SFC](examples/basic-prompt.vue)
- [Model download progress](examples/model-download-progress.vue)
- [Summarizer task API](examples/summarizer.vue)
- [Chrome AI Studio example site](examples/chrome-ai-studio)
- [Composable docs](docs/composables.md)
- [Recipes](docs/recipes)

## Why

Chrome's native API is intentionally low-level:

- `LanguageModel.availability(options)` must be called with the same language/modality options used for the session;
- the first `LanguageModel.create({ monitor })` can trigger a large browser-managed download;
- Chrome may require user activation to prepare the model;
- session resources must be destroyed;
- `promptStreaming()` returns stream-like browser objects;
- structured output and JSON constraints need careful state handling in UI.

`@yudin-s/vue-chrome-ai` gives Vue apps a predictable composable layer without hiding the native API.

## API and Documentation

### Prompt and Session Layer

Full composable documentation lives in [docs/composables.md](docs/composables.md).

- `useChromeAIAvailability()` checks `LanguageModel.availability()` and exposes `supported`, `availability`, `status`, `refresh`, and `userActivation`.
- `useChromeAIParams()` reads `LanguageModel.params()` when the browser exposes sampling parameters.
- `useChromeAISession()` creates and owns a `LanguageModel` session with download progress and scope cleanup.
- `useChromeAIPrompt()` runs non-streaming prompts and optional structured-output reflection.
- `useChromeAIStream(session)` streams a long response from an existing session.
- `useChromeAIAppend(session)` maps to native `session.append()`.
- `useChromeAIClone(session)` forks a native `session.clone()` and owns the clone teardown.
- `useChromeAIContext(session)` tracks `contextUsage`, `contextWindow`, and `contextoverflow`.

### Chrome Built-in Task Composables

For non-LLM task APIs, use the generic composables or convenience wrappers:

```ts
const summarizer = useChromeAISummarizer({
  createOptions: {
    type: "key-points",
    format: "markdown",
    length: "medium",
    expectedInputLanguages: ["en"],
    outputLanguage: "en",
  },
});

await summarizer.run(longArticleText);
console.log(summarizer.availability.value, summarizer.progress.value, summarizer.text.value);
```

Available wrappers:

- `useChromeAISummarizer`
- `useChromeAITranslator`
- `useChromeAILanguageDetector`
- `useChromeAIWriter`
- `useChromeAIRewriter`
- `useChromeAIProofreader`

For experimental or newly changing methods, use `useChromeAITaskSession` or `useChromeAITaskOperation` directly.

### Structured Output And Reflection

The Prompt API supports `responseConstraint` for JSON Schema-based structured output. This package exposes that directly and can add a second reflection pass for validation/format repair:

```ts
const ai = useChromeAIPrompt<{ severity: "low" | "medium" | "high" }>({
  reflection: {
    format: "json",
    reflect: true,
    schema: {
      type: "object",
      properties: {
        severity: { enum: ["low", "medium", "high"] },
      },
      required: ["severity"],
    },
  },
});

const result = await ai.promptStructured("Classify this PR risk: lockfile changed.");
console.log(result.data?.severity);
```

Reflection is intentionally simple: draft, then ask the same session to correct instruction-following and formatting issues. Applications with strict correctness needs should still validate parsed data with their own schema validator.

### Core Utilities

Everything useful outside Vue is exported too:

- `getChromeLanguageModelAPI()`
- `readChromeAIAvailability(options)`
- `createChromeAISession(options, runtime, onProgress)`
- `prepareChromeAIModel(options, runtime, onProgress)`
- `normalizeDownloadProgress(event)`
- `promptWithReflection(session, input, options)`
- `safeParseJSON(text)`

## How It Compares

- Compared with direct `LanguageModel` calls, this package adds Vue refs/computed state for readiness, download progress, streaming, context, errors, and teardown.
- Compared with AI SDK providers, this package is dependency-light and Chrome UX focused.
- Compared with generic Chromium wrappers, this package is Vue composable-first and includes task API wrappers.

Read the full comparison in [docs/comparison.md](docs/comparison.md).

## When To Use It

Choose this package when a Vue app needs browser-native `LanguageModel` support and the UI has to show the real runtime state:

- Vue refs/computed values for support, availability, download progress, session lifecycle, streaming, and errors;
- Prompt API coverage plus task API wrappers;
- no API keys, no backend, no bundled model;
- small dependency surface: Vue peer dependency only;
- TypeScript-first public API and copy-paste examples.

## Browser Requirements

Chrome's current docs describe the Built-in AI API family as staged across Stable, origin trials, and developer trials. The Prompt API uses `LanguageModel`, supports `availability()`, `create()`, `prompt()`, `promptStreaming()`, `append()`, `clone()`, `destroy()`, context-window tracking, multimodal inputs, and structured output constraints.

Useful references:

- [Chrome Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in-apis)
- [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api)
- [Inform users of model download](https://developer.chrome.com/docs/ai/inform-users-of-model-download)

## Development

```bash
npm install
npm run check
npm test
npm run build
npm run audit:moderate
npm run pack:dry
```

To verify the full publication gate:

```bash
npm run publish:check
```

## Publish

```bash
npm login
npm publish --access public --provenance
```

Publication preparation notes live in [docs/publishing.md](docs/publishing.md).

## Prior Art

- [`@built-in-ai/core`](https://www.npmjs.com/package/%40built-in-ai/core): Vercel AI SDK provider for browser-native AI, useful when your app already uses the AI SDK.
- [`simple-chromium-ai`](https://github.com/kstonekuan/simple-chromium-ai): small TypeScript wrapper around Chrome's Prompt API.
- [`@types/dom-chromium-ai`](https://www.npmjs.com/package/%40types/dom-chromium-ai): community TypeScript declarations.

This package focuses on Vue composables and UI state rather than becoming a model-provider adapter.

Recent releases are tracked in [CHANGELOG.md](CHANGELOG.md).
