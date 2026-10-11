import type { Recipe } from "@/components/RecipeCard";
import recipe1 from "@/assets/recipe-1.jpg";
import recipe2 from "@/assets/recipe-2.jpg";
import recipe3 from "@/assets/recipe-3.jpg";
import recipe4 from "@/assets/recipe-4.jpg";
import recipe5 from "@/assets/recipe-5.jpg";
import recipe6 from "@/assets/recipe-6.jpg";

export interface MatchSummary {
  id: number;
  title: string;
  url: string;
  image?: string | null;
  score: number;
  cuisine: string;
  course: string;
  diet: string;
  state: string;
  region: string;
  prep: number;
  cook: number;
  total: number;
  servings: number;
  ingredientCount: number;
  matched: string[];
  missing: string[];
}

export interface ApiRecipe {
  id: number;
  title: string;
  url: string;
  image?: string | null;
  cuisine: string;
  course: string;
  diet: string;
  state: string;
  region: string;
  flavor: string;
  prep: number;
  cook: number;
  total: number;
  servings: number;
  ingredients: string[];
  steps: string[];
}

export interface MatchResponse {
  count: number;
  query: number;
  results: MatchSummary[];
}

export interface RecipeListItem {
  id: number;
  title: string;
  url: string;
  image?: string | null;
  cuisine: string;
  course: string;
  diet: string;
  state: string | null;
  region: string | null;
  flavor: string | null;
  prep: number;
  cook: number;
  total: number;
  servings: number;
  ingredientCount: number;
}

export interface RecipeListResponse {
  total: number;
  offset: number;
  limit: number;
  items: RecipeListItem[];
}

export interface CuisineFacet {
  name: string;
  count: number;
}

export interface CuisineListResponse {
  total: number;
  items: CuisineFacet[];
}

export interface RecipeQuery {
  offset?: number;
  limit?: number;
  cuisine?: string;
  diet?: "veg" | "nonveg";
  q?: string;
}

const CARD_IMAGES = [recipe1, recipe2, recipe3, recipe4, recipe5, recipe6];

export const cardImageFor = (id: number) => CARD_IMAGES[Math.abs(id) % CARD_IMAGES.length];

/** Prefer the per-recipe photo harvested from the source; fall back to a stock card. */
export const imageOr = (id: number, image?: string | null) => image || cardImageFor(id);

export const normalizeCuisine = (raw: string) =>
  raw.trim().replace(/\s+Recipes$/i, "");

export const isVegetarian = (diet: string) =>
  !/non[\s-]*vegetarian|non[\s-]*veg/i.test(diet);

const difficultyFor = (totalMinutes: number): Recipe["difficulty"] => {
  if (!totalMinutes) return "Medium";
  if (totalMinutes <= 30) return "Easy";
  if (totalMinutes <= 60) return "Medium";
  return "Hard";
};

const timeLabel = (minutes: number) => (minutes ? `${Math.round(minutes)} min` : "");

/**
 * The API returns summary rows only (no ingredients/steps). Those fields are
 * filled in by `detailToRecipe` once the user opens a recipe.
 */
export function summaryToRecipe(summary: MatchSummary): Recipe {
  return {
    id: String(summary.id),
    title: summary.title.replace(/\s+Recipe$/i, ""),
    image: imageOr(summary.id, summary.image),
    time: timeLabel(summary.total),
    difficulty: difficultyFor(summary.total),
    cuisine: normalizeCuisine(summary.cuisine),
    isVeg: isVegetarian(summary.diet),
    servings: summary.servings,
    ingredients: [],
    steps: [],
    tags: [summary.course, summary.diet, summary.region].filter(Boolean),
    matchScore: Math.round(summary.score * 100),
    sourceUrl: summary.url,
  };
}

