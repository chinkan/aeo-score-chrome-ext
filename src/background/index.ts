import type { MessageRequest, MessageResponse } from "../lib/messaging";
import type { ExtractedContent, AnalysisResult } from "../lib/types";
import { finalizeAll } from "../lib/aeo-calculator";
import { createOffscreenDocument } from "../lib/messaging";

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse) => {
    if (request.type === "ANALYZE_PAGE") {
      handleAnalyzePage(sendResponse);
      return true;
    }
    return false;
  },
);

async function handleAnalyzePage(sendResponse: (response: MessageResponse) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      sendResponse({ success: false, error: "No active tab found" });
      return;
    }

    const content = await extractContentFromTab(tab.id);

    await createOffscreenDocument();

    const llmScores = await calculateLLMScores(content.mainText);

    const result = finalizeAll(content, llmScores) as unknown as AnalysisResult;

    sendResponse({ success: true, data: result });
  } catch (err) {
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Analysis failed",
    });
  }
}

function extractContentFromTab(tabId: number): Promise<ExtractedContent> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "EXTRACT_CONTENT" },
      (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.data as ExtractedContent);
      },
    );
  });
}

function calculateLLMScores(text: string): Promise<{ tone: number; uniqueness: number }> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "CALCULATE_LLM_SCORES", payload: { text } },
      (response: MessageResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error));
          return;
        }
        resolve(response.data as { tone: number; uniqueness: number });
      },
    );
  });
}
