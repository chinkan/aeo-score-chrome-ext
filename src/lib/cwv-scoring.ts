import type { CWVComponents, CWVResult, Suggestion, ExtractedContent } from "./types";

// LCP thresholds (ms) — https://web.dev/lcp/
const LCP_GOOD = 2500;
const LCP_POOR = 4000;

// INP thresholds (ms) — https://web.dev/inp/
const INP_GOOD = 200;
const INP_POOR = 500;

// CLS thresholds (unitless) — https://web.dev/cls/
const CLS_GOOD = 0.1;
const CLS_POOR = 0.25;

// FCP thresholds (ms) — https://web.dev/fcp/
const FCP_GOOD = 1800;
const FCP_POOR = 3000;

// TTFB thresholds (ms) — https://web.dev/ttfb/
const TTFB_GOOD = 800;
const TTFB_POOR = 1800;

function linearInterp(value: number, lo: number, hi: number, scoreAt_lo: number, scoreAt_hi: number): number {
  if (lo === hi) return scoreAt_lo;
  return Math.round(scoreAt_lo + (scoreAt_hi - scoreAt_lo) * ((value - lo) / (hi - lo)));
}

export function scoreLCP(lcp: number | null): number {
  if (lcp === null) return 50;
  if (lcp <= LCP_GOOD) return 100;
  if (lcp <= LCP_POOR) return linearInterp(lcp, LCP_GOOD, LCP_POOR, 99, 50);
  return Math.max(0, linearInterp(lcp, LCP_POOR, LCP_POOR * 2, 49, 0));
}

export function scoreINP(inp: number | null): number {
  if (inp === null) return 100;
  if (inp <= INP_GOOD) return 100;
  if (inp <= INP_POOR) return linearInterp(inp, INP_GOOD, INP_POOR, 99, 50);
  return Math.max(0, linearInterp(inp, INP_POOR, INP_POOR * 3, 49, 0));
}

export function scoreCLS(cls: number): number {
  if (cls <= CLS_GOOD) return 100;
  if (cls <= CLS_POOR) return linearInterp(cls, CLS_GOOD, CLS_POOR, 99, 50);
  return Math.max(0, linearInterp(cls, CLS_POOR, CLS_POOR * 3, 49, 0));
}

export function scoreFCP(fcp: number | null): number {
  if (fcp === null) return 50;
  if (fcp <= FCP_GOOD) return 100;
  if (fcp <= FCP_POOR) return linearInterp(fcp, FCP_GOOD, FCP_POOR, 99, 50);
  return Math.max(0, linearInterp(fcp, FCP_POOR, FCP_POOR * 2, 49, 0));
}

export function scoreTTFB(ttfb: number | null): number {
  if (ttfb === null) return 50;
  if (ttfb <= TTFB_GOOD) return 100;
  if (ttfb <= TTFB_POOR) return linearInterp(ttfb, TTFB_GOOD, TTFB_POOR, 99, 50);
  return Math.max(0, linearInterp(ttfb, TTFB_POOR, TTFB_POOR * 2, 49, 0));
}

