# Task APIs

Chrome Built-in AI includes task-specific APIs such as Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader. This package exposes a generic task layer plus convenience composables.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useChromeAISummarizer } from "@yudin-s/vue-chrome-ai";

const article = ref("");
const summarizer = useChromeAISummarizer({
  createOptions: {
    type: "key-points",
    format: "markdown",
    length: "medium",
    expectedInputLanguages: ["en"],
    outputLanguage: "en",
  },
});

async function summarize() {
  await summarizer.run(article.value);
}
</script>

<template>
  <textarea v-model="article" />
  <button :disabled="summarizer.status.value === 'prompting'" @click="summarize">
    Summarize
  </button>
  <output>{{ summarizer.text.value }}</output>
</template>
```

For newer browser methods that do not yet have a convenience wrapper, use `useChromeAITaskSession()` or `useChromeAITaskOperation()` and pass the task API name plus method name directly.
