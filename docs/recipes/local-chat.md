# Local Chat

Use `useChromeAISession()` when the app wants to keep a conversation session alive across multiple prompts.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useChromeAISession, type ChromeAIMessage } from "@yudin-s/vue-chrome-ai";

const input = ref("");
const messages = ref<ChromeAIMessage[]>([]);
const session = useChromeAISession({
  autoCreate: false,
  createOptions: {
    initialPrompts: [
      { role: "system", content: "You are concise and run locally in Chrome." },
    ],
  },
});

async function send() {
  const active = session.session.value ?? await session.createSession();
  messages.value = [...messages.value, { role: "user", content: input.value }];
  const text = await active.prompt(messages.value);
  messages.value = [...messages.value, { role: "assistant", content: text }];
  input.value = "";
}
</script>
```

For simple one-shot prompts, `useChromeAIPrompt()` owns its session for you. For chat-like flows, owning the session separately makes context, cloning, and teardown explicit.