function formatMs(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

function generateCWVSuggestions(
  raw: { lcp: number | null; inp: number | null; cls: number; fcp: number | null; ttfb: number | null },
  components: CWVComponents,
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (raw.lcp === null) {
    suggestions.push({
      type: "info",
      message: "LCP not available — no suitable content element found",
      action: "Ensure the page has a visible large image or text block above the fold that can serve as the Largest Contentful Paint element",
    });
  } else if (raw.lcp > LCP_POOR) {
    suggestions.push({
      type: "critical",
      message: `LCP is ${formatMs(raw.lcp)} — Poor (target: <2.5s)`,
      action: "Optimize images (compress, use WebP/AVIF, add preload hints), reduce render-blocking JS/CSS, and use a CDN",
    });
  } else if (raw.lcp > LCP_GOOD) {
    suggestions.push({
      type: "warning",
      message: `LCP is ${formatMs(raw.lcp)} — Needs Improvement (target: <2.5s)`,
      action: "Preload the hero image, defer non-critical scripts, and ensure server response is fast",
    });
  }

  if (raw.inp === null) {
    suggestions.push({
      type: "info",
      message: "INP not measured — no discrete user interactions captured yet",
      action: "Click a button or link, or press a key on this page, then re-analyze to measure Interaction to Next Paint (scrolling alone does not count)",
    });
  } else if (raw.inp > INP_POOR) {
    suggestions.push({
      type: "critical",
      message: `INP is ${formatMs(raw.inp)} — Poor (target: <200ms)`,
      action: "Break up long JavaScript tasks using setTimeout or requestIdleCallback, remove heavy third-party scripts, and minimize DOM size",
    });
  } else if (raw.inp > INP_GOOD) {
    suggestions.push({
      type: "warning",
      message: `INP is ${formatMs(raw.inp)} — Needs Improvement (target: <200ms)`,
      action: "Debounce event handlers, defer non-essential third-party scripts, and reduce JavaScript execution time",
    });
  }

  if (raw.cls > CLS_POOR) {
    suggestions.push({
      type: "critical",
      message: `CLS is ${raw.cls.toFixed(3)} — Poor (target: <0.1)`,
      action: "Set explicit width/height on all images and iframes, reserve space for dynamic content (ads, embeds), and use font-display: swap",
    });
  } else if (raw.cls > CLS_GOOD) {
    suggestions.push({
      type: "warning",
      message: `CLS is ${raw.cls.toFixed(3)} — Needs Improvement (target: <0.1)`,
      action: "Add size attributes to media elements and avoid inserting content above existing content without user interaction",
    });
  }

  if (raw.fcp === null) {
    suggestions.push({
      type: "info",
      message: "FCP not available — paint timing not supported on this page",
      action: "Ensure the page renders visible content and is not blocked by cross-origin restrictions",
    });
  } else if (raw.fcp > FCP_POOR) {
    suggestions.push({
      type: "critical",
      message: `FCP is ${formatMs(raw.fcp)} — Poor (target: <1.8s)`,
      action: "Eliminate render-blocking resources, inline critical CSS, and preconnect to required origins",
    });
  } else if (raw.fcp > FCP_GOOD) {
    suggestions.push({
      type: "warning",
      message: `FCP is ${formatMs(raw.fcp)} — Needs Improvement (target: <1.8s)`,
      action: "Reduce server response time and minimize critical-path CSS",
    });
  }

  if (raw.ttfb === null) {
    suggestions.push({
      type: "info",
      message: "TTFB not available — navigation timing not accessible on this page",
      action: "Ensure the page is loaded via a full navigation (not in an iframe) to capture Time to First Byte",
    });
  } else if (raw.ttfb > TTFB_POOR) {
    suggestions.push({
      type: "critical",
      message: `TTFB is ${formatMs(raw.ttfb)} — Poor (target: <800ms)`,
      action: "Use a CDN, enable HTTP/2 or HTTP/3, optimize server-side processing, and consider edge caching",
    });
  } else if (raw.ttfb > TTFB_GOOD) {
    suggestions.push({
      type: "warning",
      message: `TTFB is ${formatMs(raw.ttfb)} — Needs Improvement (target: <800ms)`,
      action: "Enable caching headers, optimize database queries, and consider a CDN for static assets",
    });
  }

  // Show "all good" when every measurable vital is in the Good range
  const measuredAreGood =
    (raw.lcp === null || components.lcp === 100) &&
    (raw.cls <= CLS_GOOD) &&
    (raw.fcp === null || components.fcp === 100) &&
    (raw.ttfb === null || components.ttfb === 100);
  const hasAtLeastOneMeasured = raw.lcp !== null || raw.fcp !== null || raw.ttfb !== null;
  if (measuredAreGood && hasAtLeastOneMeasured && (raw.inp === null || components.inp === 100)) {
    suggestions.push({
      type: "info",
      message: "All Core Web Vitals are in the Good range 🎉",
      action: "Keep monitoring regularly with PageSpeed Insights and Google Search Console",
    });
  }

  return suggestions;
}

export function calculateCWV(content: ExtractedContent): CWVResult {
  const raw = {
    lcp: content.lcp,
    inp: content.inp,
    cls: content.cls,
    fcp: content.fcp,
    ttfb: content.ttfb,
  };

  const lcpScore = scoreLCP(raw.lcp);
  const inpScore = scoreINP(raw.inp);
  const clsScore = scoreCLS(raw.cls);
  const fcpScore = scoreFCP(raw.fcp);
  const ttfbScore = scoreTTFB(raw.ttfb);

  // Weights: LCP 35%, CLS 25%, INP 25%, FCP 10%, TTFB 5%
  const score = Math.round(
    lcpScore * 0.35 +
    clsScore * 0.25 +
    inpScore * 0.25 +
    fcpScore * 0.10 +
    ttfbScore * 0.05,
  );

  const components: CWVComponents = {
    lcp: lcpScore,
    inp: inpScore,
    cls: clsScore,
    fcp: fcpScore,
    ttfb: ttfbScore,
  };

  const suggestions = generateCWVSuggestions(raw, components);

  return { score, components, suggestions, raw };
}
