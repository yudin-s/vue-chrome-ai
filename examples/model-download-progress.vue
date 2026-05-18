<script setup lang="ts">
import { computed } from "vue";
import { useChromeAISession } from "@yudin-s/vue-chrome-ai";

const ai = useChromeAISession({
  autoCreate: false,
  createOptions: {
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
  },
});

const busy = computed(() =>
  ["checking", "downloading", "preparing"].includes(ai.status.value)
);
const progressText = computed(() => {
  if (ai.status.value === "downloading") {
    return `Downloading ${ai.progress.value?.percent ?? 0}%`;
  }
  if (ai.status.value === "preparing") {
    return "Preparing model";
  }
  return ai.status.value;
});
</script>

<template>
  <section style="display: grid; gap: 0.75rem; max-width: 560px">
    <h3>Chrome AI Model Download</h3>
    <button :disabled="busy" @click="ai.createSession()">Prepare local model</button>
    <progress
      v-if="ai.progress.value?.progress != null"
      :value="ai.progress.value.progress"
    />
    <p><strong>Status:</strong> {{ progressText }}</p>
    <p v-if="ai.error.value">{{ ai.error.value.message }}</p>
  </section>
</template>
