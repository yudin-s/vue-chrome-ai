<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useChromeAIAvailability,
  useChromeAIContext,
  useChromeAIParams,
  useChromeAISession,
  useChromeAIStream,
  useChromeAISummarizer,
} from "@yudin-s/vue-chrome-ai";

const prompts = [
  "Explain what Chrome Built-in AI changes for privacy-sensitive Vue apps.",
  "Draft a compact onboarding checklist for enabling local model features.",
  "List three UX states a browser-native AI app must handle.",
];

const quickStart = `import { useChromeAIPrompt } from "@yudin-s/vue-chrome-ai";

const ai = useChromeAIPrompt();
await ai.prompt("Summarize this locally.");`;

const features = [
  {
    title: "Model readiness",
    text: "Detect support, availability, user activation, and browser-managed model preparation.",
  },
  {
    title: "Download progress",
    text: "Render progress from Chrome AI create({ monitor }) as Vue refs and computed values.",
  },
  {
    title: "Prompt streaming",
    text: "Use prompt() and promptStreaming() with lifecycle, errors, aborts, and scope cleanup.",
  },
  {
    title: "Task APIs",
    text: "Wrap Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.",
  },
];

const prompt = ref(prompts[0]);
const article = ref(
  "Chrome Built-in AI lets eligible Chrome builds run browser-managed model features locally. Apps still need to handle support checks, availability, download progress, user activation, session cleanup, and errors."
);

const readiness = useChromeAIAvailability();
const params = useChromeAIParams();
const model = useChromeAISession({
  autoCreate: false,
  createOptions: {
    initialPrompts: [
      {
        role: "system",
        content:
          "You are a concise local assistant. Be practical, specific, and avoid unsupported claims.",
      },
    ],
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  },
});
const stream = useChromeAIStream(model.session);
const context = useChromeAIContext(model.session, { pollIntervalMs: 1000 });
const summarizer = useChromeAISummarizer({
  createOptions: {
    type: "key-points",
    format: "markdown",
    length: "short",
    expectedInputLanguages: ["en"],
    outputLanguage: "en",
  },
});

const contextPercent = computed(() => {
  if (!context.contextWindow.value || !context.contextUsage.value) return 0;
  return Math.min(
    100,
    Math.round((context.contextUsage.value / context.contextWindow.value) * 100)
  );
});
const prepareDisabled = computed(() =>
  ["checking", "downloading", "preparing"].includes(model.status.value)
);
const streamDisabled = computed(
  () => !model.session.value || stream.status.value === "streaming"
);
const summarizeDisabled = computed(() =>
  ["checking", "downloading", "preparing", "prompting", "streaming"].includes(
    summarizer.status.value
  )
);
const progressLabel = computed(() =>
  model.progress.value?.percent != null
    ? `${model.progress.value.percent}%`
    : model.status.value
);
const apiSupportLabel = computed(() =>
  readiness.supported.value ? "Supported" : "Not exposed"
);
const userActivationLabel = computed(() =>
  readiness.userActivation.value ? "Present" : "May be required"
);

async function prepareModel() {
  await model.createSession();
}

async function streamPrompt() {
  await stream.streamPrompt(prompt.value);
  context.refresh();
}

async function summarizeArticle() {
  await summarizer.run(article.value);
}
</script>

