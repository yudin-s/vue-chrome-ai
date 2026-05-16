import {
  computed,
  hasInjectionContext,
  inject,
  onScopeDispose,
  ref,
  shallowRef,
  type ComputedRef,
  type InjectionKey,
  type MaybeRef,
  toValue,
  watch,
  watchEffect,
} from "vue";
import type { App } from "vue";
import {
  createChromeAISession,
  defaultLanguageModelOptions,
  getUserActivation,
  isChromeLanguageModelSupported,
  readChromeAIAvailability,
  readChromeAIParams,
  toError,
} from "./runtime";
import { promptWithReflection } from "./reflection";
import { toAsyncIterable } from "./streams";
import {
  assertTaskMethod,
  createChromeAITaskSession,
  destroyChromeAITaskSession,
  isChromeAITaskSupported,
  readChromeAITaskAvailability,
} from "./task-apis";
import type {
  ChromeAIAvailability,
  ChromeAIAvailabilityOptions,
  ChromeAIModelStatus,
  ChromeAICreateOptions,
  ChromeAIDownloadProgress,
  ChromeAILanguageModelSession,
  ChromeAIMessage,
  ChromeAIPromptInput,
  ChromeAIReflectionOptions,
  ChromeAITaskAPIName,
  ChromeAITaskCreateOptions,
  ChromeAITaskSession,
} from "./types";

const DEFAULT_PLUGIN_OPTIONS: VueChromeAIResolvedOptions = {
  createOptions: defaultLanguageModelOptions(),
  autoCheck: true,
  autoCreate: false,
};

export interface VueChromeAIPluginOptions {
  createOptions?: ChromeAICreateOptions;
  autoCheck?: boolean;
  autoCreate?: boolean;
}

export interface VueChromeAIResolvedOptions {
  createOptions: ChromeAICreateOptions;
  autoCheck: boolean;
  autoCreate: boolean;
}

export type ChromeAIAvailabilityHookStatus = "idle" | "checking" | "ready" | "unsupported" | "unavailable" | "error";

export type ChromeAICoreSessionStatus = Exclude<ChromeAIModelStatus, "prompting" | "streaming">;
export type ChromeAIPromptStatus = ChromeAIModelStatus;
export type ChromeAIStreamStatus = "idle" | "streaming" | "ready" | "aborted" | "error";
export type ChromeAIAppendStatus = "idle" | "appending" | "ready" | "unsupported" | "aborted" | "error";
export type ChromeAICloneStatus = "idle" | "cloning" | "ready" | "unsupported" | "aborted" | "error";
export type ChromeAITaskSessionStatus =
  | "idle"
  | "checking"
  | "unsupported"
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "preparing"
  | "ready"
  | "aborted"
  | "error";

export const chromeAIOptionsKey: InjectionKey<VueChromeAIResolvedOptions> =
  Symbol("chrome-ai-options");

export const VueChromeAI = {
  install(app: App, options: VueChromeAIPluginOptions = {}): void {
    const merged: VueChromeAIResolvedOptions = {
      autoCheck: options.autoCheck ?? DEFAULT_PLUGIN_OPTIONS.autoCheck,
      autoCreate: options.autoCreate ?? DEFAULT_PLUGIN_OPTIONS.autoCreate,
      createOptions: {
        ...DEFAULT_PLUGIN_OPTIONS.createOptions,
        ...(options.createOptions ?? {}),
      },
    };
    app.provide(chromeAIOptionsKey, merged);
  },
};

export function useChromeAIOptions(
  overrides: Partial<VueChromeAIPluginOptions> = {}
): ComputedRef<VueChromeAIResolvedOptions> {
  const provided = hasInjectionContext()
    ? inject(chromeAIOptionsKey, DEFAULT_PLUGIN_OPTIONS)
    : DEFAULT_PLUGIN_OPTIONS;
  return computed(() => ({
    autoCheck: overrides.autoCheck ?? provided.autoCheck,
    autoCreate: overrides.autoCreate ?? provided.autoCreate,
    createOptions: {
      ...provided.createOptions,
      ...(overrides.createOptions ?? {}),
    },
  }));
}

