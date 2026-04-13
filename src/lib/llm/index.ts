import { env } from "@xenova/transformers";

import { toneFromSentimentLabel } from "./tone-mapping";

// Chrome extensions block Web Workers on blob URLs.
// Disable proxy worker and force single-threaded WASM.
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.numThreads = 1;

// Load models from extension-local paths (no network required).
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useBrowserCache = false;
env.localModelPath = chrome.runtime.getURL("models/");

export async function calculateTone(text: string): Promise<number> {
  if (!text || text.trim().length === 0) return 0.5;

  const { pipeline } = await import("@xenova/transformers");

  const classifier = await pipeline(
    "sentiment-analysis",
    "Xenova/bert-base-multilingual-uncased-sentiment",
  );

  const truncated = text.slice(0, 512);
  const result = await classifier(truncated);

  const output = Array.isArray(result) ? result[0] : result;
  const { label } = output as { label: string; score: number };
  return toneFromSentimentLabel(label);
}

export async function calculateUniqueness(text: string): Promise<number> {
  if (!text || text.trim().length === 0) return 0.5;

  const { pipeline } = await import("@xenova/transformers");

  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );

  const truncated = text.slice(0, 2048);
  const output = await extractor(truncated, { pooling: "mean", normalize: true });

  const embedding = output.data as Float32Array;

  let magnitude = 0;
  for (let i = 0; i < embedding.length; i++) {
    magnitude += embedding[i] * embedding[i];
  }
  magnitude = Math.sqrt(magnitude);

  const uniqueness = clamp(magnitude / Math.sqrt(embedding.length), 0, 1);
  return uniqueness;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
