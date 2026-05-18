import { createApp } from "vue";
import { VueChromeAI } from "@yudin-s/vue-chrome-ai";
import App from "./App.vue";
import "./styles.css";

createApp(App)
  .use(VueChromeAI, {
    createOptions: {
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    },
    autoCheck: true,
    autoCreate: false,
  })
  .mount("#app");