interface UseChromeAIAvailabilityOptions {
  options?: ChromeAIAvailabilityOptions;
  autoCheck?: boolean;
}

export interface UseChromeAIAvailabilityResult {
  supported: ComputedRef<boolean>;
  status: ComputedRef<ChromeAIAvailabilityHookStatus>;
  availability: ComputedRef<ChromeAIAvailability | undefined>;
  userActivation: ComputedRef<boolean | undefined>;
  error: ComputedRef<Error | undefined>;
  refresh: () => Promise<ChromeAIAvailability>;
}

export function useChromeAIAvailability({
  options = DEFAULT_PLUGIN_OPTIONS.createOptions,
  autoCheck,
}: UseChromeAIAvailabilityOptions = {}): UseChromeAIAvailabilityResult {
  const plugin = useChromeAIOptions();
  const resolvedAutoCheck = computed(() => autoCheck ?? plugin.value.autoCheck);
  const resolvedOptions = computed(() => ({
    ...plugin.value.createOptions,
    ...options,
  }));

  const status = ref<ChromeAIAvailabilityHookStatus>("idle");
  const availability = ref<ChromeAIAvailability | undefined>(undefined);
  const error = ref<Error | undefined>(undefined);

  const refresh = async () => {
    status.value = "checking";
    error.value = undefined;
    try {
      const nextAvailability = await readChromeAIAvailability(resolvedOptions.value);
      availability.value = nextAvailability;
      status.value = nextAvailability === "unavailable" ? "unavailable" : "ready";
      return nextAvailability;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = "error";
      throw nextError;
    }
  };

  watch(
    resolvedAutoCheck,
    (next) => {
      if (next) {
        void refresh();
      }
    },
    { immediate: resolvedAutoCheck.value, deep: false }
  );

  return {
    supported: computed(() => isChromeLanguageModelSupported()),
    status: computed(() => status.value),
    availability: computed(() => availability.value),
    userActivation: computed(() => getUserActivation()),
    error: computed(() => error.value),
    refresh,
  };
}

export interface UseChromeAIParamsResult {
  params: ComputedRef<Awaited<ReturnType<typeof readChromeAIParams>> | undefined>;
  status: ComputedRef<"idle" | "loading" | "ready" | "unsupported" | "error">;
  error: ComputedRef<Error | undefined>;
  refresh: () => Promise<Awaited<ReturnType<typeof readChromeAIParams>> | undefined>;
}

export function useChromeAIParams(autoLoad = true): UseChromeAIParamsResult {
  const plugin = useChromeAIOptions();
  const status = ref<"idle" | "loading" | "ready" | "unsupported" | "error">("idle");
  const params = ref<Awaited<ReturnType<typeof readChromeAIParams>>>();
  const error = ref<Error | undefined>();

  const refresh = async () => {
    status.value = "loading";
    error.value = undefined;
    try {
      const nextParams = await readChromeAIParams();
      params.value = nextParams;
      status.value = nextParams ? "ready" : "unsupported";
      return nextParams;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = "error";
      throw nextError;
    }
  };

  watch(
    () => plugin.value.autoCheck && autoLoad,
    (next) => {
      if (next) {
        void refresh();
      }
    },
    { immediate: autoLoad }
  );

  return {
    params: computed(() => params.value),
    status: computed(() => status.value),
    error: computed(() => error.value),
    refresh,
  };
}

export interface UseChromeAISessionOptions {
  createOptions?: ChromeAICreateOptions;
  autoCreate?: boolean;
  autoCheck?: boolean;
  destroyOnUnmount?: boolean;
}

