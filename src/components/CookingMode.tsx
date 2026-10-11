import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ChefHat, Check, Clock, Flame } from "lucide-react";
import type { Recipe } from "./RecipeCard";

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

const CookingMode = ({ recipe, onClose }: CookingModeProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const totalSteps = recipe.steps.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const markComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const allDone = totalSteps > 0 && completedSteps.size === totalSteps;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Cooking Mode</p>
          <p className="text-sm font-semibold text-foreground">{recipe.title}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Step {currentStep + 1}/{totalSteps}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {totalSteps === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h2 className="text-xl font-bold text-foreground mb-2">No instructions available</h2>
              <p className="text-sm text-muted-foreground mb-6">
                This recipe doesn't have step-by-step instructions yet.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Back to Recipe
              </button>
            </motion.div>
          ) : allDone ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">All Done!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You've completed all {totalSteps} steps. Time to enjoy your {recipe.title}!
              </p>
              <div className="flex gap-3 justify-center mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-xl">
                  <Clock className="w-3.5 h-3.5" /> {recipe.time}
                </div>
                {recipe.calories && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-xl">
                    <Flame className="w-3.5 h-3.5" /> {recipe.calories}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
              >
                Back to Recipe
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-foreground">{currentStep + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Step {currentStep + 1}</h3>
              <p className="text-base text-foreground leading-relaxed">{recipe.steps[currentStep]}</p>

              {/* Step indicators */}
              <div className="flex justify-center gap-1.5 mt-8">
                {recipe.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentStep
                        ? "bg-primary w-6"
                        : completedSteps.has(i)
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      {!allDone && (
        <div className="px-6 pb-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-border text-sm font-medium text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={markComplete}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              {currentStep === totalSteps - 1 ? (
                <> <Check className="w-4 h-4" /> Finish </>
              ) : (
                <> Next <ChevronRight className="w-4 h-4" /> </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CookingMode;
