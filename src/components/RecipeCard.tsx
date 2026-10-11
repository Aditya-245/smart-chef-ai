import { motion } from "framer-motion";
import { Clock, Flame, Star, Sparkles } from "lucide-react";

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  /** Optional: the recipe index does not carry calorie data. */
  calories?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Optional: only sample recipes have a user rating. */
  rating?: number;
  cuisine: string;
  isVeg: boolean;
  servings: number;
  ingredients: string[];
  steps: string[];
  /** Optional: only sample recipes ship macro data. */
  nutrition?: NutritionInfo;
  tags: string[];
  /** Match confidence (0-100) when the recipe came from the ingredient matcher. */
  matchScore?: number;
  /** Optional link back to the original recipe source. */
  sourceUrl?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
  onClick?: () => void;
}

const difficultyColor = {
  Easy: "text-primary bg-sage-light",
  Medium: "text-accent bg-warm-light",
  Hard: "text-destructive bg-destructive/10",
};

const RecipeCard = ({ recipe, index = 0, onClick }: RecipeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={onClick}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card shadow-card hover-lift"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColor[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${recipe.isVeg ? "text-primary bg-sage-light" : "text-destructive bg-destructive/10"}`}>
            {recipe.isVeg ? "Veg" : "Non-Veg"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-semibold text-primary-foreground text-sm leading-snug line-clamp-2">{recipe.title}</h3>
        </div>
      </div>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5" />
              {recipe.time}
            </span>
            {recipe.calories && (
              <span className="flex items-center gap-1 text-xs">
                <Flame className="w-3.5 h-3.5" />
                {recipe.calories}
              </span>
            )}
          </div>
          {recipe.rating !== undefined ? (
            <span className="flex items-center gap-1 text-xs font-medium text-foreground">
              <Star className="w-3.5 h-3.5 fill-warm text-warm" />
              {recipe.rating}
            </span>
          ) : recipe.matchScore !== undefined ? (
            <span className="flex items-center gap-1 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              {recipe.matchScore}%
            </span>
          ) : null}
        </div>
    </motion.div>
  );
};

export default RecipeCard;
