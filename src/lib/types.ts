/**
 * Shared types for the AEO Score Calculator extension.
 */

export type ScoringCategory = "aeo" | "seo" | "geo" | "llmo" | "cwv";

export interface Suggestion {
  type: "critical" | "warning" | "info";
  message: string;
  action?: string;
}

export interface AEOComponents {
  eeat: number;
  relevance: number;
  structure: number;
  freshness: number;
  tone: number;
  uniqueness: number;
  intent_match: number;
}

export interface SEOComponents {
  technical: number;
  on_page: number;
  link_profile: number;
  image_seo: number;
}

export interface GEOComponents {
  citability: number;
  factual_density: number;
  structured_answers: number;
  authority: number;
}

export interface LLMOComponents {
  crawlability: number;
  completeness: number;
  direct_answers: number;
  clarity: number;
}

export interface CWVComponents {
  lcp: number;
  inp: number;
  cls: number;
  fcp: number;
  ttfb: number;
}

export interface CWVRaw {
  lcp: number | null;
  inp: number | null;
  cls: number;
  fcp: number | null;
  ttfb: number | null;
}

export interface CWVResult {
  score: number;
  components: CWVComponents;
  suggestions: Suggestion[];
  raw: CWVRaw;
}

export interface AEOMeta {
  lastUpdated: string | null;
  hasFaq: boolean;
  hasHowto: boolean;
  hasSchema: boolean;
  schemaTypes: string[];
  wordCount: number;
  headingCount: number;
  listCount: number;
  tableCount: number;
  imageCount: number;
  linkCount: number;
  snippetReady: boolean;
}

export interface AEOResult {
  score: number;
  components: AEOComponents;
  suggestions: Suggestion[];
  meta: AEOMeta;
}

export interface SEOResult {
  score: number;
  components: SEOComponents;
  suggestions: Suggestion[];
}

export interface GEOResult {
  score: number;
  components: GEOComponents;
  suggestions: Suggestion[];
}

export interface LLMOResult {
  score: number;
  components: LLMOComponents;
  suggestions: Suggestion[];
}

export interface AnalysisResult {
  aeo: AEOResult;
  seo: SEOResult;
  geo: GEOResult;
  llmo: LLMOResult;
  cwv: CWVResult;
  overall: number;
}

export interface ExtractedContent {
  mainText: string;
  schemaMarkup: Record<string, unknown>[];
  metaTags: Record<string, string>;
  lastUpdated: string | null;
  hasFaq: boolean;
  hasHowto: boolean;
  wordCount: number;
  headingCount: number;
  listCount: number;
  tableCount: number;
  imageCount: number;
  linkCount: number;
  headingHierarchy: string[];

  // SEO fields
  canonicalUrl: string | null;
  hasRobotsMeta: boolean;
  hasViewport: boolean;
  hasHttps: boolean;
  titleLength: number;
  descriptionLength: number;
  h1Count: number;
  internalLinks: number;
  externalLinks: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;

  // GEO fields
  quotationCount: number;
  statisticCount: number;
  citationCount: number;
  hasComparisonTable: boolean;
  hasStepByStep: boolean;
  answerCapsuleCount: number;

  // LLMO fields
  definitionCount: number;
  comparisonCount: number;
  summaryPresent: boolean;
  semanticHtmlScore: number;
  paragraphCount: number;
  avgParagraphLength: number;
  marketingFluffCount: number;
  boldConceptCount: number;

  // CWV fields
  lcp: number | null;
  inp: number | null;
  cls: number;
  fcp: number | null;
  ttfb: number | null;
}
