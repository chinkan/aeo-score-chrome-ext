import { extractContent } from "../lib/aeo-calculator";
import type { MessageRequest, MessageResponse } from "../lib/messaging";

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse) => {
    if (request.type === "EXTRACT_CONTENT") {
      (async () => {
        try {
          const html = document.documentElement.outerHTML;
          const content = await extractContent(html);
          const response: MessageResponse = { success: true, data: content };
          sendResponse(response);
        } catch (err) {
          const response: MessageResponse = {
            success: false,
            error: err instanceof Error ? err.message : "Unknown extraction error",
          };
          sendResponse(response);
        }
      })();
      return true;
    }
    return false;
  },
);
