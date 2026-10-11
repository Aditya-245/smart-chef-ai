import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Flame, Star, Users, ChefHat, Droplets, Wheat, Beef, Sparkles } from "lucide-react";
import type { Recipe } from "./RecipeCard";
import CookingMode from "./CookingMode";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

const RecipeDetailModal = ({ recipe, onClose }: RecipeDetailModalProps) => {
  const [cooking, setCooking] = useState(false);

  if (cooking && recipe) {
    return <CookingMode recipe={recipe} onClose={() => setCooking(false)} />;
  }

  return (
    <AnimatePresence>
      {recipe && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header image */}
            <div className="relative h-56 md:h-72">
              <img
                src={recipe.image}
                alt={recipe.title}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-xs font-medium text-primary-foreground/80 bg-primary/80 px-2.5 py-1 rounded-full">{recipe.cuisine}</span>
                <h2 className="text-2xl font-bold text-primary-foreground mt-2">{recipe.title}</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Clock, label: recipe.time, sub: "Time" },
                  ...(recipe.calories
                    ? [{ icon: Flame, label: recipe.calories, sub: "Calories" }]
                    : []),
                  ...(recipe.rating !== undefined
                    ? [{ icon: Star, label: String(recipe.rating), sub: "Rating" }]
                    : []),
                  ...(recipe.matchScore !== undefined
                    ? [{ icon: Sparkles, label: `${recipe.matchScore}%`, sub: "Match" }]
                    : []),
                  { icon: Users, label: String(recipe.servings), sub: "Servings" },
                ].map((stat) => (
                  <div key={stat.sub} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted">
                    <stat.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{stat.label}</span>
                    <span className="text-[10px] text-muted-foreground">{stat.sub}</span>
                  </div>
                ))}
              </div>

              {/* Nutrition Breakdown */}
              {recipe.nutrition && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Nutrition per Serving</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Calories", value: recipe.nutrition.calories, unit: "kcal", color: "text-orange-500 bg-orange-500/10", icon: Flame },
                      { label: "Protein", value: recipe.nutrition.protein, unit: "g", color: "text-red-500 bg-red-500/10", icon: Beef },
                      { label: "Carbs", value: recipe.nutrition.carbs, unit: "g", color: "text-amber-500 bg-amber-500/10", icon: Wheat },
                      { label: "Fat", value: recipe.nutrition.fat, unit: "g", color: "text-blue-500 bg-blue-500/10", icon: Droplets },
                      { label: "Fiber", value: recipe.nutrition.fiber, unit: "g", color: "text-green-500 bg-green-500/10", icon: Droplets },
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted">
                        <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{item.value}{item.unit}</span>
                        <span className="text-[9px] text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Ingredients ({recipe.ingredients.length})</h3>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-foreground">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Instructions ({recipe.steps.length} steps)</h3>
                <div className="space-y-4">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-sage-light flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start cooking button */}
              {recipe.steps.length > 0 && (
                <button
                  onClick={() => setCooking(true)}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ChefHat className="w-5 h-5" />
                  Start Cooking Mode
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecipeDetailModal;
