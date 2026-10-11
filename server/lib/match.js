import fs from "node:fs";
import { expandTokens, normalizeIngredient, titleCase } from "./ingredients.js";

const COVERAGE_WEIGHT = 0.5;

export function loadModel(file) {
  const model = JSON.parse(fs.readFileSync(file, "utf8"));
  const inverted = new Map();
  const tokenSets = model.recipes.map((recipe) => new Set(Object.keys(recipe.vector)));
  // Per-ingredient token sets, so a recipe's ingredient list can be compared
  // against the query without re-expanding tokens on every match.
  const ingredientSets = model.recipes.map((recipe) =>
    recipe.ingredients.map(([canonical, ...aliases]) =>
      new Set(expandTokens(canonical, aliases).keys()),
    ),
  );

  model.recipes.forEach((recipe, index) => {
    for (const [token, weight] of Object.entries(recipe.vector)) {
      let bucket = inverted.get(token);
      if (!bucket) {
        bucket = [];
        inverted.set(token, bucket);
      }
      bucket.push([index, weight]);
    }
  });

  return { model, inverted, tokenSets, ingredientSets, file, images: new Map() };
}

export function attachImageIndex(context, file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    context.images = new Map(Object.entries(raw));
    return context.images.size;
  } catch (err) {
    console.warn(`[images] could not read ${file}: ${err.message}`);
    context.images = new Map();
    return 0;
  }
}

export function recipeImage(context, recipe) {
  if (!context?.images || !recipe) return null;
  return context.images.get(String(recipe.id)) || null;
}

function vectorize(parsed, idf) {
  const weights = new Map();
  for (const entry of parsed) {
    for (const [token, weight] of entry.weights) {
      const idfWeight = idf[token];
      if (idfWeight === undefined) continue;
      const value = weight * idfWeight;
      weights.set(token, (weights.get(token) || 0) + value);
    }
  }

  let norm = 0;
  for (const value of weights.values()) norm += value * value;
  norm = Math.sqrt(norm);
  if (!norm) return null;

  for (const [token, value] of weights) weights.set(token, value / norm);
  return weights;
}

export function parseQuery(ingredients) {
  const parsed = [];
  const seen = new Set();

  for (const raw of Array.isArray(ingredients) ? ingredients : []) {
    const normalized = normalizeIngredient(raw);
    if (!normalized) continue;
    if (seen.has(normalized.canonical)) continue;
    seen.add(normalized.canonical);
    parsed.push({
      label: normalized.label,
      weights: expandTokens(normalized.canonical, normalized.aliases),
    });
  }

  return parsed;
}

// True when the recipe uses at least one ingredient that is not in the query.
function recipeNeedsExtra(ingredientSets, queryTokens) {
  for (const tokens of ingredientSets) {
    let found = false;
    for (const token of tokens) {
      if (queryTokens.has(token)) {
        found = true;
        break;
      }
    }
    if (!found) return true;
  }
  return false;
}

