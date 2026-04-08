import { clamp } from "./utils";
import type { ExtractedContent } from "./types";

export function calculateEEAT(content: ExtractedContent): number {
  let score = 0;

  if (content.metaTags.author) score += 0.25;

  const hasCitations = /references|sources|bibliography|cited|according to/i.test(content.mainText);
  if (hasCitations) score += 0.2;

  const hasExternalLinks = content.linkCount > 3;
  if (hasExternalLinks) score += 0.15;

  if (content.schemaMarkup.length > 0) score += 0.15;

  const hasAuthorBio = /about the author|written by|by\s+\w+|author bio/i.test(content.mainText);
  if (hasAuthorBio) score += 0.15;

  const wordCountBonus = clamp(content.wordCount / 1500, 0, 0.1);
  score += wordCountBonus;

  return clamp(score, 0, 1);
}

export function calculateRelevance(content: ExtractedContent): number {
  let score = 0;

  const titleRelevant = content.metaTags.title && content.metaTags.title.length > 10;
  if (titleRelevant) score += 0.2;

  const descRelevant = content.metaTags.description && content.metaTags.description.length > 50;
  if (descRelevant) score += 0.2;

  const hasHeadings = content.headingCount > 2;
  if (hasHeadings) score += 0.2;

  const contentDepth = clamp(content.wordCount / 800, 0, 0.2);
  score += contentDepth;

  const hasImages = content.imageCount > 0;
  if (hasImages) score += 0.1;

  return clamp(score, 0, 1);
}

export function calculateStructure(content: ExtractedContent): number {
  let score = 0;

  const hasH1 = content.headingHierarchy.some((h: string) => h.startsWith("H1"));
  if (hasH1) score += 0.15;

  const headingProgression = content.headingCount >= 3;
  if (headingProgression) score += 0.2;

  const hasLists = content.listCount > 0;
  if (hasLists) score += 0.2;

  const hasTables = content.tableCount > 0;
  if (hasTables) score += 0.15;

  const paragraphCount = (content.mainText.match(/\n\s*\n/g) ?? []).length;
  const paragraphBonus = clamp(paragraphCount / 10, 0, 0.15);
  score += paragraphBonus;

  const hasImages = content.imageCount > 0;
  if (hasImages) score += 0.15;

  return clamp(score, 0, 1);
}

export function calculateFreshness(lastUpdated: string | null): number {
  if (!lastUpdated) return 0.1;

  const updated = new Date(lastUpdated);
  if (isNaN(updated.getTime())) return 0.1;

  const now = new Date();
  const daysOld = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

  if (daysOld < 30) return 1.0;
  if (daysOld < 90) return 0.7;
  if (daysOld < 180) return 0.4;
  return 0.1;
}

export function calculateIntentMatch(content: ExtractedContent): number {
  let score = 0;

  const hasDirectAnswer = content.mainText.length < 500 && content.headingCount > 0;
  if (hasDirectAnswer) score += 0.3;

  const hasListAnswer = content.listCount > 0;
  if (hasListAnswer) score += 0.2;

  const hasTableAnswer = content.tableCount > 0;
  if (hasTableAnswer) score += 0.2;

  const hasFaqAnswer = content.hasFaq;
  if (hasFaqAnswer) score += 0.15;

  const conciseContent = content.wordCount > 100 && content.wordCount < 2000;
  if (conciseContent) score += 0.15;

  return clamp(score, 0, 1);
}

export function detectSnippetReady(content: ExtractedContent): boolean {
  const hasShortParagraph = content.mainText
    .split(/\n\s*\n/)
    .some((p: string) => p.trim().length > 40 && p.trim().length < 300);

  const hasList = content.listCount > 0;
  const hasTable = content.tableCount > 0;
  const hasFaq = content.hasFaq;

  return hasShortParagraph || hasList || hasTable || hasFaq;
}
