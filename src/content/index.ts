import { extractContent } from "../lib/aeo-calculator";
import type { MessageRequest, MessageResponse } from "../lib/messaging";
import type { ExtractedContent } from "../lib/types";

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface EventTimingEntry extends PerformanceEntry {
  duration: number;
  processingStart: number;
  processingEnd: number;
  interactionId: number;
}

// Accumulated CWV values — updated by PerformanceObserver callbacks registered at load time
let _lcp: number | null = null;
let _cls: number = 0;
let _fcp: number | null = null;
let _ttfb: number | null = null;
// Map of interactionId → max event duration for that interaction (INP tracks per-interaction)
const _inpInteractions = new Map<number, number>();

function computeINP(): number | null {
  if (_inpInteractions.size === 0) return null;
  const durations = [..._inpInteractions.values()].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(Math.ceil(durations.length * 0.98) - 1, durations.length - 1));
  return durations[idx] ?? null;
}

// Register PerformanceObserver instances immediately so metrics accumulate from page load.
// Using buffered:true ensures entries that already fired before this script was injected
// are also delivered, replacing the deprecated performance.getEntriesByType() approach.
function initCWVObservers(): void {
  // LCP — track the most recent (largest) contentful paint
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        _lcp = entries[entries.length - 1].startTime;
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* not supported in this context */ }

  // CLS — accumulate layout shifts that were not preceded by user input
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) {
          _cls += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch { /* not supported */ }

  // FCP — first-contentful-paint paint entry
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          _fcp = entry.startTime;
        }
      }
    }).observe({ type: "paint", buffered: true });
  } catch { /* not supported */ }

  // TTFB — from the navigation timing entry (not deprecated, safe to use synchronously)
  try {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      _ttfb = navEntries[0].responseStart;
    }
  } catch { /* not supported */ }

  // INP — 98th-percentile of per-interaction max event durations.
  // Filter by interactionId > 0 to only count real user interactions (clicks, taps, keypresses),
  // excluding non-interactive events like mousemove. Track the max duration per interactionId
  // so each interaction is counted once, matching Chrome's INP algorithm.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as EventTimingEntry[]) {
        if (entry.interactionId > 0) {
          const prev = _inpInteractions.get(entry.interactionId) ?? 0;
          _inpInteractions.set(entry.interactionId, Math.max(prev, entry.duration));
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  } catch { /* not supported */ }
}

// Start observing immediately when the content script is injected
initCWVObservers();

function collectCWVMetrics(): Pick<ExtractedContent, "lcp" | "inp" | "cls" | "fcp" | "ttfb"> {
  return {
    lcp: _lcp,
    inp: computeINP(),
    cls: _cls,
    fcp: _fcp,
    ttfb: _ttfb,
  };
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

