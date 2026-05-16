import { describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";
import {
  useChromeAIAvailability,
  useChromeAIPrompt,
  useChromeAIParams,
  useChromeAISession,
} from "../src/composables";
import type { ChromeAIRuntime, ChromeAIParams, ChromeAICreateOptions } from "../src/types";

function withRuntime<T>(runtime: ChromeAIRuntime, callback: () => Promise<T> | T): Promise<T> {
  const previousLanguageModel = (globalThis as { LanguageModel?: unknown }).LanguageModel;
  const previousAi = (globalThis as { ai?: unknown }).ai;
  (globalThis as { LanguageModel?: unknown }).LanguageModel = runtime.LanguageModel;
  (globalThis as { ai?: unknown }).ai = runtime.ai;

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      if (typeof previousLanguageModel === "undefined") {
        delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
      } else {
        (globalThis as { LanguageModel?: unknown }).LanguageModel = previousLanguageModel;
      }
      if (typeof previousAi === "undefined") {
        delete (globalThis as { ai?: unknown }).ai;
      } else {
        (globalThis as { ai?: unknown }).ai = previousAi;
      }
    });
}

describe("Vue composables smoke", () => {
  it("checks availability via useChromeAIAvailability", async () => {
    const runtime: ChromeAIRuntime = {
      LanguageModel: {
        availability: vi.fn(async () => "downloadable" as const),
        create: vi.fn(),
      },
    };

    await withRuntime(runtime, async () => {
      const scope = effectScope();
      const hooks = scope.run(() => useChromeAIAvailability());
      if (!hooks) {
        throw new Error("hook result missing");
      }

      await hooks.refresh();
      expect(hooks.status.value).toBe("ready");
      expect(hooks.availability.value).toBe("downloadable");
      expect(hooks.supported.value).toBe(true);

      scope.stop();
    });
  });

  it("loads Chrome params through useChromeAIParams", async () => {
    const runtimeParams: ChromeAIParams = {
      defaultTopK: 1,
      maxTopK: 10,
      defaultTemperature: 0.5,
      maxTemperature: 1,
    };
    const runtime: ChromeAIRuntime = {
      LanguageModel: {
        availability: vi.fn(async () => "available" as const),
        create: vi.fn(),
        params: vi.fn(async () => runtimeParams),
      },
    };

    await withRuntime(runtime, async () => {
      const scope = effectScope();
      const params = scope.run(() => useChromeAIParams());
      if (!params) {
        throw new Error("params hook missing");
      }
      const resolved = await params.refresh();
      expect(resolved).toEqual(runtimeParams);
      expect(params.status.value).toBe("ready");
      expect(params.params.value).toEqual(runtimeParams);
      scope.stop();
    });
  });

  it("creates a session and destroys on scope stop", async () => {
    const sessionDestroy = vi.fn();
    const createSession = vi.fn(async (_create: ChromeAICreateOptions = {}) => ({
      prompt: vi.fn(async () => "ok"),
      promptStreaming: vi.fn(),
      destroy: sessionDestroy,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const runtime: ChromeAIRuntime = {
      LanguageModel: {
        availability: vi.fn(async () => "available" as const),
        create: createSession,
      },
    };

    await withRuntime(runtime, async () => {
      const scope = effectScope();
      const sessionHook = scope.run(() => useChromeAISession({ autoCreate: false }));
      if (!sessionHook) {
        throw new Error("session hook missing");
      }

      const session = await sessionHook.createSession();
      expect(sessionHook.session.value).toBe(session);
      expect(createSession).toHaveBeenCalledTimes(1);

      scope.stop();
      expect(sessionDestroy).toHaveBeenCalledTimes(1);
    });
  });

  it("supports non-stream prompt and returns text", async () => {
    const runtime: ChromeAIRuntime = {
      LanguageModel: {
        availability: vi.fn(async () => "available" as const),
        create: vi.fn(async () => ({
          prompt: vi.fn(async () => "result"),
          promptStreaming: vi.fn(),
          destroy: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      },
    };

    await withRuntime(runtime, async () => {
      const scope = effectScope();
      const promptHook = scope.run(() => useChromeAIPrompt());
      if (!promptHook) {
        throw new Error("prompt hook missing");
      }

      const result = await promptHook.prompt("Summarize this");
      expect(result).toBe("result");
      expect(promptHook.text.value).toBe("result");
      expect(promptHook.status.value).toBe("ready");
      scope.stop();
    });
  });
});
