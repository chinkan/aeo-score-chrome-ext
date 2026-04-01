import { describe, it, expect } from "vitest";
import { clamp, average } from "../src/lib/utils";
import { calculateFreshness, detectSnippetReady } from "../src/lib/aeo-scoring";
import type { ExtractedContent } from "../src/lib/types";

describe("clamp", () => {
  it("clamps value within range", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
  });
});

describe("average", () => {
  it("calculates average of numbers", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([])).toBe(0);
    expect(average([5])).toBe(5);
  });
});

describe("calculateFreshness", () => {
  it("returns 1.0 for content less than 30 days old", () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 10);
    expect(calculateFreshness(recent.toISOString())).toBe(1.0);
  });

  it("returns 0.7 for content 30-90 days old", () => {
    const medium = new Date();
    medium.setDate(medium.getDate() - 60);
    expect(calculateFreshness(medium.toISOString())).toBe(0.7);
  });

  it("returns 0.4 for content 90-180 days old", () => {
    const old = new Date();
    old.setDate(old.getDate() - 120);
    expect(calculateFreshness(old.toISOString())).toBe(0.4);
  });

  it("returns 0.1 for content older than 180 days", () => {
    const veryOld = new Date();
    veryOld.setDate(veryOld.getDate() - 200);
    expect(calculateFreshness(veryOld.toISOString())).toBe(0.1);
  });

  it("returns 0.1 for null date", () => {
    expect(calculateFreshness(null)).toBe(0.1);
  });
});

describe("detectSnippetReady", () => {
  const baseContent: ExtractedContent = {
    mainText: "This is a test paragraph with some content that is long enough to be considered a snippet candidate for search engines.",
    schemaMarkup: [],
    metaTags: {},
    lastUpdated: null,
    hasFaq: false,
    hasHowto: false,
    wordCount: 100,
    headingCount: 3,
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
    internalLinks: 3,
    externalLinks: 2,
    imagesWithAlt: 0,
    imagesWithoutAlt: 0,
    quotationCount: 0,
    statisticCount: 0,
    citationCount: 0,
    hasComparisonTable: false,
    hasStepByStep: false,
    answerCapsuleCount: 1,
    definitionCount: 0,
    comparisonCount: 0,
    summaryPresent: false,
    semanticHtmlScore: 0.5,
    paragraphCount: 3,
    avgParagraphLength: 30,
    marketingFluffCount: 0,
    boldConceptCount: 0,
  };

  it("returns true for content with short paragraph", () => {
    expect(detectSnippetReady(baseContent)).toBe(true);
  });

  it("returns true when FAQ is present", () => {
    const content = { ...baseContent, hasFaq: true, mainText: "short" };
    expect(detectSnippetReady(content)).toBe(true);
  });

  it("returns true when lists exist", () => {
    const content = { ...baseContent, listCount: 2, mainText: "short" };
    expect(detectSnippetReady(content)).toBe(true);
  });

  it("returns true when tables exist", () => {
    const content = { ...baseContent, tableCount: 1, mainText: "short" };
    expect(detectSnippetReady(content)).toBe(true);
  });
});

describe("extractMainText logic", () => {
  it("strips script and style tags", () => {
    const html = `<html><body><main>Hello<script>alert('xss')</script> World</main></body></html>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const main = doc.querySelector("main");
    main?.querySelectorAll("script").forEach((el) => el.remove());
    expect(main?.textContent?.trim()).toBe("Hello World");
  });
});
