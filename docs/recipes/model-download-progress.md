# Model Download Progress

Chrome can download Gemini Nano the first time an origin creates a compatible `LanguageModel` session. Users should see that state instead of a frozen button.

```vue
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

const label = computed(() => {
  if (ai.status.value === "downloading") {
    return `Downloading ${ai.progress.value?.percent ?? 0}%`;
  }
  if (ai.status.value === "preparing") {
    return "Preparing model";
  }
  return "Prepare local model";
});
</script>

<template>
  <button :disabled="ai.status.value === 'downloading'" @click="ai.createSession()">
    {{ label }}
  </button>
  <progress
    v-if="ai.progress.value?.progress != null"
    :value="ai.progress.value.progress"
  />
  <p v-if="ai.error.value">{{ ai.error.value.message }}</p>
</template>
```

Call `createSession()` from a click or tap handler when Chrome requires user activation to start model preparation.
