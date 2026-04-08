import { describe, it, expect } from "vitest";
import { scoreLCP, scoreINP, scoreCLS, scoreFCP, scoreTTFB, calculateCWV } from "../src/lib/cwv-scoring";
import type { ExtractedContent } from "../src/lib/types";

const baseContent: ExtractedContent = {
  mainText: "Test content",
  schemaMarkup: [],
  metaTags: {},
  lastUpdated: null,
  hasFaq: false,
  hasHowto: false,
  wordCount: 100,
  headingCount: 2,
  listCount: 0,
  tableCount: 0,
  imageCount: 0,
  linkCount: 0,
  headingHierarchy: [],
  canonicalUrl: null,
  hasRobotsMeta: false,
  hasViewport: true,
  hasHttps: true,
  titleLength: 30,
  descriptionLength: 100,
  h1Count: 1,
  internalLinks: 2,
  externalLinks: 1,
  imagesWithAlt: 0,
  imagesWithoutAlt: 0,
  quotationCount: 0,
  statisticCount: 0,
  citationCount: 0,
  hasComparisonTable: false,
  hasStepByStep: false,
  answerCapsuleCount: 0,
  definitionCount: 0,
  comparisonCount: 0,
  summaryPresent: false,
  semanticHtmlScore: 0.5,
  paragraphCount: 2,
  avgParagraphLength: 20,
  marketingFluffCount: 0,
  boldConceptCount: 0,
  lcp: null,
  inp: null,
  cls: 0,
  fcp: null,
  ttfb: null,
};

describe("scoreLCP", () => {
  it("returns 100 for LCP at or below 2500ms", () => {
    expect(scoreLCP(1000)).toBe(100);
    expect(scoreLCP(2500)).toBe(100);
  });

  it("returns 50 for null (not measured)", () => {
    expect(scoreLCP(null)).toBe(50);
  });

  it("returns between 50 and 99 for LCP in needs-improvement range", () => {
    const score = scoreLCP(3000);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });

  it("returns below 50 for LCP above 4000ms", () => {
    const score = scoreLCP(5000);
    expect(score).toBeLessThan(50);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("scoreINP", () => {
  it("returns 100 for INP at or below 200ms", () => {
    expect(scoreINP(100)).toBe(100);
    expect(scoreINP(200)).toBe(100);
  });

  it("returns 100 for null (no interactions)", () => {
    expect(scoreINP(null)).toBe(100);
  });

  it("returns between 50 and 99 for INP in needs-improvement range", () => {
    const score = scoreINP(350);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });

  it("returns below 50 for INP above 500ms", () => {
    const score = scoreINP(800);
    expect(score).toBeLessThan(50);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("scoreCLS", () => {
  it("returns 100 for CLS at or below 0.1", () => {
    expect(scoreCLS(0)).toBe(100);
    expect(scoreCLS(0.1)).toBe(100);
  });

  it("returns between 50 and 99 for CLS in needs-improvement range", () => {
    const score = scoreCLS(0.18);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });

  it("returns below 50 for CLS above 0.25", () => {
    const score = scoreCLS(0.5);
    expect(score).toBeLessThan(50);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("scoreFCP", () => {
  it("returns 100 for FCP at or below 1800ms", () => {
    expect(scoreFCP(800)).toBe(100);
    expect(scoreFCP(1800)).toBe(100);
  });

  it("returns 50 for null (not measured)", () => {
    expect(scoreFCP(null)).toBe(50);
  });

  it("returns between 50 and 99 for FCP in needs-improvement range", () => {
    const score = scoreFCP(2400);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });
});

describe("scoreTTFB", () => {
  it("returns 100 for TTFB at or below 800ms", () => {
    expect(scoreTTFB(200)).toBe(100);
    expect(scoreTTFB(800)).toBe(100);
  });

  it("returns 50 for null (not measured)", () => {
    expect(scoreTTFB(null)).toBe(50);
  });

  it("returns between 50 and 99 for TTFB in needs-improvement range", () => {
    const score = scoreTTFB(1200);
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThan(100);
  });
});

describe("calculateCWV", () => {
  it("returns a valid CWVResult structure", () => {
    const result = calculateCWV(baseContent);
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("components");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("raw");
    expect(result.components).toHaveProperty("lcp");
    expect(result.components).toHaveProperty("inp");
    expect(result.components).toHaveProperty("cls");
    expect(result.components).toHaveProperty("fcp");
    expect(result.components).toHaveProperty("ttfb");
  });

  it("returns good score when all metrics are in the Good range", () => {
    const goodContent: ExtractedContent = {
      ...baseContent,
      lcp: 1500,
      inp: 100,
      cls: 0.05,
      fcp: 1000,
      ttfb: 300,
    };
    const result = calculateCWV(goodContent);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.components.lcp).toBe(100);
    expect(result.components.inp).toBe(100);
    expect(result.components.cls).toBe(100);
    expect(result.components.fcp).toBe(100);
    expect(result.components.ttfb).toBe(100);
  });

  it("generates critical suggestion for poor LCP", () => {
    const poorContent: ExtractedContent = { ...baseContent, lcp: 5000 };
    const result = calculateCWV(poorContent);
    const criticalSuggestions = result.suggestions.filter((s) => s.type === "critical");
    expect(criticalSuggestions.some((s) => s.message.includes("LCP"))).toBe(true);
  });

  it("generates critical suggestion for poor CLS", () => {
    const poorContent: ExtractedContent = { ...baseContent, cls: 0.5 };
    const result = calculateCWV(poorContent);
    const criticalSuggestions = result.suggestions.filter((s) => s.type === "critical");
    expect(criticalSuggestions.some((s) => s.message.includes("CLS"))).toBe(true);
  });

  it("generates warning suggestion for needs-improvement INP", () => {
    const needsImprovementContent: ExtractedContent = { ...baseContent, inp: 300 };
    const result = calculateCWV(needsImprovementContent);
    const warningSuggestions = result.suggestions.filter((s) => s.type === "warning");
    expect(warningSuggestions.some((s) => s.message.includes("INP"))).toBe(true);
  });

  it("generates info suggestion when all CWV metrics not measurable", () => {
    const result = calculateCWV(baseContent);
    const infoSuggestions = result.suggestions.filter((s) => s.type === "info");
    expect(infoSuggestions.some((s) => s.message.includes("LCP not available"))).toBe(true);
    expect(infoSuggestions.some((s) => s.message.includes("INP not measured"))).toBe(true);
    expect(infoSuggestions.some((s) => s.message.includes("FCP not available"))).toBe(true);
    expect(infoSuggestions.some((s) => s.message.includes("TTFB not available"))).toBe(true);
  });

  it("preserves raw metrics in result", () => {
    const content: ExtractedContent = {
      ...baseContent,
      lcp: 2000,
      inp: 150,
      cls: 0.08,
      fcp: 1200,
      ttfb: 400,
    };
    const result = calculateCWV(content);
    expect(result.raw.lcp).toBe(2000);
    expect(result.raw.inp).toBe(150);
    expect(result.raw.cls).toBe(0.08);
    expect(result.raw.fcp).toBe(1200);
    expect(result.raw.ttfb).toBe(400);
  });
});
