import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModel, matchRecipes, getRecipe, recipeListItem, filterRecipes, normalizeCuisine, attachImageIndex } from "./lib/match.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_COMPLETION_TOKENS = 1024;

// Minimal .env loader (no extra dependency). Must run before config is read.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const rawLine of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const PROVIDERS = {
  moondream: {
    id: "moondream",
    label: "Moondream",
    baseUrl: (process.env.MOONDREAM_BASE_URL || "https://api.moondream.ai/v1").replace(/\/+$/, ""),
    envKey: "MOONDREAM_API_KEY",
    apiKey: () => process.env.MOONDREAM_API_KEY,
    model: () => process.env.VISION_MODEL || "moondream3.1-9B-A2B",
    tokenParam: "max_completion_tokens",
    keyUrl: "https://moondream.ai/c/cloud/api-keys",
    settingsUrl: "https://console.moondream.ai",
    billingUrl: "https://moondream.ai/pricing",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    apiKey: () => process.env.OPENAI_API_KEY,
    model: () => process.env.VISION_MODEL || "gpt-4o-mini",
    tokenParam: "max_tokens",
    keyUrl: "https://platform.openai.com/api-keys",
    settingsUrl: "https://platform.openai.com/settings",
    billingUrl: "https://platform.openai.com/settings/billing",
  },
};

const requestedProvider = (process.env.VISION_PROVIDER || "").toLowerCase();

const resolveProvider = () => {
  if (PROVIDERS[requestedProvider]) return requestedProvider;
  if (PROVIDERS.moondream.apiKey()) return "moondream";
  if (PROVIDERS.openai.apiKey()) return "openai";
  return "moondream";
};

const MODEL_PATH = path.join(__dirname, "model", "recipe-model.json");
const modelStarted = Date.now();
const recipeIndex = fs.existsSync(MODEL_PATH)
  ? loadModel(MODEL_PATH)
  : (() => {
      console.warn(
        `[model] ${MODEL_PATH} not found. Run "npm run train" to build the recipe index.`,
      );
      return null;
    })();
const modelLoadMs = Date.now() - modelStarted;

const IMAGE_INDEX_PATH = path.join(__dirname, "model", "image-index.json");
const imageCount = recipeIndex && fs.existsSync(IMAGE_INDEX_PATH)
  ? attachImageIndex(recipeIndex, IMAGE_INDEX_PATH)
  : 0;

const app = express();
app.use(express.json({ limit: "8mb" }));

const isConfigured = () => Boolean(PROVIDERS[resolveProvider()].apiKey());

app.get("/api/health", (_req, res) => {
  const provider = PROVIDERS[resolveProvider()];
  res.json({
    ok: true,
    vision: provider.id,
    model: provider.model(),
    configured: Boolean(provider.apiKey()),
    recipes: recipeIndex ? recipeIndex.model.indexed : 0,
    images: imageCount,
  });
});

