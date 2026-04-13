# Chrome Web Store Submission — AEO Score Calculator

## Basic Info

| Field | Value |
|-------|-------|
| **App Name** | AEO Score Calculator |
| **Version** | `1.0.0` |
| **Description (short, 132 chars max)** | Score any webpage for SEO, GEO, LLMO & AEO — 100% local, privacy-first, powered by Transformers.js |
| **Category** | Developer Tools *(or Productivity)* |
| **Language** | English |
| **License** | MIT |
| **Website** | `https://github.com/chinkan/aeo-score-chrome-ext` |

---

## Detailed Description

Score your webpage for SEO, GEO, LLMO & AEO — all running 100% locally in your browser. No data leaves your machine. No API keys required.

AEO Score Calculator is a Chrome extension that analyzes any webpage and returns a comprehensive optimization score across four disciplines:

- **AEO (Answer Engine Optimization)** — EEAT, Relevance, Structure, Freshness + LLM-powered Tone & Uniqueness analysis
- **SEO (Search Engine Optimization)** — Technical, On-Page, Link Profile, Image SEO
- **GEO (Generative Engine Optimization)** — Citability, Factual Density, Structured Answers, Authority
- **LLMO (LLM Optimization)** — Crawlability, Completeness, Direct Answers, Clarity

### Features

- **4-in-1 Scoring Engine** — SEO, GEO, LLMO, and AEO scores in a single click
- **100% Local Processing** — All analysis runs in-browser via Transformers.js
- **Local LLM Inference** — Multilingual BERT (5-star sentiment → tone) and MiniLM (embeddings) run locally
- **Actionable Suggestions** — Prioritized recommendations: critical, warning, info
- **Tabbed Dashboard** — Switch between AEO, SEO, GEO, and LLMO views
- **Privacy-First** — Zero telemetry, zero tracking, zero external requests
- **Offline-Ready** — Models are bundled locally (~188 MB total build output)
- **Export to Markdown** — Copy or download AI-ready reports to paste into ChatGPT/Claude

### Score Ranges

| Score | Rating | Meaning |
|-------|--------|---------|
| 80–100 | Excellent | Well-optimized across all disciplines |
| 60–79 | Good | Solid foundation with room for improvement |
| 40–59 | Needs Work | Several areas need attention |
| 0–39 | Significant Optimization Needed | Major improvements required |

### How to Use

1. Navigate to any webpage
2. Click the AEO Score Calculator icon
3. Click "Analyze Current Page"
4. Switch tabs to view AEO, SEO, GEO, or LLMO scores
5. Review suggestions and implement improvements

### Tech Stack

Chrome Manifest V3 · React 19 · TypeScript · Transformers.js · Tailwind CSS

**License:** MIT
**Source:** https://github.com/chinkan/aeo-score-chrome-ext

---

## Privacy Practices

| Question | Answer |
|----------|--------|
| Does your extension collect user data? | **No** |
| Does it transmit data to third parties? | **No** |
| Does it use external APIs? | **No** — 100% local |

### Single Purpose Declaration

Analyzes the active webpage's content (HTML, meta tags, schema markup) and returns optimization scores. All processing runs locally in the browser.

---

## Permissions Justification

| Permission | Justification |
|------------|---------------|
| `activeTab` | Access the current tab's URL and title for display in the popup and export reports |
| `scripting` | Inject the content script into the active page to extract and analyze DOM content |
| `offscreen` | Run Transformers.js (multilingual BERT + MiniLM models) in an offscreen document for LLM-powered tone and uniqueness scoring |
| `host_permissions: <all_urls>` | Analyze any webpage the user visits — the extension must work on arbitrary URLs |

---

## Screenshots

Chrome Web Store requires screenshots at **1280×800** or **640×400** minimum. The popup itself is ~380×520px, so place it on a clean browser background.

| # | Suggested Filename | Description |
|---|--------------------|-------------|
| 1 | `screenshot-overall.png` | Overall score view with all 4 category tabs |
| 2 | `screenshot-aeo.png` | AEO tab showing EEAT/Relevance/Structure/Freshness breakdown |
| 3 | `screenshot-seo.png` | SEO tab with Technical/On-Page/Link/Image sub-scores |
| 4 | `screenshot-suggestions.png` | Suggestions panel with critical/warning/info items |
| 5 | `screenshot-export.png` | Export buttons (Copy + Download) with markdown preview |

---

## Icons

| Asset | Source File | Size |
|-------|-------------|------|
| Small Tile | `icons/icon128.png` | 128×128 |
| Large Tile | `icons/icon128.png` | 128×128 |
| Marquee Tile | `icons/icon128.png` | 128×128 |

---

## Upload Package

```bash
# Build the store-ready ZIP
bun run pack:store

# Output: aeo-score-calculator-store.zip
# Upload to: https://chrome.google.com/webstore/devconsole
```

---

## Additional Fields

| Field | Value |
|-------|-------|
| **Support Email** | *(your email)* |
| **Support URL** | `https://github.com/chinkan/aeo-score-chrome-ext/issues` |
| **Contact Email** | *(your email)* |
| **Trading as** | *(your name or company, if applicable)* |
| **Copyright** | © 2026 chinkan |

---

## Review Checklist

- [ ] ZIP built from `bun run pack:store` (everything in `dist/` included)
- [ ] All 4 icon sizes present in `icons/` (16, 32, 48, 128)
- [ ] 1+ screenshots at 1280×800 uploaded
- [ ] Privacy single purpose declaration filled
- [ ] All permissions justified above
- [ ] No console errors in `dist/` when loaded unpacked
- [ ] `manifest.json` version matches store version (`1.0.0`)
