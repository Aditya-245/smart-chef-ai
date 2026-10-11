import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, "model", "recipe-model.json");
const INDEX_PATH = path.join(__dirname, "model", "image-index.json");

const CONCURRENCY = 24;
const RETRIES = 2;
const TIMEOUT_MS = 15000;
const SAVE_EVERY = 250;

const args = process.argv.slice(2);
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : NaN;
const dryRun = args.includes("--dry-run");

const meta = (html, prop) => {
  const a = html.match(
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"),
  );
  if (a) return a[1];
  const b = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"),
  );
  return b ? b[1] : null;
};

const ldJsonImage = (html) => {
  const blocks = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (!blocks) return null;
  for (const block of blocks) {
    const body = block.replace(/^[^>]*>/, "").replace(/<\/script>$/i, "");
    try {
      const queue = [JSON.parse(body)];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== "object") continue;
        if (node.image) {
          const img = node.image;
          if (Array.isArray(img)) return typeof img[0] === "string" ? img[0] : img[0]?.url;
          if (typeof img === "string") return img;
          if (img && typeof img.url === "string") return img.url;
        }
        if (Array.isArray(node["@graph"])) queue.push(...node["@graph"]);
      }
    } catch {
      /* malformed ld+json on the source page */
    }
  }
  return null;
};

const withTimeout = async (url, ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
  } finally {
    clearTimeout(timer);
  }
};

const extractImage = async (pageUrl) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await withTimeout(pageUrl, TIMEOUT_MS);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (res.status === 404) return { image: null, error: "404" };
        continue;
      }
      const html = await res.text();
      const found = meta(html, "og:image") || ldJsonImage(html);
      if (!found) return { image: null, error: "no og:image" };
      return { image: new URL(found, res.url).href, error: null };
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return { image: null, error: lastError?.message || "unknown" };
};

const loadJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

const model = loadJson(MODEL_PATH, null);
if (!model) {
  console.error(`[images] ${MODEL_PATH} not found. Run "npm run train" first.`);
  process.exit(1);
}

const index = loadJson(INDEX_PATH, {});
const recipes = model.recipes;
const pending = recipes
  .filter((r) => !index[r.id] && r.url)
  .slice(0, Number.isFinite(limitArg) ? limitArg : Infinity);

console.log(
  `[images] ${recipes.length} recipes, ${Object.keys(index).length} already indexed, ${pending.length} to fetch`,
);

if (dryRun) {
  console.log("[images] --dry-run, nothing fetched");
  process.exit(0);
}

let done = 0;
let ok = 0;
let failed = 0;
let sinceSave = 0;
const failures = new Map();

const save = () => {
  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(index, null, 0)}\n`);
  sinceSave = 0;
};

const started = Date.now();
let cursor = 0;

const worker = async () => {
  while (cursor < pending.length) {
    const recipe = pending[cursor++];
    const { image, error } = await extractImage(recipe.url);
    if (image) {
      index[recipe.id] = image;
      ok++;
    } else {
      failed++;
      failures.set(error, (failures.get(error) || 0) + 1);
    }
    done++;
    sinceSave++;
    if (sinceSave >= SAVE_EVERY) save();
    if (done % 250 === 0) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = done / elapsed;
      const eta = Math.round((pending.length - done) / rate);
      console.log(
        `[images] ${done}/${pending.length} ok=${ok} fail=${failed} ${rate.toFixed(1)}/s eta ${eta}s`,
      );
    }
  }
};

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker));
save();

const elapsed = Math.round((Date.now() - started) / 1000);
console.log(
  `[images] done in ${elapsed}s — ok=${ok} fail=${failed} total indexed=${Object.keys(index).length}/${recipes.length}`,
);
if (failures.size) {
  console.log("[images] failure reasons:");
  for (const [reason, count] of [...failures].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}x ${reason}`);
  }
}
