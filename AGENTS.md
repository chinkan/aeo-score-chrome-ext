# PROJECT KNOWLEDGE BASE — AEO Score Calculator

**Generated:** 2026-04-01
**Project:** Chrome MV3 Extension — Answer Engine Optimization scoring
**Status:** Planning phase (no source code scaffolded yet)

## OVERVIEW
Chrome extension that calculates AEO scores for webpages. Uses local LLM (`@xenova/transformers`) for tone/uniqueness analysis, heuristic scoring for EEAT/relevance/structure/freshness.

## STRUCTURE
```
├── AGENTS.md              # This file
├── package.json           # [PLANNED]
├── vite.config.ts         # [PLANNED]
├── manifest.json          # [PLANNED] Chrome MV3 manifest
├── src/
│   ├── background/        # Service worker + message routing (DOM-free)
│   ├── content/           # DOM extraction + calculateAEO
│   ├── offscreen/         # Transformers.js execution
│   ├── popup/             # React UI (ScoreRing, Breakdown, Suggestions)
│   ├── lib/
│   │   ├── aeo-calculator.ts   # 19 scoring functions
│   │   ├── aeo-scoring.ts
│   │   ├── llm/
│   │   └── messaging/
│   └── components/ui/     # shadcn components
├── tests/                 # Vitest tests
└── dist/                  # Built extension
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Service worker | `src/background/` | DOM-free, message routing only |
| DOM analysis | `src/content/` | Main content extraction, 19 scoring funcs |
| LLM inference | `src/offscreen/` | Transformers.js (DistilBERT + MiniLM) |
| Popup UI | `src/popup/` | React 19, ~380×520px |
| Scoring logic | `src/lib/aeo-calculator.ts` | EEAT, Relevance, Structure, Freshness |
| Types/interfaces | `src/lib/` | AEOResult, Suggestion, component scores |

## CONVENTIONS
- TypeScript strict mode
- Tailwind CSS v4 + shadcn/ui
- Vite + CRXJS / vite-plugin-web-extension
- Typed messaging between all components

## ANTI-PATTERNS
1. Background service worker **must be DOM-free** — no `document`, `window`, browser globals
2. LLM code **must** run in offscreen document or via dynamic import
3. Content script: limit DOM scan to `main`, `article`, `[role="main"]`
4. Never suppress `document is not defined` errors — fix root cause
5. No `as any` or `@ts-ignore`

## SCORING FORMULA
```
final_score = (EEAT × 0.40) + (Relevance × 0.30) + (Structure × 0.20) + (Freshness × 0.10) + LLM bonus
```

## 19 CORE FUNCTIONS
| # | Function | Purpose |
|---|----------|---------|
| 1 | `fetch_html()` | Get page HTML |
| 2 | `extract_main_text()` | Clean main content (strip nav/footer/ads) |
| 3 | `extract_schema_markup()` | JSON-LD + Microdata (FAQPage, HowTo, Article) |
| 4 | `extract_meta_tags()` | Title, description, author, dates |
| 5 | `get_last_updated()` | Date object from meta |
| 6 | `has_faq_section()` | Detect FAQ section/schema |
| 7 | `has_howto_schema()` | Detect HowTo schema |
| 8 | `calculate_EEAT()` | 0-1, weight 40% — author, citations, trust |
| 9 | `calculate_Relevance()` | 0-1, weight 30% — content vs userIntent |
| 10 | `calculate_Structure()` | 0-1, weight 20% — headings, lists, tables |
| 11 | `calculate_Freshness()` | 0-1, weight 10% — age-based decay |
| 12 | `calculate_Intent_Match()` | 0-1 — content matches intent |
| 13 | `calculate_Tone()` | 0-1 — LLM sentiment analysis |
| 14 | `detect_snippet_ready()` | 0-1 — snippet readiness |
| 15 | `calculate_Uniqueness()` | 0-1 — LLM embedding similarity |
| 16 | `generate_suggestions()` | Actionable improvements |
| 17 | `clamp()` | Number clamping utility |
| 18 | `average()` | Array average utility |
| 19 | `finalizeAEO()` | Combine heuristic + LLM scores → AEOResult |

## AEOResult STRUCTURE
- `score: number` (0-100)
- `components`: { eeat, relevance, structure, freshness, tone, uniqueness, intent_match }
- `suggestions: Suggestion[]`
- `meta`: { lastUpdated, hasFaq, hasHowto, ... }

## COMMANDS
```bash
bun run dev     # Development
bun run build   # Production build (always verify after changes)
bun run test    # Vitest tests
```

## NOTES
- Popup size: ~380 × 520px
- Freshness decay: <30d=1.0, <90d=0.7, <180d=0.4, older=0.1
- All 7 phases marked "Done" in plan but no source code exists yet — project needs scaffolding