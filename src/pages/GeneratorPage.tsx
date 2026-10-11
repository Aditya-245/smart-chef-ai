import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SkeletonCard from "@/components/SkeletonCard";
import { toast } from "sonner";
import {
  detailToRecipe,
  extractIngredients,
  fetchRecipe,
  matchAllRecipes,
  summaryToRecipe,
  type MatchSummary,
} from "@/lib/api";

const CUISINES: Record<string, string> = {
  north: "North Indian",
  south: "South Indian",
  marathi: "Marathi",
  bengali: "Bengali",
};

const PAGE_SIZE = 24;

interface SectionState {
  items: MatchSummary[];
  total: number;
  hasMore: boolean;
}

const emptySection: SectionState = { items: [], total: 0, hasMore: false };

const GeneratorPage = () => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTerms, setActiveTerms] = useState<string[]>([]);
  const [allSection, setAllSection] = useState<SectionState>(emptySection);
  const [anySection, setAnySection] = useState<SectionState>(emptySection);
  const [loadingMore, setLoadingMore] = useState<"all" | "any" | null>(null);

  // Filters
  const [diet, setDiet] = useState("all");
  const [time, setTime] = useState("any");
  const [cuisine, setCuisine] = useState("any");

  const openRecipe = async (summary: MatchSummary) => {
    // Optimistic: show the card immediately, then enrich with ingredients/steps.
    const card = summaryToRecipe(summary);
    setSelectedRecipe(card);
    try {
      const detail = await fetchRecipe(summary.id);
      setSelectedRecipe(detailToRecipe(detail, summary));
    } catch {
      setSelectedRecipe(card);
      toast.error("Could not load the full recipe. Showing summary only.");
    }
  };

  const prefs = {
    cuisine: cuisine !== "any" ? CUISINES[cuisine] : undefined,
    diet: diet !== "all" ? (diet as "veg" | "nonveg") : undefined,
    maxTotalMinutes: time !== "any" ? parseInt(time, 10) : undefined,
  };

  const fetchSection = async (
    mode: "all" | "any",
    offset: number,
  ): Promise<MatchSummary[]> => {
    const res = await matchAllRecipes({
      ingredients: activeTerms,
      mode,
      offset,
      limit: PAGE_SIZE,
      prefs,
    });
    const section = mode === "all" ? allSection : anySection;
    const setSection = mode === "all" ? setAllSection : setAnySection;
    const items = offset === 0 ? res.results : [...section.items, ...res.results];
    setSection({ items, total: res.total, hasMore: offset + res.results.length < res.total });
    return res.results;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to cook.");
      return;
    }

    const terms = extractIngredients(prompt);
    if (terms.length === 0) {
      toast.error("Mention at least one ingredient, e.g. paneer, spinach, cream.");
      return;
    }

    setGenerating(true);
    setHasGenerated(true);
    setActiveTerms(terms);
    setAllSection(emptySection);
    setAnySection(emptySection);

    try {
      const fixedPrefs = {
        cuisine: cuisine !== "any" ? CUISINES[cuisine] : undefined,
        diet: diet !== "all" ? (diet as "veg" | "nonveg") : undefined,
        maxTotalMinutes: time !== "any" ? parseInt(time, 10) : undefined,
      };
      const [allRes, anyRes] = await Promise.all([
        matchAllRecipes({ ingredients: terms, mode: "all", offset: 0, limit: PAGE_SIZE, prefs: fixedPrefs }),
        matchAllRecipes({ ingredients: terms, mode: "any", offset: 0, limit: PAGE_SIZE, prefs: fixedPrefs }),
      ]);
      setAllSection({
        items: allRes.results,
        total: allRes.total,
        hasMore: allRes.offset + allRes.results.length < allRes.total,
      });
      setAnySection({
        items: anyRes.results,
        total: anyRes.total,
        hasMore: anyRes.offset + anyRes.results.length < anyRes.total,
      });
      if (allRes.total === 0 && anyRes.total === 0) {
        toast.info("No recipes contain those ingredients. Try different names.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recipe service failed.");
    } finally {
      setGenerating(false);
    }
  };

  const loadMore = async (mode: "all" | "any") => {
    if (loadingMore) return;
    const section = mode === "all" ? allSection : anySection;
    if (!section.hasMore) return;
    setLoadingMore(mode);
    try {
      await fetchSection(mode, section.items.length);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load more recipes.");
    } finally {
      setLoadingMore(null);
    }
  };

  const resultsTotal = allSection.total + anySection.total;

  const renderSection = (mode: "all" | "any", title: string, section: SectionState) => {
    if (section.total === 0) return null;
    return (
      <div className="mt-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <span className="text-xs text-muted-foreground">{section.total} recipes</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
          {section.items.map((summary, i) => {
            const recipe = summaryToRecipe(summary);
            return (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={i % 12}
                onClick={() => void openRecipe(summary)}
              />
            );
          })}
        </div>
        {section.hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => void loadMore(mode)}
              disabled={loadingMore === mode}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors disabled:opacity-60"
            >
              {loadingMore === mode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </>
              ) : (
                <>Load more ({section.total - section.items.length} left)</>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-warm-light flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">AI Recipe Generator</h1>
          </div>
          <p className="text-sm text-muted-foreground">Describe what you want to cook and let AI suggest recipes</p>
        </motion.div>

        {/* Prompt */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
            placeholder="e.g. I have paneer, spinach, and cream. Make something North Indian that's spicy..."
            className="w-full bg-muted rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none h-28"
          />
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Diet</label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none text-foreground"
            >
              <option value="all">Any</option>
              <option value="veg">Veg</option>
              <option value="nonveg">Non-Veg</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none text-foreground"
            >
              <option value="any">Any</option>
              <option value="30">Under 30 min</option>
              <option value="45">Under 45 min</option>
              <option value="60">Under 1 hour</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full mt-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none text-foreground"
            >
              <option value="any">Any</option>
              <option value="north">North Indian</option>
              <option value="south">South Indian</option>
              <option value="marathi">Marathi</option>
              <option value="bengali">Bengali</option>
            </select>
          </div>
        </motion.div>

        {/* Generate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-card disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding every recipe with your ingredients...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Recipes
              </>
            )}
          </button>
        </motion.div>

        {/* Loading skeletons */}
        {generating && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {hasGenerated && resultsTotal > 0 && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <p className="text-xs text-muted-foreground mb-4">
              Found ingredients:{" "}
              <span className="font-medium text-foreground">{activeTerms.join(", ")}</span>
            </p>
            {renderSection("all", "Uses all your ingredients", allSection)}
            {renderSection("any", "Contains any of your ingredients", anySection)}
          </motion.div>
        )}

        {/* Empty state when nothing matched the ingredients */}
        {hasGenerated && resultsTotal === 0 && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center py-12">
            <p className="text-4xl mb-3">🧺</p>
            <p className="text-sm font-medium text-foreground">We couldn't find recipes for those ingredients</p>
            <p className="text-xs text-muted-foreground mt-1">Try more common ingredients, one at a time</p>
          </motion.div>
        )}
      </div>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};

export default GeneratorPage;