export interface UseChromeAISessionResult {
  status: ComputedRef<ChromeAICoreSessionStatus>;
  supported: ComputedRef<boolean>;
  session: ComputedRef<ChromeAILanguageModelSession | null>;
  availability: ComputedRef<ChromeAIAvailability | undefined>;
  progress: ComputedRef<ChromeAIDownloadProgress | undefined>;
  error: ComputedRef<Error | undefined>;
  contextUsage: ComputedRef<number | undefined>;
  contextWindow: ComputedRef<number | undefined>;
  autoCreate: ComputedRef<boolean>;
  createSession: (overrideOptions?: ChromeAICreateOptions) => Promise<ChromeAILanguageModelSession>;
  destroySession: () => void;
}

export function useChromeAISession({
  createOptions = {},
  autoCreate,
  autoCheck,
  destroyOnUnmount = true,
}: UseChromeAISessionOptions = {}): UseChromeAISessionResult {
  const plugin = useChromeAIOptions();
  const resolvedAutoCreate = computed(() => autoCreate ?? plugin.value.autoCreate);
  const shouldAutoCreate = computed(() => (autoCheck ?? plugin.value.autoCheck) && resolvedAutoCreate.value);
  const resolvedCreateOptions = computed(() => ({
    ...plugin.value.createOptions,
    ...createOptions,
  }));

  const status = ref<ChromeAICoreSessionStatus>("idle");
  const session = shallowRef<ChromeAILanguageModelSession | null>(null);
  const availability = ref<ChromeAIAvailability | undefined>(undefined);
  const progress = ref<ChromeAIDownloadProgress | undefined>(undefined);
  const error = ref<Error | undefined>(undefined);

  const destroySession = () => {
    if (session.value) {
      session.value.destroy();
    }
    session.value = null;
    status.value = "idle";
  };

  const createSession = async (overrideOptions?: ChromeAICreateOptions) => {
    status.value = "checking";
    error.value = undefined;
    const merged = {
      ...resolvedCreateOptions.value,
      ...overrideOptions,
    };

    const currentAvailability = await readChromeAIAvailability(merged);
    availability.value = currentAvailability;
    status.value = currentAvailability === "available" ? "ready" : currentAvailability;

    try {
      const nextSession = await createChromeAISession(
        merged,
        undefined,
        (nextProgress) => {
          progress.value = nextProgress;
          status.value = nextProgress.completed ? "preparing" : "downloading";
        }
      );
      session.value?.destroy();
      session.value = nextSession;
      availability.value = "available";
      status.value = "ready";
      return nextSession;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      if (nextError instanceof Error && (nextError as { status?: string }).status === "unsupported") {
        status.value = "unsupported";
      } else {
        status.value = nextError.name === "AbortError" ? "aborted" : "error";
      }
      throw nextError;
    }
  };

  watch(
    () => shouldAutoCreate.value,
    (next) => {
      if (!next) {
        return;
      }
      void createSession();
    },
    { immediate: shouldAutoCreate.value }
  );

  onScopeDispose(() => {
    if (destroyOnUnmount) {
      destroySession();
    }
  });

  return {
    status: computed(() => status.value),
    supported: computed(() => isChromeLanguageModelSupported()),
    session: computed(() => session.value),
    availability: computed(() => availability.value),
    progress: computed(() => progress.value),
    error: computed(() => error.value),
    contextUsage: computed(() => session.value?.contextUsage),
    contextWindow: computed(() => session.value?.contextWindow),
    autoCreate: resolvedAutoCreate,
    createSession,
    destroySession,
  };
}

export interface UseChromeAIPromptOptions<TData = unknown> extends UseChromeAISessionOptions {
  reflection?: ChromeAIReflectionOptions<TData>;
  reuseSession?: boolean;
}

