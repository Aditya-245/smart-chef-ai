import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SkeletonCard from "@/components/SkeletonCard";
import { toast } from "sonner";
import {
  detailToRecipe,
  extractIngredients,
  fetchRecipe,
  isVegetarian,
  matchRecipes,
  normalizeCuisine,
  summaryToRecipe,
  type MatchSummary,
} from "@/lib/api";

const CUISINES: Record<string, string> = {
  north: "North Indian",
  south: "South Indian",
  marathi: "Marathi",
  bengali: "Bengali",
};

const GeneratorPage = () => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [activeTerms, setActiveTerms] = useState<string[]>([]);

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
    setMatches([]);
    setActiveTerms(terms);

    try {
      const { results } = await matchRecipes(terms, 60);
      setMatches(results);
      if (results.length === 0) {
        toast.info("No matches found. Try naming different ingredients.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recipe service failed.");
    } finally {
      setGenerating(false);
    }
  };

  const applyFilters = (list: MatchSummary[]) =>
    list.filter((m) => {
      if (diet === "veg" && !isVegetarian(m.diet)) return false;
      if (diet === "nonveg" && isVegetarian(m.diet)) return false;
      if (time !== "any" && m.total > parseInt(time)) return false;
      if (cuisine !== "any" && normalizeCuisine(m.cuisine) !== CUISINES[cuisine]) return false;
      return true;
    });

  const results = applyFilters(matches).slice(0, 9);

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
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Matching 5,999 recipes...
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
        {results.length > 0 && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">
                {hasGenerated ? "Generated Recipes ✨" : "Suggested Recipes"}
              </h2>
              <span className="text-xs text-muted-foreground">{results.length} matches</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Found ingredients: <span className="font-medium text-foreground">{activeTerms.join(", ")}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((summary, i) => {
                const recipe = summaryToRecipe(summary);
                return (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={i}
                    onClick={() => void openRecipe(summary)}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty state after generation */}
        {hasGenerated && matches.length > 0 && results.length === 0 && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center py-12">
            <p className="text-4xl mb-3">🍳</p>
            <p className="text-sm font-medium text-foreground">No recipes match your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your preferences</p>
          </motion.div>
        )}

        {/* Empty state when nothing matched the ingredients */}
        {hasGenerated && matches.length === 0 && !generating && (
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
