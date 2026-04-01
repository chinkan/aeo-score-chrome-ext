import { calculateTone, calculateUniqueness } from "../lib/llm";
import type { MessageRequest, MessageResponse } from "../lib/messaging";

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse) => {
    if (request.type === "CALCULATE_LLM_SCORES") {
      const text = request.payload.text;

      Promise.all([
        calculateTone(text),
        calculateUniqueness(text),
      ])
        .then(([tone, uniqueness]) => {
          const response: MessageResponse = {
            success: true,
            data: { tone, uniqueness },
          };
          sendResponse(response);
        })
        .catch((err: Error) => {
          const response: MessageResponse = {
            success: false,
            error: err.message,
          };
          sendResponse(response);
        });

      return true;
    }

    return false;
  },
);

self.postMessage({ type: "OFFSCREEN_READY" });
