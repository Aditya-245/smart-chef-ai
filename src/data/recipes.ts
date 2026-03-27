import recipe1 from "@/assets/recipe-1.jpg";
import recipe2 from "@/assets/recipe-2.jpg";
import recipe3 from "@/assets/recipe-3.jpg";
import recipe4 from "@/assets/recipe-4.jpg";
import recipe5 from "@/assets/recipe-5.jpg";
import recipe6 from "@/assets/recipe-6.jpg";
import type { Recipe } from "@/components/RecipeCard";

export const sampleRecipes: Recipe[] = [
  { id: "1", title: "Butter Chicken", image: recipe1, time: "40 min", calories: "450 kcal", difficulty: "Medium", rating: 4.8, cuisine: "North Indian", isVeg: false },
  { id: "2", title: "Masala Dosa", image: recipe2, time: "30 min", calories: "280 kcal", difficulty: "Medium", rating: 4.7, cuisine: "South Indian", isVeg: true },
  { id: "3", title: "Palak Paneer", image: recipe3, time: "25 min", calories: "320 kcal", difficulty: "Easy", rating: 4.6, cuisine: "North Indian", isVeg: true },
  { id: "4", title: "Hyderabadi Biryani", image: recipe4, time: "60 min", calories: "520 kcal", difficulty: "Hard", rating: 4.9, cuisine: "South Indian", isVeg: false },
  { id: "5", title: "Chole Bhature", image: recipe5, time: "45 min", calories: "480 kcal", difficulty: "Medium", rating: 4.5, cuisine: "North Indian", isVeg: true },
  { id: "6", title: "Vada Pav", image: recipe6, time: "20 min", calories: "350 kcal", difficulty: "Easy", rating: 4.4, cuisine: "Marathi", isVeg: true },
];

export const quickRecipes = sampleRecipes.filter(r => parseInt(r.time) <= 30);
export const trendingRecipes = sampleRecipes.slice(0, 4);