export interface UseChromeAIPromptResult<TData = unknown> {
  status: ComputedRef<ChromeAIPromptStatus>;
  text: ComputedRef<string>;
  data: ComputedRef<TData | undefined>;
  chunks: ComputedRef<string[]>;
  input: ComputedRef<ChromeAIPromptInput | undefined>;
  error: ComputedRef<Error | undefined>;
  session: ComputedRef<ChromeAILanguageModelSession | null>;
  progress: ComputedRef<ChromeAIDownloadProgress | undefined>;
  prompt: (input: ChromeAIPromptInput, options?: { signal?: AbortSignal }) => Promise<string>;
  promptStructured: (
    input: ChromeAIPromptInput,
    options?: ChromeAIReflectionOptions<TData> & { signal?: AbortSignal }
  ) => Promise<{ text: string; data?: TData; draft?: string }>;
  reset: () => void;
}

export function useChromeAIPrompt<TData = unknown>({
  reflection,
  reuseSession = true,
  ...sessionOptions
}: UseChromeAIPromptOptions<TData> = {}): UseChromeAIPromptResult<TData> {
  const sessionHook = useChromeAISession(sessionOptions);
  const status = ref<ChromeAIPromptStatus>("idle");
  const text = ref("");
  const data = ref<TData>();
  const chunks = ref<string[]>([]);
  const input = ref<ChromeAIPromptInput | undefined>(undefined);
  const error = ref<Error | undefined>(undefined);

  const ensureSession = async (): Promise<ChromeAILanguageModelSession> => {
    if (sessionHook.session.value) {
      return sessionHook.session.value;
    }
    return sessionHook.createSession();
  };

  const reset = () => {
    status.value = "idle";
    text.value = "";
    data.value = undefined;
    chunks.value = [];
    input.value = undefined;
    error.value = undefined;
  };

  const prompt = async (nextInput: ChromeAIPromptInput, options?: { signal?: AbortSignal }) => {
    input.value = nextInput;
    status.value = "prompting";
    text.value = "";
    chunks.value = [];
    error.value = undefined;

    try {
      const activeSession = await ensureSession();
      const result = await activeSession.prompt(nextInput, options);
      status.value = "ready";
      text.value = result;
      chunks.value = [result];
      if (!reuseSession) {
        sessionHook.destroySession();
      }
      return result;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  const promptStructured = async (
    nextInput: ChromeAIPromptInput,
    options?: ChromeAIReflectionOptions<TData> & { signal?: AbortSignal }
  ) => {
    input.value = nextInput;
    status.value = "prompting";
    text.value = "";
    chunks.value = [];
    error.value = undefined;

    try {
      const activeSession = await ensureSession();
      const result = await promptWithReflection(activeSession, nextInput, {
        ...reflection,
        ...options,
      });
      status.value = "ready";
      text.value = result.text;
      data.value = result.data;
      chunks.value = [result.text];
      if (!reuseSession) {
        sessionHook.destroySession();
      }
      return result;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  return {
    status: computed(() => status.value),
    text: computed(() => text.value),
    data: computed(() => data.value),
    chunks: computed(() => chunks.value),
    input: computed(() => input.value),
    error: computed(() => error.value),
    session: computed(() => sessionHook.session.value),
    progress: computed(() => sessionHook.progress.value),
    prompt,
    promptStructured,
    reset,
  };
}

export interface UseChromeAIStreamResult {
  status: ComputedRef<ChromeAIStreamStatus>;
  text: ComputedRef<string>;
  chunks: ComputedRef<string[]>;
  error: ComputedRef<Error | undefined>;
  streamPrompt: (input: ChromeAIPromptInput, options?: { signal?: AbortSignal }) => Promise<string>;
  reset: () => void;
}

export function useChromeAIStream(
  session: MaybeRef<ChromeAILanguageModelSession | null>
): UseChromeAIStreamResult {
  const sessionRef = computed(() => toValue(session));
  const status = ref<ChromeAIStreamStatus>("idle");
  const text = ref("");
  const chunks = ref<string[]>([]);
  const error = ref<Error | undefined>(undefined);

  const reset = () => {
    status.value = "idle";
    text.value = "";
    chunks.value = [];
    error.value = undefined;
  };

  const streamPrompt = async (nextInput: ChromeAIPromptInput, options?: { signal?: AbortSignal }) => {
    const current = sessionRef.value;
    if (!current) {
      throw new Error("Chrome AI session is not ready.");
    }

    status.value = "streaming";
    text.value = "";
    chunks.value = [];
    error.value = undefined;

    try {
      const streamOrIterable = current.promptStreaming(nextInput, options);
      const chunksState: string[] = [];
      for await (const chunk of toAsyncIterable(streamOrIterable)) {
        chunksState.push(chunk);
        text.value = chunksState.join("");
        chunks.value = [...chunksState];
      }
      status.value = "ready";
      const result = chunksState.join("");
      text.value = result;
      return result;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  return {
    status: computed(() => status.value),
    text: computed(() => text.value),
    chunks: computed(() => chunks.value),
    error: computed(() => error.value),
    streamPrompt,
    reset,
  };
}

export interface UseChromeAIAppendResult {
  status: ComputedRef<ChromeAIAppendStatus>;
  error: ComputedRef<Error | undefined>;
  append: (messages: ChromeAIMessage[], options?: { signal?: AbortSignal }) => Promise<void>;
  reset: () => void;
}

export function useChromeAIAppend(
  session: MaybeRef<ChromeAILanguageModelSession | null>
): UseChromeAIAppendResult {
  const sessionRef = computed(() => toValue(session));
  const status = ref<ChromeAIAppendStatus>("idle");
  const error = ref<Error | undefined>(undefined);

  const reset = () => {
    status.value = "idle";
    error.value = undefined;
  };

  const append = async (messages: ChromeAIMessage[], options?: { signal?: AbortSignal }) => {
    const current = sessionRef.value;
    if (!current?.append) {
      const nextError = new Error("Chrome AI session.append() is not supported in this browser.");
      status.value = "unsupported";
      error.value = nextError;
      throw nextError;
    }

    status.value = "appending";
    error.value = undefined;
    try {
      await current.append(messages, options);
      status.value = "ready";
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  return {
    status: computed(() => status.value),
    error: computed(() => error.value),
    append,
    reset,
  };
}

export interface UseChromeAICloneResult {
  status: ComputedRef<ChromeAICloneStatus>;
  clone: ComputedRef<ChromeAILanguageModelSession | null>;
  error: ComputedRef<Error | undefined>;
  cloneSession: (options?: { signal?: AbortSignal }) => Promise<ChromeAILanguageModelSession>;
  destroyClone: () => void;
}

export function useChromeAIClone(
  session: MaybeRef<ChromeAILanguageModelSession | null>
): UseChromeAICloneResult {
  const sessionRef = computed(() => toValue(session));
  const status = ref<ChromeAICloneStatus>("idle");
  const cloneSession = shallowRef<ChromeAILanguageModelSession | null>(null);
  const error = ref<Error | undefined>(undefined);

  const destroyClone = () => {
    cloneSession.value?.destroy();
    cloneSession.value = null;
    status.value = "idle";
  };

  const clone = async (options?: { signal?: AbortSignal }) => {
    const current = sessionRef.value;
    if (!current?.clone) {
      const nextError = new Error("Chrome AI session.clone() is not supported in this browser.");
      status.value = "unsupported";
      error.value = nextError;
      throw nextError;
    }

    status.value = "cloning";
    error.value = undefined;
    try {
      const nextClone = await current.clone(options);
      destroyClone();
      cloneSession.value = nextClone;
      status.value = "ready";
      return nextClone;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  onScopeDispose(destroyClone);

  return {
    status: computed(() => status.value),
    clone: computed(() => cloneSession.value),
    error: computed(() => error.value),
    cloneSession: clone,
    destroyClone,
  };
}

export interface UseChromeAIContextResult {
  contextUsage: ComputedRef<number | undefined>;
  contextWindow: ComputedRef<number | undefined>;
  overflowed: ComputedRef<boolean>;
  refresh: () => void;
  resetOverflow: () => void;
}

export function useChromeAIContext(
  session: MaybeRef<ChromeAILanguageModelSession | null>,
  options: { pollIntervalMs?: number } = {}
): UseChromeAIContextResult {
  const sessionRef = computed(() => toValue(session));
  const contextUsage = ref<number | undefined>(undefined);
  const contextWindow = ref<number | undefined>(undefined);
  const overflowed = ref(false);
  let intervalId: number | undefined;

  const refresh = () => {
    const current = sessionRef.value;
    contextUsage.value = current?.contextUsage;
    contextWindow.value = current?.contextWindow;
  };

  const onOverflow = () => {
    overflowed.value = true;
  };

  watchEffect(() => {
    const current = sessionRef.value;
    contextUsage.value = current?.contextUsage;
    contextWindow.value = current?.contextWindow;
    current?.addEventListener("contextoverflow", onOverflow);
    return () => {
      current?.removeEventListener("contextoverflow", onOverflow);
    };
  });

  const setupInterval = (pollIntervalMs?: number) => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
    if (typeof pollIntervalMs === "number" && pollIntervalMs > 0 && typeof window !== "undefined") {
      intervalId = window.setInterval(refresh, pollIntervalMs);
    }
  };

  watch(() => options.pollIntervalMs, setupInterval, { immediate: true });

  onScopeDispose(() => {
    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
    }
  });

  return {
    contextUsage: computed(() => contextUsage.value),
    contextWindow: computed(() => contextWindow.value),
    overflowed: computed(() => overflowed.value),
    refresh,
    resetOverflow: () => {
      overflowed.value = false;
    },
  };
}

export interface UseChromeAITaskAvailabilityOptions {
  apiName: ChromeAITaskAPIName;
  options?: Record<string, unknown>;
  autoCheck?: boolean;
}

export interface UseChromeAITaskAvailabilityResult {
  apiName: ChromeAITaskAPIName;
  supported: ComputedRef<boolean>;
  status: ComputedRef<"idle" | "checking" | "ready" | "unavailable" | "error">;
  availability: ComputedRef<ChromeAIAvailability | undefined>;
  userActivation: ComputedRef<boolean | undefined>;
  error: ComputedRef<Error | undefined>;
  refresh: () => Promise<ChromeAIAvailability>;
}

export function useChromeAITaskAvailability({
  apiName,
  options,
  autoCheck,
}: UseChromeAITaskAvailabilityOptions): UseChromeAITaskAvailabilityResult {
  const status = ref<"idle" | "checking" | "ready" | "unavailable" | "error">("idle");
  const availability = ref<ChromeAIAvailability | undefined>(undefined);
  const error = ref<Error | undefined>(undefined);

  const refresh = async () => {
    status.value = "checking";
    error.value = undefined;
    try {
      const nextAvailability = await readChromeAITaskAvailability(apiName, options);
      availability.value = nextAvailability;
      status.value = nextAvailability === "unavailable" ? "unavailable" : "ready";
      return nextAvailability;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = "error";
      throw nextError;
    }
  };

  watch(
    () => autoCheck ?? true,
    (next) => {
      if (next) {
        void refresh();
      }
    },
    { immediate: autoCheck ?? true }
  );

  return {
    apiName,
    supported: computed(() => isChromeAITaskSupported(apiName)),
    status: computed(() => status.value),
    availability: computed(() => availability.value),
    userActivation: computed(() => getUserActivation()),
    error: computed(() => error.value),
    refresh,
  };
}

export interface UseChromeAITaskSessionOptions<TSession = ChromeAITaskSession> {
  apiName: ChromeAITaskAPIName;
  createOptions?: ChromeAITaskCreateOptions;
  autoCreate?: boolean;
  destroyOnUnmount?: boolean;
  onSession?: (session: TSession) => void;
}

export interface UseChromeAITaskSessionResult<TSession> {
  apiName: ChromeAITaskAPIName;
  status: ComputedRef<ChromeAITaskSessionStatus>;
  supported: ComputedRef<boolean>;
  session: ComputedRef<TSession | null>;
  availability: ComputedRef<ChromeAIAvailability | undefined>;
  progress: ComputedRef<ChromeAIDownloadProgress | undefined>;
  error: ComputedRef<Error | undefined>;
  createSession: (overrideOptions?: ChromeAITaskCreateOptions) => Promise<TSession>;
  destroySession: () => void;
}

export function useChromeAITaskSession<TSession = ChromeAITaskSession>({
  apiName,
  createOptions = {},
  autoCreate = false,
  destroyOnUnmount = true,
  onSession,
}: UseChromeAITaskSessionOptions<TSession>): UseChromeAITaskSessionResult<TSession> {
  const status = ref<ChromeAITaskSessionStatus>("idle");
  const session = shallowRef<TSession | null>(null);
  const availability = ref<ChromeAIAvailability | undefined>(undefined);
  const progress = ref<ChromeAIDownloadProgress | undefined>(undefined);
  const error = ref<Error | undefined>(undefined);

  const createSession = async (overrideOptions?: ChromeAITaskCreateOptions) => {
    status.value = "checking";
    error.value = undefined;
    progress.value = undefined;
    const merged = { ...createOptions, ...(overrideOptions ?? {}) };
    const nextAvailability = await readChromeAITaskAvailability(apiName, merged);
    availability.value = nextAvailability;
    status.value = nextAvailability === "available" ? "ready" : nextAvailability;
    try {
      const nextSession = await createChromeAITaskSession<TSession>(
        apiName,
        merged,
        undefined,
        (nextProgress) => {
          progress.value = nextProgress;
          status.value = nextProgress.completed ? "preparing" : "downloading";
        }
      );
      await destroyChromeAITaskSession(session.value);
      session.value = nextSession;
      availability.value = "available";
      status.value = "ready";
      onSession?.(nextSession);
      return nextSession;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  const destroySession = () => {
    void destroyChromeAITaskSession(session.value);
    session.value = null;
    status.value = "idle";
  };

  watch(
    () => autoCreate,
    (next) => {
      if (next) {
        void createSession();
      }
    },
    { immediate: autoCreate }
  );

  onScopeDispose(() => {
    if (destroyOnUnmount) {
      destroySession();
    }
  });

  return {
    apiName,
    status: computed(() => status.value),
    supported: computed(() => isChromeAITaskSupported(apiName)),
    session: computed(() => session.value),
    availability: computed(() => availability.value),
    progress: computed(() => progress.value),
    error: computed(() => error.value),
    createSession,
    destroySession,
  };
}

export interface UseChromeAITaskOperationOptions<TSession = ChromeAITaskSession> extends UseChromeAITaskSessionOptions<TSession> {
  methodName: string;
  streaming?: boolean;
  reuseSession?: boolean;
}

export interface UseChromeAITaskOperationResult<TResult = unknown, TSession = ChromeAITaskSession>
  extends Omit<UseChromeAITaskSessionResult<TSession>, "status" | "error"> {
  result: ComputedRef<TResult | undefined>;
  status: ComputedRef<ChromeAIPromptStatus>;
  text: ComputedRef<string>;
  chunks: ComputedRef<string[]>;
  error: ComputedRef<Error | undefined>;
  run: (...args: unknown[]) => Promise<TResult>;
  reset: () => void;
}

export function useChromeAITaskOperation<TResult = unknown, TSession = ChromeAITaskSession>({
  methodName,
  streaming = false,
  reuseSession = true,
  ...sessionOptions
}: UseChromeAITaskOperationOptions<TSession>) {
  const sessionHook = useChromeAITaskSession<TSession>(sessionOptions);
  const status = ref<ChromeAIPromptStatus>("idle");
  const result = ref<TResult>();
  const text = ref("");
  const chunks = ref<string[]>([]);
  const error = ref<Error | undefined>(undefined);

  const run = async (...args: unknown[]) => {
    status.value = streaming ? "streaming" : "prompting";
    error.value = undefined;
    text.value = "";
    chunks.value = [];
    const activeSession = sessionHook.session.value ?? (await sessionHook.createSession(sessionOptions.createOptions));
    const method = assertTaskMethod(activeSession, methodName) as (...args: unknown[]) => unknown;

    try {
      const maybeResult = method(...args);
      if (streaming) {
        const outputParts: string[] = [];
        for await (const chunk of toAsyncIterable((await maybeResult) as ReadableStream<string> | AsyncIterable<string>)) {
          outputParts.push(chunk);
          text.value = outputParts.join("");
          chunks.value = [...outputParts];
        }
        const finalText = outputParts.join("");
        status.value = "ready";
        text.value = finalText;
        result.value = (finalText as unknown) as TResult;
      } else {
        const awaited = (await maybeResult) as TResult;
        status.value = "ready";
        result.value = awaited;
        if (typeof awaited === "string") {
          text.value = awaited as string;
          chunks.value = [awaited as string];
        } else {
          text.value = "";
          chunks.value = [];
        }
      }

      if (!reuseSession) {
        sessionHook.destroySession();
      }
      return result.value as TResult;
    } catch (cause) {
      const nextError = toError(cause);
      error.value = nextError;
      status.value = nextError.name === "AbortError" ? "aborted" : "error";
      throw nextError;
    }
  };

  const reset = () => {
    status.value = "idle";
    result.value = undefined;
    text.value = "";
    chunks.value = [];
    error.value = undefined;
  };

  return {
    ...sessionHook,
    status: computed(() => status.value),
    result: computed(() => result.value),
    text: computed(() => text.value),
    chunks: computed(() => chunks.value),
    error: computed(() => error.value),
    run,
    reset,
  } as UseChromeAITaskOperationResult<TResult, TSession>;
}

export function useChromeAISummarizer(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName"> = {}
) {
  return useChromeAITaskOperation<string, ChromeAITaskSession>({
    ...options,
    apiName: "Summarizer",
    methodName: options.streaming ? "summarizeStreaming" : "summarize",
  });
}

export function useChromeAITranslator(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName"> = {}
) {
  return useChromeAITaskOperation<string, ChromeAITaskSession>({
    ...options,
    apiName: "Translator",
    methodName: options.streaming ? "translateStreaming" : "translate",
  });
}

export function useChromeAILanguageDetector(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName" | "streaming"> = {}
) {
  return useChromeAITaskOperation<unknown, ChromeAITaskSession>({
    ...options,
    apiName: "LanguageDetector",
    methodName: "detect",
  });
}

export function useChromeAIWriter(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName"> = {}
) {
  return useChromeAITaskOperation<string, ChromeAITaskSession>({
    ...options,
    apiName: "Writer",
    methodName: options.streaming ? "writeStreaming" : "write",
  });
}

export function useChromeAIRewriter(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName"> = {}
) {
  return useChromeAITaskOperation<string, ChromeAITaskSession>({
    ...options,
    apiName: "Rewriter",
    methodName: options.streaming ? "rewriteStreaming" : "rewrite",
  });
}

export function useChromeAIProofreader(
  options: Omit<UseChromeAITaskOperationOptions, "apiName" | "methodName" | "streaming"> = {}
) {
  return useChromeAITaskOperation<unknown, ChromeAITaskSession>({
    ...options,
    apiName: "Proofreader",
    methodName: "proofread",
  });
}

