import type { ExtractedContent } from "../types";

export type MessageRequest =
  | { type: "ANALYZE_PAGE" }
  | { type: "EXTRACT_CONTENT" }
  | { type: "CONTENT_EXTRACTED"; payload: ExtractedContent }
  | { type: "CALCULATE_LLM_SCORES"; payload: { text: string } }
  | { type: "LLM_SCORES_READY"; payload: { tone: number; uniqueness: number } }
  | { type: "OFFSCREEN_READY" }
  | { type: "ERROR"; payload: { message: string } };

export type MessageResponse =
  | { success: true; data?: unknown }
  | { success: false; error: string };

export function sendMessage<R extends MessageResponse>(
  request: MessageRequest,
): Promise<R> {
  return chrome.runtime.sendMessage(request);
}

export function handleMessage(
  request: MessageRequest,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void,
): boolean {
  const handler = handlers[request.type];
  if (!handler) {
    sendResponse({ success: false, error: `Unknown message type: ${request.type}` });
    return false;
  }

  const result = handler(request);

  if (result instanceof Promise) {
    result
      .then((data) => sendResponse({ success: true, data }))
      .catch((err: Error) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  sendResponse({ success: true, data: result });
  return false;
}

const handlers: Record<
  string,
  (request: MessageRequest) => unknown | Promise<unknown>
> = {};

export function registerHandler(
  type: MessageRequest["type"],
  handler: (request: MessageRequest) => unknown | Promise<unknown>,
): void {
  handlers[type] = handler;
}

export function createOffscreenDocument(): Promise<void> {
  const path = chrome.runtime.getURL("offscreen.html");

  return chrome.offscreen.hasDocument().then((hasDocument) => {
    if (hasDocument) return;
    return chrome.offscreen.createDocument({
      url: path,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: "Run Transformers.js models for AEO analysis",
    });
  });
}

export function closeOffscreenDocument(): Promise<void> {
  return chrome.offscreen.hasDocument().then((hasDocument) => {
    if (!hasDocument) return;
    return chrome.offscreen.closeDocument();
  });
}
