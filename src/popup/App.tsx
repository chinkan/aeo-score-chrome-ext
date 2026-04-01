import { useState, useCallback } from "react";
import type { AnalysisResult, ScoringCategory, AEOResult, SEOResult, GEOResult, LLMOResult } from "../lib/types";
import { ScoreRing } from "../components/ScoreRing";
import { BreakdownBar } from "../components/BreakdownBar";
import { SuggestionsAccordion } from "../components/SuggestionsAccordion";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

const CATEGORIES: { key: ScoringCategory; label: string; color: string }[] = [
  { key: "aeo", label: "AEO", color: "bg-blue-500" },
  { key: "seo", label: "SEO", color: "bg-green-500" },
  { key: "geo", label: "GEO", color: "bg-amber-500" },
  { key: "llmo", label: "LLMO", color: "bg-purple-500" },
];

type CategoryResult = AEOResult | SEOResult | GEOResult | LLMOResult;

const COMPONENT_CONFIG: Record<ScoringCategory, { label: string; weight: number; color: string; value: (r: CategoryResult) => number }[]> = {
  aeo: [
    { label: "EEAT", weight: 40, color: "bg-blue-500", value: (r) => (r as AEOResult).components.eeat },
    { label: "Relevance", weight: 30, color: "bg-green-500", value: (r) => (r as AEOResult).components.relevance },
    { label: "Structure", weight: 20, color: "bg-amber-500", value: (r) => (r as AEOResult).components.structure },
    { label: "Freshness", weight: 10, color: "bg-purple-500", value: (r) => (r as AEOResult).components.freshness },
    { label: "Tone", weight: 0, color: "bg-pink-500", value: (r) => (r as AEOResult).components.tone },
    { label: "Uniqueness", weight: 0, color: "bg-indigo-500", value: (r) => (r as AEOResult).components.uniqueness },
  ],
  seo: [
    { label: "Technical", weight: 30, color: "bg-blue-500", value: (r) => (r as SEOResult).components.technical },
    { label: "On-Page", weight: 35, color: "bg-green-500", value: (r) => (r as SEOResult).components.on_page },
    { label: "Links", weight: 20, color: "bg-amber-500", value: (r) => (r as SEOResult).components.link_profile },
    { label: "Images", weight: 15, color: "bg-purple-500", value: (r) => (r as SEOResult).components.image_seo },
  ],
  geo: [
    { label: "Citability", weight: 30, color: "bg-blue-500", value: (r) => (r as GEOResult).components.citability },
    { label: "Factual Density", weight: 25, color: "bg-green-500", value: (r) => (r as GEOResult).components.factual_density },
    { label: "Structured Answers", weight: 25, color: "bg-amber-500", value: (r) => (r as GEOResult).components.structured_answers },
    { label: "Authority", weight: 20, color: "bg-purple-500", value: (r) => (r as GEOResult).components.authority },
  ],
  llmo: [
    { label: "Crawlability", weight: 20, color: "bg-blue-500", value: (r) => (r as LLMOResult).components.crawlability },
    { label: "Completeness", weight: 30, color: "bg-green-500", value: (r) => (r as LLMOResult).components.completeness },
    { label: "Direct Answers", weight: 30, color: "bg-amber-500", value: (r) => (r as LLMOResult).components.direct_answers },
    { label: "Clarity", weight: 20, color: "bg-purple-500", value: (r) => (r as LLMOResult).components.clarity },
  ],
};

export default function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ScoringCategory>("aeo");

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveCategory("aeo");

    try {
      const response = await chrome.runtime.sendMessage({ type: "ANALYZE_PAGE" });
      if (!response.success) {
        setError(response.error ?? "Analysis failed");
        return;
      }
      if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={handleAnalyze} />;

  if (!result) {
    return (
      <div className="w-[380px] min-h-[520px] bg-white p-4 flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-1">AEO Score Calculator</h1>
          <p className="text-sm text-gray-500">Analyze any page for SEO, GEO, LLMO & AEO</p>
        </div>
        <button
          onClick={handleAnalyze}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Analyze Current Page
        </button>
      </div>
    );
  }

  const categoryResult = result[activeCategory];
  const configs = COMPONENT_CONFIG[activeCategory];

  return (
    <div className="w-[380px] min-h-[520px] bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900">Optimization Score</h1>
          <button onClick={handleAnalyze} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Re-analyze
          </button>
        </div>

        <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeCategory === c.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <ScoreRing score={categoryResult.score} />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{result.overall}</div>
            <div className="text-xs text-gray-500">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {configs.map((cfg) => (
          <BreakdownBar
            key={cfg.label}
            label={cfg.label}
            value={cfg.value(categoryResult)}
            weight={cfg.weight}
            color={cfg.color}
          />
        ))}
      </div>

      <div className="px-4 pb-2">
        <SuggestionsAccordion suggestions={categoryResult.suggestions} />
      </div>

      <div className="px-4 pb-4">
        <div className="text-xs text-gray-400 text-center">
          {("meta" in categoryResult && (categoryResult as AEOResult).meta?.wordCount)
            ? `${(categoryResult as AEOResult).meta.wordCount} words · ${(categoryResult as AEOResult).meta.headingCount} headings · ${(categoryResult as AEOResult).meta.hasSchema ? "Schema ✓" : "No schema"}`
            : `${result.aeo.meta.wordCount} words · ${result.aeo.meta.headingCount} headings`}
        </div>
      </div>
    </div>
  );
}
