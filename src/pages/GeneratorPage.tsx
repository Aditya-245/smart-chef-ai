import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, Flame, IndianRupee, ChefHat } from "lucide-react";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SkeletonCard from "@/components/SkeletonCard";
import { sampleRecipes } from "@/data/recipes";

const GeneratorPage = () => {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Filters
  const [diet, setDiet] = useState("all");
  const [time, setTime] = useState("any");
  const [cuisine, setCuisine] = useState("any");

  const handleGenerate = () => {
    setGenerating(true);
    setResults([]);
    // Simulate AI generation
    setTimeout(() => {
      setResults(sampleRecipes.slice(0, 3));
      setGenerating(false);
    }, 2500);
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
              <option value="vegan">Vegan</option>
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
              <option value="15">Under 15 min</option>
              <option value="30">Under 30 min</option>
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
                Generating recipes...
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
            <h2 className="text-lg font-bold text-foreground mb-4">Generated Recipes ✨</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((recipe, i) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={() => setSelectedRecipe(recipe)} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};

export default GeneratorPage;
