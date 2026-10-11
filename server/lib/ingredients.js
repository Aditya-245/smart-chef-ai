const PREP_WORDS = new Set([
  "chopped", "finely", "roughly", "thinly", "coarsely", "minced", "grated", "diced",
  "peeled", "deseeded", "sliced", "cut", "cubes", "cubed", "soaked", "roasted",
  "fried", "boiled", "dry", "dried", "crushed", "whole", "fresh", "ripe", "small",
  "medium", "large", "big", "long", "tender", "cleaned", "washed", "picked", "slit",
  "halved", "quartered", "split", "julienned", "powdered", "optional", "extra",
  "virgin", "pure", "refined", "organic", "natural", "skinless", "boneless",
  "trimmed", "sprouted", "blanched", "steamed", "mashed", "crumbled", "whisked",
  "beaten", "melted", "frozen", "thawed", "canned", "tinned", "grated", "rubbed",
]);

const CATEGORY_WORDS = new Set(["powder", "powders", "seeds", "seed", "leaves", "leaf"]);

const FILLER_RE =
  /^(?:to\s+taste|as\s+required|as\s+needed|required|few|for\s+(?:frying|garnish|serving|tempering|cooking|slathering)|n\/?a)$/i;

const TRAILING_FILLER_RE =
  /\s+(?:to\s+taste|as\s+required|as\s+needed|for\s+(?:frying|garnish|serving|tempering|cooking)|optional)$/i;

const CUT_RE = /\s+(?:-|for)\s+/;

const ARTICLE_RE = /^(?:a|an|the|some|few)\s+/i;
const OF_RE = /^(?:pinch|handful|bunch|piece|pieces|cup|cups|tablespoon|tablespoons|teaspoon|teaspoons)\s+of\s+/i;
const NUM_RE = /^[\d¼½¾][\d\s.,/¼½¾]*/;
const UNIT_RE =
  /^(?:tablespoons?|tbsp|teaspoons?|tsp|cups?|grams?|kilograms?|kg|millilitres?|milliliters?|ml|litres?|liters?|l|pinches?|bunch(?:es)?|cloves?|pieces?|slices?|inch(?:es)?|sprigs?|pods?|stalks?|handfuls?|packets?|packs?|cans?|tins?|bowls?|dozen|plates?|servings?|gram)\b\s*/i;

const WORD_FIX = {
  chili: "chilli",
  chilies: "chilli",
  chillies: "chilli",
  chilly: "chilli",
  yoghurt: "yogurt",
  yoghurts: "yogurt",
  tomatoes: "tomato",
  potatoes: "potato",
  beans: "bean",
  peas: "pea",
};

const SYNONYMS = {
  cilantro: ["coriander leaves"],
  "coriander leaves": ["cilantro"],
  capsicum: ["bell pepper", "sweet pepper"],
  "bell pepper": ["capsicum", "sweet pepper"],
  brinjal: ["eggplant", "aubergine"],
  eggplant: ["brinjal", "aubergine"],
  courgette: ["zucchini"],
  zucchini: ["courgette"],
  okra: ["ladies finger", "bhindi"],
  "ladies finger": ["okra"],
  bhindi: ["okra", "ladies finger"],
  paneer: ["cottage cheese"],
  "cottage cheese": ["paneer"],
  curd: ["yogurt"],
  yogurt: ["curd"],
  maida: ["all purpose flour", "plain flour"],
  "all purpose flour": ["maida", "plain flour"],
  "plain flour": ["maida"],
  ghee: ["clarified butter"],
  "clarified butter": ["ghee"],
  chana: ["chickpea"],
  chickpea: ["chana"],
  dal: ["lentils"],
  lentils: ["dal"],
  lauki: ["bottle gourd", "dudhi"],
  "bottle gourd": ["lauki", "dudhi"],
  karela: ["bitter gourd"],
  "bitter gourd": ["karela"],
  palak: ["spinach"],
  spinach: ["palak"],
  aloo: ["potato"],
  gobhi: ["cauliflower"],
  gobi: ["cauliflower"],
  "cauliflower": ["gobi"],
  methi: ["fenugreek"],
  fenugreek: ["methi"],
  jeera: ["cumin"],
  cumin: ["jeera"],
  haldi: ["turmeric"],
  turmeric: ["haldi"],
  dhania: ["coriander"],
  coriander: ["dhania"],
  hing: ["asafoetida"],
  asafoetida: ["hing"],
  elaichi: ["cardamom"],
  cardamom: ["elaichi"],
  dalchini: ["cinnamon"],
  cinnamon: ["dalchini"],
  "tej patta": ["bay leaf"],
  "bay leaf": ["tej patta"],
  gur: ["jaggery"],
  jaggery: ["gur"],
  suji: ["semolina"],
  rava: ["semolina"],
  semolina: ["suji", "rava"],
  badam: ["almond"],
  almond: ["badam"],
  kaju: ["cashew"],
  cashew: ["kaju"],
  kishmish: ["raisin"],
  prawn: ["shrimp"],
  shrimp: ["prawn"],
  matar: ["green peas"],
  mooli: ["radish"],
  radish: ["mooli"],
  turai: ["ridge gourd"],
  "ridge gourd": ["turai"],
  parwal: ["pointed gourd"],
  "pointed gourd": ["parwal"],
  suran: ["yam"],
  amchur: ["dry mango powder"],
  "dry mango powder": ["amchur"],
  "spring onion": ["scallion", "green onion"],
  scallion: ["spring onion"],
  "green onion": ["spring onion"],
  atta: ["whole wheat flour"],
  "whole wheat flour": ["atta"],
  "black salt": ["kala namak"],
  rai: ["mustard seeds"],
  imli: ["tamarind"],
  tamarind: ["imli"],
  adrak: ["ginger"],
  lehsun: ["garlic"],
  pyaz: ["onion"],
  moongphali: ["peanut"],
  peanut: ["moongphali"],
  "french beans": ["green beans"],
  "green beans": ["french beans"],
  "soya sauce": ["soy sauce"],
  "soy sauce": ["soya sauce"],
  "kasuri methi": ["dried fenugreek leaves"],
  "mustard seeds": ["rai"],
  "curry leaves": ["kadi patta"],
  "red chilli": ["lal mirch"],
  "green chilli": ["hari mirch"],
};

