import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Upload, Camera, X, Plus, Sparkles, Image } from "lucide-react";

const suggestedIngredients = [
  "Onion", "Tomato", "Potato", "Garlic", "Ginger", "Green Chili",
  "Turmeric", "Cumin", "Coriander", "Rice", "Paneer", "Chicken",
  "Lentils", "Spinach", "Cauliflower", "Yogurt",
];

const ScanPage = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addIngredient = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setNewIngredient("");
  };

  const removeIngredient = (name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    // Simulate AI scan
    setScanning(true);
    setTimeout(() => {
      setIngredients(["Tomato", "Onion", "Green Chili", "Garlic", "Coriander", "Potato"]);
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Scan Ingredients</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload a photo or add ingredients manually</p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={imagePreview} alt="Uploaded" className="w-full h-64 object-cover" />
              {scanning && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <div className="bg-background rounded-2xl px-6 py-4 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-foreground">Scanning ingredients...</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => { setImagePreview(null); setIngredients([]); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center">
                <Image className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Upload ingredient photo</p>
                <p className="text-xs text-muted-foreground mt-1">AI will detect ingredients automatically</p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-sage-light px-3 py-1.5 rounded-full">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-accent bg-warm-light px-3 py-1.5 rounded-full">
                  <Camera className="w-3.5 h-3.5" /> Camera
                </span>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
        </motion.div>

        {/* Manual input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <label className="text-sm font-semibold text-foreground">Add manually</label>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addIngredient(newIngredient)}
              placeholder="Type an ingredient..."
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <button
              onClick={() => addIngredient(newIngredient)}
              className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Selected ingredients */}
        <AnimatePresence>
          {ingredients.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6">
              <label className="text-sm font-semibold text-foreground">
                Detected ingredients ({ingredients.length})
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ingredients.map((ing) => (
                  <motion.span
                    key={ing}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1.5 bg-sage-light text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {ing}
                    <button onClick={() => removeIngredient(ing)} className="hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <label className="text-sm font-semibold text-foreground">Quick add</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedIngredients.filter(s => !ingredients.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addIngredient(s)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Generate button */}
        {ingredients.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <button className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-card">
              <Sparkles className="w-5 h-5" />
              Generate Recipes ({ingredients.length} ingredients)
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
