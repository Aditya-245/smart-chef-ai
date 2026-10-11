import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ScanLine, Sparkles, Clock, TrendingUp, Utensils } from "lucide-react";
import heroImage from "@/assets/hero-food.jpg";
import RecipeCard from "@/components/RecipeCard";
import type { Recipe } from "@/components/RecipeCard";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import SectionTitle from "@/components/SectionTitle";
import { sampleRecipes, quickRecipes, trendingRecipes } from "@/data/recipes";

const Index = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero */}
      <section className="relative h-[75vh] md:h-[85vh] overflow-hidden">
        <img src={heroImage} alt="Indian cuisine" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-background" />
        <div className="relative container h-full flex flex-col justify-end pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Cooking
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight max-w-lg">
              Cook Smarter with <span className="text-gradient">SmartChef AI</span>
            </h1>
            <p className="text-primary-foreground/80 mt-3 max-w-md text-sm md:text-base">
              Scan ingredients, discover regional Indian recipes, and cook with AI-guided steps.
            </p>
            <div className="flex gap-3 mt-6">
              <Link
                to="/scan"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ScanLine className="w-4 h-4" />
                Scan Ingredients
              </Link>
              <Link
                to="/recipes"
                className="flex items-center gap-2 bg-background/80 backdrop-blur-sm text-foreground px-6 py-3.5 rounded-2xl text-sm font-semibold hover:bg-background transition-colors"
              >
                Explore Recipes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ScanLine, label: "Scan & Cook", desc: "Upload ingredients", to: "/scan", color: "bg-sage-light text-primary" },
            { icon: Sparkles, label: "AI Generate", desc: "Get recipes", to: "/generator", color: "bg-warm-light text-accent" },
            { icon: Clock, label: "Quick Meals", desc: "Under 20 min", to: "/recipes", color: "bg-secondary text-secondary-foreground" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-card rounded-2xl p-4 shadow-card hover-lift text-center"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="container mt-10">
        <SectionTitle title="Trending Now 🔥" subtitle="Most popular recipes this week" action="See all" to="/recipes" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingRecipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={() => setSelectedRecipe(recipe)} />
          ))}
        </div>
      </section>

      {/* Quick Meals */}
      <section className="container mt-10">
        <SectionTitle title="Quick Meals ⚡" subtitle="Ready in 30 minutes or less" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickRecipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={() => setSelectedRecipe(recipe)} />
          ))}
        </div>
      </section>

      {/* Based on taste */}
      <section className="container mt-10">
        <SectionTitle title="Based on Your Taste 🎯" subtitle="Personalized picks for you" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sampleRecipes.slice(2).map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={i} onClick={() => setSelectedRecipe(recipe)} />
          ))}
        </div>
      </section>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};

export default Index;
