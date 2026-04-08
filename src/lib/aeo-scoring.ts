import { clamp } from "./utils";
import type { ExtractedContent } from "./types";

export function calculateEEAT(content: ExtractedContent): number {
  // --- Experience (25%) ---
  let experienceScore = 0;
  if (content.firstPersonExperience >= 2) experienceScore += 0.35;
  else if (content.firstPersonExperience >= 1) experienceScore += 0.2;
  if (content.specificCitationCount >= 3) experienceScore += 0.25;
  else if (content.specificCitationCount >= 1) experienceScore += 0.1;
  if (content.quotationCount > 0) experienceScore += 0.15;
  if (content.statisticCount >= 5) experienceScore += 0.15;
  else if (content.statisticCount >= 2) experienceScore += 0.1;
  if (content.hasStepByStep) experienceScore += 0.1;

  // --- Expertise (25%) ---
  let expertiseScore = 0;
  if (content.metaTags.author) expertiseScore += 0.2;
  if (content.hasAuthorPage) expertiseScore += 0.15;
  if (content.personSchemaPresent) expertiseScore += 0.15;
  const hasAuthorBio = /about the author|written by|by\s+\w+|author bio/i.test(content.mainText);
  if (hasAuthorBio) expertiseScore += 0.15;
  if (content.definitionLanguageCount >= 3) expertiseScore += 0.1;
  const hasCitations = /references|sources|bibliography|cited|according to/i.test(content.mainText);
  if (hasCitations) expertiseScore += 0.1;
  const wordCountBonus = clamp(content.wordCount / 1500, 0, 0.15);
  expertiseScore += wordCountBonus;

  // --- Authoritativeness (25%) ---
  let authorityScore = 0;
  if (content.eduGovLinks >= 2) authorityScore += 0.25;
  else if (content.eduGovLinks >= 1) authorityScore += 0.15;
  if (content.highQualityExternalLinks >= 3) authorityScore += 0.2;
  else if (content.highQualityExternalLinks >= 1) authorityScore += 0.1;
  if (content.externalLinks >= 3) authorityScore += 0.15;
  if (content.organizationSchemaPresent) authorityScore += 0.15;
  if (content.articleSchemaPresent) authorityScore += 0.1;
  if (content.entityNameCount >= 5) authorityScore += 0.1;
  else if (content.entityNameCount >= 2) authorityScore += 0.05;

  // --- Trustworthiness (25%) ---
  let trustScore = 0;
  if (content.hasContactInfo) trustScore += 0.15;
  if (content.hasAboutPage) trustScore += 0.1;
  if (content.hasLastUpdatedVisible) trustScore += 0.15;
  if (content.hasPrivacyPolicy) trustScore += 0.1;
  if (content.hasEditorialPolicy) trustScore += 0.1;
  if (content.schemaMarkup.length > 0) trustScore += 0.1;
  if (content.hasHttps) trustScore += 0.05;
  if (content.hasAIDisclosure) trustScore += 0.05;
  if (content.hasViewport) trustScore += 0.05;
  if (content.canonicalUrl) trustScore += 0.1;
  if (content.semanticHtmlScore >= 0.5) trustScore += 0.05;

  const score = experienceScore * 0.25 + expertiseScore * 0.25 + authorityScore * 0.25 + trustScore * 0.25;
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
