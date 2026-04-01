import { useState } from "react";
import type { Suggestion } from "../lib/types";

interface SuggestionsAccordionProps {
  suggestions: Suggestion[];
}

const typeColors = {
  critical: "border-red-300 bg-red-50 text-red-800",
  warning: "border-amber-300 bg-amber-50 text-amber-800",
  info: "border-blue-300 bg-blue-50 text-blue-800",
};

const typeIcons = {
  critical: "●",
  warning: "▲",
  info: "ℹ",
};

export function SuggestionsAccordion({ suggestions }: SuggestionsAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (suggestions.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        No suggestions — page looks good!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Suggestions ({suggestions.length})
      </h3>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`border rounded-lg overflow-hidden ${typeColors[suggestion.type]}`}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:opacity-80"
          >
            <span className="text-xs">{typeIcons[suggestion.type]}</span>
            <span className="flex-1">{suggestion.message}</span>
            <span className="text-xs">{openIndex === index ? "−" : "+"}</span>
          </button>
          {openIndex === index && suggestion.action && (
            <div className="px-3 pb-2 text-xs opacity-80">
              {suggestion.action}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
