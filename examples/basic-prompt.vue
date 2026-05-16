<script setup lang="ts">
import { computed, ref } from "vue";
import { useChromeAIStream, useChromeAISession } from "@yudin-s/vue-chrome-ai";

const query = ref("Explain Prompt API in three short bullets.");
const session = useChromeAISession({ autoCreate: false });
const stream = useChromeAIStream(session.session);

const status = computed(() => session.status.value);
const availability = computed(() => session.availability.value);
const progress = computed(() => session.progress.value);

const isBusy = computed(
  () => status.value === "downloading" || status.value === "checking" || status.value === "preparing"
);
const answer = computed(() => stream.text.value);

const run = async () => {
  await session.createSession();
  await stream.streamPrompt(query.value);
};
</script>

<template>
  <section style="display: grid; gap: 0.75rem; max-width: 760px">
    <h3>Vue Chrome AI Basic Prompt</h3>
    <textarea v-model="query" rows="3" />
    <button :disabled="isBusy" @click="run">Run</button>

    <p><strong>Status:</strong> {{ status }}</p>
    <p><strong>Availability:</strong> {{ availability }}</p>
    <p><strong>Progress:</strong> {{ progress }}</p>

    <pre style="white-space: pre-wrap">{{ answer }}</pre>
  </section>
</template>