<template>
  <main class="shell">
    <nav class="site-nav" aria-label="Package navigation">
      <a class="brand" href="https://github.com/yudin-s/vue-chrome-ai">
        @yudin-s/vue-chrome-ai
      </a>
      <div class="package-links">
        <a href="https://www.npmjs.com/package/@yudin-s/vue-chrome-ai">npm</a>
        <a href="https://github.com/yudin-s/vue-chrome-ai">GitHub</a>
        <a href="https://github.com/yudin-s/vue-chrome-ai/blob/main/docs/composables.md">
          Docs
        </a>
        <a href="https://github.com/yudin-s/vue-chrome-ai/tree/main/docs/recipes">
          Recipes
        </a>
      </div>
    </nav>

    <header class="hero">
      <div>
        <p class="eyebrow">Vue composables for Chrome-side LLMs</p>
        <h1>@yudin-s/vue-chrome-ai</h1>
        <p class="tagline">
          Reactive Vue integration for Gemini Nano, Chrome Built-in AI,
          LanguageModel Prompt API, browser-side LLMs, streaming, and task APIs.
        </p>
        <div class="hero-actions">
          <a class="primary-link" href="https://www.npmjs.com/package/@yudin-s/vue-chrome-ai">
            View on npm
          </a>
          <a href="https://github.com/yudin-s/vue-chrome-ai">Read the source</a>
          <a href="#playground">Try the live playground</a>
        </div>
      </div>

      <section class="install-card" aria-labelledby="install-title">
        <h2 id="install-title">Install</h2>
        <code class="install-command">npm install @yudin-s/vue-chrome-ai</code>
        <p>
          No API key, backend, or bundled model. Chrome owns model availability
          and Gemini Nano downloads.
        </p>
      </section>
    </header>

    <section class="quickstart" aria-labelledby="quickstart-title">
      <div>
        <p class="eyebrow">Quick start</p>
        <h2 id="quickstart-title">Use Chrome AI from Vue refs</h2>
        <p>
          Composables expose availability, download progress, sessions, prompts,
          streaming, structured output, and task APIs without hiding the native
          Chrome Built-in AI behavior.
        </p>
      </div>
      <pre><code>{{ quickStart }}</code></pre>
    </section>

    <section class="feature-grid" aria-label="Feature coverage">
      <article v-for="feature in features" :key="feature.title" class="feature-tile">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.text }}</p>
      </article>
    </section>

    <section class="playground-block" id="playground">
      <section class="section-heading">
        <p class="eyebrow">Live example</p>
        <h2>Chrome AI playground</h2>
        <p>
          This playground is built with the package composables and shows the UI
          states a real Vue app needs to control.
        </p>
      </section>

      <section class="status-grid" aria-label="Chrome AI runtime status">
        <div class="status-tile">
          <span>API support</span>
          <strong>{{ apiSupportLabel }}</strong>
        </div>
        <div class="status-tile">
          <span>Availability</span>
          <strong>{{ readiness.availability.value ?? readiness.status.value }}</strong>
        </div>
        <div class="status-tile">
          <span>Session</span>
          <strong>{{ model.status.value }}</strong>
        </div>
        <div class="status-tile">
          <span>User activation</span>
          <strong>{{ userActivationLabel }}</strong>
        </div>
      </section>

      <section class="workspace">
        <aside class="panel">
          <h2>Model Control</h2>
          <p class="muted">
            Prepare the model from a click. Chrome may use this step to download
            or load browser-managed model files.
          </p>
          <div class="button-row">
            <button :disabled="prepareDisabled" @click="prepareModel">
              Prepare Model
            </button>
            <button class="secondary" :disabled="!model.session.value" @click="model.destroySession">
              Destroy Session
            </button>
          </div>

          <div class="progress-block">
            <div>
              <strong>Download</strong>
              <span>{{ progressLabel }}</span>
            </div>
            <progress
              v-if="model.progress.value?.progress != null"
              :value="model.progress.value.progress"
              max="1"
            />
            <progress v-else />
          </div>

          <div class="meter">
            <div>
              <strong>Context</strong>
              <span>{{ contextPercent }}%</span>
            </div>
            <meter
              :value="context.contextUsage.value ?? 0"
              :max="context.contextWindow.value ?? 1"
            />
            <p v-if="context.overflowed.value" role="alert">
              Context overflow was reported by Chrome.
            </p>
          </div>

          <dl>
            <dt>Top K</dt>
            <dd>{{ params.params.value?.defaultTopK ?? "unknown" }}</dd>
            <dt>Temperature</dt>
            <dd>{{ params.params.value?.defaultTemperature ?? "unknown" }}</dd>
          </dl>
        </aside>

        <section class="panel editor">
          <h2>Streaming Prompt</h2>
          <label>
            Prompt
            <textarea v-model="prompt" rows="8" />
          </label>
          <div class="preset-row">
            <button
              v-for="item in prompts"
              :key="item"
              class="chip"
              type="button"
              @click="prompt = item"
            >
              {{ item.slice(0, 34) }}
            </button>
          </div>
          <button :disabled="streamDisabled" @click="streamPrompt">
            Stream Response
          </button>
          <p v-if="model.error.value" role="alert">{{ model.error.value.message }}</p>
          <p v-if="stream.error.value" role="alert">{{ stream.error.value.message }}</p>
        </section>

        <section class="panel output">
          <h2>Output</h2>
          <p class="muted">Status: {{ stream.status.value }}</p>
          <output>{{ stream.text.value || "The local model response will appear here." }}</output>
        </section>
      </section>

      <section class="task-workspace">
        <section class="panel task-panel">
          <h2>Task API: Summarizer</h2>
          <p class="muted">
            The same reactive lifecycle works for Chrome Built-in AI task APIs.
          </p>
          <textarea v-model="article" rows="6" />
          <button :disabled="summarizeDisabled" @click="summarizeArticle">
            Summarize Article
          </button>
          <p v-if="summarizer.error.value" role="alert">
            {{ summarizer.error.value.message }}
          </p>
        </section>
        <section class="panel output">
          <h2>Summary</h2>
          <p class="muted">Status: {{ summarizer.status.value }}</p>
          <output>{{ summarizer.text.value || "A local summary will appear here." }}</output>
        </section>
      </section>
    </section>
  </main>
</template>
