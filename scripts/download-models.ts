import { $ } from "bun";

const BASE = "https://huggingface.co";

const MODELS = [
  {
    repo: "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    files: [
      "tokenizer.json",
      "tokenizer_config.json",
      "config.json",
      "onnx/model_quantized.onnx",
    ],
  },
  {
    repo: "Xenova/all-MiniLM-L6-v2",
    files: [
      "tokenizer.json",
      "tokenizer_config.json",
      "config.json",
      "onnx/model_quantized.onnx",
    ],
  },
];

const OUT_DIR = "public/models";

async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  await Bun.write(dest, new Uint8Array(buf));
  const sizeKB = (buf.byteLength / 1024).toFixed(1);
  console.log(`  ✓ ${dest.split("/").slice(-2).join("/")} (${sizeKB} KB)`);
}

async function main() {
  console.log("Downloading model files for local use...\n");

  for (const model of MODELS) {
    const modelDir = `${OUT_DIR}/${model.repo}`;
    console.log(`Model: ${model.repo}`);

    for (const file of model.files) {
      const url = `${BASE}/${model.repo}/resolve/main/${file}`;
      const dest = `${modelDir}/${file}`;

      // Ensure directory exists
      const dir = dest.substring(0, dest.lastIndexOf("/"));
      await $`mkdir -p ${dir}`;
      await downloadFile(url, dest);
    }
    console.log("");
  }

  console.log("Done! Models saved to public/models/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
