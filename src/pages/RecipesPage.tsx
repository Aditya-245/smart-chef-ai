import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SectionTitle from "@/components/SectionTitle";
import { sampleRecipes } from "@/data/recipes";
import {
  detailToRecipe,
  fetchRecipe,
  listCuisines,
  listRecipes,
  listItemToRecipe,
  summaryToRecipe,
  type CuisineFacet,
  type MatchSummary,
  type RecipeListItem,
} from "@/lib/api";

const PAGE_SIZE = 24;

const FALLBACK_CUISINES = [
  "All",
  "Continental",
  "Indian",
  "North Indian",
  "South Indian",
  "Italian",
  "Maharashtrian",
  "Bengali",
  "Gujarati",
];

const filters = ["All", "Veg", "Non-Veg"];

const readSession = <T,>(key: string, fallback: T): T => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const RecipesPage = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const [scannedIngredients, setScannedIngredients] = useState<string[]>(() =>
    readSession<string[]>("scanIngredients", []),
  );
  const [matches, setMatches] = useState<MatchSummary[]>(() =>
    readSession<MatchSummary[]>("scanMatches", []),
  );
  const [cuisineTabs, setCuisineTabs] = useState<CuisineFacet[]>([]);

  const [items, setItems] = useState<RecipeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [apiDown, setApiDown] = useState(false);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const query = searchParams.get("q") || "";
  const activeQuery = query.trim().toLowerCase();
  const usingMatches = matches.length > 0;
  const browsing = !usingMatches && !apiDown;

  const clearContext = () => {
    sessionStorage.removeItem("scanIngredients");
    sessionStorage.removeItem("scanMatches");
    setScannedIngredients([]);
    setMatches([]);
    if (query) setSearchParams({});
  };

  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (loadingRef.current || (!reset && !hasMoreRef.current)) return;
      loadingRef.current = true;
      if (reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await listRecipes({
          offset: reset ? 0 : offsetRef.current,
          limit: PAGE_SIZE,
          cuisine: activeCuisine !== "All" ? activeCuisine : undefined,
          diet:
            activeFilter === "Veg"
              ? "veg"
              : activeFilter === "Non-Veg"
                ? "nonveg"
                : undefined,
          q: query || undefined,
        });
        offsetRef.current = res.offset + res.items.length;
        hasMoreRef.current = res.items.length > 0 && offsetRef.current < res.total;
        setTotal(res.total);
        setHasMore(hasMoreRef.current);
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setApiDown(false);
      } catch {
        hasMoreRef.current = false;
        setHasMore(false);
        setApiDown(true);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCuisine, activeFilter, query],
  );

  useEffect(() => {
    listCuisines()
      .then((res) => setCuisineTabs(res.items.slice(0, 14)))
      .catch(() => setCuisineTabs([]));
  }, []);

  useEffect(() => {
    if (usingMatches) {
      // Matches are read from sessionStorage, so there is nothing to fetch;
      // make sure the loading spinner does not stay on forever.
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setItems([]);
    void fetchPage(true);
  }, [fetchPage, usingMatches]);

  const openRecipe = async (recipe: Recipe, summary?: MatchSummary, itemId?: number) => {
    setSelectedRecipe(recipe);
    const id = summary?.id ?? itemId;
    if (id === undefined) return;
    try {
      const detail = await fetchRecipe(id);
      setSelectedRecipe(summary ? detailToRecipe(detail, summary) : detailToRecipe(detail));
    } catch {
      toast.error("Could not load the full recipe. Showing summary only.");
    }
  };

  // Fallback when the backend is unreachable
  const fallbackEntries = sampleRecipes.filter((r) => {
    const cuisineMatch = activeCuisine === "All" || r.cuisine === activeCuisine;
    const filterMatch =
      activeFilter === "All" || (activeFilter === "Veg" ? r.isVeg : !r.isVeg);
    const queryMatch =
      !activeQuery ||
      r.title.toLowerCase().includes(activeQuery) ||
      r.tags.some((t) => t.toLowerCase().includes(activeQuery)) ||
      r.ingredients.some((i) => i.toLowerCase().includes(activeQuery));
    return cuisineMatch && filterMatch && queryMatch;
  });

  const matchedEntries = matches.map((summary) => ({
    key: `m-${summary.id}`,
    recipe: summaryToRecipe(summary),
    summary,
    itemId: undefined as number | undefined,
  }));

  const browseEntries = items.map((item) => ({
    key: `b-${item.id}`,
    recipe: listItemToRecipe(item),
    summary: undefined as MatchSummary | undefined,
    itemId: item.id,
  }));

  const entries = usingMatches ? matchedEntries : browseEntries;

  const tabs = cuisineTabs.length
    ? ["All", ...cuisineTabs.map((c) => c.name)]
    : FALLBACK_CUISINES;

  const sectionTitle = usingMatches
    ? "Recipes for your ingredients"
    : activeQuery
      ? `Results for "${query}"`
      : activeCuisine !== "All"
        ? `${activeCuisine} recipes`
        : "All Recipes";

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
          <p className="text-sm text-muted-foreground mt-1">Explore authentic Indian dishes</p>
        </motion.div>

        {/* Cuisine tabs */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCuisine(c)}
              className={`text-xs font-medium px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeCuisine === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
              {c !== "All" && cuisineTabs.length > 0 && (
                <span className="ml-1.5 opacity-60">
                  {cuisineTabs.find((f) => f.name === c)?.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Veg / Non-veg */}
        <div className="flex gap-2 mt-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-xs font-medium px-4 py-2 rounded-full transition-colors ${
                activeFilter === f
                  ? "bg-sage-light text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search / scan context banner */}
        {(activeQuery || scannedIngredients.length > 0) && (
          <div className="flex items-center justify-between gap-3 mt-4 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-foreground truncate">
                {usingMatches ? (
                  <>
                    Matching ingredients:{" "}
                    <span className="font-semibold">{scannedIngredients.join(", ")}</span>
                  </>
                ) : (
                  <>
                    Showing results for "<span className="font-semibold">{query}</span>"
                  </>
                )}
              </p>
            </div>
            <button
              onClick={clearContext}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground flex-shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Results */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <SectionTitle title={sectionTitle} />
            {browsing && total > 0 && !loading && (
              <span className="text-xs text-muted-foreground">{total} recipes</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading recipes…
            </div>
          ) : entries.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {entries.map(({ key, recipe, summary, itemId }, i) => (
                  <RecipeCard
                    key={key}
                    recipe={recipe}
                    index={i % 12}
                    onClick={() => void openRecipe(recipe, summary, itemId)}
                  />
                ))}
              </div>

              {browsing &&
                (hasMore ? (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => void fetchPage(false)}
                      disabled={loadingMore}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors disabled:opacity-60"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                        </>
                      ) : (
                        <>Load more ({total - items.length} left)</>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground mt-8">
                    You've reached the end — showing all {total} matching recipes.
                  </p>
                ))}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-sm font-medium text-foreground">No recipes found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {apiDown
                  ? "The recipe service is offline — showing sample recipes instead."
                  : activeCuisine !== "All" || activeFilter !== "All" || activeQuery
                    ? "Try adjusting your filters"
                    : "Try a different search"}
              </p>
              {apiDown && fallbackEntries.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                  {fallbackEntries.map((recipe, i) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      index={i}
                      onClick={() => void openRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};

export default RecipesPage;
