/** Matches Xenova multilingual sentiment id2label strings like "1 star" / "5 stars". */
const STAR_LABEL_RE = /^(\d)\s+stars?$/i;

/**
 * Maps 5-class star sentiment labels to a 0–1 tone score (1 star → 0, 5 stars → 1).
 * Unknown labels fall back to neutral 0.5.
 */
export function toneFromSentimentLabel(label: string): number {
  const m = label.trim().match(STAR_LABEL_RE);
  if (!m) return 0.5;
  const n = Number(m[1]);
  if (n < 1 || n > 5) return 0.5;
  return (n - 1) / 4;
}
