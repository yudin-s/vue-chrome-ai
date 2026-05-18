# Comparison

`@yudin-s/vue-chrome-ai` is a Vue composable layer for Chrome Built-in AI. It is intentionally focused on browser-native APIs and UI state.

## Direct `LanguageModel` Calls

Direct calls are fine for tiny demos:

```ts
const session = await LanguageModel.create();
const text = await session.prompt("Hello");
```

Use this package when the app needs production UI states:

- support detection;
- availability checks with the same options used for creation;
- user activation hints;
- first-run download progress;
- session cleanup tied to Vue scopes;
- streaming chunks in Vue state;
- context-window usage;
- structured output helpers;
- task API wrappers.

## `@built-in-ai/core`

`@built-in-ai/core` is a good fit when your app is standardized around the Vercel AI SDK provider model.

Choose this package instead when you want:

- Vue composables directly;
- no AI SDK dependency;
- explicit Chrome session lifecycle control;
- UI-first download and readiness state;
- task API composables beyond the general Prompt API.

The two approaches can coexist. Use `@built-in-ai/core` for AI SDK transports and this package for Chrome-specific Vue UX.

## `simple-chromium-ai`

`simple-chromium-ai` is a compact TypeScript wrapper for experimenting with Chromium AI APIs.

Choose this package when:

- the application is Vue;
- UI needs to show readiness, progress, and errors;
- you want composables rather than a generic wrapper;
- examples and agent-friendly docs matter.

## `@types/dom-chromium-ai`

`@types/dom-chromium-ai` provides community TypeScript declarations for Chromium AI APIs.

This package ships conservative local types so users can install one package and start building. You can still use `@types/dom-chromium-ai` in applications that want declarations closer to the latest upstream spec.

## Cloud Gemini SDKs

Cloud Gemini SDKs call Google-hosted models and require cloud credentials, quota, and network access.

This package wraps Chrome's browser-owned APIs. It does not call Google cloud APIs and does not manage API keys.
