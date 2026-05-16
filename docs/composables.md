# Vue Composable API

All composables return reactive references (`ref`/`computed`) suitable for Vue 3 templates and composition-style usage.

## Injection + Plugin

- `VueChromeAI` — plugin object with `install(app, options?)`
- `chromeAIOptionsKey` — injection key used internally for defaults
- `useChromeAIOptions()` — reactive plugin defaults (`computed`)

Plugin options:

- `createOptions?: ChromeAICreateOptions`
- `autoCheck?: boolean`
- `autoCreate?: boolean`

`createOptions` is used as the default for session/task hooks that create browser sessions.

## Composables

### `useChromeAIAvailability(options?)`

```ts
const result = useChromeAIAvailability({
  options: { expectedInputs: [{ type: "text" }], expectedOutputs: [{ type: "text" }] },
  autoCheck: true,
});
```

Returns:

- `supported: Readonly<ComputedRef<boolean>>`
- `status: Readonly<ComputedRef<ChromeAIModelStatus>>`
- `availability: Readonly<ComputedRef<ChromeAIAvailability | undefined>>`
- `userActivation: Readonly<ComputedRef<boolean | undefined>>`
- `error: Readonly<ComputedRef<Error | undefined>>`
- `refresh(): Promise<ChromeAIAvailability>`

### `useChromeAIParams(autoLoad = true)`

Read model parameters when available.

Returns:

- `params: Ref<ChromeAIParams | undefined>`
- `status: ...`
- `error: ...`
- `refresh()`

### `useChromeAISession(options?)`

Create/destroy a `LanguageModel` session and track model download progress.

Returns:

- `status`
- `availability`
- `progress`
- `error`
- `session`
- `createSession()`
- `destroySession()`
- `autoCreate`

### `useChromeAIPrompt(options?)`

Non-streaming prompt helper with optional reflection support.

Returns prompt state (`status`, `text`, `data`, `chunks`, `input`, `error`) as refs plus:

- `prompt(input, options?)`
- `promptStructured(input, options?)`
- `reset()`
- `session`
- `progress`

### `useChromeAIStream(session)`

Streaming wrapper for an existing session (`session` may be a session or ref-like value).

Returns:

- `status`
- `text`
- `chunks`
- `error`
- `streamPrompt(input, options?)`
- `reset()`

### `useChromeAIAppend(session)`

Wrapper for `session.append(...)`.

Returns `status`, `error`, `append()`, `reset()`.

### `useChromeAIClone(session)`

Wrapper for `session.clone(...)` plus lifecycle cleanup.

Returns `status`, `clone`, `error`, `cloneSession()`, `destroyClone()`.

### `useChromeAIContext(session, { pollIntervalMs? })`

Tracks context usage and overflow state.

Returns:

- `contextUsage`
- `contextWindow`
- `overflowed`
- `refresh()`
- `resetOverflow()`

### Task composables

- `useChromeAITaskAvailability({ apiName, options?, autoCheck? })`
- `useChromeAITaskSession(...)`
- `useChromeAITaskOperation(...)`
- `useChromeAISummarizer(...)`
- `useChromeAITranslator(...)`
- `useChromeAILanguageDetector(...)`
- `useChromeAIWriter(...)`
- `useChromeAIRewriter(...)`
- `useChromeAIProofreader(...)`

Task API status and result states follow the same reactive pattern with refs.
