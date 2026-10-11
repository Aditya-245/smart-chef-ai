import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, Plus, Sparkles, Image, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { matchRecipes } from "@/lib/api";

const suggestedIngredients = [
  "Onion", "Tomato", "Potato", "Garlic", "Ginger", "Green Chili",
  "Turmeric", "Cumin", "Coriander", "Rice", "Paneer", "Chicken",
  "Lentils", "Spinach", "Cauliflower", "Yogurt",
];

const MAX_IMAGE_DIMENSION = 1024;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MIN_CONFIDENCE = 50;
const RECOGNIZE_TIMEOUT_MS = 30000;
const DECODE_TIMEOUT_MS = 8000;

interface DetectedIngredient {
  name: string;
  confidence: number;
}

type ScanStatus = "idle" | "scanning" | "success" | "error";

const normalizeName = (name: string) => {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : "";
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });

// Raw data URL via FileReader (no image decode, cannot hang)
const fileToRawDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

// Downscale to JPEG via canvas; falls back to the raw data URL if decode fails or times out
const prepareDataUrl = async (file: File): Promise<string> => {
  try {
    const raw = await withTimeout(fileToRawDataUrl(file), DECODE_TIMEOUT_MS);
    const downscaled = await withTimeout(
      new Promise<string>((resolve, reject) => {
        // `Image` is shadowed by the lucide icon import, so build the DOM node explicitly
        const img = document.createElement("img");
        img.onload = () => {
          const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Cannot decode image"));
        img.src = raw;
      }),
      DECODE_TIMEOUT_MS
    );
    return downscaled;
  } catch {
    // Fallback: send the original file as-is
    return fileToRawDataUrl(file);
  }
};

const ScanPage = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [detected, setDetected] = useState<DetectedIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const lastDataUrlRef = useRef<string | null>(null);
  const navigate = useNavigate();

  const scanning = scanStatus === "scanning";

  const addIngredient = useCallback((name: string) => {
    const trimmed = normalizeName(name);
    if (trimmed && !ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      setIngredients((prev) => [...prev, trimmed]);
    }
    setNewIngredient("");
  }, [ingredients]);

  const removeIngredient = useCallback((name: string) => {
    setIngredients((prev) => prev.filter((i) => i !== name));
  }, []);

  const recognize = useCallback(async (dataUrl: string) => {
    if (!dataUrl) {
      setScanStatus("error");
      setScanError("Could not read the image file.");
      return;
    }
    lastDataUrlRef.current = dataUrl;
    setScanStatus("scanning");
    setScanError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RECOGNIZE_TIMEOUT_MS);
    try {
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status}).`);
      }
      const found: DetectedIngredient[] = (data?.ingredients || [])
        .map((i: { name?: string; confidence?: number }) => ({
          name: normalizeName(i.name || ""),
          confidence: Math.round(Number(i.confidence) * 100),
        }))
        .filter((i: DetectedIngredient) => i.name && i.confidence >= MIN_CONFIDENCE)
        .filter((i: DetectedIngredient, idx: number, arr: DetectedIngredient[]) =>
          arr.findIndex(x => x.name.toLowerCase() === i.name.toLowerCase()) === idx
        );

      if (found.length === 0) {
        setScanStatus("error");
        setScanError("No ingredients detected in this photo. You can still add ingredients manually below.");
      } else {
        setDetected(found);
        setIngredients(prev => [
          ...prev,
          ...found.map(f => f.name).filter(n => !prev.some(p => p.toLowerCase() === n.toLowerCase())),
        ]);
        setScanStatus("success");
      }
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      const message = aborted
        ? "Recognition timed out. Make sure the backend is running (npm run server), then retry."
        : err instanceof Error
          ? err.message
          : "Something went wrong while recognizing the image.";
      setScanStatus("error");
      setScanError(message);
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setScanStatus("error");
      setScanError("That file is not an image. Please choose a photo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setScanStatus("error");
      setScanError("Image is too large (max 12 MB). Please pick a smaller photo.");
      return;
    }

    // Show the photo immediately so the user always knows it uploaded
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewBroken(false);
    setDetected([]);
    setIngredients([]);
    setScanStatus("scanning");
    setScanError(null);

    const dataUrl = await prepareDataUrl(file);
    await recognize(dataUrl);
  }, [previewUrl, recognize]);

  const handleDroppedFile = useCallback((file: File) => {
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = fileRef.current;
    if (input) {
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleDroppedFile(file);
  };

  const handleCamera = () => {
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      cameraRef.current?.click();
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          const overlay = document.createElement("div");
          overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center";

          const videoEl = document.createElement("video");
          videoEl.srcObject = stream;
          videoEl.autoplay = true;
          videoEl.playsInline = true;
          videoEl.style.cssText = "width:100%;max-width:640px;border-radius:16px;object-fit:cover";

          const btnContainer = document.createElement("div");
          btnContainer.style.cssText = "position:absolute;bottom:40px;display:flex;gap:16px";

          const captureBtn = document.createElement("button");
          captureBtn.textContent = "Capture";
          captureBtn.style.cssText = "width:64px;height:64px;border-radius:50%;background:#fff;border:4px solid #4ade80;cursor:pointer;font-size:14px;font-weight:600;color:#16a34a";

          const cancelBtn = document.createElement("button");
          cancelBtn.textContent = "Cancel";
          cancelBtn.style.cssText = "padding:12px 24px;border-radius:16px;background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;font-size:14px;font-weight:600";

          btnContainer.appendChild(captureBtn);
          btnContainer.appendChild(cancelBtn);
          overlay.appendChild(videoEl);
          overlay.appendChild(btnContainer);
          document.body.appendChild(overlay);

          const stop = () => {
            stream.getTracks().forEach(t => t.stop());
            document.body.removeChild(overlay);
          };

          captureBtn.onclick = () => {
            const canvas = document.createElement("canvas");
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            canvas.getContext("2d")?.drawImage(videoEl, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            stop();
            setPreviewUrl(dataUrl);
            setPreviewBroken(false);
            setDetected([]);
            setIngredients([]);
            setScanStatus("scanning");
            setScanError(null);
            recognize(dataUrl);
          };

          cancelBtn.onclick = stop;
        })
        .catch(() => {
          fileRef.current?.click();
        });
    } else {
      fileRef.current?.click();
    }
  };

  const cleanupImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewBroken(false);
    setDetected([]);
    setIngredients([]);
    setScanStatus("idle");
    setScanError(null);
    lastDataUrlRef.current = null;
  };

  const handleGenerate = async () => {
    if (ingredients.length < 2) {
      toast.error("Add at least 2 ingredients to generate recipes.");
      return;
    }
    setGenerating(true);
    sessionStorage.setItem("scanIngredients", JSON.stringify(ingredients));
    try {
      const { results } = await matchRecipes(ingredients, 40, true);
      sessionStorage.setItem("scanMatches", JSON.stringify(results));
      if (results.length === 0) {
        toast.info("No recipes use only those ingredients. Showing everything instead.");
        sessionStorage.removeItem("scanMatches");
      } else {
        toast.success(`Found ${results.length} recipes using only your ingredients!`);
      }
      navigate("/recipes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not find matching recipes.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Scan Ingredients</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload a photo and AI will detect ingredients automatically</p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden">
              {previewBroken ? (
                <div className="w-full h-64 bg-muted flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This image could not be displayed, but it was uploaded.</p>
                  <p className="text-xs text-muted-foreground/70">Recognition may still work — check the status below.</p>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Uploaded ingredients"
                  className="w-full h-64 object-cover"
                  onError={() => setPreviewBroken(true)}
                />
              )}
              {scanning && (
                <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                  <div className="bg-background rounded-2xl px-6 py-4 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-foreground">AI recognizing ingredients...</span>
                  </div>
                </div>
              )}
              {!scanning && (
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => lastDataUrlRef.current && recognize(lastDataUrlRef.current)}
                    className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                    aria-label="Retry scan"
                    title="Retry scan"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cleanupImage}
                    className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center">
                <Image className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Upload ingredient photo</p>
                <p className="text-xs text-muted-foreground mt-1">Click to browse, drag & drop, or use your camera</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary bg-sage-light px-4 py-2 rounded-full hover:bg-sage-muted transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Photo
                </button>
                <button
                  onClick={handleCamera}
                  className="flex items-center gap-1.5 text-xs font-medium text-accent bg-warm-light px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Camera
                </button>
              </div>
            </div>
          )}
          {/* Hidden file inputs */}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
        </motion.div>

        {/* Scan status (always visible so the user knows what happened) */}
        <AnimatePresence>
          {previewUrl && !scanning && scanStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 bg-primary/5 border border-primary/20 text-primary rounded-2xl px-4 py-3 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium">
                {detected.length > 0
                  ? `✓ ${detected.length} ingredient${detected.length > 1 ? "s" : ""} detected — review and edit below.`
                  : "✓ Photo uploaded."}
              </p>
            </motion.div>
          )}
          {previewUrl && !scanning && scanStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> Recognition failed
                  </p>
                  <p className="text-xs mt-1 opacity-80">{scanError}</p>
                  <p className="text-xs mt-1 opacity-70">Tip: you can add ingredients manually below and still generate recipes.</p>
                </div>
                <button
                  onClick={() => lastDataUrlRef.current && recognize(lastDataUrlRef.current)}
                  className="text-xs font-semibold flex items-center gap-1 flex-shrink-0 hover:underline"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                {detected.length > 0 ? "Detected ingredients" : "Ingredients"} ({ingredients.length})
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ingredients.map((ing) => {
                  const det = detected.find(d => d.name === ing);
                  return (
                    <motion.span
                      key={ing}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1.5 bg-sage-light text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {ing}
                      {det && (
                        <span className="text-[10px] font-bold bg-primary/10 rounded-full px-1.5 py-0.5">
                          {det.confidence}%
                        </span>
                      )}
                      <button onClick={() => removeIngredient(ing)} className="hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <label className="text-sm font-semibold text-foreground">Quick add</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {suggestedIngredients.filter(s => !ingredients.some(i => i.toLowerCase() === s.toLowerCase())).map((s) => (
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
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-card disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Finding matching recipes...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Recipes ({ingredients.length} ingredients)
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
