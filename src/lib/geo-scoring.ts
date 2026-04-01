import type { ExtractedContent, GEOComponents, Suggestion } from "./types";

export function calculateCitability(content: ExtractedContent): number {
  let score = 0;
  if (content.quotationCount >= 2) score += 0.3;
  else if (content.quotationCount > 0) score += 0.15;
  if (content.statisticCount >= 5) score += 0.3;
  else if (content.statisticCount >= 2) score += 0.2;
  else if (content.statisticCount > 0) score += 0.1;
  if (content.citationCount >= 3) score += 0.25;
  else if (content.citationCount > 0) score += 0.1;
  if (content.externalLinks >= 3) score += 0.15;
  return Math.min(score, 1);
}

export function calculateFactualDensity(content: ExtractedContent): number {
  let score = 0;
  const statsPer1000 = content.wordCount > 0 ? (content.statisticCount / content.wordCount) * 1000 : 0;
  if (statsPer1000 >= 3) score += 0.35;
  else if (statsPer1000 >= 1.5) score += 0.2;
  else if (statsPer1000 > 0) score += 0.1;
  if (content.citationCount >= 2) score += 0.25;
  else if (content.citationCount > 0) score += 0.1;
  if (content.quotationCount >= 1) score += 0.2;
  if (content.wordCount >= 1000) score += 0.2;
  return Math.min(score, 1);
}

export function calculateStructuredAnswers(content: ExtractedContent): number {
  let score = 0;
  if (content.hasFaq) score += 0.2;
  if (content.hasComparisonTable) score += 0.2;
  if (content.hasStepByStep) score += 0.2;
  if (content.answerCapsuleCount >= 3) score += 0.2;
  else if (content.answerCapsuleCount > 0) score += 0.1;
  if (content.hasHowto) score += 0.2;
  return Math.min(score, 1);
}

export function calculateAuthority(content: ExtractedContent): number {
  let score = 0;
  if (content.metaTags.author) score += 0.2;
  if (content.schemaMarkup.length > 0) score += 0.25;
  if (content.schemaMarkup.length >= 2) score += 0.1;
  if (content.lastUpdated) score += 0.15;
  if (content.externalLinks >= 2) score += 0.15;
  if (content.wordCount >= 1500) score += 0.15;
  return Math.min(score, 1);
}

export function calculateGEO(content: ExtractedContent): { score: number; components: GEOComponents; suggestions: Suggestion[] } {
  const citability = calculateCitability(content);
  const factualDensity = calculateFactualDensity(content);
  const structuredAnswers = calculateStructuredAnswers(content);
  const authority = calculateAuthority(content);

  const score = citability * 0.3 + factualDensity * 0.25 + structuredAnswers * 0.25 + authority * 0.2;
  const roundedScore = Math.round(score * 100);

  const components: GEOComponents = {
    citability: Math.round(citability * 100),
    factual_density: Math.round(factualDensity * 100),
    structured_answers: Math.round(structuredAnswers * 100),
    authority: Math.round(authority * 100),
  };

  const suggestions: Suggestion[] = [];
  if (content.quotationCount === 0) suggestions.push({ type: "warning", message: "No expert quotations found", action: "Add 2+ attributed expert quotes to boost AI visibility (+42.8% per research)" });
  if (content.statisticCount < 3) suggestions.push({ type: "warning", message: "Low statistics density", action: "Include 5+ sourced statistics per 2,000 words with (Organization, Year) attribution" });
  if (content.citationCount === 0) suggestions.push({ type: "info", message: "No inline citations detected", action: "Add inline citations like (Source, Year) after data points" });
  if (!content.hasFaq) suggestions.push({ type: "warning", message: "No FAQ section", action: "Add FAQ with FAQPage schema — 2x more citations in AI answers" });
  if (!content.hasComparisonTable) suggestions.push({ type: "info", message: "No comparison tables", action: "Add structured comparison tables for feature/benefit analysis" });
  if (!content.hasStepByStep) suggestions.push({ type: "info", message: "No step-by-step guides", action: "Add numbered instructional lists with action verbs" });
  if (content.answerCapsuleCount < 2) suggestions.push({ type: "warning", message: "Few answer capsules", action: "Structure 40-60 word direct answers after each H2 heading" });

  return { score: roundedScore, components, suggestions };
}