export function detailToRecipe(detail: ApiRecipe, summary?: MatchSummary): Recipe {
  const base = summary
    ? summaryToRecipe({ ...summary, image: summary.image ?? detail.image })
    : {
        id: String(detail.id),
        title: detail.title.replace(/\s+Recipe$/i, ""),
        image: imageOr(detail.id, detail.image),
        time: timeLabel(detail.total),
        difficulty: difficultyFor(detail.total),
        cuisine: normalizeCuisine(detail.cuisine),
        isVeg: isVegetarian(detail.diet),
        servings: detail.servings,
        tags: [detail.course, detail.diet, detail.region].filter(Boolean),
        sourceUrl: detail.url,
      };

  return {
    ...base,
    ingredients: detail.ingredients,
    steps: detail.steps,
  };
}

async function requestJson<T>(url: string, init?: RequestInit, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("The recipe service timed out. Retry, or restart it with `npm run server`.");
    }
    if (err instanceof TypeError) {
      throw new Error("Cannot reach the recipe service. Start it with `npm run server`, then retry.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const postJson = <T>(url: string, body: unknown) =>
  requestJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const matchRecipes = (ingredients: string[], limit = 12, subset = false) =>
  postJson<MatchResponse>("/api/match", { ingredients, limit, subset });

export const fetchRecipe = (id: number | string) =>
  requestJson<{ recipe: ApiRecipe }>(`/api/recipes/${encodeURIComponent(id)}`).then(
    (res) => res.recipe,
  );

export const listRecipes = (query: RecipeQuery = {}) => {
  const params = new URLSearchParams();
  if (query.offset !== undefined) params.set("offset", String(query.offset));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.cuisine) params.set("cuisine", query.cuisine);
  if (query.diet) params.set("diet", query.diet);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  return requestJson<RecipeListResponse>(`/api/recipes${qs ? `?${qs}` : ""}`);
};

export const listCuisines = () =>
  requestJson<CuisineListResponse>("/api/cuisines");

export function listItemToRecipe(item: RecipeListItem): Recipe {
  return {
    id: String(item.id),
    title: item.title.replace(/\s+Recipe$/i, ""),
    image: imageOr(item.id, item.image),
    time: timeLabel(item.total),
    difficulty: difficultyFor(item.total),
    cuisine: normalizeCuisine(item.cuisine),
    isVeg: isVegetarian(item.diet),
    servings: item.servings,
    ingredients: [],
    steps: [],
    tags: [item.course, item.diet, item.region, item.state].filter(Boolean) as string[],
    sourceUrl: item.url,
  };
}

const STOPWORDS = new Set([
  "the", "and", "for", "you", "your", "with", "that", "this", "from", "have", "has", "had",
  "was", "are", "but", "not", "all", "can", "will", "would", "could", "should", "into",
  "about", "please", "just", "some", "more", "most", "other", "than", "then", "them",
  "they", "their", "there", "these", "those", "what", "when", "where", "which", "while",
  "very", "too", "also", "any", "much", "many", "like", "want", "need", "make", "made",
  "makes", "cook", "cooked", "cooking", "dish", "dishes", "meal", "meals", "food", "foods",
  "recipe", "recipes", "plate", "serve", "served", "serve", "today", "tonight", "now",
  "only", "even", "still", "here", "down", "been", "being", "does", "doing", "did",
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "good", "great", "best", "nice", "easy", "quick", "simple", "fast", "tasty", "yummy",
  "delicious", "spicy", "sweet", "sour", "hot", "cold", "fresh", "hot", "healthy",
  "indian", "north", "south", "east", "west", "vegetarian", "veg", "nonveg", "non",
  "protein", "diet", "budget", "party", "week", "style", "home", "homemade", "authentic",
  "and", "anything", "available", "leftover", "leftovers", "using", "use", "got", "get",
  "really", "quite", "something", "anything", "nothing", "every", "each", "well",
]);

/**
 * Turns a free-text request like "I have paneer, spinach and cream, make it
 * North Indian" into query terms the recipe matcher can score against.
 */
export function extractIngredients(prompt: string, max = 15): string[] {
  const words = prompt
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);

  const terms: string[] = [];
  const seen = new Set<string>();
  for (const word of words) {
    if (word.length < 3 || STOPWORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    terms.push(word);
    if (terms.length >= max) break;
  }
  return terms;
}
