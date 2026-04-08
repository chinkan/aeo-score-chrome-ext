export function extractMainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const selectors = ["main", "article", '[role="main"]', "#content", ".content", ".post", ".entry"];
  let container: Element | null = null;

  for (const sel of selectors) {
    container = doc.querySelector(sel);
    if (container) break;
  }

  if (!container) {
    const body = doc.querySelector("body");
    if (body) {
      const removeSelectors = [
        "nav", "footer", "header", "aside", "script", "style",
        ".nav", ".footer", ".header", ".sidebar", ".sidebar-content",
        ".ad", ".ads", ".advertisement", ".cookie", ".popup",
        ".modal", ".newsletter", ".social-share", ".comments",
        '[class*="sidebar"]', '[class*="widget"]', '[class*="ad-"]',
      ];
      for (const sel of removeSelectors) {
        body.querySelectorAll(sel).forEach((el) => el.remove());
      }
      container = body;
    }
  }

  if (!container) return "";

  container.querySelectorAll("script, style, noscript, svg, iframe").forEach((el) => el.remove());

  const text = container.textContent ?? "";
  return text
    .replace(/\s+/g, " ")
    .replace(/[\r\n]+/g, "\n")
    .trim();
}

export function extractSchemaMarkup(html: string): Record<string, unknown>[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const schemas: Record<string, unknown>[] = [];

  doc.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try {
      const data = JSON.parse(el.textContent ?? "{}");
      if (data) schemas.push(data);
    } catch {
      // invalid JSON-LD — skip
    }
  });

  doc.querySelectorAll('[itemscope]').forEach((el) => {
    const itemType = el.getAttribute("itemtype") ?? "";
    const name = el.querySelector('[itemprop="name"]')?.textContent ?? "";
    if (itemType) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": itemType.split("/").pop(),
        name,
      });
    }
  });

  return schemas;
}

export function extractMetaTags(html: string): Record<string, string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const meta: Record<string, string> = {};

  doc.querySelectorAll("meta").forEach((el) => {
    const name = el.getAttribute("name") ?? el.getAttribute("property") ?? "";
    const content = el.getAttribute("content") ?? "";
    if (name && content) {
      meta[name] = content;
    }
  });

  const title = doc.querySelector("title")?.textContent ?? "";
  if (title) meta.title = title;

  const author = doc.querySelector('meta[name="author"]')?.getAttribute("content") ?? "";
  if (author) meta.author = author;

  return meta;
}

export function getLastUpdated(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const dateSelectors = [
    'meta[name="article:modified_time"]',
    'meta[property="article:modified_time"]',
    'meta[name="date.modified"]',
    'meta[property="og:updated_time"]',
    'time[datetime]',
    'meta[name="last-modified"]',
    'time[itemprop="dateModified"]',
    'meta[itemprop="dateModified"]',
  ];

  for (const sel of dateSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const value = el.getAttribute("content") ?? el.getAttribute("datetime") ?? "";
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
  }

  const pubDate = doc.querySelector('meta[name="article:published_time"]')?.getAttribute("content");
  if (pubDate) {
    const date = new Date(pubDate);
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  return null;
}

export function hasFaqSection(html: string, schema: Record<string, unknown>[]): boolean {
  if (schema.some((s) => JSON.stringify(s).includes("FAQPage"))) return true;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const faqPatterns = [
    /faq/i,
    /frequently asked question/i,
    /common question/i,
    /ask.*question/i,
  ];

  const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");
  for (const h of headings) {
    const text = h.textContent ?? "";
    if (faqPatterns.some((p) => p.test(text))) return true;
  }

  const details = doc.querySelectorAll("details");
  if (details.length >= 3) return true;

  return false;
}

export function hasHowtoSchema(schema: Record<string, unknown>[]): boolean {
  return schema.some((s) => JSON.stringify(s).includes("HowTo"));
}