const VOWELS = "aeiou";

const SYN = new Map();
for (const [key, values] of Object.entries(SYNONYMS)) {
  const normalizedKey = squash(key);
  if (!normalizedKey) continue;
  const entry = SYN.get(normalizedKey) || [];
  for (const value of values) {
    const normalizedValue = squash(value);
    if (normalizedValue && normalizedValue !== normalizedKey) entry.push(normalizedValue);
  }
  SYN.set(normalizedKey, [...new Set(entry)]);
}

export function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (/(?:sses|shes|ches|xes|zes|oes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("us") || word.endsWith("is") || word.endsWith("ss")) return word;
  if (word.endsWith("s") && !word.endsWith("as")) {
    const stem = word.slice(0, -1);
    if (stem.length >= 3 && !VOWELS.includes(stem[stem.length - 1])) return stem;
    return stem;
  }
  return word;
}

export function singularizePhrase(phrase) {
  const parts = phrase.split(" ");
  parts[parts.length - 1] = singularize(parts[parts.length - 1]);
  return parts.join(" ");
}

function stripPrep(text) {
  return text
    .split(/\s+/)
    .filter((w) => !PREP_WORDS.has(w))
    .join(" ");
}

function stripCategory(text) {
  const parts = text.split(/\s+/);
  while (parts.length > 1 && CATEGORY_WORDS.has(parts[parts.length - 1])) parts.pop();
  return parts.length > 1 ? parts.join(" ") : "";
}

export function squash(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => WORD_FIX[w] || w);
  return words.join(" ");
}

function splitAlias(value) {
  return value
    .split(/\s*(?:\/|,|\band\b)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function splitIngredients(field) {
  return String(field || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeIngredient(raw) {
  let s = String(raw || "").replace(/\s+/g, " ").trim();
  if (!s) return null;
  if (FILLER_RE.test(s)) return null;

  const cutIndex = s.search(CUT_RE);
  if (cutIndex > 0) s = s.slice(0, cutIndex).trim();

  const aliases = [];
  s = s.replace(/\(([^)]*)\)/g, (_m, inner) => {
    for (const part of splitAlias(inner)) {
      const cleaned = squash(part);
      if (cleaned && cleaned.length > 1) aliases.push(cleaned);
    }
    return " ";
  });

  s = s.replace(TRAILING_FILLER_RE, "");
  s = s.replace(OF_RE, "");
  s = s.replace(ARTICLE_RE, "");

  const numMatch = NUM_RE.exec(s);
  if (numMatch) {
    s = s.slice(numMatch[0].length);
    const unit = UNIT_RE.exec(s);
    if (unit) {
      const rest = s.slice(unit[0].length);
      if (squash(stripPrep(rest))) s = rest;
    }
  }

  s = squash(stripPrep(s));
  if (!s || FILLER_RE.test(s)) return null;

  const cleanedAliases = aliases.map((a) => squash(stripPrep(a))).filter((a) => a && a !== s);

  return {
    canonical: s,
    aliases: [...new Set(cleanedAliases)],
    label: titleCase(s),
  };
}

export function expandTokens(canonical, aliases = []) {
  const base = new Map();

  const push = (token, weight) => {
    if (!token || token.length < 2) return;
    const current = base.get(token);
    if (current === undefined || current < weight) base.set(token, weight);
    const singular = singularizePhrase(token);
    if (singular !== token && (!base.has(singular) || base.get(singular) < weight)) {
      base.set(singular, weight);
    }
  };

  for (const part of [canonical, ...aliases]) {
    if (!part) continue;
    push(part, 1);
    const withoutCategory = stripCategory(part);
    if (withoutCategory) push(withoutCategory, 0.75);
  }

  const contentWords = [...new Set(stripCategory(canonical).split(" ").filter(Boolean))];
  if (contentWords.length >= 2) {
    for (const word of contentWords) push(word, 0.4);
  }

  const tokens = new Map(base);
  for (const [token, weight] of base) {
    const related = SYN.get(token);
    if (!related) continue;
    for (const alt of related) {
      const cleaned = squash(alt);
      if (!cleaned) continue;
      const target = weight * 0.85;
      if (!tokens.has(cleaned) || tokens.get(cleaned) < target) tokens.set(cleaned, target);
      const singular = singularizePhrase(cleaned);
      if (singular !== cleaned && (!tokens.has(singular) || tokens.get(singular) < target)) {
        tokens.set(singular, target);
      }
    }
  }

  return tokens;
}

export function tokensForIngredient(raw) {
  const normalized = normalizeIngredient(raw);
  if (!normalized) return { normalized: null, tokens: new Map() };
  return { normalized, tokens: expandTokens(normalized.canonical, normalized.aliases) };
}

export function titleCase(value) {
  return value
    .split(" ")
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
