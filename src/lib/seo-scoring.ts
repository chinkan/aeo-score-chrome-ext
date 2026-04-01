import type { ExtractedContent, SEOComponents, Suggestion } from "./types";

export function calculateTechnicalSEO(content: ExtractedContent): number {
  let score = 0;
  if (content.canonicalUrl) score += 0.2;
  if (content.hasRobotsMeta) score += 0.1;
  if (content.hasViewport) score += 0.2;
  if (content.hasHttps) score += 0.15;
  if (content.semanticHtmlScore > 0.5) score += 0.15;
  if (content.h1Count === 1) score += 0.2;
  return Math.min(score, 1);
}

export function calculateOnPageSEO(content: ExtractedContent): number {
  let score = 0;
  if (content.titleLength >= 30 && content.titleLength <= 60) score += 0.25;
  else if (content.titleLength > 0) score += 0.1;
  if (content.descriptionLength >= 120 && content.descriptionLength <= 160) score += 0.25;
  else if (content.descriptionLength > 50) score += 0.1;
  if (content.headingCount >= 3) score += 0.15;
  if (content.wordCount >= 300) score += 0.15;
  if (content.wordCount >= 1000) score += 0.1;
  if (content.headingHierarchy.length > 0 && content.headingHierarchy[0]?.startsWith("H1")) score += 0.1;
  return Math.min(score, 1);
}

export function calculateLinkProfile(content: ExtractedContent): number {
  let score = 0;
  const totalLinks = content.internalLinks + content.externalLinks;
  if (content.internalLinks >= 3) score += 0.3;
  else if (content.internalLinks > 0) score += 0.15;
  if (content.externalLinks >= 2) score += 0.3;
  else if (content.externalLinks > 0) score += 0.15;
  if (totalLinks >= 5) score += 0.2;
  else if (totalLinks > 0) score += 0.1;
  if (content.externalLinks > 0 && content.internalLinks > 0) score += 0.2;
  return Math.min(score, 1);
}

export function calculateImageSEO(content: ExtractedContent): number {
  let score = 0;
  const totalImages = content.imagesWithAlt + content.imagesWithoutAlt;
  if (totalImages === 0) return 0.3;
  const altRatio = content.imagesWithAlt / totalImages;
  score += altRatio * 0.6;
  if (content.imageCount > 0) score += 0.2;
  if (content.imageCount >= 3) score += 0.2;
  return Math.min(score, 1);
}

export function calculateSEO(content: ExtractedContent): { score: number; components: SEOComponents; suggestions: Suggestion[] } {
  const technical = calculateTechnicalSEO(content);
  const onPage = calculateOnPageSEO(content);
  const linkProfile = calculateLinkProfile(content);
  const imageSEO = calculateImageSEO(content);

  const score = technical * 0.3 + onPage * 0.35 + linkProfile * 0.2 + imageSEO * 0.15;
  const roundedScore = Math.round(score * 100);

  const components: SEOComponents = {
    technical: Math.round(technical * 100),
    on_page: Math.round(onPage * 100),
    link_profile: Math.round(linkProfile * 100),
    image_seo: Math.round(imageSEO * 100),
  };

  const suggestions: Suggestion[] = [];
  if (!content.canonicalUrl) suggestions.push({ type: "warning", message: "No canonical URL detected", action: "Add <link rel=\"canonical\"> to prevent duplicate content issues" });
  if (!content.hasViewport) suggestions.push({ type: "critical", message: "Missing viewport meta tag", action: "Add <meta name=\"viewport\"> for mobile-friendliness" });
  if (content.titleLength === 0) suggestions.push({ type: "critical", message: "Page has no title tag", action: "Add a descriptive <title> tag (50-60 characters)" });
  else if (content.titleLength > 60) suggestions.push({ type: "warning", message: "Title tag is too long", action: "Shorten title to 50-60 characters to avoid truncation in search results" });
  if (content.descriptionLength === 0) suggestions.push({ type: "critical", message: "Missing meta description", action: "Add a compelling meta description (150-160 characters)" });
  else if (content.descriptionLength < 120) suggestions.push({ type: "warning", message: "Meta description is too short", action: "Expand to 120-160 characters for better click-through rates" });
  if (content.h1Count === 0) suggestions.push({ type: "warning", message: "No H1 heading found", action: "Add exactly one H1 tag with your primary topic" });
  else if (content.h1Count > 1) suggestions.push({ type: "info", message: "Multiple H1 headings detected", action: "Use only one H1 per page for best SEO practice" });
  if (content.imagesWithoutAlt > 0) suggestions.push({ type: "warning", message: `${content.imagesWithoutAlt} image(s) missing alt text`, action: "Add descriptive alt attributes to all images" });
  if (content.externalLinks === 0) suggestions.push({ type: "info", message: "No outbound links to authoritative sources", action: "Link to relevant, authoritative external sources" });

  return { score: roundedScore, components, suggestions };
}
