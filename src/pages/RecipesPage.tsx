import { useState } from "react";
import { motion } from "framer-motion";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SectionTitle from "@/components/SectionTitle";
import { sampleRecipes } from "@/data/recipes";

const cuisines = ["All", "North Indian", "South Indian", "Marathi", "Bengali", "Gujarati"];
const filters = ["All", "Veg", "Non-Veg"];

const RecipesPage = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [activeCuisine, setActiveCuisine] = useState("All");
  const [activeFilter, setActiveFilter] = useState("All");

  const filtered = sampleRecipes.filter((r) => {
    const cuisineMatch = activeCuisine === "All" || r.cuisine === activeCuisine;
    const filterMatch = activeFilter === "All" || (activeFilter === "Veg" ? r.isVeg : !r.isVeg);
    return cuisineMatch && filterMatch;
  });

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
          <p className="text-sm text-muted-foreground mt-1">Explore authentic Indian dishes</p>
        </motion.div>

        {/* Cuisine tabs */}
        <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-none">
          {cuisines.map((c) => (
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

        {/* Results */}
        <div className="mt-6">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((recipe, i) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={() => setSelectedRecipe(recipe)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-sm font-medium text-foreground">No recipes found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};

export default RecipesPage;
