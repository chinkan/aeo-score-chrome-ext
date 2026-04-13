📊 AEO Score Calculator — Comprehensive AI-Era Optimization Scoring for Your Webpages

In an era where AI search engines (ChatGPT, Google AI Overview, Perplexity, Claude) are steadily reshaping traditional search behavior, is your webpage truly ready to be understood and recommended by AI?

AEO Score Calculator is a Chrome extension that runs entirely locally in your browser. With one click, it performs deep analysis across four core dimensions: SEO (Search Engine Optimization), GEO (Generative Engine Optimization), LLMO (Large Language Model Optimization), and AEO (Answer Engine Optimization). All analysis is completed on your own device. No data is sent to external servers, with zero tracking and zero privacy risk.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Four Scoring Dimensions Covering the Full AI Search Ecosystem
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 AEO (Answer Engine Optimization)
Evaluates how your content performs in AI answer engines. Includes:
• EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) — Weight 40%
  Checks author signals, citations, structured data markup, trust indicators, and content depth
• Relevance — Weight 30%
  Analyzes title quality, meta description, heading structure, content depth, and image usage
• Structure — Weight 20%
  Reviews heading hierarchy, lists, tables, and paragraph organization
• Freshness — Weight 10%
  Applies time-decay scoring based on last update date (full score within 30 days, significant decay after 180 days)
• LLM Tone Analysis — Uses a local multilingual BERT model (5-star sentiment) mapped to a tone score
• Uniqueness Detection — Uses MiniLM embeddings to evaluate content uniqueness

📌 SEO (Search Engine Optimization)
Evaluates your page performance in traditional search engines. Includes:
• Technical SEO — Weight 30%
  Checks canonical URL, viewport, HTTPS, semantic HTML, and H1 usage
• On-Page SEO — Weight 35%
  Analyzes title length, description length, heading count, word count, and opening heading quality
• Link Profile — Weight 20%
  Assesses internal/external link volume and balance
• Image SEO — Weight 15%
  Reviews alt text coverage and image count

📌 GEO (Generative Engine Optimization)
Evaluates your content's likelihood of being cited and recommended by generative AI engines (such as Google AI Overview and ChatGPT Search). Includes:
• Citability — Weight 30%
  Checks citation count, statistical data density, inline references, and authoritative outbound links
• Factual Density — Weight 25%
  Analyzes stats per 1,000 words, citation density, quote usage, and content depth
• Structured Answers — Weight 25%
  Detects FAQ blocks, comparison tables, step-by-step guides, and answer capsules
• Authority — Weight 20%
  Evaluates author markup, structured data, update recency, outbound links, and content length

📌 LLMO (Large Language Model Optimization)
Evaluates how friendly your content is for large language models. Includes:
• Crawlability — Weight 20%
  Checks semantic HTML usage, promotional language density, and paragraph length suitability
• Completeness — Weight 30%
  Evaluates word count, heading coverage, paragraph count, list usage, and table usage
• Direct Answers — Weight 30%
  Detects definition patterns, comparison signals, how-to guidance, comparison tables, and FAQs
• Clarity — Weight 20%
  Analyzes summary blocks, bolded key concepts, heading hierarchy, and language conciseness

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Why Install AEO Score Calculator?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 100% Local Processing, Strong Privacy by Design
Everything runs inside your browser. Page content, analysis results, and LLM inference never leave your device. No API keys, no account, and no cloud dependency required (models are bundled). In a privacy-conscious world, this is peace of mind by default.

✅ Four Dimensions in One Workflow
Most tools cover only one area (SEO, GEO, or LLM analysis). AEO Score Calculator evaluates all four dimensions in one click, giving you a complete, AI-era optimization picture of any webpage.

✅ Local LLM Inference, No Paid API Required
Built-in multilingual BERT (star sentiment for tone) and MiniLM (embeddings) run directly in the browser. No OpenAI, Anthropic, or third-party API fees. No rate limits. No service outages.

✅ Actionable Recommendations, Not Just Scores
Every dimension includes concrete optimization suggestions categorized by severity:
• 🔴 Critical — Issues that need immediate attention
• 🟡 Warning — Important factors affecting score quality
• 🔵 Info — Additional optimization opportunities
Each suggestion includes specific guidance, such as "Add FAQPage structured data" or "Include a 40-60 word direct answer after each H2 heading."

✅ Export AI-Friendly Markdown Reports
Copy or download a complete Markdown report with one click, including URL, timestamp, dimension scores, metadata, and all suggestions. You can paste it directly into ChatGPT or Claude to generate concrete code-level improvement plans.

✅ Works Offline, Anywhere
All models (about 188MB total packaged `dist/`) are bundled in the extension. After installation, it works fully offline, ideal for flights, meetings, or unstable network environments.

✅ Open Source and Transparent (MIT License)
The full source code is public on GitHub so you can audit every line and verify there is no hidden data exfiltration. Contributions, issues, and forks are welcome.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Score Interpretation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Score Range | Rating | Meaning |
|------------|--------|---------|
| 80-100 | 🟢 Excellent | Strong optimization across all dimensions |
| 60-79  | 🔵 Good | Solid foundation with room to improve |
| 40-59  | 🟡 Needs Work | Multiple areas require attention |
| 0-39   | 🔴 Major Optimization Needed | Significant improvements required |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 How to Use (3 Simple Steps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open any webpage in Chrome that you want to analyze
2. Click the AEO Score Calculator icon in the toolbar
3. Click "Analyze Current Page" and get the full report in seconds

You can also configure a keyboard shortcut at `chrome://extensions/shortcuts` for one-key analysis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠 Tech Stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Chrome Manifest V3 — latest extension platform standard
• React 19 — smooth and modern UI
• TypeScript 5.7 — type-safe codebase
• Transformers.js — in-browser LLM inference engine
• Tailwind CSS v4 — modern styling system
• Vitest — comprehensive unit testing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Privacy Commitment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• ❌ We do not collect user data
• ❌ We do not send data to external servers
• ❌ We do not use tracking or analytics tools
• ❌ No account or login required
• ✅ 100% of processing runs inside your browser

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Permission Justification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• `activeTab` — reads current tab URL and title for display/reporting
• `scripting` — injects content script into active page to extract and analyze DOM content
• `offscreen` — runs Transformers.js models in an offscreen document for local LLM inference
• `host_permissions: <all_urls>` — enables analysis on any webpage the user visits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 License and Support
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This extension is released under the MIT License.
Source code: https://github.com/chinkan/aeo-score-chrome-ext
Issue tracker: https://github.com/chinkan/aeo-score-chrome-ext/issues

If you are a content creator, SEO professional, marketer, web developer, or simply someone who wants your content to be correctly understood and recommended in the AI era, AEO Score Calculator is an essential tool. Install it today and discover your true competitive strength in AI search.
