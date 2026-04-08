import { describe, it, expect } from "vitest";
import { generateExportMarkdown, getExportFilename } from "../src/lib/export-markdown";
import type { AnalysisResult } from "../src/lib/types";

function makeMockResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  return {
    overall: 72,
    aeo: {
      score: 68,
      components: {
        eeat: 65,
        relevance: 72,
        structure: 70,
        freshness: 60,
        tone: 55,
        uniqueness: 48,
        intent_match: 75,
      },
      suggestions: [
        { type: "critical", message: "Missing author bio", action: "Add author credentials to build EEAT" },
        { type: "warning", message: "No FAQ section detected" },
        { type: "info", message: "Consider adding more internal links" },
      ],
      meta: {
        lastUpdated: "2026-03-15T10:00:00Z",
        hasFaq: false,
        hasHowto: false,
        hasSchema: true,
        schemaTypes: ["Article", "FAQPage"],
        wordCount: 1245,
        headingCount: 8,
        listCount: 3,
        tableCount: 1,
        imageCount: 5,
        linkCount: 12,
        snippetReady: true,
      },
    },
    seo: {
      score: 75,
      components: { technical: 80, on_page: 72, link_profile: 68, image_seo: 78 },
      suggestions: [
        { type: "warning", message: "Title tag too short", action: "Extend to 50-60 characters" },
      ],
    },
    geo: {
      score: 62,
      components: { citability: 58, factual_density: 65, structured_answers: 60, authority: 64 },
      suggestions: [
        { type: "critical", message: "No citations or references found", action: "Add external data sources" },
      ],
    },
    llmo: {
      score: 80,
      components: { crawlability: 85, completeness: 78, direct_answers: 82, clarity: 76 },
      suggestions: [
        { type: "info", message: "Add a summary paragraph at the top" },
      ],
    },
    cwv: {
      score: 85,
      components: { lcp: 90, inp: 100, cls: 95, fcp: 88, ttfb: 92 },
      suggestions: [],
      raw: { lcp: 1800, inp: null, cls: 0.02, fcp: 1200, ttfb: 400 },
    },
    ...overrides,
  };
}

const TEST_URL = "https://example.com/test-page";
const TEST_TIMESTAMP = "2026-04-02T14:30:00Z";

