import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";

const { version } = packageJson;
const [major, minor, patch] = version.split(".").map(Number);

export default defineManifest({
  manifest_version: 3,
  name: "AEO Score Calculator",
  version: `${major}.${minor}.${patch}`,
  description: "Calculate Answer Engine Optimization scores for any webpage",
  permissions: ["activeTab", "scripting", "offscreen"],
  host_permissions: ["<all_urls>"],
  action: {
    default_popup: "popup.html",
    default_title: "AEO Score Calculator",
    default_icon: {
      16: "icons/icon16.png",
      48: "icons/icon48.png",
      128: "icons/icon128.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  icons: {
    16: "icons/icon16.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png",
  },
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
  },
  web_accessible_resources: [
    {
      resources: [
        "assets/offscreen-*.js",
        "offscreen.html",
        "models/**/*",
      ],
      matches: ["<all_urls>"],
    },
  ],
});