app.post("/api/recognize", async (req, res) => {
  const provider = PROVIDERS[resolveProvider()];
  try {
    const { image } = req.body || {};
    if (typeof image !== "string" || !image) {
      return res.status(400).json({ error: "Missing 'image' field (base64 data URL)." });
    }
    if (image.length > MAX_IMAGE_BYTES * 1.4) {
      return res.status(413).json({ error: "Image is too large. Please use a photo under 8 MB." });
    }
    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
      return res.status(400).json({ error: "Image must be a PNG, JPEG, or WebP data URL." });
    }
    if (!provider.apiKey()) {
      return res.status(503).json({
        error: `The ${provider.label} vision backend is not configured. Add ${provider.envKey} to server/.env (see server/.env.example), then restart the server.`,
      });
    }

    const apiResponse = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey()}`,
      },
      body: JSON.stringify({
        model: provider.model(),
        [provider.tokenParam]: MAX_COMPLETION_TOKENS,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "You are a food ingredient recognition engine for an Indian cooking app.",
              "Look at the image and list every food ingredient you can identify (e.g. paneer, tomatoes, cumin seeds, chicken, rice).",
              'Respond ONLY with a JSON array, no markdown, no commentary: [{"name": "ingredient", "confidence": 0.95}]',
              "Rules:",
              "- Use common English ingredient names.",
              "- Skip non-food objects (countertops, utensils, kitchen appliances).",
              "- Confidence 0-1: how sure you are the ingredient is present.",
              "- If nothing food-related is visible, return [].",
            ].join("\n"),
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify the ingredients in this photo." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const detail = await apiResponse.text().catch(() => "");
      let friendly;
      if (apiResponse.status === 401) {
        friendly = `The ${provider.label} API key in server/.env is invalid or expired. Generate a new key at ${provider.keyUrl} and restart the server.`;
      } else if (apiResponse.status === 403) {
        friendly = `The ${provider.label} API key has no access to ${provider.model()}. Check permissions at ${provider.settingsUrl}.`;
      } else if (apiResponse.status === 429) {
        friendly = /insufficient_quota|credit|billing|quota/i.test(detail)
          ? `The ${provider.label} account has no remaining credit. Add billing or credits at ${provider.billingUrl} and try again.`
          : `${provider.label} rate limit reached. Wait a moment and try again.`;
      } else if (apiResponse.status >= 500) {
        friendly = `${provider.label} is having issues right now. Try again shortly.`;
      } else {
        friendly = `Vision API error (${apiResponse.status}${detail ? `: ${detail.slice(0, 200)}` : ""})`;
      }
      return res.status(502).json({ error: friendly });
    }

    const data = await apiResponse.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Vision API returned an unparseable response." });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      return res.status(502).json({ error: "Vision API returned an unexpected shape." });
    }

    const ingredients = parsed
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        name: item.name.trim(),
        confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
      }))
      .filter((item) => item.name);

    res.json({ ingredients });
  } catch (err) {
    console.error("[recognize] error:", err);
    res.status(500).json({ error: "Internal server error while recognizing ingredients." });
  }
});

app.post("/api/match", (req, res) => {
  if (!recipeIndex) {
    return res.status(503).json({
      error: 'The recipe index is not built. Run "npm run train" in the project root.',
    });
  }

  const { ingredients, limit, subset } = req.body || {};
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: "Provide 'ingredients' as a non-empty array of strings." });
  }
  const invalid = ingredients.find((item) => typeof item !== "string");
  if (invalid !== undefined) {
    return res.status(400).json({ error: "Every entry in 'ingredients' must be a string." });
  }
  if (ingredients.length > 60) {
    return res.status(413).json({ error: "Too many ingredients. Send at most 60." });
  }

  const requested = Number.parseInt(String(limit), 10);
  const bounded = Math.min(Math.max(Number.isFinite(requested) ? requested : 12, 1), 50);
  const results = matchRecipes(recipeIndex, ingredients, bounded, {
    subset: Boolean(subset),
  });

  res.json({
    count: results.length,
    query: ingredients.length,
    results,
  });
});

app.get("/api/cuisines", (_req, res) => {
  if (!recipeIndex) {
    return res.status(503).json({
      error: 'The recipe index is not built. Run "npm run train" in the project root.',
    });
  }
  const counts = new Map();
  for (const recipe of recipeIndex.model.recipes) {
    const name = normalizeCuisine(recipe.cuisine);
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const items = [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ total: recipeIndex.model.recipes.length, items });
});

app.get("/api/recipes", (req, res) => {
  if (!recipeIndex) {
    return res.status(503).json({
      error: 'The recipe index is not built. Run "npm run train" in the project root.',
    });
  }
  const filtered = filterRecipes(recipeIndex.model.recipes, {
    cuisine: req.query.cuisine,
    diet: req.query.diet,
    q: req.query.q,
  });
  const offset = Math.max(0, Number.parseInt(String(req.query.offset), 10) || 0);
  const requested = Number.parseInt(String(req.query.limit), 10);
  const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 24, 1), 50);
  res.json({
    total: filtered.length,
    offset,
    limit,
    items: filtered.slice(offset, offset + limit).map((recipe) => recipeListItem(recipeIndex, recipe)),
  });
});

app.get("/api/recipes/:id", (req, res) => {
  if (!recipeIndex) {
    return res.status(503).json({
      error: 'The recipe index is not built. Run "npm run train" in the project root.',
    });
  }
  const recipe = getRecipe(recipeIndex, req.params.id);
  if (!recipe) return res.status(404).json({ error: "No recipe with that id." });
  res.json({ recipe });
});

app.listen(PORT, () => {
  console.log(`SmartChef backend listening on http://localhost:${PORT}`);
  console.log(
    recipeIndex
      ? `[model] ${recipeIndex.model.indexed} recipes, ${recipeIndex.model.vocabulary} terms, loaded in ${modelLoadMs} ms`
      : "[model] not loaded",
  );
  if (imageCount) console.log(`[images] ${imageCount} recipe images linked`);
  else console.log('[images] none linked — run "npm run harvest-images"');
});