describe("generateExportMarkdown", () => {
  it("contains all required sections with correct scores", () => {
    const md = generateExportMarkdown(makeMockResult(), TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("# Website Optimization Report");
    expect(md).toContain("## Page Details");
    expect(md).toContain(`**URL**: ${TEST_URL}`);
    expect(md).toContain(`**Analyzed**: ${TEST_TIMESTAMP}`);
    expect(md).toContain("**Overall Score**: 72/100");
    expect(md).toContain("## Score Summary");
    expect(md).toContain("| AEO | 68/100 |");
    expect(md).toContain("| SEO | 75/100 |");
    expect(md).toContain("| GEO | 62/100 |");
    expect(md).toContain("| LLMO | 80/100 |");
    expect(md).toContain("## AEO Breakdown");
    expect(md).toContain("## SEO Breakdown");
    expect(md).toContain("## GEO Breakdown");
    expect(md).toContain("## LLMO Breakdown");
    expect(md).toContain("## Page Metadata");
    expect(md).toContain("## Issues & Suggestions");
    expect(md).toContain("AEO Score Calculator");
  });

  it("renders empty suggestion groups with fallback text", () => {
    const result = makeMockResult();
    result.aeo.suggestions = [];
    result.seo.suggestions = [];
    result.geo.suggestions = [];
    result.llmo.suggestions = [];
    result.cwv.suggestions = [];

    const md = generateExportMarkdown(result, TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("No critical issues found.");
    expect(md).toContain("No warning issues found.");
    expect(md).toContain("No informational issues found.");
  });

  it("maps score ratings correctly", () => {
    const excellent = makeMockResult({ overall: 95 });
    excellent.aeo.score = 95;
    const mdExcellent = generateExportMarkdown(excellent, TEST_URL, TEST_TIMESTAMP);
    expect(mdExcellent).toContain("Excellent");

    const good = makeMockResult({ overall: 70 });
    const mdGood = generateExportMarkdown(good, TEST_URL, TEST_TIMESTAMP);
    expect(mdGood).toContain("Good");

    const needsWork = makeMockResult({ overall: 50 });
    const mdNeedsWork = generateExportMarkdown(needsWork, TEST_URL, TEST_TIMESTAMP);
    expect(mdNeedsWork).toContain("Needs Work");

    const poor = makeMockResult({ overall: 20 });
    const mdPoor = generateExportMarkdown(poor, TEST_URL, TEST_TIMESTAMP);
    expect(mdPoor).toContain("Poor");
  });

  it("handles URLs with query parameters without breaking markdown", () => {
    const urlWithParams = "https://example.com/page?q=test&lang=en&sort=date";
    const md = generateExportMarkdown(makeMockResult(), urlWithParams, TEST_TIMESTAMP);

    expect(md).toContain(urlWithParams);
    expect(md).toContain("## Page Details");
    expect(md).toContain("## Score Summary");
  });

  it("renders 'Not detected' for null lastUpdated", () => {
    const result = makeMockResult();
    result.aeo.meta.lastUpdated = null;

    const md = generateExportMarkdown(result, TEST_URL, TEST_TIMESTAMP);
    expect(md).toContain("**Last Updated**: Not detected");
  });

  it("deduplicates suggestions with same message across categories", () => {
    const result = makeMockResult();
    const sharedSuggestion = { type: "critical" as const, message: "Duplicate issue found" };
    result.aeo.suggestions = [sharedSuggestion];
    result.seo.suggestions = [sharedSuggestion];
    result.geo.suggestions = [sharedSuggestion];
    result.llmo.suggestions = [];
    result.cwv.suggestions = [];

    const md = generateExportMarkdown(result, TEST_URL, TEST_TIMESTAMP);
    const matches = md.match(/Duplicate issue found/g);
    expect(matches).toHaveLength(1);
  });

  it("rounds fractional component scores", () => {
    const result = makeMockResult();
    result.aeo.components.eeat = 67.8;
    result.aeo.components.relevance = 72.3;

    const md = generateExportMarkdown(result, TEST_URL, TEST_TIMESTAMP);
    expect(md).toContain("| EEAT | 68/100 |");
    expect(md).toContain("| Relevance | 72/100 |");
  });

  it("includes AI instruction preamble for LLM consumption", () => {
    const md = generateExportMarkdown(makeMockResult(), TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("**For AI assistants**");
    expect(md).toContain("actionable changes");
    expect(md).toContain("Prioritize critical issues first");
  });

  it("renders page metadata correctly", () => {
    const md = generateExportMarkdown(makeMockResult(), TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("**Word Count**: 1245");
    expect(md).toContain("**Headings**: 8");
    expect(md).toContain("**Lists**: 3");
    expect(md).toContain("**Tables**: 1");
    expect(md).toContain("**Images**: 5");
    expect(md).toContain("**Links**: 12");
    expect(md).toContain("Article, FAQPage");
    expect(md).toContain("**Snippet Ready**:");
    expect(md).toContain("**Last Updated**: 2026-03-15T10:00:00Z");
  });

  it("renders suggestions with actions using em dash separator", () => {
    const md = generateExportMarkdown(makeMockResult(), TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("**Missing author bio** \u2014 Add author credentials to build EEAT");
    expect(md).toContain("**No FAQ section detected**");
  });

  it("escapes HTML tags in suggestion text so they render in markdown", () => {
    const result = makeMockResult();
    result.aeo.suggestions = [
      { type: "warning", message: "Low semantic HTML usage", action: "Use <article>, <section>, <nav>, <main> tags for better LLM chunking" },
      { type: "critical", message: "Page has no <title> tag", action: "Add a descriptive <title> tag (50-60 characters)" },
    ];
    result.seo.suggestions = [];
    result.geo.suggestions = [];
    result.llmo.suggestions = [];
    result.cwv.suggestions = [];

    const md = generateExportMarkdown(result, TEST_URL, TEST_TIMESTAMP);

    expect(md).toContain("`<article>`");
    expect(md).toContain("`<section>`");
    expect(md).toContain("`<title>`");
    expect(md).not.toMatch(/(?<!`)<article>(?!`)/);
    expect(md).not.toMatch(/(?<!`)<title>(?!`)/);
  });
});

describe("getExportFilename", () => {
  it("generates filename from URL and timestamp", () => {
    const filename = getExportFilename("https://example.com", "2026-04-02T14:30:00Z");
    expect(filename).toBe("aeo-report-example-com-20260402-143000.md");
  });

  it("sanitizes special characters in hostname", () => {
    const filename = getExportFilename("https://my.site.co.uk/page", "2026-04-02T14:30:00Z");
    expect(filename).toMatch(/^aeo-report-my-site-co-uk-\d{8}-\d{6}\.md$/);
  });

  it("handles invalid URL gracefully", () => {
    const filename = getExportFilename("not-a-url", "2026-04-02T14:30:00Z");
    expect(filename).toContain("unknown");
    expect(filename).toMatch(/\.md$/);
  });

  it("handles invalid timestamp gracefully", () => {
    const filename = getExportFilename("https://example.com", "bad-timestamp");
    expect(filename).toContain("example-com");
    expect(filename).toContain("00000000-000000");
    expect(filename).toMatch(/\.md$/);
  });
});
