import type { ExtractedContent, LLMOComponents, Suggestion } from "./types";

export function calculateCrawlability(content: ExtractedContent): number {
  let score = 0;
  if (content.semanticHtmlScore >= 0.5) score += 0.3;
  else if (content.semanticHtmlScore > 0) score += 0.15;
  if (content.marketingFluffCount === 0) score += 0.25;
  else if (content.marketingFluffCount < 5) score += 0.15;
  if (content.avgParagraphLength >= 20 && content.avgParagraphLength <= 50) score += 0.25;
  else if (content.avgParagraphLength > 0) score += 0.1;
  if (content.mainText.length > 0) score += 0.2;
  return Math.min(score, 1);
}

export function calculateCompleteness(content: ExtractedContent): number {
  let score = 0;
  if (content.wordCount >= 1000) score += 0.25;
  else if (content.wordCount >= 500) score += 0.15;
  else if (content.wordCount >= 300) score += 0.1;
  if (content.headingCount >= 5) score += 0.2;
  else if (content.headingCount >= 3) score += 0.1;
  if (content.paragraphCount >= 5) score += 0.2;
  else if (content.paragraphCount > 0) score += 0.1;
  if (content.listCount > 0) score += 0.15;
  if (content.tableCount > 0) score += 0.2;
  return Math.min(score, 1);
}

export function calculateDirectAnswers(content: ExtractedContent): number {
  let score = 0;
  if (content.definitionCount >= 2) score += 0.25;
  else if (content.definitionCount > 0) score += 0.1;
  if (content.comparisonCount >= 3) score += 0.2;
  else if (content.comparisonCount > 0) score += 0.1;
  if (content.hasStepByStep) score += 0.2;
  if (content.hasComparisonTable) score += 0.15;
  if (content.hasFaq) score += 0.2;
  return Math.min(score, 1);
}

export function calculateClarity(content: ExtractedContent): number {
  let score = 0;
  if (content.summaryPresent) score += 0.2;
  if (content.boldConceptCount >= 3) score += 0.2;
  else if (content.boldConceptCount > 0) score += 0.1;
  if (content.headingHierarchy.length >= 3) score += 0.2;
  else if (content.headingHierarchy.length > 0) score += 0.1;
  if (content.marketingFluffCount === 0) score += 0.2;
  else if (content.marketingFluffCount < 3) score += 0.1;
  if (content.avgParagraphLength <= 50) score += 0.2;
  return Math.min(score, 1);
}

export function calculateLLMO(content: ExtractedContent): { score: number; components: LLMOComponents; suggestions: Suggestion[] } {
  const crawlability = calculateCrawlability(content);
  const completeness = calculateCompleteness(content);
  const directAnswers = calculateDirectAnswers(content);
  const clarity = calculateClarity(content);

  const score = crawlability * 0.2 + completeness * 0.3 + directAnswers * 0.3 + clarity * 0.2;
  const roundedScore = Math.round(score * 100);

  const components: LLMOComponents = {
    crawlability: Math.round(crawlability * 100),
    completeness: Math.round(completeness * 100),
    direct_answers: Math.round(directAnswers * 100),
    clarity: Math.round(clarity * 100),
  };

  const suggestions: Suggestion[] = [];
  if (content.semanticHtmlScore < 0.5) suggestions.push({ type: "warning", message: "Low semantic HTML usage", action: "Use <article>, <section>, <nav>, <main> tags for better LLM chunking" });
  if (content.definitionCount === 0) suggestions.push({ type: "warning", message: "No definition patterns detected", action: "Add clear '[Term] is [definition]' patterns for entity extraction" });
  if (content.comparisonCount < 2) suggestions.push({ type: "info", message: "Few comparison signals", action: "Add 'vs.', 'compared to', 'in contrast' patterns for LLM retrieval" });
  if (!content.summaryPresent) suggestions.push({ type: "info", message: "No summary or TL;DR section", action: "Add a summary section for quick LLM context extraction" });
  if (content.boldConceptCount < 3) suggestions.push({ type: "info", message: "Few bolded key concepts", action: "Use <strong> tags to highlight important terms and concepts" });
  if (content.marketingFluffCount > 5) suggestions.push({ type: "warning", message: "High marketing language density", action: "Replace marketing superlatives with declarative, factual language" });
  if (content.avgParagraphLength > 80) suggestions.push({ type: "info", message: "Paragraphs are too long", action: "Keep paragraphs to 2-3 sentences for better LLM chunking" });

  return { score: roundedScore, components, suggestions };
}
