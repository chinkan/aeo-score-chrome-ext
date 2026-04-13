import { describe, it, expect } from "vitest";

import { toneFromSentimentLabel } from "../src/lib/llm/tone-mapping";

describe("toneFromSentimentLabel", () => {
  it("maps 1 star to 0", () => {
    expect(toneFromSentimentLabel("1 star")).toBe(0);
  });

  it("maps 5 stars to 1", () => {
    expect(toneFromSentimentLabel("5 stars")).toBe(1);
  });

  it("maps 3 stars to 0.5", () => {
    expect(toneFromSentimentLabel("3 stars")).toBe(0.5);
  });

  it("returns neutral for unknown labels", () => {
    expect(toneFromSentimentLabel("POSITIVE")).toBe(0.5);
  });
});
