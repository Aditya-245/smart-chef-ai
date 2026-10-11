import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toObjects } from "./lib/csv.js";
import { splitIngredients, normalizeIngredient, expandTokens } from "./lib/ingredients.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_CSV = path.join(ROOT, "data", "raw", "IndianFoodDatasetCSV.csv");
const REGION_CSV = path.join(ROOT, "data", "raw", "indian_food_region.csv");
const OUT_DIR = path.join(__dirname, "model");
const OUT_FILE = path.join(OUT_DIR, "recipe-model.json");

const round = (value, places = 4) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const normalizeText = (value) => String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const toSteps = (text) => {
  if (!text) return [];
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const steps = [];
  for (const sentence of sentences) {
    const last = steps[steps.length - 1];
    if (last && last.length < 30) steps[steps.length - 1] = `${last} ${sentence}`;
    else steps.push(sentence);
  }
  return steps;
};

const devanagariCount = (value) => (String(value || "").match(/[\u0900-\u097F]/g) || []).length;
const latinCount = (value) => (String(value || "").match(/[A-Za-z]/g) || []).length;
const isEnglish = (value) => latinCount(value) > 0 && latinCount(value) >= devanagariCount(value);

const pickEnglish = (primary, secondary) => {
  if (isEnglish(primary)) return String(primary || "");
  if (isEnglish(secondary)) return String(secondary || "");
  return "";
};

const cleanTitle = (value) => String(value || "").replace(/\s*\(\s*Recipe In Hindi\s*\)\s*$/i, "").trim();

const pickTitle = (row) => {
  const primary = cleanTitle(row.RecipeName);
  if (primary && devanagariCount(primary) === 0) return primary;
  const dash = primary.indexOf(" - ");
  if (dash >= 0) {
    const tail = cleanTitle(primary.slice(dash + 3));
    if (isEnglish(tail)) return tail;
  }
  const secondary = cleanTitle(row.TranslatedRecipeName);
  if (secondary && isEnglish(secondary)) return secondary;
  return primary;
};

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toInt = (value) => {
  const parsed = Number.parseInt(String(value || "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

function loadRegions() {
  if (!fs.existsSync(REGION_CSV)) return new Map();
  const { records } = toObjects(fs.readFileSync(REGION_CSV, "utf8"));
  const map = new Map();
  for (const row of records) {
    const key = slug(row.name);
    if (key) {
      map.set(key, {
        state: row.state || null,
        region: row.region || null,
        flavor: row.flavor_profile || null,
      });
    }
  }
  return map;
}

function findRegion(title, regions) {
  const target = slug(title).replace(/\brecipe\b/g, "").trim();
  if (!target) return null;
  for (const [key, value] of regions) {
    if (key === target) return value;
  }
  for (const [key, value] of regions) {
    if (key.length >= 6 && target.length >= 6 && (target.includes(key) || key.includes(target))) {
      return value;
    }
  }
  return null;
}

const started = Date.now();
const { records } = toObjects(fs.readFileSync(RAW_CSV, "utf8"));
const regions = loadRegions();

let docs = [];
let skippedNoEnglish = 0;
let skippedEmpty = 0;
let regionHits = 0;

for (const row of records) {
  const ingredientText = pickEnglish(row.Ingredients, row.TranslatedIngredients);
  if (!ingredientText.trim()) {
    skippedNoEnglish++;
    continue;
  }

  const ingredientPairs = [];
  for (const raw of splitIngredients(ingredientText)) {
    const normalized = normalizeIngredient(raw);
    if (normalized) ingredientPairs.push([normalized.canonical, ...normalized.aliases]);
  }
  if (ingredientPairs.length === 0) {
    skippedEmpty++;
    continue;
  }

  const tokenSets = ingredientPairs.map(([canonical, ...aliases]) => expandTokens(canonical, aliases));
  const title = normalizeText(pickTitle(row));
  const region = findRegion(title, regions);
  if (region) regionHits++;

  docs.push({
    title,
    url: String(row.URL || "").trim(),
    cuisine: String(row.Cuisine || "").trim() || null,
    course: String(row.Course || "").trim() || null,
    diet: String(row.Diet || "").trim() || null,
    prep: toInt(row.PrepTimeInMins),
    cook: toInt(row.CookTimeInMins),
    total: toInt(row.TotalTimeInMins),
    servings: toInt(row.Servings),
    state: region?.state || null,
    region: region?.region || null,
    flavor: region?.flavor || null,
    steps: toSteps(normalizeText(pickEnglish(row.Instructions, row.TranslatedInstructions))),
    ingredients: ingredientPairs,
    tokenSets,
  });
}

const seenTitles = new Map();
let duplicates = 0;
docs = docs.filter((doc) => {
  const key = slug(doc.title).replace(/\brecipe\b/g, "").trim();
  if (!key || seenTitles.has(key)) {
    duplicates++;
    return false;
  }
  seenTitles.set(key, doc);
  return true;
});

const corpus = docs.length;
const documentFrequency = new Map();
for (const doc of docs) {
  const seen = new Set();
  for (const tokenSet of doc.tokenSets) {
    for (const token of tokenSet.keys()) seen.add(token);
  }
  for (const token of seen) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
}

const idf = {};
for (const [token, df] of documentFrequency) {
  idf[token] = round(Math.log((corpus + 1) / (df + 1)) + 1);
}

const recipes = docs.map((doc, index) => {
  const weights = {};
  for (const tokenSet of doc.tokenSets) {
    for (const [token, weight] of tokenSet) {
      weights[token] = (weights[token] || 0) + weight;
    }
  }

  let norm = 0;
  const scored = {};
  for (const [token, tf] of Object.entries(weights)) {
    const value = tf * idf[token];
    scored[token] = value;
    norm += value * value;
  }
  norm = Math.sqrt(norm) || 1;

  const vector = {};
  for (const [token, value] of Object.entries(scored)) {
    vector[token] = round(value / norm, 5);
  }
  delete doc.tokenSets;

  return {
    id: index,
    title: doc.title,
    url: doc.url,
    cuisine: doc.cuisine,
    course: doc.course,
    diet: doc.diet,
    prep: doc.prep,
    cook: doc.cook,
    total: doc.total,
    servings: doc.servings,
    state: doc.state,
    region: doc.region,
    flavor: doc.flavor,
    steps: doc.steps,
    ingredients: doc.ingredients,
    vector,
  };
});

const model = {
  version: 1,
  createdAt: new Date().toISOString(),
  source: path.basename(RAW_CSV),
  records: records.length,
  indexed: recipes.length,
  skippedNoEnglish,
  skippedEmpty,
  duplicates,
  vocabulary: Object.keys(idf).length,
  avgIngredients: round(
    recipes.reduce((sum, recipe) => sum + recipe.ingredients.length, 0) / recipes.length,
    2,
  ),
  regionMatches: regionHits,
  idf,
  recipes,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(model));

const size = fs.statSync(OUT_FILE).size;
const elapsed = Date.now() - started;
console.log(`source records : ${records.length}`);
console.log(`indexed        : ${model.indexed}`);
console.log(`skipped (no English text): ${skippedNoEnglish}`);
console.log(`skipped (no ingredients) : ${skippedEmpty}`);
console.log(`duplicates removed : ${duplicates}`);
console.log(`vocabulary     : ${model.vocabulary}`);
console.log(`avg ingredients: ${model.avgIngredients}`);
console.log(`region matches : ${model.regionMatches}`);
console.log(`model          : ${(size / 1024 / 1024).toFixed(1)} MB -> ${OUT_FILE}`);
console.log(`elapsed        : ${elapsed} ms`);
