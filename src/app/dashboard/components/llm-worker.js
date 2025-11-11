// WebLLM worker bridge for Next.js
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

self.onmessage = (event) => {
  WebWorkerMLCEngineHandler.onmessage(event);
};
