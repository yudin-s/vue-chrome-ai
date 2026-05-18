<script setup lang="ts">
import { computed, ref } from "vue";
import { useChromeAISummarizer } from "@yudin-s/vue-chrome-ai";

const article = ref("Paste a longer English article here.");
const summarizer = useChromeAISummarizer({
  createOptions: {
    type: "key-points",
    format: "markdown",
    length: "medium",
    expectedInputLanguages: ["en"],
    outputLanguage: "en",
  },
});

const busy = computed(() =>
  ["checking", "downloading", "preparing", "prompting", "streaming"].includes(
    summarizer.status.value
  )
);

async function summarize() {
  await summarizer.run(article.value);
}
</script>

<template>
  <section style="display: grid; gap: 0.75rem; max-width: 760px">
    <h3>Chrome AI Summarizer</h3>
    <textarea v-model="article" rows="8" />
    <button :disabled="busy" @click="summarize">Summarize locally</button>
    <progress
      v-if="summarizer.progress.value?.progress != null"
      :value="summarizer.progress.value.progress"
    />
    <p><strong>Status:</strong> {{ summarizer.status.value }}</p>
    <p v-if="summarizer.error.value">{{ summarizer.error.value.message }}</p>
    <pre style="white-space: pre-wrap">{{ summarizer.text.value }}</pre>
  </section>
</template>
