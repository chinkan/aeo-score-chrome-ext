import { extractContent } from "../lib/aeo-calculator";
import type { MessageRequest, MessageResponse } from "../lib/messaging";
import type { ExtractedContent } from "../lib/types";

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface EventTimingEntry extends PerformanceEntry {
  duration: number;
}

function collectCWVMetrics(): Pick<ExtractedContent, "lcp" | "inp" | "cls" | "fcp" | "ttfb"> {
  try {
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
    const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : null;

    const clsEntries = performance.getEntriesByType("layout-shift") as LayoutShiftEntry[];
    const cls = clsEntries.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : e.value), 0);

    const paintEntries = performance.getEntriesByType("paint");
    const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
    const fcp = fcpEntry ? fcpEntry.startTime : null;

    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const ttfb = navEntries.length > 0 ? navEntries[0].responseStart : null;

    const eventEntries = performance.getEntriesByType("event") as EventTimingEntry[];
    let inp: number | null = null;
    if (eventEntries.length > 0) {
      const durations = eventEntries.map((e) => e.duration).sort((a, b) => a - b);
      const idx = Math.max(0, Math.min(Math.ceil(durations.length * 0.98) - 1, durations.length - 1));
      inp = durations[idx] ?? null;
    }

    return { lcp, inp, cls, fcp, ttfb };
  } catch {
    return { lcp: null, inp: null, cls: 0, fcp: null, ttfb: null };
  }
}

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse) => {
    if (request.type === "EXTRACT_CONTENT") {
      (async () => {
        try {
          const html = document.documentElement.outerHTML;
          const content = await extractContent(html);
          const cwvMetrics = collectCWVMetrics();
          const response: MessageResponse = {
            success: true,
            data: { ...content, ...cwvMetrics },
          };
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
