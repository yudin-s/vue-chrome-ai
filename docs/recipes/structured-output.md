# Structured Output

Use `promptStructured()` when the UI needs typed data and the browser supports `responseConstraint`.

```ts
import { useChromeAIPrompt } from "@yudin-s/vue-chrome-ai";

const ai = useChromeAIPrompt<{ label: "bug" | "feature" | "question" }>({
  reflection: {
    format: "json",
    reflect: true,
    schema: {
      type: "object",
      properties: {
        label: { enum: ["bug", "feature", "question"] },
      },
      required: ["label"],
    },
  },
});

const result = await ai.promptStructured("Classify: The save button does nothing.");
console.log(result.data?.label);
```

`reflection.reflect` runs a second prompt on the same session to repair formatting and instruction-following issues. Treat parsed data as a convenience layer and still validate it in high-risk workflows.
