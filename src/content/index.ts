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
// CLS: track maximum session-window value (gap ≤1s between shifts, window ≤5s), not a running sum.
// This matches Chrome's CLS algorithm and prevents overestimating CLS on long pages.
let _cls: number = 0;
let _clsCurrentWindowValue: number = 0;
let _clsWindowStart: number = -Infinity;
let _clsLastEntryTime: number = -Infinity;
let _fcp: number | null = null;
let _ttfb: number | null = null;
// Map of interactionId → max event duration for that interaction (INP tracks per-interaction)
const _inpInteractions = new Map<number, number>();
// Fallback: first-input captures the very first discrete interaction without needing interactionId
let _firstInputDuration: number | null = null;

function computeINP(): number | null {
  if (_inpInteractions.size === 0) {
    // Fall back to first-input duration when no interactionId-tagged events were observed.
    // This happens in Chrome versions that don't assign interactionId, or when only one
    // interaction has occurred (first-input is always reliable and doesn't need interactionId).
    return _firstInputDuration;
  }
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

  // CLS — track the maximum session-window score (shifts within a 1s gap, max 5s total window),
  // ignoring shifts preceded by user input. This matches Chrome's official CLS algorithm.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) {
          const t = entry.startTime;
          // Start a new session window when gap > 1s or window duration > 5s
          if (t - _clsLastEntryTime > 1000 || t - _clsWindowStart > 5000) {
            _clsCurrentWindowValue = 0;
            _clsWindowStart = t;
          }
          _clsLastEntryTime = t;
          _clsCurrentWindowValue += entry.value;
          _cls = Math.max(_cls, _clsCurrentWindowValue);
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

  // first-input — reliable fallback for the first discrete user interaction.
  // Supported since Chrome 73+ and does not require interactionId, making it a robust
  // safety net when the event observer fails to capture interactionId-tagged entries.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as EventTimingEntry[]) {
        if (_firstInputDuration === null || entry.duration > _firstInputDuration) {
          _firstInputDuration = entry.duration;
        }
      }
    }).observe({ type: "first-input", buffered: true });
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