export function matchRecipes(context, ingredients, limit = 12, { subset = false } = {}) {
  const { model, inverted, tokenSets, ingredientSets } = context;
  const parsed = parseQuery(ingredients);
  if (parsed.length === 0) return [];

  const queryVector = vectorize(parsed, model.idf);
  if (!queryVector) return [];

  const candidates = new Map();
  for (const [token, weight] of queryVector) {
    const bucket = inverted.get(token);
    if (!bucket) continue;
    for (const [index, docWeight] of bucket) {
      candidates.set(index, (candidates.get(index) || 0) + weight * docWeight);
    }
  }
  if (candidates.size === 0) return [];

  const queryTokens = new Set();
  for (const entry of parsed) for (const token of entry.weights.keys()) queryTokens.add(token);

  const ranked = [];
  for (const [index, cosine] of candidates) {
    if (cosine <= 0) continue;

    // Subset mode: drop any recipe that needs an ingredient the user does not have.
    if (subset && recipeNeedsExtra(ingredientSets[index], queryTokens)) continue;

    const recipeTokens = tokenSets[index];
    let covered = 0;
    for (const entry of parsed) {
      for (const token of entry.weights.keys()) {
        if (recipeTokens.has(token)) {
          covered++;
          break;
        }
      }
    }
    const coverage = covered / parsed.length;
    ranked.push({ index, score: cosine * (1 - COVERAGE_WEIGHT + COVERAGE_WEIGHT * coverage) });
  }

  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, limit);

  return top.map(({ index, score }) => {
    const recipe = model.recipes[index];
    const matched = new Set();
    for (const entry of parsed) {
      for (const token of entry.weights.keys()) {
        if (tokenSets[index].has(token)) {
          matched.add(entry.label);
          break;
        }
      }
    }

    const missing = [];
    const seenMissing = new Set();
    recipe.ingredients.forEach(([canonical], i) => {
      const label = titleCase(canonical);
      if (seenMissing.has(label)) return;
      let has = false;
      for (const token of ingredientSets[index][i]) {
        if (queryTokens.has(token)) {
          has = true;
          break;
        }
      }
      if (!has) {
        seenMissing.add(label);
        missing.push(label);
      }
    });

    return {
      id: recipe.id,
      title: recipe.title,
      url: recipe.url,
      image: recipeImage(context, recipe),
      score: Math.round(score * 1000) / 1000,
      cuisine: recipe.cuisine,
      course: recipe.course,
      diet: recipe.diet,
      state: recipe.state,
      region: recipe.region,
      prep: recipe.prep,
      cook: recipe.cook,
      total: recipe.total,
      servings: recipe.servings,
      ingredientCount: recipe.ingredients.length,
      matched: [...matched],
      missing,
    };
  });
}

export function getRecipe(context, id) {
  const recipe = context.model.recipes[Number(id)];
  if (!recipe) return null;
  return {
    id: recipe.id,
    title: recipe.title,
    url: recipe.url,
    image: recipeImage(context, recipe),
    cuisine: recipe.cuisine,
    course: recipe.course,
    diet: recipe.diet,
    state: recipe.state,
    region: recipe.region,
    flavor: recipe.flavor,
    prep: recipe.prep,
    cook: recipe.cook,
    total: recipe.total,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map(([canonical]) => titleCase(canonical)),
    steps: recipe.steps,
  };
}

export function recipeListItem(context, recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    url: recipe.url,
    image: recipeImage(context, recipe),
    cuisine: recipe.cuisine,
    course: recipe.course,
    diet: recipe.diet,
    state: recipe.state,
    region: recipe.region,
    flavor: recipe.flavor,
    prep: recipe.prep,
    cook: recipe.cook,
    total: recipe.total,
    servings: recipe.servings,
    ingredientCount: recipe.ingredients.length,
  };
}

export function normalizeCuisine(raw) {
  return String(raw || "").trim().replace(/\s+Recipes$/i, "");
}

export function isVegetarian(diet) {
  return !/non[\s-]*vegetarian|non[\s-]*veg/i.test(String(diet || ""));
}

export function filterRecipes(recipes, { cuisine, diet, q } = {}) {
  const targetCuisine = String(cuisine || "").trim().toLowerCase();
  const targetDiet = String(diet || "").trim().toLowerCase();
  const query = String(q || "").trim().toLowerCase();

  if (!targetCuisine && !targetDiet && !query) return recipes;

  return recipes.filter((recipe) => {
    if (targetCuisine && normalizeCuisine(recipe.cuisine).toLowerCase() !== targetCuisine) {
      return false;
    }
    if (targetDiet === "veg" && !isVegetarian(recipe.diet)) return false;
    if (targetDiet === "nonveg" && isVegetarian(recipe.diet)) return false;
    if (query) {
      const haystack = [
        recipe.title,
        recipe.course,
        recipe.cuisine,
        recipe.diet,
        recipe.region,
        recipe.state,
        ...recipe.ingredients.map(([canonical]) => canonical),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
