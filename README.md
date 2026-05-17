# @yudin-s/vue-chrome-ai

[![npm version](https://img.shields.io/npm/v/@yudin-s/vue-chrome-ai.svg)](https://www.npmjs.com/package/@yudin-s/vue-chrome-ai)
[![npm downloads](https://img.shields.io/npm/dm/@yudin-s/vue-chrome-ai.svg)](https://www.npmjs.com/package/@yudin-s/vue-chrome-ai)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6.svg)](https://www.typescriptlang.org/)

Vue 3 composables and a plugin for Chrome's browser-side `LanguageModel` API.

Use `@yudin-s/vue-chrome-ai` when a Vue app needs to check browser support, prepare a local model, stream prompt output, and clean up sessions without wiring the low-level API by hand.

The package keeps the browser API visible, but adds Vue state for feature detection, availability, download progress, session lifecycle, prompt calls, streaming, structured output, and the current task APIs such as Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.

> Chrome Built-in AI is browser-owned and still evolving. This package does not bundle a model, does not call Google APIs, and does not polyfill unsupported browsers.

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

const input = ref("Summarize this paragraph in two sentences.");
const ai = useChromeAIPrompt({
  createOptions: {
    initialPrompts: [
      { role: "system", content: "You answer concisely and locally." },
    ],
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

More examples:

- [Basic prompt SFC](examples/basic-prompt.vue)
- [Composable docs](docs/composables.md)
- [Publishing checklist](docs/publishing.md)

## API Coverage

Prompt / session layer:

- `LanguageModel.availability()`, `params()`, and `create()`
- `create({ monitor })` download progress
- `prompt()` and `promptStreaming()`
- `append()`, `clone()`, and `destroy()`
- context usage/window tracking and `contextoverflow`
- `AbortSignal`, `responseConstraint`, structured output, and reflection helpers

Task API layer:

- `Summarizer`
- `Translator`
- `LanguageDetector`
- `Writer`
- `Rewriter`
- `Proofreader`

## Composables

- `useChromeAIOptions`
- `useChromeAIAvailability`
- `useChromeAIParams`
- `useChromeAISession`
- `useChromeAIPrompt`
- `useChromeAIStream`
- `useChromeAIAppend`
- `useChromeAIClone`
- `useChromeAIContext`
- `useChromeAITaskAvailability`
- `useChromeAITaskSession`
- `useChromeAITaskOperation`
- `useChromeAISummarizer`
- `useChromeAITranslator`
- `useChromeAILanguageDetector`
- `useChromeAIWriter`
- `useChromeAIRewriter`
- `useChromeAIProofreader`

All composables expose state as Vue `ComputedRef` values and clean up owned sessions with `onScopeDispose()`.

## Structured Output

```ts
const ai = useChromeAIPrompt<{ severity: "low" | "medium" | "high" }>({
  reflection: {
    format: "json",
    reflect: true,
    schema: {
      type: "object",
      properties: { severity: { enum: ["low", "medium", "high"] } },
      required: ["severity"],
    },
  },
});

const result = await ai.promptStructured("Classify this PR risk: lockfile changed.");
console.log(result.data?.severity);
```

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
